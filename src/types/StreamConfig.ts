import { SecurityConfig } from "./SecurityConfig";
import {ServerListConfig} from "./ServerListConfig";

export type StreamConfig = {
    streamKey?:string
    serverList?:ServerListConfig[]
    security?:SecurityConfig
}