import {IPlayer} from "./IPlayer";
import {AbstractPlayer} from "./AbstractPlayer";
import {StormPlayerCore} from "../../StormPlayerCore";
import {PlaybackController} from "../PlaybackController";
import {PlayerType} from "../enum/PlayerTypes";
import {StormLibraryEvent} from "../../events/StormLibraryEvent";
import {PlaybackState} from "../enum/PlaybackState";
import {UserCapabilities} from "../../utilities/UserCapabilities";
import {StreamState} from "../enum/StreamState";
import {CooldownMonitor} from "../CooldownMonitor";
import {BufferAnalyser} from "../../analyse/BufferAnalyser";
import {BufferData} from "../BufferData";
import {BandwidthMeter} from "../buffer/BandwidthMeter";
import {OverloadMeter} from "../buffer/OverloadMeter";
import {NumberUtilities} from "../../utilities/NumberUtilities";

/**
 * Media Source-based internal playback mechanism
 */
export class MSEPlayer extends AbstractPlayer implements IPlayer {

    /**
     * MediaSource object
     * @private
     */
    private _mediaSource:MediaSource | ManagedMediaSource | null;

    /**
     * Source buffer
     * @private
     */
    private _sourceBuffer:SourceBuffer | null;

    /**
     * Video segments in a queue
     * @private
     */
    private _segmentsQueue:any = [];

    /**
     * Whenever it's turn to flush data
     * @private
     */
    private _shouldFlushData:boolean = false;

    /**
     * The moment buffer is empty
     * @private
     */
    protected _bufferEndTime:number = 0;

    /**
     * The moment buffer start to be filled
     * @private
     */
    protected _bufferStartTime:number = 0;

    /**
     * Whenever video data is acceptable
     * @private
     */
    private _acceptVideoData:boolean = false;

    /**
     * Cooldown for seek action
     * @private
     */
    private _seekCooldown:CooldownMonitor;

    /**
     * Cooldown for playback rate change
     * @private
     */
    private _rateCooldown:CooldownMonitor;

    /**
     * Cooldown for playback rate change
     * @private
     */
    private _bitrateCooldown:CooldownMonitor;

    /**
     * Main timer
     * @private
     */
    private _mainTimer:number;


    /**
     * Calculates bandwidth drops
     * @private
     */
    private _degradeChargeMeter:OverloadMeter;

    /**
     * Time in milliseconds for buffer cleanup interval
     * @private
     */
    private _bufferCleanupInterval:number = 60000;

    /**
     * How much time should be kept during cleanup
     * @private
     */
    private _bufferTimeToKeep:number = 120;

    /**
     * When was last cleanup performed
     * @private
     */
    private _lastBufferCleanupTime:number = 0;

    /**
     * Target for margin +/- around targetValue
     * @private
     */
    private _targetMargin:number = 0.2;

    /**
     * How many times margin was enlarged
     * @private
     */
    private _marginEnlargedCount:number = 0;

    /**
     * Advanced debugging options
     * @private
     */
    private _debug:boolean = false;

    private _usePlaybackRateControl: boolean = true;


    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    constructor(main: StormPlayerCore, playbackController:PlaybackController) {
        super();

        this._main = main;
        this._playbackController = playbackController;
        this._logger = main.getLogger();

        this._debug = this._main.getConfigManager()?.getSettingsData().getDebugData().playerUnitDebug ?? this._debug;

        this.initialize();

    }

    /**
     * Initializes all main variables
     */
    public initialize():void {

        this._seekCooldown = new CooldownMonitor(10);
        this._rateCooldown = new CooldownMonitor(10);

        if(UserCapabilities.getBrowserName().toLowerCase() == "safari" || UserCapabilities.isMobile()){
            this._seekCooldown.setCooldownDuration(60);
            this._rateCooldown = new CooldownMonitor(30);
        }

        if (UserCapabilities.isIOS()) {
            this._usePlaybackRateControl = false;
        }

        this._bitrateCooldown = new CooldownMonitor(20);
        this._playerType = PlayerType.MSE;
        this._bufferAnalyser = new BufferAnalyser();
        this._bandwidthMeter = new BandwidthMeter(60, this._main);
        this._degradeChargeMeter = new OverloadMeter(30);

        this._main.addEventListener("streamMetadataUpdate", this.onMetaData, false);
        this._main.addEventListener("streamStateChange", this.onStreamStateChange, false);
        this._main.addEventListener("playbackForcePause", this.onForcePause, false);

        this._videoObject = this._main.getStageController()!.getScreenElement()!.getVideoElement();

    }

