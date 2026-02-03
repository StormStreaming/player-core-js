import {StormServerItem} from "../model/StormServerItem";
import {ISourceItem} from "../model/ISourceItem";
import {SecurityData} from "./SecurityData";
import {IStreamItem} from "../model/IStreamItem";
import {Logger} from "../logger/Logger";
import {StreamConfig} from "../types/StreamConfig";

/**
 * Class contains streaming data
 */
export class StreamData {

    /**
     * Decides whenever player will print this config data on startup
     *
     * @private
     */
    private static readonly PRINT_ON_STARTUP: boolean = true;

    /**
     * Default storm port (usually 443)
     * @private
     */
    private static readonly DEFAULT_CONNECTION_PORT: number = 443;

    /**
     * Whenever all connection to strom should be made via SSL
     * @private
     */
    private static readonly IS_SSL_BY_DEFAULT: boolean = true;

    /**
     * Original config file
     * @private
     */
    private _streamConfig: StreamConfig;

    /**
     * List of all servers (Storm)
     * @private
     */
    private _serverList: Array<StormServerItem>

    /**
     * List of all sources (usually the same video, but in a different resolution)
     * @private
     */
    private _sourceList: Array<ISourceItem>

    /**
     * Security settings
     * @private
     */
    private _securityData!:SecurityData

    /**
     * Contains stream data (for publishing aka Streamer mode)
     * @private
     */
    private publishData!:IStreamItem;

    /**
     * Group name for gateway server
     * @private
     */
    private _streamKey:string | null

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constructor
     * @param streamConfig
     */
    constructor(streamConfig: StreamConfig) {

        this._serverList = new Array<StormServerItem>();
        this._sourceList = new Array<ISourceItem>();
        this._streamKey = null;

        this.parse(streamConfig);
    }

    //------------------------------------------------------------------------//
    // MAIN METHODS
    //------------------------------------------------------------------------//

    /**
     * Parses provided config
     */
    public parse(streamConfig: StreamConfig) {

        this._streamConfig = streamConfig;

        if (!this._streamConfig)
            throw new Error("Stream configuration is missing. Please check stream config!");

        if (this._streamConfig.serverList !== undefined && this._streamConfig.serverList !== null) {
            if (this._streamConfig.serverList.length !== 0) {

                for (let i: number = 0; i < this._streamConfig.serverList.length; i++) {

                    let host:string;
                    let application:string;

                    if(this._streamConfig.serverList[i].host != null)
                        host = this._streamConfig.serverList[i].host
                    else
                        throw new Error("Error while parsing server object (\"host\" field is missing). Please check player config!");

                    if(this._streamConfig.serverList[i].application != null)
                        application = this._streamConfig.serverList[i].application
                    else
                        throw new Error("Error while parsing server object (\"application\" field is missing). Please check player config!");

                    const port: number = this._streamConfig.serverList[i].port ?? StreamData.DEFAULT_CONNECTION_PORT;
                    const isSSL: boolean = this._streamConfig.serverList[i].ssl ?? StreamData.IS_SSL_BY_DEFAULT;

                    this._serverList.push(new StormServerItem(host, application, port, isSSL));

                }

            } else
                throw new Error("StormLibrary: Server list configuration is empty. Please check the config!")
        } else
            throw new Error("StormLibrary: Server list configuration is missing. Please check the config!")

        this._streamKey = this._streamConfig.streamKey ?? this._streamKey;
        this._securityData = new SecurityData(this._streamConfig.security ?? null);

    }

    //------------------------------------------------------------------------//
    // GETS & SETS
    //------------------------------------------------------------------------//

    /**
     * Returns list of all provided servers
     */
    public getServerList(): Array<StormServerItem> {
        return this._serverList;
    }

    /**
     * Returns list of all video sources
     */
    public getSourceList(): Array<ISourceItem> {
        return this._sourceList;
    }

    /**
     * Returns group name;
     */
    public get streamKey():string | null {
        return this._streamKey;
    }

    /**
     * Returns group name;
     */
    public set streamKey(newValue:string | null){
        this._streamKey = newValue;
    }

    /**
     * Returns security config
     */
    public getSecurityData():SecurityData {
        return this._securityData;
    }

    /**
     * Allows to push server list to the config
     * @param serverList
     */
    public set serverList(serverList:Array<StormServerItem>) {
        this._serverList = serverList;
    }

    /**
     * Allows to push source list to the config
     * @param sourceList
     */
    public set sourceList(sourceList:Array<ISourceItem>) {
        this._sourceList = sourceList;
    }

    //------------------------------------------------------------------------//
    // OTHER
    //------------------------------------------------------------------------//

    /**
     * Removes all sources
     */
    public clearSourceList():void {
        this._sourceList = new Array<ISourceItem>();
    }

    /**
     * Removes all SERVERS
     */
    public clearServerList():void {
        this._serverList = new Array<StormServerItem>();
    }

    /**
     * Prints current settings.
     *
     * @param logger reference to logger
     * @param force if printing is disabled, this parameter can overwrite it
     */
    public print(logger: Logger, force: boolean = false): void {

        if (StreamData.PRINT_ON_STARTUP || force) {

            logger.info(this, "Server List:");
            for (let i = 0; i < this._serverList.length; i++) {
                logger.info(this, "=> [" + (i) + "] " + this._serverList[i].toString());
            }

            logger.info(this, "StreamKey: "+this._streamKey);

            this._securityData.print(logger);

        }

    }

}