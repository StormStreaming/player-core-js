import {IServerItem} from "./IServerItem";

/**
 * Class stores information related to storm gateway servers
 */

export class GatewayServerItem implements IServerItem {

    /**
     * Server url
     * @private
     */
    private host: string;

    /**
     * Application name
     * @private
     */
    private application:string;

    /**
     * Port for storm (default is 443)
     * @private
     */
    private port: number;

    /**
     * Whenver connection should be made via SSL (default is true)
     * @private
     */
    private isSSL: boolean;

    /**
     * Whenever player could not establish connection with this host
     * @private
     */
    private hasFaild: boolean

    /**
     * Constructor
     *
     * @param host server URL e.g. "cdn-e001.stormstreaming.com"
     * @param applicationName e.g. "live
     * @param port usually 443
     * @param isSSL whenever connection should be stablished via SSL (true by default)
     */
    constructor(host: string, application:string, port: number = 443, isSSL: boolean = true) {

        this.host = host;
        this.application = application;
        this.port = port;
        this.isSSL = isSSL;
        this.hasFaild = false;

    }

    /**
     * Returns server URL
     */
    public getHost(): string {
        return this.host;
    }

    /**
     * Returns port number
     */
    public getPort(): number {
        return this.port
    }

    /**
     * Returns whenever connection should be established via SSL
     */
    public getIfSSL(): boolean {
        return this.isSSL;
    }

    /**
     * Returns whenever connection faild while trying to connect
     */
    public getIfFaild(): boolean {
        return this.hasFaild;
    }

    /**
     * Marks this server as faild, prevent it from being used anymore
     * @param value
     */
    public setAsFaild(value: boolean): void {
        this.hasFaild = value
    }

    /**
     * Returns application
     */
    public getApplication(): string {
        return this.application;
    }

    /**
     * Returns data from this object
     */
    public getData(): any {
        return {
            serverURL: this.getHost(),
            serverPort: this.getPort(),
            isSSL: this.getIfSSL()
        };
    }

    public toString(): string {
        return "host: " + this.host + " | port: " + this.port + " | isSSL: " + this.isSSL;
    }

}