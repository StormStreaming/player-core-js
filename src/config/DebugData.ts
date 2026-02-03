import {IConfig} from "./IConfig";
import {LogType} from "./enum/LogType";
import {Logger} from "../logger/Logger";
import {DebugConfig} from "../types/DebugConfig";

/**
 * This class represents "debug" section of an original player config. If any field/value is missing in the config,
 * default values defined within this class will be used instead.
 */
export class DebugData implements IConfig {

    /**
     * Decides whenever player will print this config data on startup
     *
     * @private
     */
    private static readonly PRINT_ON_STARTUP: boolean = true;

    /**
     * A part of an original config with parameters for debug settings
     *
     * @private
     */
    private _debugConfig: DebugConfig | null

    /**
     * Decides whenever log will be outputted in browser console
     * @private
     */
    private _consoleLogEnabled: boolean = false;

    /**
     * List of enabled console log types (order doesn't matter)
     * @private
     */
    private _enabledConsoleTypes: Array<LogType> = [LogType.INFO, LogType.ERROR, LogType.SUCCESS, LogType.TRACE, LogType.WARNING];

    /**
     * If true, different types of logs for console will have the same color, but each player will have
     * its own color (easier to debug with multiple players)
     *
     * @private
     */
    private _consoleMonoColor: boolean = false;

    /**
     * List of enabled console log types (order doesn't matter)
     * @private
     */
    private _containerLogEnabled: boolean = false;
    /**
     *
     * @private
     */
    private _enabledContainerTypes: Array<LogType> = [LogType.INFO, LogType.ERROR, LogType.SUCCESS, LogType.TRACE, LogType.WARNING];

    /**
     * Name of the DOM container where logs will be added
     * @private
     */
    private _containerID: string | null;

    /**
     * If true, different types of logs for container will have the same color, but each player will have
     * its own color (easier to debug with multiple players)
     *
     * @private
     */
    private _containerLogMonoColor: boolean = false;

    private _playbackController:boolean = false;

    private _qualityController:boolean = false;

    private _stageController:boolean = false;

    private _playerUnit:boolean = false;

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Creates debug object based on parameters from config object
     *
     * @param debugConfig
     */
    constructor(debugConfig: DebugConfig | null) {
        this.parse(debugConfig);
    }

    /**
     * Parses provided config
     */
    public parse(debugConfig: DebugConfig | null): void {
        this._debugConfig = debugConfig;

        if(this._debugConfig) {
            this._consoleLogEnabled = this._debugConfig?.console?.enabled ?? this._consoleLogEnabled;
            this._consoleMonoColor = this._debugConfig?.console?.monoColor ?? this._consoleMonoColor;
            this._enabledConsoleTypes = this.parseLogTypes(this._debugConfig?.console?.logTypes) ?? this._enabledConsoleTypes;

            this._containerLogEnabled = this._debugConfig?.container?.enabled ?? this._containerLogEnabled;
            this._containerLogMonoColor = this._debugConfig?.container?.monoColor ?? this._containerLogMonoColor;
            this._enabledContainerTypes = this.parseLogTypes(this._debugConfig?.container?.logTypes) ?? this._enabledContainerTypes;
            this._containerID = this._debugConfig?.container?.containerID ?? this._containerID;

            this._playbackController = this._debugConfig?.playbackController ?? this._playbackController;
            this._qualityController = this._debugConfig?.qualityController ?? this._qualityController;
            this._stageController = this._debugConfig?.stageController ?? this._stageController;
            this._playerUnit = this._debugConfig?.playerUnit ?? this._playerUnit;

        }
    }

    private parseLogTypes(logTypes: string[] | undefined): LogType[] | undefined {
        return logTypes?.map(type => {
            switch (type.toLowerCase()) {
                case 'info': return LogType.INFO;
                case 'error': return LogType.ERROR;
                case 'warning': return LogType.WARNING;
                case 'success': return LogType.SUCCESS;
                case 'trace': return LogType.TRACE;
                default: throw new Error(`Unsupported log type: ${type}`);
            }
        });
    }

    //------------------------------------------------------------------------//
    // GETS & SETS
    //------------------------------------------------------------------------//

    /**
     * Returns whenever logs from debug will be pushed to browser console. False by default.
     */
    public get consoleLogEnabled(): boolean {
        return this._consoleLogEnabled;
    }

    /**
     * Sets console logging on/off
     * @param newValue
     */
    public set consoleLogEnabled(newValue:boolean) {
        this._consoleLogEnabled = newValue;
    }

    /**
     * Returns all enabled types of logs for console logging
     */
    public get enabledConsoleTypes(): Array<LogType> {
        return this._enabledConsoleTypes;
    }

