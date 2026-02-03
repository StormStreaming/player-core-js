import {AbstractSourceItem} from "./AbstractSourceItem";
import {ISourceItem} from "./ISourceItem";
import {StreamInfo} from "./StreamInfo";
import {ProtocolType} from "../config/enum/ProtocolType";

/**
 * Class containing RTMP Source Item
 */

export class RTMPSourceItem extends AbstractSourceItem implements ISourceItem {

    /**
     * RTMP URL
     * @private
     */
    private host: string;

    /**
     * RTMP Application name. May also include instance e.g. "live/test")
     * @private
     */
    private application:string

    /**
     * Name of the stream. May include prefix and paths  e.g. mp4:/vod/test
     * @private
     */
    private streamKey:string;

    /**
     * RTMP Port
     * @private
     */
    private port: number;

    /**
     * Whenever this source item is default
     * @private
     */
    private defaultSource:boolean

    /**
     * Constructor
     * @param host rtmp url
     * @param application
     * @param streamName
     * @param port rtmp port
     * @param streamInfo
     * @param defaultSource
     */
    constructor(host: string, application:string, streamKey:string, port: number, streamInfo: StreamInfo, defaultSource:boolean) {

        super(ProtocolType.RTMP, streamInfo);

        this.host = host;
        this.application = application;
        this.streamKey = streamKey;
        this.port = port;
        this.defaultSource = defaultSource;

    }

    /**
     * Returns source URL
     */
    public getHost(): string {
        return this.host;
    }

    /**
     * Returns source port
     */
    public getPort(): number {
        return this.port;
    }

    /**
     * Returns source application name
     */
    public getApplicationName():string {
        return this.application;
    }

    /**
     * Returns source stream name
     */
    public getStreamKey():string {
        return this.streamKey;
    }

    /**
     * Returns whenver source is default for this playback
     */
    public isDefaultSource():boolean {
        return this.defaultSource;
    }

    /**
     * Creates a string containing source information in readble form
     */
    public toString(): string {
        return "type: RTMP | url: " + this.host + " | port: " + this.port;
    }

}