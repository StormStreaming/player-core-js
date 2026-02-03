import {ConfigManager} from "./config/ConfigManager";
import {EventDispatcher} from "./events/EventDispatcher";
import {Logger} from "./logger/Logger";
import {UserCapabilities} from "./utilities/UserCapabilities";
import {StormStreamConfig} from "./types/StormStreamConfig";
import {StormLibraryEvent} from "./events/StormLibraryEvent";
import {PlaybackState} from "./playback/enum/PlaybackState";
import {StorageManager} from "./storage/StorageManager";
import {StageController} from "./stage/StageController";
import {NumberUtilities} from "./utilities/NumberUtilities";
import {PlaybackController} from "./playback/PlaybackController";
import {NetworkController} from "./network/NetworkController";
import {ScalingType} from "./config/enum/ScalingType";
import {ISourceItem} from "./model/ISourceItem";
import {StreamState} from "./playback/enum/StreamState";
import {QualityItem} from "./model/QualityItem";
import {BandwidthAnalyser} from "./analyse/BandwidthAnalyser";
import {BufferAnalyser} from "./analyse/BufferAnalyser";
import {BandwidthMeter} from "./playback/buffer/BandwidthMeter";
import {BufferGraph} from "./graph/BufferGraph";
import {BandwidthGraph} from "./graph/BandwidthGraph";
import {BufferStabilityGraph} from "./graph/BufferStabilityGraph";
import {IGraph} from "./graph/IGraph";
import {QualityControlMode} from "./enum/QualityControlMode";
import {QualityController} from "./playback/QualityController";
import {ServerInfo} from "./network/model/ServerInfo";

/**
 * Main class of the player. The player itself has no GUI, but can be controlled via provided API.
 */
export class StormPlayerCore extends EventDispatcher {

    /**
     * Next ID for the player
     * @private
     */
    private static NEXT_PLAYER_ID:number = 0;

    /**
     * Whenever player is in development mode (more debug options)
     * @private
     */
    private readonly DEV_MODE:boolean = true;

    /**
     * Version of this player.
     * @private
     */
    readonly PLAYER_VERSION:string = "$version";

    /**
     * Compile date for this player
     * @private
     */
    private readonly COMPILE_DATE:string = "$compileDate";

    /**
     * Defines from which branch this player comes from e.g. "Main", "Experimental",
     * @private
     */
    private readonly PLAYER_BRANCH:string = "Experimental"

    /**
     * Defines number of player protocol that is required on server-side
     * @private
     */
    public readonly PLAYER_PROTOCOL_VERSION:number = 1;

    /**
     * ID of the player within stormPlayerCollection array
     * @private
     */
    private readonly _playerID:number

    /**
     * Contains all player configuration objects
     * @private
     */
    private _configManager:ConfigManager;

    /**
     * Whenever player was initialized or not
     * @private
     */
    private _initialized:boolean = false;

    /**
     * Manages data-saving like bandwidth, volume
     * @private
     */
    private _storageManager: StorageManager | null

    /**
     * Controls all HTML elements
     * @private
     */
    private _stageController:StageController | null

    /**
     * Controls all HTML elements
     * @private
     */
    private _playbackController:PlaybackController | null

    /**
     * Controls aspects related to video quality
     * @private
     */
    private _qualityController:QualityController | null

    /**
     * Controls all network communication
     * @private
     */
    private _networkController:NetworkController | null;

    /**
     * Active graphs,
     * @private
     */
    private _graphs:IGraph[];

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constructor - requires properly configured config object
     * @param config
     */
    constructor(streamConfig?:StormStreamConfig, autoInitialize:boolean = false) {

        super();

        if (typeof window === 'undefined' || !window.document || !window.document.createElement) {
            console.error(`StormPlayerCore Creation Error - No "window" element in the provided context!`)
            return;
        }

        // WINDOW.StormLibraryArray
        if (this.DEV_MODE && !('StormPlayerCoreArray' in window)) {
            (window as any).StormLibraryArray = [];
        }(window as any).StormLibraryArray.push(this);

        this._playerID = StormPlayerCore.NEXT_PLAYER_ID++;

        if(streamConfig == null)
            return;

        this.setStreamConfig(streamConfig);

        if(autoInitialize)
            this.initialize();

    }

