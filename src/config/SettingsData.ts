import {IConfig} from "./IConfig";
import {ProtocolType} from "./enum/ProtocolType";
import {BufferData} from "./BufferData";
import {VideoData} from "./VideoData";
import {DebugData} from "./DebugData";
import {AudioData} from "./AudioData";
import {Logger} from "../logger/Logger";
import {SettingsConfig} from "../types/SettingsConfig";
import {StorageData} from "./StorageData";
import {QualityControlMode} from "../enum/QualityControlMode";
import {QualityData} from "./QualityData";

/**
 * Store all settings related to player behavior
 */
export class SettingsData implements IConfig {

    /**
     * Decides whenever player will print this config data on startup
     *
     * @private
     */
    private static readonly PRINT_ON_STARTUP: boolean = true;

    /**
     * Raw config provided for the player
     *
     * @private
     */
    private _settingsConfig: SettingsConfig;

    /**
     * Whenver player should try reconnecting upon its error
     * @private
     */
    private _restartOnError: boolean = true;

    /**
     * Number of seconds between player reconnects
     * @private
     */
    private _reconnectTime: number = 1;

    /**
     * Decides whenver player will automatically start playing content
     * @private
     */
    private _autoStart: boolean = false;

    /**
     * Decides whenver player will automatically connect to a server
     * @private
     */
    private _autoConnect: boolean = true;

    /**
     * Start player only when DOM is ready
     *
     * @private
     */
    private startOnDOMReady:boolean = false;

    /**
     * Starts video playback on iOS only once DOM is ready
     *
     * @private
     *
     */
    private iOSOnDomReadyFix:boolean = true;

    /**
     * List of enabled protocols. Player will compare it to the list within the config object.
     *
     * @private
     */
    private _enabledProtocols: Array<ProtocolType> = new Array<ProtocolType>(ProtocolType.STORM, ProtocolType.RTMP, ProtocolType.HLS, ProtocolType.WEBRTC);

    /**
     * Contains configuration related to video buffer
     * @private
     */
    private _bufferData: BufferData;

    /**
     * Contains configuration related to video
     * @private
     */
    private _videoData: VideoData;

    /**
     * Contains configuration related to logger/debugger
     * @private
     */
    private _debugData: DebugData;

    /**
     * Contains configuration related to storing user data
     * @private
     */
    private _storageData: StorageData;

    /**
     * Contains configuration related to volume
     * @private
     */
    private _audioData: AudioData;

    /**
     * Contains configuration related to quality
     * @private
     */
    private _qualityData: QualityData

    /**
     * Decides whenever player will restart on focus/blur
     * @private
     */
    private _restartOnFocus:boolean = true;

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constructor
     * @param config
     */
    constructor(config: SettingsConfig) {
        this.parse(config);
    }

    //------------------------------------------------------------------------//
    // MAIN METHODS
    //------------------------------------------------------------------------//

    /**
     * Parses provided config
     * @param config
     */
    public parse(config: SettingsConfig): void {

        this._settingsConfig = config;

        this._autoConnect = this._settingsConfig.autoConnect ?? this._autoConnect;
        this._autoStart = this._settingsConfig.autoStart ?? this._autoStart;
        this._restartOnFocus = this._settingsConfig.restartOnFocus ?? this._restartOnFocus;
        this._restartOnError = this._settingsConfig.restartOnError ?? this._restartOnError;
        this._reconnectTime = this._settingsConfig.reconnectTime ?? this._reconnectTime;

        if (this._settingsConfig.enabledProtocols?.length) {
            this._enabledProtocols = this._settingsConfig.enabledProtocols.map(protocolName => {
                const normalized = protocolName.toLowerCase();
                switch (normalized) {
                    case "storm":
                        return ProtocolType.STORM;
                    case "hls":
                        return ProtocolType.HLS;
                    case "webrtc":
                        return ProtocolType.WEBRTC;
                    case "rtmp":
                        return ProtocolType.RTMP;
                    case "rtsp":
                        return ProtocolType.RTSP;
                    default:
                        throw new Error(`Unknown protocol "${protocolName}". Please check your config!`);
                }
            });
        }

        this._bufferData = new BufferData(this._settingsConfig.buffer ?? null);
        this._videoData = new VideoData(this._settingsConfig.video ?? null);
        this._audioData = new AudioData(this._settingsConfig.audio ?? null);
        this._storageData = new StorageData(this._settingsConfig.storage ?? null);
        this._debugData = new DebugData(this._settingsConfig.debug ?? null);
        this._qualityData = new QualityData(this._settingsConfig.quality ?? null);

    }

