import { Logger } from "../logger/Logger";
import {IConfig} from "./IConfig";
import {AudioConfig} from "../types/AudioConfig";

/**
 * Class contains all parameters related to volume
 */
export class AudioData implements IConfig {

    /**
     * Decides whenever player will print this config data on startup
     *
     * @private
     */
    private static readonly PRINT_ON_STARTUP: boolean = true;

    /**
     * Original config object
     * @private
     */
    private _audioConfig: AudioConfig | null;

    /**
     * Default value for volume
     * @private
     */
    private _startVolume: number = 100;

    /**
     * Whenever video is muted
     * @private
     */
    private _isMuted: boolean = false;

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constructor
     * @param volumeConfig
     */
    constructor(volumeConfig: AudioConfig | null) {
        this.parse(volumeConfig);
    }

    //------------------------------------------------------------------------//
    // MAIN METHODS
    //------------------------------------------------------------------------//

    /**
     * Parses provided config
     */
    public parse(config: AudioConfig | null): void {

        this._audioConfig = config;

        if(this._audioConfig) {
            this._startVolume = this._audioConfig?.startVolume ?? this._startVolume;
            this._isMuted = this._audioConfig?.muted ?? this._isMuted;
        }

    }

    //------------------------------------------------------------------------//
    // GETS & SETS
    //------------------------------------------------------------------------//

    /**
     * Returns player start volume
     */
    public get startVolume(): number {
        return this._startVolume;
    }

    /**
     * Sets start volume for the player (by default it's 100)
     * @param newValue
     */
    public set startVolume(newValue:number){
        this._startVolume = newValue;
    }

    /**
     * Returns whenever library should be muted on start
     */
    public get muted(): boolean {
        return this._isMuted;
    }

    /**
     * Sets whenever library should be muted or not
     * @param newValue
     */
    public set muted(newValue:boolean) {
        this._isMuted = newValue;
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
        if (AudioData.PRINT_ON_STARTUP || force)
            logger.info(this, "Audio :: startVolume: " + this._startVolume + " | isMuted: " + this._isMuted);

    }

}
