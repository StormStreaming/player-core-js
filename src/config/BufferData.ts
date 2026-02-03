import {IConfig} from "./IConfig";
import {Logger} from "../logger/Logger";
import {BufferConfig} from "../types/BufferConfig";

/**
 * Contains configuration related to video buffer
 */
export class BufferData implements IConfig {

    /**
     * Decides whenever player will print this config data on startup
     *
     * @private
     */
    private readonly PRINT_ON_STARTUP: boolean = true;

    /**
     * Stored bufferConfig (original)
     *
     * @private
     */
    private _bufferConfig: BufferConfig | null;

    /**
     * Minimal value (seconds) for the buffer before video will stop
     * @private
     */
    private _minValue: number = 0.2;

    /**
     * Max buffer size (seconds)
     * @private
     */
    private _maxValue: number = 2;

    /**
     * Minimal value for buffer before video start
     * @private
     */
    private _startValue: number = 0.5;

    /**
     * Optimal buffer size (seconds)
     * @private
     */
    private _targetValue: number = 0.7;

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constructor
     * @param bufferConfig
     */
    constructor(bufferConfig: BufferConfig | null) {
        this.parse(bufferConfig);
    }

    //------------------------------------------------------------------------//
    // MAIN METHODS
    //------------------------------------------------------------------------//

    /**
     * Parses provided config
     */
    public parse(bufferConfig: BufferConfig | null) {

        this._bufferConfig = bufferConfig;

        if(this._bufferConfig) {
            this._minValue = this._bufferConfig.minValue ?? this._minValue;
            this._maxValue = this._bufferConfig.maxValue ?? this._maxValue;
            this._startValue = this._bufferConfig.startValue ?? this._startValue;
            this._targetValue = this._bufferConfig.targetValue ?? this._targetValue;
        }
        
    }

    //------------------------------------------------------------------------//
    // GETS & SETS
    //------------------------------------------------------------------------//

    /**
     * Returns buffer minimal value (in seconds), below which player will stop and wait for buffer to fill
     */
    public get minValue(): number {
        return this._minValue;
    }

    /**
     * Returns buffer max size (in seconds), above which player will start dropping frames
     */
    public get maxValue(): number {
        return this._maxValue;
    }

    /**
     * Returns buffer start size (in seconds). Player won't start playing unless this value is filled
     */
    public get startValue(): number {
        return this._startValue;
    }

    /**
     * Optimal buffer size (in seconds) for the video
     */
    public get targetValue(): number {
        return this._targetValue;
    }

    /**
     * Sets buffer minimal value
     * @param newValue
     */
    public set minValue(newValue:number){
        this._minValue = newValue
    }

    /**
     * Sets buffer max value
     * @param newValue
     */
    public set maxValue(newValue:number){
        this._maxValue = newValue
    }

    /**
     * Sets buffer target value
     * @param newValue
     */
    public set targetValue(newValue:number){
        this._targetValue = newValue
    }

    /**
     * Sets buffer start value
     * @param newValue
     */
    public set startValue(newValue:number){
        this._startValue = newValue
    }

    //------------------------------------------------------------------------//
    // OTHER
    //------------------------------------------------------------------------//

    /**
     * Prints current settings.
     *
     * @param logger reference to logger
     * @param force if printing is disabled, this parameter can overwrite it
     */
    public print(logger: Logger, force: boolean = false): void {
        if (this.PRINT_ON_STARTUP || force)
            logger.info(this, "BufferConfig :: minValue: " + this.minValue + " | maxValue: " + this.maxValue + " | startValue: " + this.startValue + " | targetValue: " + this.targetValue);

    }

}
