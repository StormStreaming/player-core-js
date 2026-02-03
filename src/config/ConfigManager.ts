import {IConfig} from "./IConfig";
import {StreamData} from "./StreamData";
import {SettingsData} from "./SettingsData";
import {Logger} from "../logger/Logger";
import {StormStreamConfig} from "../types/StormStreamConfig";

/**
 * Class responsible for parsing config object.
 */
export class ConfigManager implements IConfig {

    /**
     * Decides whenever player will print this config data on startup
     *
     * @private
     */
    private readonly PRINT_ON_STARTUP: boolean = true;

    /**
     * Original config template provided via constructor
     * @private
     */
    private configTemplate: StormStreamConfig;

    /**
     * Contains configurations related to servers and streams
     * @private
     */
    private streamData: StreamData;

    /**
     * Contains configuration related to player settings
     * @private
     */
    private settingsData: SettingsData;

    /**
     * Whenver we're in demo mode
     * @private
     */
    private demoMode:boolean = false;

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constuctor
     * @param config config object
     */
    constructor(config: StormStreamConfig) {
        this.parse(config);
    }

    //------------------------------------------------------------------------//
    // MAIN METHODS
    //------------------------------------------------------------------------//

    /**
     * Parses config objects into smaller chunkes related to their kind.
     * @private
     */
    public parse(config: StormStreamConfig): void {

        this.configTemplate = config;

        if(this.configTemplate.stream == null)
            throw new Error("No stream field was provided. Please check your player config!");

        this.streamData = new StreamData(this.configTemplate.stream);
        this.settingsData = new SettingsData(this.configTemplate.settings ?? null);
        this.demoMode = this.configTemplate.demoMode ?? false;

    }

    //------------------------------------------------------------------------//
    // GETS & SETS
    //------------------------------------------------------------------------//

    /**
     * Returns the part of the config with player stream data (what to play)
     */
    public getStreamData(): StreamData {
        return this.streamData;
    }

    /**
     * Returns the part of the config with player settings
     */
    public getSettingsData(): SettingsData {
        return this.settingsData;
    }

    /**
     * Returns true/false whenever we're in demo mode or not
     */
    public getIfDemoMode():boolean {
        return this.demoMode
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
        if (this.PRINT_ON_STARTUP || force) {
            this.streamData.print(logger);
            this.settingsData.print(logger);
        }

    }

}
