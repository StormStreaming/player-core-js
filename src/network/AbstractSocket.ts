/**
 * Base for all classes that use WebSocksts
 */

import {ConnectionState} from "../playback/enum/ConnectionState";
import {Logger} from "../logger/Logger";

/**
 * Abstract socket connection
 */
export class AbstractSocket {

    /**
     * Connection timeout
     * @protected
     */
    protected readonly CONNECTION_TIMEOUT:number = 5;

    /**
     * Logger for this class
     * @private
     */
    protected _logger:Logger

    /**
     * WebSocket object
     * @protected
     */
    protected socket!: WebSocket;

    /**
     * Current WebSocket URL (with protocol and port)
     * @protected
     */
    protected socketURL!: string;

    /**
     * Whenever it is binary data or not
     * @protected
     */
    protected isBinary: boolean = true;

    /**
     * Current state of the connection
     * @private
     */
    protected _connectionState: ConnectionState = ConnectionState.NOT_INITIALIZED;

    /**
     * Number of messages that arrived
     * @private
     */
    protected _messageCount: number = 0;

    /**
     * Connection timeout for the player
     * @protected
     */
    protected _connectionTimeout:any;

    /**
     * Was disconnected by user?
     * @protected
     */
    protected _disconnectedByUser:boolean = false

    /**
     * Whenever we're connected to a server or not
     * @private
     */
    protected _isConnected:boolean = false;

    /**
     * Counts connections
     * @protected
     */
    protected _sequenceNumber:number = -1;

    protected _isDestroyed:boolean = false;

    /**
     * Creates and starts new socket connection
     *
     * @param socketURL
     * @private
     */
    public startConnection(): void {

        this._disconnectedByUser = false;
        this._messageCount = 0;
        this._isConnected = false;
        this._disconnectedByUser = false;
        this._connectionState = ConnectionState.CONNECTING;

        this.socket = new WebSocket(this.socketURL);
        if(this.isBinary)
            this.socket.binaryType = "arraybuffer";

        this.socket.onopen = (event) => {
            clearTimeout(this._connectionTimeout);
            this._sequenceNumber++;
            this._connectionState = ConnectionState.CONNECTED;
            this.onSocketOpen(event);
        };

        this.socket.onmessage = (event) => {
            this._messageCount++;
            this.onSocketMessage(event);
        }

        this.socket.onclose = (event) => {
            clearTimeout(this._connectionTimeout);
            if(this._connectionState == ConnectionState.CONNECTED) {
                this._connectionState = ConnectionState.CLOSED;
                this.onSocketClose(event);
            } else {
                this._connectionState = ConnectionState.FAILED;
            }

        }

        this.socket.onerror = (event) => {
            clearTimeout(this._connectionTimeout);
            if(this._connectionState == ConnectionState.CONNECTING)
                this.onSocketError(event);

            if(this._connectionState == ConnectionState.CONNECTED) {
                try {
                    this.socket.close();
                } catch (error) {
                    //
                }
            }

        }

        this._connectionTimeout = setTimeout(() =>{
            try {
                this.socket.close();
            } catch(error){
                //
            }

            if(this._connectionState == ConnectionState.CONNECTING) {
                this._connectionState = ConnectionState.FAILED;
                this.onSocketError(new ErrorEvent("connectionTimeout"));
            }

        },this.CONNECTION_TIMEOUT * 1000);

    }

    /**
     * Method is called once connection with the server is established
     * @param event
     */
    protected onSocketOpen(event: Event): void {
        // nothing, for extension only
    }

    /**
     * Method is called once connection with the server is closed (
     *
     * @param event
     */
    protected onSocketClose(event: CloseEvent): void {
        // nothing, for extension only
    }

    /**
     * Method is called whenever a new message from socket arrives
     * @private
     */
    protected onSocketMessage(event: MessageEvent): void {
        // nothing, for extension only
    }

    /**
     * Method is called whenever an error on socket occures
     *
     * @param event
     * @private
     */
    protected onSocketError(event: Event): void {
        // nothing, for extension only
    }

    protected onError(error:string): void {
        // nothing, for extension only
    }

    /**
     * Sends data via socket
     * @param data
     */
    public sendData(data:any){
        if(this._connectionState == ConnectionState.CONNECTED) {
            if(this.socket !== null) {
                if (data !== undefined && data !== null) {
                    this.socket.send(data);
                    return;
                } else
                    this.onError("no data to send");

            }
        }

        this.onError("socket not connected");

    }

    /**
     * Returns player state e.g. NOT_INITIALIZED, STARTED, CONNECTED, ENDED
     */
    public getConnectionState(): ConnectionState {
        return this._connectionState;
    }

    /**
     * Rozłacza z serwerem
     */
    public disconnect(byUser:boolean = true):void {

        this._isConnected = false;
        this._connectionState = ConnectionState.CLOSED;

        if(byUser) {
            this._logger.warning(this, "Disconnected by user");
            this._disconnectedByUser = byUser;
        }

        try {

            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onclose = null;
            this.socket.onerror = null;
            this.socket.close();

        } catch (exception){
            // nothing
        }

    }

    /**
     * Destroys connection
     *
     * @protected
     */
    protected destroy():void {

        this._isDestroyed = true;
        this._connectionState = ConnectionState.CLOSED;

        if(this.socket !== undefined && this.socket !== null) {

            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onclose = null;
            this.socket.onerror = null;

            this.socket.close();
        }

    }

    /**
     * Returns currenly used socketURL
     * @protected
     */
    public getSocketURL():string {
        return this.socketURL;
    }

}