    //------------------------------------------------------------------------//
    // EVENTS
    //------------------------------------------------------------------------//

    /**
     * Event calls before video data start to arrive
     * @param event
     */
    private onMetaData = (event:StormLibraryEvent["streamMetadataUpdate"]) => {

        if(this._debug)
            this._logger.decoratedLog("Metadata Arrived", "dark-green");

        this.restart();

        this._mainTimer = setInterval(() => {
            this.timerEvent();
        }, 100)

        this._acceptVideoData = true;
        this._mediaSource = this.createMediaSourceObject();
        this._videoObject.disableRemotePlayback = true;
        this._videoObject.controls = false;
        this._videoObject.src = URL.createObjectURL(this._mediaSource);
        this._playbackController.setPlaybackState(PlaybackState.BUFFERING);
        this._main.dispatchEvent("bufferingStart", {ref: this._main,});

        this._mediaSource.onsourceopen = () => {
            this.onSourceOpen();
        }

    }

    /**
     * Event triggered when Source is being opened and can now append data
     */
    private onSourceOpen = ():void => {

        if(this._mediaSource == null)
            return;

        if(this._mediaSource.readyState === 'open') {

            this._mediaSource.duration = 0;
            this._sourceBuffer = this._mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
            this._sourceBuffer.mode = "segments";

            this._sourceBuffer.onupdateend = () => {
                this.appendSourceBuffer();
            };

        }
    }

    /**
     * Appends a new fragment to a source Buffer
     * @private
     */
    private appendSourceBuffer(): void {

        if (this._sourceBuffer == null || this._mediaSource == null)
            return;

        if (this._mediaSource.readyState === 'open') {
            if (!this._sourceBuffer.updating) {

                if (this._shouldFlushData) {
                    this.flushVideoCache();
                    return;
                }

                if(this._playbackController.getPlaybackState() == PlaybackState.BUFFERING)
                    this.timerEvent();

                if (this._segmentsQueue.length > 0) {
                    try {
                        this._sourceBuffer.appendBuffer(this._segmentsQueue.shift());
                    } catch (error) {
                        console.error('Error appending buffer:', error);
                    }
                }
            }
        }
    }