    /**
     * Initializes the player object. From this point, a connection to the server is established and authentication occurs.
     * It is recommended to add all event listeners before calling this method to ensure they can be properly captured.
     */
    public initialize():void {

        if(this._isRemoved)
            return;

        if(this._configManager == null)
            throw Error("Stream Config was not provided for this library! A properly configured object must be provided through the constructor or via the setConfig method before using the initialize() method.")

        this._storageManager = new StorageManager(this);                 // Storing user data
        this._stageController = new StageController(this);               // Visual elements like VideoElement
        this._networkController = new NetworkController(this);           // Networking and connection with a server
        this._playbackController = new PlaybackController(this);         // Video Playback
        this._qualityController = new QualityController(this);
        this._graphs = [];

        this._initialized = true;

        this.dispatchEvent("playerReady", {ref: this});

    }

    /**
     * Sets stream config for the library (or overwrites an existing one).
     * @param streamConfig
     */
    public setStreamConfig(streamConfig:StormStreamConfig):void {

        if(this._isRemoved)
            return;

        /**
         * In case the original streamConfig is modified elsewhere we have to create a separate copy and store it ourselves
         */
        const copiedStreamConfig:StormStreamConfig = JSON.parse(JSON.stringify(streamConfig));

        if(this._configManager == null){

            this._configManager = new ConfigManager(copiedStreamConfig);
            this._logger = new Logger(this._configManager.getSettingsData().getDebugData(), this);

            this._logger.info(this, "Storm Library :: Storm Streaming Suite");
            this._logger.info(this, "LibraryID: " + this._playerID);
            this._logger.info(this, "Version: " + this.PLAYER_VERSION + " | Compile Date: " + this.COMPILE_DATE + " | Branch: " + this.PLAYER_BRANCH);
            this._logger.info(this, "UserCapabilities :: Browser: " + UserCapabilities.getBrowserName() + " " + UserCapabilities.getBrowserVersion());
            this._logger.info(this, "UserCapabilities :: Operating System: " + UserCapabilities.getOS() + " " + UserCapabilities.getOSVersion());
            this._logger.info(this, "UserCapabilities :: isMobile: " + UserCapabilities.isMobile());
            this._logger.info(this, "UserCapabilities :: hasMSESupport: " + UserCapabilities.hasMSESupport());
            this._logger.info(this, "UserCapabilities :: hasWebSocketSupport: " + UserCapabilities.hasWebSocketsSupport());
            this._logger.info(this, "UserCapabilities :: hasWebRTCSupport: " + UserCapabilities.hasWebRTCSupport());

            this._configManager.print(this._logger);

        } else {

            this._logger.info(this, "StreamConfig has been overwritten, dispatching streamConfigChanged!");

            this._configManager = new ConfigManager(copiedStreamConfig);
            this._configManager.print(this._logger);

            this.dispatchEvent("streamConfigChange", {ref: this, newConfig:this._configManager});

        }

    }

    //------------------------------------------------------------------------//
    // PLAYBACK
    //------------------------------------------------------------------------//

    /**
     * Initiates playback of a video stream. If a video was previously paused, you can use this method to resume playback.
     * For this method to work, the library must be subscribed to a stream (check the streamKey field in the config
     * and/or the subscribe method).
     */
    public play():void {
        if(this._playbackController != null)
            this._playbackController.createPlayTask();
    }

    /**
     * Pauses current playback. To restart playback, please use the play() method.
     */
    public pause():void {
        if(this._playbackController != null)
            this._playbackController.createPauseTask();
    }