    /**
     * Sets console log types
     * @param newValue
     */
    public set enabledConsoleTypes(newValue:Array<string>) {

        this._enabledConsoleTypes = new Array<LogType>();

        for (let i = 0; i < newValue.length; i++) {
            switch (newValue[i].toLowerCase()) {
                case "info":
                    this._enabledConsoleTypes.push(LogType.INFO);
                    break;
                case "error":
                    this._enabledConsoleTypes.push(LogType.ERROR);
                    break;
                case "warning":
                    this._enabledConsoleTypes.push(LogType.WARNING);
                    break;
                case "success":
                    this._enabledConsoleTypes.push(LogType.SUCCESS);
                    break;
                case "trace":
                    this._enabledConsoleTypes.push(LogType.TRACE);
                    break;
            }
        }

    }

    /**
     * Returns whenever logs from debug will be pushed to a cointainer. False by default.
     */
    public get containerLogEnabled(): boolean {
        return this._containerLogEnabled;
    }

    /**
     * Sets container debugging on/off
     * @param newValue
     */
    public set containerLogEnabled(newValue:boolean){
        this._consoleLogEnabled = newValue;
    }

    /**
     * Retruns true if all console outputs will have the same color (depending on playerID)
     */
    public get consoleLogMonoColor(): boolean {
        return this._consoleMonoColor;
    }

    /**
     * Sets console logging to monocolor
     * @param newValue
     */
    public set consoleLogMonoColor(newValue:boolean){
        this._consoleMonoColor = newValue;
    }

    /**
     * Returns all enabled types of logs for container logging
     */
    public get enabledContainerTypes(): Array<LogType> {
        return this._enabledContainerTypes;
    }

    /**
     * Sets console log types
     * @param newValue
     */
    public set enabledContainerTypes(newValue:Array<string>) {

        this._enabledContainerTypes = new Array<LogType>();

        for (let i = 0; i < newValue.length; i++) {
            switch (newValue[i].toLowerCase()) {
                case "info":
                    this._enabledContainerTypes.push(LogType.INFO);
                    break;
                case "error":
                    this._enabledContainerTypes.push(LogType.ERROR);
                    break;
                case "warning":
                    this._enabledContainerTypes.push(LogType.WARNING);
                    break;
                case "success":
                    this._enabledContainerTypes.push(LogType.SUCCESS);
                    break;
                case "trace":
                    this._enabledContainerTypes.push(LogType.TRACE);
                    break;
            }
        }

    }

    /**
     * Return a reference to a object where logs will be pushed as text. Null by default.
     */
    public get containerID(): string | null {
        return this._containerID;
    }

    /**
     * Sets container for logging
     * @param object
     */
    public set containerID(object:string) {
        this._containerID = object;
    }

    /**
     * Retruns true if all container outputs will have the same color (depending on playerID)
     */
    public get containerLogMonoColor(): boolean {
        return this._containerLogMonoColor;
    }

    /**
     * Sets container logging to monocolor
     * @param newValue
     */
    public set containerLogMonoColor(newValue:boolean) {
        this._containerLogMonoColor = newValue;
    }

    public get playbackControllerDebug():boolean {
        return this._playbackController;
    }

    public get qualityControllerDebug():boolean {
        return this._qualityController
    }

    public get stageControllerDebug():boolean {
        return this._stageController;
    }

    public get playerUnitDebug():boolean {
        return this._playerUnit;
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

        if (DebugData.PRINT_ON_STARTUP || force) {

            let consoleLogTypes: string = "";

            for (let i = 0; i < this._enabledConsoleTypes.length; i++) {
                switch (this._enabledConsoleTypes[i]) {
                    case LogType.TRACE:
                        consoleLogTypes += "TRACE, ";
                        break;
                    case LogType.SUCCESS:
                        consoleLogTypes += "SUCCESS, ";
                        break;
                    case LogType.WARNING:
                        consoleLogTypes += "WARNING, ";
                        break;
                    case LogType.INFO:
                        consoleLogTypes += "INFO, ";
                        break;
                    case LogType.ERROR:
                        consoleLogTypes += "ERROR, ";
                        break;
                }
            }

            logger.info(this, "Console:: enabled: " + this._consoleLogEnabled);
            logger.info(this, "Console:: logTypes: " + consoleLogTypes);
            logger.info(this, "Console:: monoColor: " + this._consoleMonoColor);

            let containerLogTypes: string = "";

            for (let i = 0; i < this._enabledContainerTypes.length; i++) {
                switch (this._enabledContainerTypes[i]) {
                    case LogType.TRACE:
                        containerLogTypes += "TRACE, ";
                        break;
                    case LogType.SUCCESS:
                        containerLogTypes += "SUCCESS, ";
                        break;
                    case LogType.WARNING:
                        containerLogTypes += "WARNING, ";
                        break;
                    case LogType.INFO:
                        containerLogTypes += "INFO, ";
                        break;
                    case LogType.ERROR:
                        containerLogTypes += "ERROR, ";
                        break;
                }
            }

            logger.info(this, "Container:: enabled: " + this._containerLogEnabled);
            logger.info(this, "Container:: logTypes: " + containerLogTypes);
            logger.info(this, "Container:: containerID: " + this._containerID);
            logger.info(this, "Container:: monoColor: " + this._consoleMonoColor);

        }

    }
}