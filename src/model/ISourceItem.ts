import {ProtocolType} from "../config/enum/ProtocolType";
import {StreamInfo} from "./StreamInfo";

/**
 * Interface for source item
 */
export interface ISourceItem {

    getType(): ProtocolType;
    getStreamInfo(): StreamInfo;
    getStreamKey():string;
    toString(): string

}