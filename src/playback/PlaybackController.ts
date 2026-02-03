import {StormPlayerCore} from "../StormPlayerCore";
import {Logger} from "../logger/Logger";
import {IPlaybackTask} from "./task/IPlaybackTask";
import {SubscribeTask} from "./task/SubscribeTask";
import {PlayTask} from "./task/PlayTask";
import {TaskType} from "./enum/TaskType";
import {PlaybackState} from "./enum/PlaybackState";
import {ISourceItem} from "../model/ISourceItem";
import {ProtocolType} from "../config/enum/ProtocolType";
import {UserCapabilities} from "../utilities/UserCapabilities";
import {MSEPlayer} from "./player/MSEPlayer";
import {StormLibraryEvent} from "../events/StormLibraryEvent";
import {PauseTask} from "./task/PauseTask";
import {UnsubscribeTask} from "./task/UnsubscribeTask";
import {IPlayer} from "./player/IPlayer";
import {HLSPlayer} from "./player/HLSPlayer";
import {StreamState} from "./enum/StreamState";
import {Trend} from "../enum/Trend";
import {Stability} from "../enum/Stability";


/**
 * This class (instance) is responsible to controlling video playback. It's the central point of the whole project, where
 * all components are being managed.
 */
export class PlaybackController {

    /**
     * Whenever MSE & MMS sub-player is enabled
     * @private
     */
    private readonly MSE_ENABLED:boolean = true;

    /**
     * Whenever HLS sub-player is enabled
     * @private
     */
    private readonly HLS_ENABLED:boolean = true;

    /**
     * Reference to the main class
     * @private
     */
    private readonly _main: StormPlayerCore;

    /**
     * Reference to the player logger
     * @private
     */
    protected _logger:Logger;

    /**
     * List of task to perform
     * @private
     */
    private _taskQueue:Array<IPlaybackTask> = new Array<IPlaybackTask>();

    /**
     * Last subscription-type task (can be null)
     * @private
     */
    private _lastSubscribeTask:IPlaybackTask | null | undefined;

    /**
     * Last playback-type task
     * @private
     */
    private _lastCommandTask:IPlaybackTask | null | undefined;

    /**
     * Recovery task for forced-pause
     * @private
     */
    private _recoveryTask:IPlaybackTask | null | undefined;

    /**
     * Current playbackState of the playback (not the stream!)
     * @private
     */
    private _playbackState:PlaybackState = PlaybackState.UNKNOWN;

    /**
     * Previous playbackState
     * @private
     */
    private _previousPlaybackState:PlaybackState = PlaybackState.UNKNOWN;

    /**
     * Current stream state (on the server)
     * @private
     */
    private _streamState:StreamState = StreamState.UNKNOWN;

    /**
     * Absolute playback time
     * @private
     */
    private _absoluteStreamTime:number = 0;

    /**
     * Current, active source
     * @private
     */
    private _selectedSource:ISourceItem | null;

    /**
     * Currently selected player
     * @private
     */
    private _selectedPlayer:IPlayer | null;

    /**
     * Whenever current window is active or not
     * @private
     */
    private _isWindowActive:boolean = true;

    private _subscribeCooldown:any;

    private _lastStreamKey:String | null = null;

    private _userReportCounter:number = 0;

    private _stateDebug:boolean = false;

    private _debug:boolean = false;

    private _silentMode:boolean = false;

    private _prevStreamState:StreamState = StreamState.UNKNOWN;


    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constructor - requires properly configured config object
     * @param config
     */
    constructor(main: StormPlayerCore) {

        this._main = main;
        this._logger = main.getLogger();
        this._logger.info(this, "Creating new PlaybackController")

        this._debug = this._main.getConfigManager()?.getSettingsData().getDebugData().playbackControllerDebug ?? this._debug;

        this.initialize();

    }

    //------------------------------------------------------------------------//
    // MAIN METHODS
    //------------------------------------------------------------------------//

