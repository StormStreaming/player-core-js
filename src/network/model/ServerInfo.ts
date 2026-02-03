/**
 * Class containing data related to server (for future use)
 */
export class ServerInfo {

    /**
     * Server name
     * @private
     */
    private _name:string;

    /**
     * Group name
     * @private
     */
    private _groupName:string;

    /**
     * Host name
     * @private
     */
    private _hostName:string;

    /**
     * Server version
     * @private
     */
    private _version:string;

    constructor(serverName:string, groupName:string, hostName:string, version:string) {
        this._name = serverName;
        this._groupName = groupName;
        this._hostName = hostName;
        this._version = version;
    }

    /**
     * Server common name
     */
    public get name():string {
        return this._name;
    }

    /**
     * Server group name
     */
    public get group():string {
        return this._groupName;
    }

    /**
     * Server version
     */
    public get version():string {
        return this._version;
    }

}