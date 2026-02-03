import {SourceInfo} from "./SourceInfo";

export type SourceItem = {
    protocol:string;
    default?:boolean;
    streamKey?:string;
    host?:string;
    application?:string;
    port?:number;
    streamInfo?:SourceInfo;
}