    /**
     * Method marks for flushing video
     */
    public timerEvent():void {

        if(this._videoObject === null)
            return;

        this._degradeChargeMeter.markTimestamp();
        this._bandwidthMeter.markTimestamp();
        this._bufferAnalyser.addEntry(this.calculateBufferSize());

        const minValue:number = this._main.getConfigManager()!.getSettingsData().getBufferData().minValue;
        const targetValue:number = this._main.getConfigManager()!.getSettingsData().getBufferData().targetValue;
        const maxValue:number = this._main.getConfigManager()!.getSettingsData().getBufferData().maxValue;
        const startValue:number = this._main.getConfigManager()!.getSettingsData().getBufferData().startValue;
        const currentBufferSize:number = this._bufferAnalyser.bufferSize;

        if (this._main.getPlaybackController()!.getPlaybackState() == PlaybackState.BUFFERING) {

            if (currentBufferSize < startValue){

                //console.log("too low to start", startValue);

            } else if(currentBufferSize >= startValue) {
                if(this._preparingToStart == false){

                    //console.log("preparing to start");

                    this._preparingToStart = true;
                    this._bufferEndTime = new Date().getTime();

                    this._main.dispatchEvent("bufferingComplete", {ref: this._main,});

                    if(this._debug)
                        this._logger.decoratedLog("Buffering Complete", "dark-green");

                    this._seekCooldown.triggerCooldown();
                    this._rateCooldown.triggerCooldown();

                    this._videoObject.play().then(() => {

                        this._main.getStageController()?.getScreenElement()?.deleteBlackBackground();
                        this._preparingToStart = false;

                        if(this._debug)
                            this._logger.decoratedLog("Playback Start", "dark-green");

                    }).catch(error => {

                        this._preparingToStart = false;

                        this._logger.warning(this, "Error on Play(): "+error.name+" :: "+JSON.stringify(error));

                        switch(error.name){
                            case "NotAllowedError":
                                this._playbackController.setPlaybackState(PlaybackState.BUFFERING);
                                this._videoObject.muted = true;
                                this._main.dispatchEvent("playbackForceMute", {ref:this._main});

                                break;
                            default:
                                console.warn(error);
                        }

                    });


                } else {
                    // console.log("already preparing to start");
                }

            }

        } else if (this._main.getPlaybackController()!.getPlaybackState() == PlaybackState.PLAYING) {

            //console.log("bufferSize: "+currentBufferSize+" | minValue: "+minValue+" | maxValue: "+maxValue +" | targetValue: "+targetValue+" | rate: " +this._videoObject.playbackRate+" | cooldown: "+this._seekCooldown.isCooling()+" | isNear: "+this.isNearTarget(currentBufferSize, targetValue))

            if (currentBufferSize < minValue) {

                //console.warn("buffer is empty, stoping for buffering")

                /*
                            M   S  [ T ]   X
                    --------================++++++++++
                         ^
                */

                if(this._debug)
                    this._logger.decoratedLog("Buffer empty", "dark-green");

                this._playbackController.setPlaybackState(PlaybackState.BUFFERING);
                this._main.dispatchEvent("bufferingStart", {ref: this._main,});
                this._degradeChargeMeter.addEntry();
                this._videoObject.pause();


            } else if (currentBufferSize > maxValue && !this._seekCooldown.isCooling() && !this._rateCooldown.isCooling()) {

                /*
                          M   S  [ T ]   X
                  --------================++++++++++
                                            ^
                */

                //console.warn("OVER MAX - way, way too fast!")

                const bufferedEnd = this._videoObject.buffered.end(this._videoObject.buffered.length - 1);
                const targetPosition = bufferedEnd - targetValue;

                let validPosition = targetPosition;
                for (let i = 0; i < this._videoObject.buffered.length; i++) {
                    const start = this._videoObject.buffered.start(i);
                    const end = this._videoObject.buffered.end(i);

                    if (start <= targetPosition && targetPosition <= end) {
                        validPosition = targetPosition;
                        break;
                    }
                }

                if(this._debug )
                    this._logger.decoratedLog("Seek Jump! Rate set to 1.0", "dark-green");

                this._videoObject.currentTime = validPosition;
                this._videoObject.playbackRate = 1.0;
                this._seekCooldown.triggerCooldown();
                this._rateCooldown.triggerCooldown();


            } else if (currentBufferSize > targetValue && !NumberUtilities.isNear(currentBufferSize, targetValue, this._targetMargin)) {

                /*
                          M   S  [ T ]   X
                  --------================++++++++++
                                       ^
                */

                //console.warn("OVER TARGET - buffer increasing!")

                if(this._usePlaybackRateControl) {

                    if (this._videoObject.playbackRate == 0.9) {
                        this._videoObject.playbackRate = 1.0;

                        if (this._debug)
                            this._logger.decoratedLog("Playback Speed: 1.0", "dark-green");

                        this._rateCooldown.triggerCooldown();
                    }

                    if (this._videoObject.playbackRate == 1 && !this._rateCooldown.isCooling()) {
                        this._videoObject.playbackRate = 1.1;

                        if (this._debug)
                            this._logger.decoratedLog("Playback Speed: 1.1", "dark-green");

                        this._rateCooldown.triggerCooldown();
                    }
                }

            } else if (currentBufferSize < targetValue && !NumberUtilities.isNear(currentBufferSize, targetValue, this._targetMargin)) {

                /*
                         M   S  [ T ]   X
                 --------================++++++++++
                               ^
                 */

                //console.warn("BELOW TARGET - too slow!")

                if(this._usePlaybackRateControl) {

                    if (this._videoObject.playbackRate == 1.1) {
                        // console.error("ACTION - normalize!")
                        if (this._debug)
                            this._logger.decoratedLog("Playback Speed: 1.0", "dark-green");

                        this._videoObject.playbackRate = 1.0;
                        this._rateCooldown.triggerCooldown();
                    }

                    if (this._videoObject.playbackRate == 1.0 && !this._rateCooldown.isCooling()) {
                        // console.error("ACTION - slowing down!")

                        if (this._debug)
                            this._logger.decoratedLog("Playback Speed: 0.9", "dark-green");

                        this._videoObject.playbackRate = 0.9;
                        this._rateCooldown.triggerCooldown();
                    }

                }

            } else if (NumberUtilities.isNear(currentBufferSize, targetValue, this._targetMargin)) {

                /*
                        M   S  [ T ]   X
                --------================++++++++++
                                 ^
                */

                //console.warn("normal speed!")

                if(this._usePlaybackRateControl) {

                    if (this._videoObject.playbackRate != 1.0) {

                        if (this._debug)
                            this._logger.decoratedLog("Playback Speed: 1.0", "dark-green");

                        this._videoObject.playbackRate = 1.0;
                        this._rateCooldown.triggerCooldown();
                        this._marginEnlargedCount++;
                        if (this._marginEnlargedCount > 10) {
                            this._marginEnlargedCount = 0;
                            //this._targetMargin += 0.1;
                        }

                    }
                }

            }
        }

        if(this._degradeChargeMeter.getCurrentCount() >= 2){

            this._degradeChargeMeter.reset();
            this._bitrateCooldown.triggerCooldown();

            const fakeBandwidthCap:number = Number(this._main.getStorageManager()?.getField("fakeBandwidthCap")) ?? 0;
            const bandwidthValueCap:number = (fakeBandwidthCap != 0) ? fakeBandwidthCap : Math.round((this._bandwidthMeter.maxBandwidth+this._bandwidthMeter.currentBandwidth)/2/1024);

            this._main.dispatchEvent("sourceDowngrade", {ref:this._main, bandwidthCap: bandwidthValueCap });

            if(fakeBandwidthCap != 0)
                this._main.getStorageManager()?.saveField("fakeBandwidthCap","0");


        }

        const currentTime = new Date().getTime();
        if (currentTime - this._lastBufferCleanupTime >= this._bufferCleanupInterval) {
            this._lastBufferCleanupTime = currentTime;
            if (this._videoObject && this._videoObject.buffered.length > 0) {
                this._shouldFlushData = true;
                this.appendSourceBuffer();
            }
        }

    }

