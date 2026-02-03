import {StreamInfoConfig} from "./StreamInfoConfig";

export type SourceListConfig = {
    host?:string
    application?:string
    port?:number;
    streamKey:string
    protocol:string
    streamInfo?:StreamInfoConfig
}