    /**
     * Returns the current playback time.
     */
    public getAbsoluteStreamTime():number {
        if(this._playbackController != null)
            return this._playbackController.getAbsoluteStreamTime();
        return 0;
    }

    /**
     * Stops the current playback and ceases all operations. It also disconnects the library from a server.
     * To restore connection, use the subscribe() method.
     */
    public stop():void {

        if(this._networkController != null)
            this._networkController.stop();

        if(this._playbackController != null)
            this._playbackController.stop();

    }

    /**
     * Requests a subscription to a given streamKey. When a library is subscribed to a certain streamKey, it will receive
     * notifications regarding its status.
     *
     * @param streamKey newStreamKey (will replace the one provided within config object)
     * @param autoStart whether stream should start playing right after calling the method
     */
    public subscribe(streamKey:string, autoStart:boolean):void {
        if(this._playbackController != null)
            this._playbackController.createSubscribeTask(streamKey, autoStart);
    }

    /**
     * Cancels subscription to a currently selected stream and stops playback.
     */
    public unsubscribe():void {
        if(this._playbackController != null)
            this._playbackController.createUnsubscribeTask();
    }

    /**
     * Returns current subscription (streamKey)
     */
    public getSubscriptionKey(): string | null {
        const configManager = this.getConfigManager();
        const streamData = configManager?.getStreamData();
        return streamData?.streamKey ?? null;
    }

    /**
     * Works as a pause/play switch depending on the current object state.
     */
    public togglePlay():void {
        if(this._playbackController != null)
            this._playbackController.togglePlay();
    }

    /**
     * Returns true if this library instance is currently playing a stream. To obtain more detailed information
     * about the stream's state, you can use the getPlaybackState() method.
     */
    public isPlaying():boolean {

        const currentState:PlaybackState = this._playbackController?.getPlaybackState() ?? PlaybackState.UNKNOWN;
        if(currentState == PlaybackState.PLAYING || currentState == PlaybackState.BUFFERING)
            return true;

        return false;
    }

    /**
     * Returns true if this library instance is connected to a server.
     */
    public isConnected():boolean {
        return this._networkController?.getConnection().isConnectionActive() ?? false;
    }

    /**
     * Returns true if this library instance is authorized with a server.
     */
    public isAuthorized():boolean {
        return this._networkController?.getIfAuthorized() ?? false;
    }

    /**
     * Returns the current playback state of this library instance.
     */
    public getPlaybackState():PlaybackState {
        return this._playbackController?.getPlaybackState() ?? PlaybackState.UNKNOWN;
    }

    /**
     * Returns the current stream state to which the library is subscribed.
     */
    public getStreamState():StreamState {
        return this._playbackController?.getStreamState() ?? StreamState.UNKNOWN;
    }

    /**
     * Mutes the library's video object. It's not the same as setVolume(0), as both methods can be applied together.
     * @param source - "user" for user interaction, "service" for programmatic control
     */
    public mute(source: "user" | "service" = "user"): void {
        if (this._stageController?.getScreenElement() != null) {
            this._stageController.getScreenElement()!.setMuted(true, source);
            return;
        }

        this._configManager.getSettingsData().getAudioData().muted = true;
    }

    /**
     * Unmutes the library's video object.
     * @param source - "user" for user interaction, "service" for programmatic control
     */
    public unmute(source: "user" | "service" = "user"): void {
        if (this._stageController?.getScreenElement() != null) {
            this._stageController.getScreenElement()!.setMuted(false, source);
            return;
        }

        this._configManager.getSettingsData().getAudioData().muted = false;
    }

    /**
     * Checks whether the library is muted.
     */
    public isMute(): boolean {
        return this._stageController?.getScreenElement()?.getIfMuted()
            ?? this._configManager.getSettingsData().getAudioData().muted
            ?? false;
    }