    private onStreamStateChange = (event:StormLibraryEvent["streamStateChange"]) => {

        switch(event.state){
            case StreamState.CLOSED:
            case StreamState.STOPPED:
            case StreamState.UNPUBLISHED:
                this.pause();
                this._playbackController.setPlaybackState(PlaybackState.STOPPED);
                this.restart();
                break;
        }

    }

    //------------------------------------------------------------------------//
    // GETS AND SETS
    //------------------------------------------------------------------------//

    /**
     * Calculates current buffer size
     */
    public calculateBufferSize(): number {
        if (!this._videoObject || !this._videoObject.buffered.length) return 0;

        const currentTime = this._videoObject.currentTime;
        let bufferedTimeLeft = 0;

        for (let i = 0; i < this._videoObject.buffered.length; i++) {
            if (this._videoObject.buffered.start(i) <= currentTime && currentTime <= this._videoObject.buffered.end(i)) {
                bufferedTimeLeft = this._videoObject.buffered.end(i) - currentTime;
                break;
            }
        }

        return bufferedTimeLeft;
    }

    /**
     * Returns buffer data
     */
    public getBufferData(): BufferData {

        const bufferData = new BufferData();

        bufferData.targetBuffer = this._main.getConfigManager()!.getSettingsData().getBufferData().targetValue;
        bufferData.minBuffer = this._main.getConfigManager()!.getSettingsData().getBufferData().minValue;
        bufferData.maxBuffer = this._main.getConfigManager()!.getSettingsData().getBufferData().maxValue;
        bufferData.startBuffer = this._main.getConfigManager()!.getSettingsData().getBufferData().startValue;
        bufferData.targetMargin = this._targetMargin;
        bufferData.deviation = this._bufferAnalyser.bufferDeviation;
        bufferData.bufferSize = this.calculateBufferSize();

        return bufferData;
    }

    /**
     * Pushes new data segments into stream
     * @param data
     */
    public feedRawData(data:ArrayBuffer):void {

        if(!this._acceptVideoData) {
            return;
        }

        if(this._dataPacketCount == 0)
            this._dataArrivalStartTime = new Date().getTime();

        this._dataPacketCount++;
        this._bandwidthMeter.addReceivedBytes((data.byteLength*8))

        this._segmentsQueue.push(data);
        this.appendSourceBuffer();

    }

    //------------------------------------------------------------------------//
    // UTILITIES
    //------------------------------------------------------------------------//