    public initialize():void {

        this._main.addEventListener("serverDisconnect", this.onServerDisconnect, false)
        this._main.addEventListener("authorizationComplete", this.onAuthComplete, false)
        this._main.addEventListener("subscriptionComplete", this.onSubscribeComplete, false)
        this._main.addEventListener("subscriptionFailed", this.onSubscribeFailed, false)
        this._main.addEventListener("streamStateChange", this.onStreamStateChange, false)
        this._main.addEventListener("playbackForcePause", this.onForcePause, false)
        this._main.addEventListener("playbackProgress", this.onProgressEvent, false)

        this._main.addEventListener("serverConnectionRestart", this.serverConnectionRestart, false)
        this._main.addEventListener("containerChange", (event  ) => {

            if (this._recoveryTask != null) {
                const recoveredTask = this._recoveryTask;
                this._taskQueue.push(recoveredTask);
                this.executeTask();
                this._recoveryTask = null;
            }

        }, false);

        const streamKey: string | null | undefined = this._main?.getConfigManager()?.getStreamData().streamKey;

        if (streamKey) {
            if (this._main.getConfigManager()?.getSettingsData().autoStart) {
                this.createSubscribeTask(streamKey, true);
            } else {
                this.createSubscribeTask(streamKey, false);
            }
        }

        // Słuchacze zdarzeń dla Page Visibility API
        document.addEventListener("visibilitychange", this.visibilityChange);
        window.addEventListener("blur", this.onWindowBlur);
        window.addEventListener("focus", this.onWindowFocus);

        if(this._main.getConfigManager()?.getSettingsData().autoConnect) {
            this._logger.info(this, "Initializing NetworkController (autoConnect is true)");
            this._main.getNetworkController()?.initialize();
        } else
            this._logger.warning(this, "Warning - autoConnect is set to false, switching to standby mode!");

    }

    public stop():void {
        this._selectedPlayer?.clear();

        this._taskQueue = new Array<IPlaybackTask>();

        this.setPlaybackState(PlaybackState.UNKNOWN);
        this._streamState = StreamState.UNKNOWN;

        this._main.getPlaybackController()?.setStreamState(StreamState.UNKNOWN, this._selectedSource?.getStreamKey() ?? null);

        this._selectedSource = null;
        this._previousPlaybackState = PlaybackState.UNKNOWN;
        this._recoveryTask = null;
        this._lastCommandTask = null;

    }

    //------------------------------------------------------------------------//
    // EVENTS
    //------------------------------------------------------------------------//

