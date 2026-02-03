import {AbstractSocket} from "./AbstractSocket";
import {StormPlayerCore} from "../StormPlayerCore";
import {StormServerItem} from "../model/StormServerItem";
import {NetworkController} from "./NetworkController";

/**
 * Main class for communicating with Storm Streaming Server
 */
export class StormConnection extends AbstractSocket {

    /**
     * Path for url
     * @private
     */
    private static readonly STORM_WEBSOCKET_HARNESS:string = "storm/v2";

    /**
     * Reference to the main class
     * @private
     */
    private readonly _main:StormPlayerCore;

    /**
     * Reference to the NetworkController object
     * @private
     */
    private readonly _networkController:NetworkController;

    /**
     * Current server connection data
     * @private
     */
    private _currServer:StormServerItem | null;

    /**
     * How long (in seconds) will it take to reconnect to a server after a failure
     * @private
     */
    private _reconnectTimer:number | null;

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constructor
     * @param main
     * @constructor
     */
    public constructor(main:StormPlayerCore, networkController:NetworkController){
        super();

        this._logger = main.getLogger();
        this._main = main;
        this._networkController = networkController;

        this.initialize();

    }

    public initialize():void {

        this._logger.info(this, "Starting new connection with a storm server");
        this.pickServerFromList(this._main.getConfigManager()!.getStreamData().getServerList());

        if(this._currServer != null){
            this.socketURL = this.createURL(this._currServer);
            this._logger.info(this, `Starting WebSocket connection with: ${this.socketURL}`);

            this._main.dispatchEvent("serverConnectionInitiate", {ref: this._main, serverURL:this.socketURL});

            if(this._main.getConfigManager()!.getIfDemoMode()){
                this._logger.warning(this, "Player is in demo mode, and will not connect with a server!");
                this._main.dispatchEvent("authorizationComplete", {ref: this._main, clientIP:"127.0.0.1"});
                return
            }

            this.startConnection();

        } else
            this._logger.error(this, "Connection with the server could not be initialized!");

    }

    //------------------------------------------------------------------------//
    // BASE EVENTS
    //------------------------------------------------------------------------//

    /**
     * On server connection opened;
     * @param event
     * @protected
     */
    protected override onSocketOpen(event:Event):void{

        this._logger.success(this, `Connection with the server has been established!`);
        this._main.dispatchEvent("serverConnect", {ref: this._main, serverURL:this.socketURL, sequenceNum:this._sequenceNumber});
        this._isConnected = true;

    }

    /**
     * On server connection error
     * @param event
     * @protected
     */
    protected override onSocketError(event: Event) {

        this._isConnected = false;

        if(!this._disconnectedByUser) {

            this._logger.error(this, `Connection with the server failed`);
            this._main.dispatchEvent("serverConnectionError", {
                ref: this._main,
                serverURL: this.socketURL,
                restart: this._main.getConfigManager()!.getSettingsData().getIfRestartOnError(),
                sequenceNum:this._sequenceNumber
            });

            if (this._isConnected == false) {
                this._currServer!.setAsFaild(true);
                this.initiateReconnect();
            }

        }

    }

    /**
     * On server connection closed
     * @param event
     * @protected
     */
    protected override onSocketClose(event: CloseEvent): void {

        this._isConnected = false;

        if(!this._disconnectedByUser) {
            this._logger.error(this, `Connection with the server has been closed`);
            this._main.dispatchEvent("serverDisconnect", {
                ref: this._main,
                serverURL: this.socketURL,
                restart: this._main.getConfigManager()!.getSettingsData().getIfRestartOnError(),
                sequenceNum:this._sequenceNumber
            });
            this.initiateReconnect();
        } else
            this._logger.warning(this, `Force disconnect from server!`);

    }

    /**
     * Method is called whenever a new message from socket arrives
     * @private
     */
    protected override onSocketMessage(event: MessageEvent): void {
        if(!this._isDestroyed)
            this._networkController.onMessage(event);
    }

    //------------------------------------------------------------------------//
    // BASE METHODS
    //------------------------------------------------------------------------//

    /**
     * Creates new URL for WebSockets based on serverItem object
     * @param serverItem
     * @private
     */
    private createURL(serverItem:StormServerItem):string {

        let url:string = "";

        url += (serverItem.getIfSSL() ? "wss://" : "ws://")
        url += serverItem.getHost();
        url += ":"+serverItem.getPort();
        url += "/"+StormConnection.STORM_WEBSOCKET_HARNESS;
        url += "/"+serverItem.getApplication();

        return url;
    }

    /**
     * Initiates reconnection procedure
     * @private
     */
    private initiateReconnect():void {

        const shouldReconnect: boolean = this._main.getConfigManager()!.getSettingsData().getIfRestartOnError();
        const reconnectTime: number = this._main.getConfigManager()!.getSettingsData().getReconnectTime();

        if (this._disconnectedByUser) {
            return;
        }

        if(shouldReconnect){

            if(this._reconnectTimer != null)
                clearTimeout(this._reconnectTimer);

            this._reconnectTimer = setTimeout(()=>{

                this.pickServerFromList(this._main.getConfigManager()!.getStreamData().getServerList());
                if(this._currServer != null){

                    this._logger.info(this, `Will reconnect to the server in ${reconnectTime} seconds...`)

                    this.socketURL = this.createURL(this._currServer);
                    this._logger.info(this, `Starting WebSocket connection with: ${this.socketURL}`);

                    this._main.dispatchEvent("serverConnectionInitiate", {ref: this._main, serverURL:this.socketURL});
                    this.startConnection();

                }

            }, reconnectTime*1000);

        }

    }

    /**
     * Picks new server from this list of available ones
     * @param serverList
     * @private
     */
    private pickServerFromList(serverList:Array<StormServerItem>):void {

        let server:StormServerItem|null = null;

        for(let i:number=0;i<serverList.length;i++) {
            if (!serverList[i].getIfFaild()) {
                server = serverList[i];
                break
            }
        }

        if(server == null) {
            this._logger.error(this, "All connections failed!");
            this._main.dispatchEvent("allConnectionsFailed", {ref: this._main, mode: "none"});

            this._currServer = null;
            return;
        } else {
            this._currServer = server;
        }

    }

    /**
     * Returns true/false depending if a connection with a server is active
     */
    public isConnectionActive():boolean {
        return this._isConnected;
    }

    public getCurrentServer():StormServerItem | null {
        return this._currServer
    }

    /**
     * Destroys object and clean-ups everything that is needed
     */
    public destroy():void {
        super.destroy();

        if(this._reconnectTimer != null)
            clearTimeout(this._reconnectTimer);
    }

}