    /**
     * Blocks receiving data to video
     */
    public block():void {
        this._acceptVideoData = false;
    }

    /**
     * Method pauses playback
     * @param isStopped
     */
    public pause(isStopped:boolean = false):void {

        if(this._videoObject != null)
            this._videoObject.pause();

        const newState = (!isStopped) ? PlaybackState.PAUSED : PlaybackState.STOPPED;
        this._playbackController.setPlaybackState(newState);
        this._bandwidthMeter.reset();

    }

    /**
     * Creates new MediaSourceObject (either Media or ManagedMedia)
     * @private
     */
    private createMediaSourceObject():MediaSource | ManagedMediaSource {
        if(UserCapabilities.hasMMSSupport()) {
            this._logger.info(this, "MMS Mode was picked for this source!");
            return new ManagedMediaSource()
        } else {
            this._logger.info(this, "MSE Mode was picked for this source!");
            return new MediaSource();
        }
    }

    /**
     * Metoda czyszcząca bufor na żądanie
     * @private
     */
    private flushVideoCache():void {
        if(this._mediaSource != null && this._sourceBuffer != null && this._videoObject != null) {
            if(!this._sourceBuffer.updating) {
                try {

                    const currentTime = this._videoObject.currentTime;
                    const safeRemoveEndTime = Math.max(0, currentTime - this._bufferTimeToKeep);

                    if (safeRemoveEndTime > 0) {
                        this._sourceBuffer.remove(0, safeRemoveEndTime);
                    }

                    this._shouldFlushData = false;
                } catch (error) {
                    this._logger.warning(this, `Error while flushingVideoCache: ${error}`);
                    this._shouldFlushData = false;
                }
            }
        }
    }

    //------------------------------------------------------------------------//
    // CLEAN UP
    //------------------------------------------------------------------------//

    /**
     * Restarts player in preparing for new stream
     * @private
     */
    private restart():void {

        if (this._sourceBuffer && this._mediaSource) {
            if (this._sourceBuffer.updating) {
                this._sourceBuffer.abort();
            }

            try {
                this._mediaSource.removeSourceBuffer(this._sourceBuffer);
            } catch (e) {
                this._logger.warning(this, `Error removing source buffer: ${e}`);
            }

            this._sourceBuffer.onupdateend = null;
            this._sourceBuffer = null;
        }

        if (this._mediaSource && this._mediaSource.readyState === 'open') {
            this._mediaSource.duration = 0;
        }

        if (this._mediaSource) {
            if (this._mediaSource.readyState === 'open') {
                this._mediaSource.endOfStream();
            }
            this._mediaSource.onsourceopen = null;
            this._mediaSource = null;
        }

        if (this._videoObject) {
            this._videoObject.pause();
            this._videoObject.removeAttribute('src');
            this._videoObject.load();
            this._videoObject.playbackRate = 1.0;
        }

        this._bufferStartTime = 0;
        this._bufferEndTime = 0;
        this._dataPacketCount = 0;
        this._totalBytesReceived = 0;
        this._segmentsQueue = [];
        this._acceptVideoData = false;
        this._seekCooldown.reset();
        this._bufferAnalyser.reset();
        this._bandwidthMeter.reset();
        this._degradeChargeMeter.reset();
        this._bitrateCooldown.reset()

    }

    /**
     * Clears all data after stream is over
     */
    public clear():void {

        this._acceptVideoData = false;

        if (this._videoObject)
            this._videoObject.pause();

        if (this._videoObject) {
            this._videoObject.removeAttribute('src');
            this._videoObject.load();
        }

        if (this._sourceBuffer && this._mediaSource) {
            if (this._sourceBuffer.updating) {
                this._sourceBuffer.abort();
            }
            try {
                this._mediaSource.removeSourceBuffer(this._sourceBuffer);
            } catch (e) {
                //console.warn('Error removing source buffer:', e);
            }
            this._sourceBuffer = null;
        }

        if (this._mediaSource) {
            if (this._mediaSource.readyState === 'open') {
                this._mediaSource.endOfStream();
            }
            this._mediaSource = null;
        }

        if(this._mainTimer != null)
            clearInterval(this._mainTimer);

        this._seekCooldown.reset();
        this._rateCooldown.reset();

        this._videoObject.playbackRate = 1.0;

    }


}