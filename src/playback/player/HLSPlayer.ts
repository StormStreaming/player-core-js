import {IPlayer} from "./IPlayer";
import {AbstractPlayer} from "./AbstractPlayer";
import {StormPlayerCore} from "../../StormPlayerCore";
import {PlaybackController} from "../PlaybackController";
import {PlayerType} from "../enum/PlayerTypes";
import {StormLibraryEvent} from "../../events/StormLibraryEvent";
import {PlaybackState} from "../enum/PlaybackState";
import {UserCapabilities} from "../../utilities/UserCapabilities";
import {StreamState} from "../enum/StreamState";
import {BufferData} from "../BufferData";
import {BufferAnalyser} from "../../analyse/BufferAnalyser";
import {BandwidthMeter} from "../buffer/BandwidthMeter";
import {OverloadMeter} from "../buffer/OverloadMeter";

export class HLSPlayer extends AbstractPlayer implements IPlayer {

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
     * Calculates bandwidth drops
     * @private
     */
    private _degradeChargeMeter:OverloadMeter;

    /**
     * Main timer
     * @private
     */
    private _mainTimer:number;

    /**
     * Advanced debugging options
     * @private
     */
    private _debug:boolean = false;

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    constructor(main: StormPlayerCore, playbackController:PlaybackController) {
        super();

        this._main = main;
        this._playbackController = playbackController;
        this._logger = main.getLogger();
        this._playerType = PlayerType.HLS;

        this._debug = this._main.getConfigManager()?.getSettingsData().getDebugData().playerUnitDebug ?? this._debug;

        this.initialize();

    }

    public initialize():void {

        this._main.addEventListener("streamMetadataUpdate", this.onMetaData, false);
        this._main.addEventListener("streamStateChange", this.onStreamStateChange, false);
        this._main.addEventListener("playbackForcePause", this.onForcePause, false);

        this._videoObject = this._main.getStageController()!.getScreenElement()!.getVideoElement();
        this._bufferAnalyser = new BufferAnalyser();
        this._bandwidthMeter = new BandwidthMeter(60, this._main);
        this._degradeChargeMeter = new OverloadMeter(30);

        this._mainTimer = setInterval(() => {
            this.timerEvent();
        }, 100)

    }

    private onMetaData = (event:StormLibraryEvent["streamMetadataUpdate"]) => {

        this.restart();

        this._videoObject.disableRemotePlayback = true;
        this._videoObject.controls = false;
        this._playbackController.setPlaybackState(PlaybackState.BUFFERING);

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

    public setURL(url: string) {

        this._playbackController.setPlaybackState(PlaybackState.BUFFERING);
        this._videoObject!.src = url;
        this._videoObject?.play().then(() => {

        }).catch(error => {
            this.onPlaybackError(error);
        });

    }


    private onPlaybackError(error:any):void {

        this._logger.warning(this, "Error on Play(): "+error.name+" :: "+JSON.stringify(error));

        switch(error.name){
            case "NotAllowedError":
                this._videoObject.muted = true;
                this._main.dispatchEvent("playbackForceMute", {ref:this._main});

                break;
            default:
                console.warn(error);
        }

        this._videoObject?.play().then(() => {

        }).catch(error => {

            this._logger.error(this, "Critical HLS Player Error");

        });
    }

    //------------------------------------------------------------------------//
    // GETS AND SETS
    //------------------------------------------------------------------------//

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

    public pause(isStopped:boolean = false):void {

        if(this._videoObject != null)
            this._videoObject.pause();

        const newState = (!isStopped) ? PlaybackState.PAUSED : PlaybackState.STOPPED;
        this._playbackController.setPlaybackState(newState);
        this._bandwidthMeter.reset();

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

    }

    //------------------------------------------------------------------------//
    // UTILITIES
    //------------------------------------------------------------------------//

    /**
     * Pushes new data segments into stream
     * @param data
     */
    public feedRawData(data:ArrayBuffer):void {
        // nothing
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
        bufferData.targetMargin = 0;
        bufferData.deviation = 0;
        bufferData.bufferSize = this.calculateBufferSize();

        return bufferData;
    }

    //------------------------------------------------------------------------//
    // CLEAN UP
    //------------------------------------------------------------------------//

    /**
     * Restarts player in preparing for new stream
     * @private
     */
    private restart():void {

        this._bufferStartTime = 0;
        this._bufferEndTime = 0;

        this._dataPacketCount = 0;
        this._totalBytesReceived = 0;

        this._bufferAnalyser.reset();
        this._bandwidthMeter.reset();
        this._degradeChargeMeter.reset();

    }

    /**
     * Clears all data after stream is over
     */
    public clear():void {

        if (this._videoObject)
            this._videoObject.pause();

        if (this._videoObject) {
            this._videoObject.removeAttribute('src');
            this._videoObject.load();
        }


        this._bufferAnalyser.reset();
        this._bandwidthMeter.reset();
        this._degradeChargeMeter.reset()


    }

}