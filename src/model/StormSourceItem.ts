import {AbstractSourceItem} from "./AbstractSourceItem";
import {ISourceItem} from "./ISourceItem";
import {ProtocolType} from "../config/enum/ProtocolType";
import {StreamInfo} from "./StreamInfo";

/**
 * Class containing Storm Source Item
 */
export class StormSourceItem extends AbstractSourceItem implements ISourceItem {

    /**
     * Name of the stream.
     * @private
     */
    private streamKey:string;


    /**
     * Whenever this source item is default
     * @private
     */
    private defaultSource:boolean

    /**
     * Constructor
     * @param streamKey
     * @param applicationName
     * @param streamInfo
     * @param defaultSource
     */
    constructor(streamKey:string, streamInfo: StreamInfo, defaultSource:boolean) {

        super(ProtocolType.STORM, streamInfo);
        this.streamKey = streamKey;
        this.defaultSource = defaultSource;

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
        return "type: Storm | streamKey: " + this.streamKey + " | streamInfo: "+this.streamInfo.toString();
    }

}