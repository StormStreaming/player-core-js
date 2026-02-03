import {ProtocolType} from "../config/enum/ProtocolType";

/**
 * Interface for source item
 */
export interface IStreamItem {

    getType(): ProtocolType;
    getStreamName(): string;
    getHost():string;
    getApplicationName():string;
    toString(): string

}