    /**
     * Switches between mute and unmute methods depending on the current state.
     * @param source - "user" for user interaction, "service" for programmatic control
     */
    public toggleMute(source: "user" | "service" = "user"): boolean {
        const isMuted = this.isMute();
        if (isMuted) {
            this.unmute(source);
        } else {
            this.mute(source);
        }
        return !isMuted;
    }

    /**
     * Sets new volume for the library (0-100). Once the method is performed, the volumeChange event will be triggered.
     * If the video was muted prior to the volume change, it will be automatically unmuted.
     * @param newVolume
     */
    public setVolume(newVolume: number): void {
        this._stageController?.getScreenElement()?.setVolume(newVolume, true);
        this._configManager.getSettingsData().getAudioData().startVolume = newVolume;
    }

    /**
     * Returns library volume (0-100).
     */
    public getVolume(): number {
        return this._stageController?.getScreenElement()?.getVolume()
            ?? this._configManager.getSettingsData().getAudioData().startVolume;
    }

    /**
     * Returns an array of all available source items.
     */
    public getSourceItemList(): ISourceItem[] {
        return this._configManager?.getStreamData().getSourceList() ?? [];
    }

    /**
     * Returns an array of all available stream quality items.
     */
    public getQualityItemList(): QualityItem[] {
        return this._qualityController?.getQualityItemList() ?? [];
    }

    /**
     * Returns the current source item. If no source was selected yet, null might be returned instead.
     */
    public getCurrentSourceItem():ISourceItem | null {
        return this._playbackController?.getCurrentSourceItem() ?? null;
    }

    /**
     * Starts a playback of a provided Stream Source Item.
     * @param sourceItem
     */
    public playSourceItem(sourceItem:ISourceItem):void {
        if(this._playbackController)
            this._playbackController.createPlayTask(sourceItem);
    }

    /**
     * Changes the selected video quality to the one corresponding to the specified ID. A list of qualities can be
     * obtained through the getQualityItemList() method.
     * @param id
     */
    public playQualityItem(id:number):void {
        if(this._qualityController)
            this._qualityController.playQualityItemByID(id);
    }

    //------------------------------------------------------------------------//
    // CONTAINER
    //------------------------------------------------------------------------//

    /**
     * Attaches the library to a new parent container using either a container ID (string) or a reference to an HTMLElement.
     * If the instance is already attached, it will be moved to a new parent.
     *
     * @param container
     */
    public attachToContainer(container:string | HTMLElement):boolean {
        let result:boolean = false;
        if(this._initialized)
            return this._stageController?.attachToParent(container) ?? false;

        return result;
    }

    /**
     * Detaches the library from the current parent element, if possible.
     */
    public detachFromContainer():boolean {
        let result:boolean = false;
        if(this._initialized)
            return this._stageController?.detachFromParent() ?? false;
        return result;
    }

    /**
     * Returns the current parent element of the library, or null if none exists.
     */
    public getContainer():HTMLElement | null {
        return this._stageController?.getParentElement() ?? null;
    }

    //------------------------------------------------------------------------//
    // SIZE & RESIZE
    //------------------------------------------------------------------------//

    /**
     * Sets a new width and height for the library. The values can be given as a number (in which case they are
     * treated as the number of pixels), or as a string ending with "px" (this will also be the number of pixels) or "%",
     * where the number is treated as a percentage of the parent container's value.
     *
     * @param width can be provided as number or a string with "%" or "px" suffix
     * @param height can be provided as number or a string with "%" or "px" suffix
     */
    public setSize(width: number | string, height: number | string): void {
        if (this._initialized)
            this._stageController!.setSize(width, height);
        else {

            const parsedWidth = NumberUtilities.parseValue(width);
            const parsedHeight = NumberUtilities.parseValue(height);

            this._configManager.getSettingsData().getVideoData().videoWidthValue = parsedWidth.value;
            this._configManager.getSettingsData().getVideoData().videoWidthInPixels = parsedWidth.isPixels;

            this._configManager.getSettingsData().getVideoData().videoHeightValue = parsedHeight.value;
            this._configManager.getSettingsData().getVideoData().videoHeightInPixels = parsedHeight.isPixels;
        }
    }