    /**
     * Methods handles visibility change events
     */
    private visibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            this.onWindowBlur();
        } else if (document.visibilityState === 'visible') {
            this.onWindowFocus();
        }
    }

    private serverConnectionRestart = (event:StormLibraryEvent["serverConnectionRestart"]) => {

        if(event.isSilent){
            this._silentMode = true;
            setTimeout(() => {
                this._silentMode = false;
            },5000)
        }

    }

    private onServerDisconnect = () => {
        this._lastStreamKey = null;
        this.setPlaybackState(PlaybackState.STOPPED);
        this.setStreamState(StreamState.STOPPED, this._selectedSource?.getStreamKey() ?? null);
    }

    private onProgressEvent = (event: StormLibraryEvent["playbackProgress"]): void => {
        this._absoluteStreamTime = event.streamStartTime + event.streamDuration;

        if(this._userReportCounter == 10){

            const bufferSize:number = this._selectedPlayer?.getBufferAnalyser()?.bufferSize ?? 0;
            const bufferDev:number = this._selectedPlayer?.getBufferAnalyser()?.bufferDeviation ?? 0;
            const bufferStability: Stability = this._main.getBufferAnalyser()?.stability ?? Stability.UNKNOWN;
            const playbackRate:number = this._selectedPlayer?.getPlaybackRate() ?? 0;
            const bwStability:Trend = this._main.getBandwidthAnalyser()?.currentTrend ?? Trend.UNKNOWN;
            const bwCap:number = this._main.getQualityController()?.getBandwidthCap() ?? 0;
            const actionTimer:number = this._main.getQualityController()?.getTimeToNextUpgrade() ?? 0;

            const progressData:Object = {
                "bufferSize": Math.floor(bufferSize * 10000) / 10000,
                "bufferDev": Math.floor(bufferDev * 10000) / 10000,
                "bufferStability": bufferStability,
                "playbackRate": playbackRate,
                "bwStability": bwStability,
                "bwCap": bwCap,
                "actionTimer": actionTimer
            };



            this._main.getNetworkController()?.sendUserReportPacket(progressData);
            this._userReportCounter = 0;
        }
        this._userReportCounter++;

    }

    /**
     * Authorization with the server is now complete. If autoStart was set to 'true'
     * a subscription and play task were added. If autostart was set to 'false'
     * only subscribe was added and player will wait for user interaction
     */
    private onAuthComplete = () => {

        this._selectedSource = null;

        if(this._taskQueue.length > 0) {
            if (this._taskQueue[0].getType() == TaskType.PLAY) {
                if (this._lastSubscribeTask != null) {
                    let playCommand: IPlaybackTask | undefined = this._taskQueue.shift();
                    this._taskQueue = new Array<IPlaybackTask>();
                    this._taskQueue.push(this._lastSubscribeTask);
                    if (playCommand != null)
                        this._taskQueue.push(playCommand);
                }
            }
        } else {

            if(this._lastSubscribeTask != null)
                this._taskQueue.push(this._lastSubscribeTask);

            if(this._lastCommandTask != null)
                this._taskQueue.push(this._lastCommandTask);

        }

        this.executeTask();
    }

    public wasPlayingLastTime():boolean {
        let result:boolean = false;
        if(this._lastCommandTask != null){
            if(this._lastCommandTask.getType() == TaskType.PLAY){
                result = true;
            }
        }

        return result;
    }


    private onSubscribeComplete = () => {

        this._logger.info(this, "Subscription complete, remaining tasks: "+this._taskQueue.length);

        if(this._taskQueue.length > 0) {

            const firstTask: IPlaybackTask = this._taskQueue[0];
            if(firstTask.getType() == TaskType.SUBSCRIBE)
                this._lastSubscribeTask = this._taskQueue.shift();

            this._selectedSource = null;
            this.executeTask();
        }
    }

    /**
     * Method is called when player is paused by a browser. Player will
     * save last task.
     */
    private onForcePause = () => {

        if(this._lastCommandTask != null)
            this._recoveryTask = this._lastCommandTask;

        this.createPauseTask()

    }


    private onSubscribeFailed = () => {

        if(this._taskQueue.length > 0) {

            const firstTask: IPlaybackTask = this._taskQueue[0];
            if (firstTask.getType() == TaskType.SUBSCRIBE)
                this._lastSubscribeTask = this._taskQueue.shift();

            const secondTask:IPlaybackTask | undefined = this._taskQueue.shift();
            if(secondTask != null && secondTask.getType() == TaskType.PLAY)
                this._lastCommandTask = secondTask;

            this._selectedSource = null;
        }

    }

    /**
     * Updates streamState to the latest reported state
     * @param event
     */
    private onStreamStateChange = (event:StormLibraryEvent["streamStateChange"]) => {

        this._streamState = event.state;


        switch(event.state){
            case StreamState.PUBLISHED:

                if(this._lastCommandTask?.getType() == TaskType.PLAY){
                    //if(this._prevStreamState != StreamState.NOT_FOUND) {
                        this._taskQueue.push(this._lastCommandTask);
                        this.executeTask();
                    //} else {
                    //}
                }
                break;
            case StreamState.CLOSED:
                this._selectedSource = null;

                break;
            case StreamState.NOT_FOUND:

                this.setPlaybackState(PlaybackState.STOPPED);

                break;
        }

        this._prevStreamState = event.state;

    }

    /**
     * Method switches between play and pause depending on current state.
     */
    public togglePlay():void {
        switch(this._playbackState){
            case PlaybackState.BUFFERING:
            case PlaybackState.PLAYING:
                this.createPauseTask();
                break;
            default:
                this.createPlayTask();
        }
    }

    //------------------------------------------------------------------------//
    // TASK QUEUE
    //------------------------------------------------------------------------//

    public createSubscribeTask(streamKey:string, autoStart:boolean){

        if(this._debug)
            this._logger.decoratedLog("Subscribe: "+streamKey, "dark-red");

        this._logger.info(this, "Creating new subscribe task :: streamKey: "+streamKey+ " | autoStart: "+autoStart+" | lastStreamKey: "+ this._lastStreamKey)

        if(streamKey == this._lastStreamKey) {

            if(this._debug)
                this._logger.decoratedLog("Aborting Subscribe (already subscribed): "+streamKey, "dark-red");

            this._logger.warning(this, "Already have this subscription, aborting...");
            return;
        } else {
            this._lastStreamKey = streamKey;
        }

        clearTimeout(this._subscribeCooldown);

        this._main.getConfigManager()!.getStreamData().streamKey = streamKey;
        this._logger.info(this, "StreamKey registered: "+streamKey);

        this._taskQueue = [];
        this._taskQueue.push( new SubscribeTask(streamKey));

        if(autoStart)
            this._taskQueue.push(new PlayTask(streamKey));

        this._subscribeCooldown = setTimeout(() => {
            this.executeTask();
        }, 30);

    }

    public createPauseTask():void {

        if(this._debug)
            this._logger.decoratedLog("Pause", "dark-red");

        this._taskQueue = new Array<IPlaybackTask>();
        this._taskQueue.push(new PauseTask());

        this.executeTask();
    }

    public createPlayTask(source:ISourceItem | null = null):void {

        if(source == null) {
            if (this._lastSubscribeTask != null) {
                const prevSubsciption: SubscribeTask = this._lastSubscribeTask as SubscribeTask;
                this._taskQueue.push(new PlayTask(prevSubsciption.getStreamKey()));
            }
        } else {
            this._selectedSource = source;
            this._taskQueue.push(new PlayTask(this._selectedSource.getStreamKey()));
        }

        if(this._debug)
            this._logger.decoratedLog("Play: "+this._selectedSource?.getStreamInfo().getLabel(), "dark-red");

        this.executeTask();
    }


    public createUnsubscribeTask(){

        if(this._debug)
            this._logger.decoratedLog("Unsubscribe", "dark-red");

        this._logger.info(this, "Creating Unsubscribe Task")

        this._lastStreamKey = null;
        this._main.getConfigManager()!.getStreamData().streamKey = null;

        for(let i:number=0;i<this._taskQueue.length;i++){
            this._taskQueue.shift();
        }

        this._taskQueue.push(new PauseTask(true));
        this._taskQueue.push(new UnsubscribeTask());

        this.executeTask();

    }

    private executeTask():void {

        if(this._taskQueue.length > 0) {

            const firstTask: IPlaybackTask | undefined = this._taskQueue.shift();

            if(firstTask == null)
                return;

            switch(firstTask.getType()){
                // SUBSCRIBE
                case TaskType.SUBSCRIBE:

                    const subscribeTask: SubscribeTask = firstTask as SubscribeTask;

                    if (this._main.getConfigManager()!.getStreamData().streamKey == subscribeTask.getStreamKey()) {
                        this._selectedPlayer?.clear();

                        this._main.getNetworkController()!.subscribe(subscribeTask.getStreamKey())
                        this._lastSubscribeTask = firstTask;
                    }

                break;
                // SUBSCRIBE
                case TaskType.UNSUBSCRIBE:

                    this._logger.info(this, "Performing Unsubscribe Task")

                    this._selectedPlayer?.clear();
                    this._main.getNetworkController()!.unsubscribe();

                    this.setPlaybackState(PlaybackState.UNKNOWN);
                    this.setStreamState(StreamState.UNKNOWN, this._selectedSource?.getStreamKey() ?? null)

                    this._selectedSource = null;
                    this._lastSubscribeTask = null;

                    break;
                // PLAY
                case TaskType.PLAY:

                    this._lastCommandTask = firstTask;
                    if(this._streamState == StreamState.PUBLISHED) {

                        if (this._selectedSource == null)
                            this._selectedSource = this._main.getQualityController()?.selectSource() ?? null;

                        if (this._selectedSource != null) {

                            if(this._selectedPlayer == null)
                                this._selectedPlayer = this.selectPlayer(this._selectedSource);
                            else
                                this._selectedPlayer.block();

                            if(this._selectedPlayer != null){

                                this._main.getNetworkController()?.playSignal(this._selectedSource);
                                this._main.getQualityController()?.updateAutoQualityItem(this._selectedSource);

                            } else
                                this._logger.error(this, "No compatible player for playback")
                        } else {
                            this._logger.info(this, "No StreamData to play - restoring subscription!")
                            if(this._lastSubscribeTask != null){
                                const lastSubscriptionTask = this._lastSubscribeTask as SubscribeTask;
                                this._main.getNetworkController()!.subscribe(lastSubscriptionTask.getStreamKey())
                            }

                        }

                    }

                break;
                // PAUSE
                case TaskType.PAUSE:

                    if(this._selectedPlayer != null && this._main.getNetworkController() != null) {

                        const pauseTask:PauseTask = firstTask as PauseTask;

                        switch (this._playbackState) {
                            case PlaybackState.PLAYING:
                            case PlaybackState.BUFFERING:

                                this._lastCommandTask = firstTask;
                                this._selectedPlayer.pause(pauseTask.getIfStopped());
                                this._main.getNetworkController()!.pauseSignal();

                                break;
                            default:
                                this._logger.warning(this, "Incorrect state, cannot pause: " + this._playbackState,)
                        }

                    }

                    this.executeTask(); // need to re-run for unsubcribe

                break;
            }

        } else
            this._logger.warning(this, "No tasks to perform, waiting for user command")

    }

    //------------------------------------------------------------------------//
    // PLAYER & SOURCE
    //------------------------------------------------------------------------//

    /**
     * This method is called when we know that all stream & server sources/list are ready
     * @private
     */
    public selectPlayer(source:ISourceItem):IPlayer | null {

        let player:IPlayer | null = null;

        switch(source.getType()){
            // RTMP & STORM
            case ProtocolType.STORM: {

                if(player == null && this.MSE_ENABLED && (UserCapabilities.hasMMSSupport() || UserCapabilities.hasMSESupport())) {
                    this._logger.info(this, "MSE/MME Player was picked for this source!");
                    return new MSEPlayer(this._main, this);
                }

                if(player == null && this.HLS_ENABLED) {
                    this._logger.info(this, "HLS Player was picked for this source!");
                    return new HLSPlayer(this._main, this);
                }

            }
            break;
            default: {

            }
        }

        if(player == null){
            this._logger.error(this, "This device does not support any available media protocol!");
            this._main.dispatchEvent("compatibilityError", {
                ref: this._main,
                message: "This device does not support any available media protocol!"
            });
        }

        return player

    }

    /**
     * Sets playback state. Please keep in mind that this method will not dispatch related event!
     *
     * @param newPlaybackState new playback state
     */
    public setPlaybackState(newPlaybackState:PlaybackState):void {

        this._previousPlaybackState = this._playbackState;
        this._playbackState = newPlaybackState;

        if(this._stateDebug)
            this._logger.decoratedLog("Playback State: "+newPlaybackState, "dark-blue");

        this._logger.info(this, "Playback State Change: "+newPlaybackState+" (old: "+this._previousPlaybackState+")");

        if(this._silentMode){
            if(newPlaybackState == PlaybackState.STOPPED)
                return;
        }

        this._main.dispatchEvent("playbackStateChange", {
            ref: this._main,
            streamKey: this._selectedSource?.getStreamKey() ?? null,
            state: this._playbackState,
        });

        switch(newPlaybackState){
            case PlaybackState.PLAYING:

                this._main.dispatchEvent("playbackStart", {
                    ref: this._main,
                    streamKey: this._selectedSource?.getStreamKey() ?? null,
                });

                break;
            case PlaybackState.PAUSED:

                this._main.dispatchEvent("playbackPause", {
                    ref: this._main,
                    streamKey: this._selectedSource?.getStreamKey() ?? null,
                });

                break;
            case PlaybackState.STOPPED:

                this._main.dispatchEvent("playbackStop", {
                    ref: this._main,
                    streamKey: this._selectedSource?.getStreamKey() ?? null,
                });

                break;

        }

    }

    /**
     * Sets state for stream (it's independent from what player does at the moment)
     *
     * @param newStreamState
     */
    public setStreamState(newStreamState:StreamState, streamKey:string | null):void {

        if(this._stateDebug)
            this._logger.decoratedLog("Stream State: "+newStreamState, "dark-orange");

        this._streamState = newStreamState;


        if(this._silentMode){
            if(newStreamState == StreamState.STOPPED || newStreamState == StreamState.CLOSED)
                return;
        }

        switch (newStreamState){
            case StreamState.NOT_FOUND:
                this._playbackState = PlaybackState.UNKNOWN;
                break;
        }

        this._main.dispatchEvent("streamStateChange", {
            ref: this._main,
            streamKey: streamKey,
            state: newStreamState,
        });

    }

    /**
     * Returns absolute stream time
     */
    public getAbsoluteStreamTime():number {
        return this._absoluteStreamTime;
    }

    //------------------------------------------------------------------------//
    // BLUR & FOCUS
    //------------------------------------------------------------------------//
    /**
     * Reacts to browser changing visibility of the document (or blur)
     */
    private onWindowBlur = () => {
        if(this._isWindowActive){
            this._logger.warning(this, "Player window is no longer in focus!");
        }
        this._isWindowActive = false;
    }

    /**
     * Reacts to browser changing visibility of the document (or focus)
     */
    private onWindowFocus = () => {

        if(!this._isWindowActive) {
            if (this._recoveryTask != null) {
                const recoveredTask = this._recoveryTask;
                this._taskQueue.push(recoveredTask);
                this.executeTask();
                this._recoveryTask = null;
            }
            this._logger.info(this, "Player window is focused again!");
        }

        this._isWindowActive = true;
    }

    //------------------------------------------------------------------------//
    // SETS & GETS
    //------------------------------------------------------------------------//

    /**
     * Returns current task queue
     */
    public getTaskQueue():any {
        return this._taskQueue;
    }

    /**
     * Returns currently used player
     */
    public getPlayer():IPlayer | null {
        return this._selectedPlayer;
    }

    /**
     * Returns current Playback playbackState
     */
    public getPlaybackState():PlaybackState {
        return this._playbackState;
    }

    /**
     * Returns source item currently being in use
     */
    public getCurrentSourceItem():ISourceItem | null {
        return this._selectedSource;
    }

    /**
     * Returns current Stream playbackState
     */
    public getStreamState():StreamState {
        return this._streamState;
    }

    public setSelectedStream(newItem:ISourceItem | null):void {
        this._selectedSource = newItem;
    }

    //------------------------------------------------------------------------//
    // DESTROY
    //------------------------------------------------------------------------//

    public destroy():void {

        this.setStreamState(StreamState.UNKNOWN, this._selectedSource?.getStreamKey() ?? null);
        this.setPlaybackState(PlaybackState.UNKNOWN);

        this._selectedPlayer?.clear();
        this._selectedPlayer = null;
        this._selectedSource = null;

        document.removeEventListener("visibilitychange", this.visibilityChange);
        window.removeEventListener("blur", this.onWindowBlur);
        window.removeEventListener("focus", this.onWindowFocus);

    }


}