    //------------------------------------------------------------------------//
    // GETS & SETS
    //------------------------------------------------------------------------//

    /**
     * Returns list of enabled protocols
     */
    public get enabledProtocols(): Array<ProtocolType> {
        return this._enabledProtocols;
    }

    public set enabledProtocols(newValue:Array<ProtocolType>){
        this._enabledProtocols = newValue
    }

    /**
     * Returns Buffer Config
     */
    public getBufferData(): BufferData {
        return this._bufferData
    }

    /**
     * Returns Volume Config
     */
    public getAudioData(): AudioData {
        return this._audioData;
    }

    /**
     * Returns Video Config
     */
    public getVideoData(): VideoData {
        return this._videoData;
    }

    /**
     * Returns Storage Data
     */
    public getStorageData():StorageData{
        return this._storageData
    }

    public getQualityData():QualityData {
        return this._qualityData;
    }

    /**
     * Returns if player should reset connection after error
     */
    public getIfRestartOnError(): boolean {
        return this._restartOnError;
    }

    /**
     * Returns time (in ms) when player should attempt new connection after error
     */
    public getReconnectTime(): number {
        return this._reconnectTime
    }

    /**
     * Returns true whenever autostart is activated
     */
    public get autoStart(): boolean {
        return this._autoStart;
    }

    /**
     * Sets autostart value
     * @param newValue
     */
    public set autoStart(newValue:boolean) {
        this._autoStart = newValue;
    }

    /**
     * Returns true/false whenever library is set to auto-connect with a Storm server
     */
    public get autoConnect():boolean {
        return this._autoConnect;
    }


    /**
     * Returns true whenever library should restart the connection on document focus/blur
     */
    public get restartOnFocus():boolean {
        return this._restartOnFocus;
    }

    /**
     * Returns Debug Config
     */
    public getDebugData(): DebugData {
        return this._debugData;
    }

    /**
     * Returns whenever player should start only after DOM has been initialized
     */
    public getIfStartOnDOMReadyEnabled():boolean {
        return this.startOnDOMReady;
    }

    /**
     * Returns whenever player (ios mode) should start only after DOM has been initialized
     */
    public getIfIOSOnDomStartFixEnabled():boolean {
        return this.iOSOnDomReadyFix;
    }



    //------------------------------------------------------------------------//
    // OTHER
    //------------------------------------------------------------------------//

    /**
     * Prints current settings
     *
     * @param logger
     */
    public print(logger: Logger, force: boolean = false): void {

        if (SettingsData.PRINT_ON_STARTUP || force) {

            let enabledProtocols: string = "";

            for (let i: number = 0; i < this._enabledProtocols.length; i++) {
                switch (this._enabledProtocols[i]) {
                    case ProtocolType.STORM:
                        enabledProtocols += "STORM, ";
                        break;
                    case ProtocolType.RTMP:
                        enabledProtocols += "RTMP, ";
                        break;
                    case ProtocolType.RTSP:
                        enabledProtocols += "RTSP, ";
                        break;
                    case ProtocolType.HLS:
                        enabledProtocols += "HLS, ";
                        break;
                    case ProtocolType.WEBRTC:
                        enabledProtocols += "WebRTC, ";
                        break;
                }
            }

            logger.info(this, "SettingsConfig :: autoConnect: " + this._autoConnect);
            logger.info(this, "SettingsConfig :: autoStart: " + this._autoStart);
            logger.info(this, "SettingsConfig :: restartOnError: " + this._restartOnError);
            logger.info(this, "SettingsConfig :: reconnectTime: " + this._reconnectTime);
            logger.info(this, "SettingsConfig :: enabledProtocols: " + enabledProtocols);

            this._bufferData.print(logger);
            this._qualityData.print(logger);
            this._videoData.print(logger);
            this._audioData.print(logger);
            this._debugData.print(logger);
            this._debugData.print(logger);

        }

    }

}
