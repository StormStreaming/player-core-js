import { Logger } from "../logger/Logger";
import {IConfig} from "./IConfig";
import {StorageConfig} from "../types/StorageConfig";

/**
 * Class contains all parameters related to volume
 */
export class StorageData implements IConfig {

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
    private _storageConfig: StorageConfig | null;

    /**
     * Whenever storage is enabled or not (true by default)
     * @private
     */
    private _enabled: boolean = true;

    /**
     * Prefix for loading and saving settings
     * @private
     */
    private _prefix: string = "storm";

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constructor
     * @param storageConfig
     */
    constructor(storageConfig: StorageConfig | null) {
        this.parse(storageConfig);
    }

    //------------------------------------------------------------------------//
    // MAIN METHODS
    //------------------------------------------------------------------------//

    /**
     * Parses provided config
     */
    public parse(config: StorageConfig | null): void {

        this._storageConfig = config;

        this._enabled = this._storageConfig?.enabled ?? this._enabled;
        this._prefix = this._storageConfig?.prefix ?? this._prefix;

    }

    //------------------------------------------------------------------------//
    // GETS & SETS
    //------------------------------------------------------------------------//

    /**
     * Returns if storage is enabled
     */
    public get enabled(): boolean {
        return this._enabled;
    }

    /**
     * Sets new value for enabled
     * @param newValue
     */
    public set enabled(newValue:boolean) {
        this._enabled = newValue;
    }

    /**
     * Returns storage prefix
     */
    public get prefix(): string {
        return this._prefix;
    }

    /**
     * Sets storage prefix
     * @param newValue
     */
    public set prefix(newValue:string) {
        this._prefix = newValue;
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
        if (StorageData.PRINT_ON_STARTUP || force)
            logger.info(this, "Storage :: startVolume: " + this._enabled + " | prefix: " + this._prefix);

    }

}