    /**
     * Sets a new width for the library. The value can be given as a number (in which case it is treated as the
     * number of pixels), or as a string ending with "px" (this will also be the number of pixels) or "%", where the
     * number is treated as a percentage of the parent container's value.
     *
     * @param width can be provided as number or a string with "%" or "px" suffix
     */
    public setWidth(width:number | string):void {
        if (this._initialized)
            this._stageController!.setWidth(width);
        else {

            const parsedWidth = NumberUtilities.parseValue(width);

            this._configManager.getSettingsData().getVideoData().videoWidthValue = parsedWidth.value;
            this._configManager.getSettingsData().getVideoData().videoWidthInPixels = parsedWidth.isPixels;
        }
    }

    /**
     * Sets a new height for the library. The value can be given as a number (in which case it is treated as the
     * number of pixels), or as a string ending with "px" (this will also be the number of pixels) or "%", where the
     * number is treated as a percentage of the parent container's value.
     *
     * @param height can be provided as number or a string with "%" or "px" suffix
     */
    public setHeight(height:number | string):void {
        if (this._initialized)
            this._stageController!.setHeight(height);
        else {

            const parsedHeight = NumberUtilities.parseValue(height);

            this._configManager.getSettingsData().getVideoData().videoHeightValue = parsedHeight.value;
            this._configManager.getSettingsData().getVideoData().videoHeightInPixels = parsedHeight.isPixels;
        }
    }

    /**
     * Returns current library width in pixels
     */
    public getWidth():number {
        if(this._initialized)
            return this._stageController!.getContainerWidth();
        else {
            if(this._configManager.getSettingsData().getVideoData().videoWidthInPixels)
                return this._configManager.getSettingsData().getVideoData().videoWidthValue;
        }
        return 0;
    }

    /**
     * Returns current library height in pixels.
     */
    public getHeight():number {
        if(this._initialized)
            return this._stageController!.getContainerHeight();
        else {
            if(this._configManager.getSettingsData().getVideoData().videoHeightInPixels)
                return this._configManager.getSettingsData().getVideoData().videoHeightValue;
        }
        return 0;
    }

    /**
     * Changes the library scaling mode. For reference, please check scaling mode in the library config.
     * @param newMode new scaling mode name (fill, letterbox, original, crop)
     */
    public setScalingMode(newMode:ScalingType):void {
        if(this._stageController){
            this._stageController!.setScalingMode(newMode);
        } else {
            this._configManager.getSettingsData().getVideoData().scalingMode = newMode;
        }
    }

    /**
     * Returns the current library scaling mode. For reference, please check scaling mode in the library config.
     */
    public getScalingMode():ScalingType {
        if(this._stageController){
            return this._stageController!.getScalingMode()
        } else {
            return this._configManager.getSettingsData().getVideoData().scalingMode;
        }
    }

    /**
     * Forces the library to recalculate its size based on parent internal dimensions.
     */
    public updateToSize():void {
        if(this._initialized){
            this._stageController!.onResize();
        }
    }

