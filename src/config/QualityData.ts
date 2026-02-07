import {IConfig} from "./IConfig";
import {Logger} from "../logger/Logger";
import {QualityControlMode} from "../enum/QualityControlMode";
import {QualityConfig} from "../types/QualityConfig";

/**
 * Contains configuration related to video buffer
 */
export class QualityData implements IConfig {

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
    private _qualityConfig: QualityConfig | null;

    private _qualityControlMode: QualityControlMode = QualityControlMode.RESOLUTION_AWARE;

    private _initialUpgradeTimeout: number = 30;

    private _maxUpgradeTimeout: number = 3600;

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constructor
     * @param bufferConfig
     */
    constructor(qualityData: QualityConfig | null) {
        this.parse(qualityData);
    }

    //------------------------------------------------------------------------//
    // MAIN METHODS
    //------------------------------------------------------------------------//

    /**
     * Parses provided config
     */
    public parse(qualityData: QualityConfig | null) {

        this._qualityConfig = qualityData;

        if(this._qualityConfig) {
            this._qualityControlMode = this._qualityConfig.controlMode ?? this._qualityControlMode;
            this._initialUpgradeTimeout = this._qualityConfig.initialUpgradeTimeout ?? this._initialUpgradeTimeout;
            this._maxUpgradeTimeout = this._qualityConfig.maxUpgradeTimeout ?? this._maxUpgradeTimeout;
        }
        
    }

    //------------------------------------------------------------------------//
    // GETS & SETS
    //------------------------------------------------------------------------//

    public get qualityControlMode():QualityControlMode{
        return this._qualityControlMode;
    }

    public set qualityControlMode(newMode:QualityControlMode) {
        this._qualityControlMode = newMode
    }

    public get initialUpgradeTimeout():number {
        return this._initialUpgradeTimeout;
    }

    public set initialUpgradeTimeout(newValue:number) {
        this._initialUpgradeTimeout = newValue;
    }

    public get maxUpgradeTimeout():number {
        return this._maxUpgradeTimeout;
    }

    public set maxUpgradeTimeout(newValue:number) {
        this._maxUpgradeTimeout = newValue;
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
            logger.info(this, "QualityControl :: mode: " + this.qualityControlMode + " | initialUpgradeTime: " + this._initialUpgradeTimeout + " | maxUpgradeTime: " + this._maxUpgradeTimeout);

    }

}
