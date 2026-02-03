import {IConfig} from "./IConfig";
import {SecurityType} from "./enum/SecurityType";
import {Logger} from "../logger/Logger";
import {SecurityConfig} from "../types/SecurityConfig";

/**
 * Class contains preferences regarding connection security
 */
export class SecurityData implements IConfig {

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
    private _securityConfig: SecurityConfig | null;

    /**
     * Selected type of security mechanism
     * @private
     */
    private _securityMethod: SecurityType = SecurityType.NONE;

    /**
     * Security token provided via config
     * @private
     */
    private _token:string | null;

    /**
     * Security token provided via config
     * @private
     */
    private _secret:string | null;

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constructor
     * @param config security config
     */
    constructor(config: SecurityConfig | null) {
        this.parse(config);
    }

    //------------------------------------------------------------------------//
    // MAIN METHODS
    //------------------------------------------------------------------------//

    /**
     * Parses provided configuration
     * @param config
     */
    public parse(config: SecurityConfig | null): void {

        this._securityConfig = config;

        if(this._securityConfig){

            const type = this._securityConfig.type ?? null

            if (type){
                switch (type) {
                    case "token":
                        this._securityMethod = SecurityType.TOKEN;
                        break;
                    case "none":
                        this._securityMethod = SecurityType.NONE;
                        break;
                    default:
                        this._securityMethod = SecurityType.NONE;
                }
            }

            this._token = this._securityConfig.token ?? null;
            this._secret = this._securityConfig.secret ?? null;

        } else
            this._securityMethod = SecurityType.NONE;

    }

    //------------------------------------------------------------------------//
    // GETS & SETS
    //------------------------------------------------------------------------//

    /**
     * Returns current securty method
     */
    public get securityType(): SecurityType {
        return this._securityMethod;
    }

    /**
     * Sets security method (token or none)
     * @param newValue
     */
    public set securityType(newValue:string){
        switch (newValue) {
            case "token":
                this._securityMethod = SecurityType.TOKEN;
                break;
            case "none":
                this._securityMethod = SecurityType.NONE;
                break;
            default:
                this._securityMethod = SecurityType.NONE;
        }
    }

    /**
     * Returns token
     */
    public get token():string | null {
        return this._token;
    }

    public get secret():string | null {
        return this._secret;
    }

    /**
     * Sets token
     * @param newValue
     */
    public set token (newValue:string) {
        this._token = newValue;
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

        if (SecurityData.PRINT_ON_STARTUP || force) {
            let securityMethodName:string = "";
            switch(this._securityMethod){
                case SecurityType.NONE:
                    securityMethodName = "none";
                    break;
                case SecurityType.TOKEN:
                    securityMethodName = "token";
                    break;
            }

            logger.info(this, "Security Method: "+securityMethodName);
        }

    }

}