    /**
     * Returns a promise that resolves with a screenshot of the video element as a blob, or null if taking the
     * screenshot was not possible.
     */
    public makeScreenshot(): Promise<Blob | null> {
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');

        return new Promise((resolve) => {
            if (this._stageController != null) {
                canvas.width = this._stageController.getScreenElement()!.getVideoElement().videoWidth;
                canvas.height = this._stageController.getScreenElement()!.getVideoElement().videoHeight;

                let element: HTMLVideoElement = this._stageController.getScreenElement()!.getVideoElement();

                if (context) {
                    context.drawImage(element, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/png');
                } else {
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    }

    //------------------------------------------------------------------------//
    // GRAPHS
    //------------------------------------------------------------------------//

    /**
     * Creates a buffer size graph in the specified location (container ID or reference). The graph is a separate
     * object that must be started using its start() method and stopped using its stop() method. The dimensions
     * of the graph depend on the dimensions of the specified container.
     *
     * @param container element ID or reference to HTMLElement
     * @param interval interval for updating the graph (50-100) ms
     */
    public createBufferGraph(container:string | HTMLElement, interval:number):BufferGraph {
        return new BufferGraph(this, container, interval);
    }

    /**
     * Creates a bandwidth performance graph in the specified location (container ID or reference). The graph is a
     * separate object that must be started using its start() method and stopped using its stop() method. The dimensions
     * of the graph depend on the dimensions of the specified container.
     *
     * @param container element ID or reference to HTMLElement
     * @param interval interval for updating the graph (50-100) ms
     */
    public createBandwidthGraph(container:string | HTMLElement, interval:number):BandwidthGraph {
        return new BandwidthGraph(this, container, interval);
    }

    /**
     * Creates a buffer stability graph in the specified location (container ID or reference). The graph is a separate
     * object that must be started using its start() method and stopped using its stop() method. The dimensions of the
     * graph depend on the dimensions of the specified container.
     *
     * @param container element ID or reference to HTMLElement
     * @param interval interval for updating the graph (50-100) ms
     */
    public createBufferStabilityGraph(container:string | HTMLElement, interval:number):BufferStabilityGraph {
        return new BufferStabilityGraph(this, container, interval);
    }

    /**
     * Adds new graph to the array (internal)
     * @param newGraph
     */
    public addGraph(newGraph:IGraph){
        if(this._graphs != null)
            this._graphs.push(newGraph);
    }

    /**
     * Stops all active graphs
     */
    public stopAllGraphs():void {
        if(this._graphs != null && this._graphs.length > 0){
            for(let i:number =0;i<this._graphs.length;i++){
                this._graphs[i].stop();
            }
        }
    }

    //------------------------------------------------------------------------//
    // FULLSCREEN
    //------------------------------------------------------------------------//

    /**
     * Enters the FullScreen mode.
     */
    public enterFullScreen():void {
        if(this._initialized && this._stageController)
            this._stageController.enterFullScreen();
    }

    /**
     * Exits the FullScreen mode.
     */
    public exitFullScreen():void {
        if(this._initialized && this._stageController)
            this._stageController.exitFullScreen();
    }

    /**
     * Returns true if the library instance is in FullScreen mode.
     */
    public isFullScreenMode():boolean {
        if(this._initialized && this._stageController)
            return this._stageController.isFullScreenMode();
        return false;
    }

    //------------------------------------------------------------------------//
    // SIMPLE GETS & SETS
    //------------------------------------------------------------------------//

    /**
     * Returns the ID of this library instance. Each subsequent instance has a higher number.
     */
    public getLibraryID():number {
        return this._playerID;
    }

    /**
     * Returns logger (internal)
     */
    public getLogger():Logger {
        return this._logger;
    }

    /**
     * Returns config manager (internal)
     */
    public getConfigManager():ConfigManager | null {
        return this._configManager;
    }

    /**
     * Returns NetworkController for this library object (internal)
     */
    public getNetworkController():NetworkController | null {
        return this._networkController;
    }

    /**
     * Returns PlaybackController for this library object (internal)
     */
    public getPlaybackController():PlaybackController | null {
        return this._playbackController;
    }

    /**
     * Returns PlaybackController for this library object (internal)
     */
    public getQualityController():QualityController | null {
        return this._qualityController;
    }

    /**
     * Returns StageController for this library object (internal)
     */
    public getStageController():StageController | null {
        return this._stageController;
    }

    /**
     * Returns the Video Element used by this instance of the library.
     */
    public getVideoElement():HTMLVideoElement | null {
        return this._stageController?.getScreenElement()?.getVideoElement() ?? null;
    }

    /**
     * Returns true if this library instance has already been initialized.
     */
    public isInitialized():boolean{
        return this._initialized;
    }

    /**
     * Returns the version of this library instance. The version is returned in the SemVer format (Major.Minor.Patch).
     */
    public getVersion():string {
        return this.PLAYER_VERSION
    }

    /**
     * Returns an object containing server info like its common name, version, and protocol version.
     */
    public getServerInfo():ServerInfo | null {
        return this._networkController?.getServerInfo() ?? null;
    }

    /**
     * Returns the development branch of this library (e.g., main, experimental).
     */
    public getBranch():string {
        return this.PLAYER_BRANCH
    }

    /**
     * Returns storage manager (internal)
     */
    public getStorageManager():StorageManager | null {
        return this._storageManager;
    }

    /**
     * Returns task Queue (internal)
     */
    public getTaskQueue():any {
        return this._playbackController?.getTaskQueue();
    }

    /**
     * Returns the currently used quality control mode.
     */
    public getQualityControlMode():QualityControlMode {
        return this._qualityController?.getQualityControlMode() ?? QualityControlMode.UNKNOWN;
    }

    /**
     * Sets the quality control mode for this player instance. You can force a reload of the mechanism,
     * which may result in an immediate quality change.
     * @param qualityControlMode
     * @param forceReload
     */
    public setQualityControlMode(qualityControlMode:QualityControlMode, forceReload:boolean = false){
        this._qualityController?.setQualityControlMode(qualityControlMode, forceReload);
    }

    /**
     * Returns current playback ratio (usually between 0.9 and 1.1).
     */
    public getPlaybackRate():number {
        return this._stageController?.getScreenElement()?.getVideoElement().playbackRate ?? 1;
    }

    //------------------------------------------------------------------------//
    // COMPONENTS
    //------------------------------------------------------------------------//

    /**
     * Returns the Bandwidth Analyser component for the library. This component contains statistical data
     * regarding the stability of the internet connection.
     */
    public getBandwidthAnalyser():BandwidthAnalyser | null {
        return this._networkController?.getBandwidthAnalyser() ?? null;
    }

    /**
     * Returns the Bandwidth Meter component for the library. This component contains statistical data related
     * to the performance of the internet connection.
     */
    public getBandwidthMeter():BandwidthMeter | null {
        return this._playbackController?.getPlayer()?.getBandwidthMeter() ?? null;
    }

    /**
     * Returns the Buffer Analyser component for the library. This component contains statistical data regarding
     * the buffer state and its stability.
     */
    public getBufferAnalyser():BufferAnalyser | null {
        return this._playbackController?.getPlayer()?.getBufferAnalyser() ?? null;
    }

    //------------------------------------------------------------------------//
    // EVENT
    //------------------------------------------------------------------------//

    /**
     * Dispatches event
     * @param eventName name of an event
     * @param event object containing an event and its data
     */
    public dispatchEvent<K extends keyof StormLibraryEvent>(eventName: K, event: StormLibraryEvent[K]): void {
        super.dispatchEvent(eventName,event);
    }

    //------------------------------------------------------------------------//
    // CLEAN UP
    //------------------------------------------------------------------------//

    /**
     * Destroys this instance of StormLibrary and disconnects from a server.
     */
    public destroy():void {
        this._logger.warning(this, "Destroying library instance, bye, bye!")

        if(this._graphs != null && this._graphs.length > 0){
            for(let i:number =0;i<this._graphs.length;i++){
                this._graphs[i].stop();
            }
        }

        // part1
        this._initialized = false;
        this._isRemoved = true;

        // part3
        this._networkController?.getConnection().destroy();
        this._stageController?.destroy();
        this._playbackController?.destroy();


        // part2
        this.removeAllEventListeners();
    }

}