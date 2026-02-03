import {BufferConfig} from "./BufferConfig";
import {VideoConfig} from "./VideoConfig";
import {AudioConfig} from "./AudioConfig";
import {DebugConfig} from "./DebugConfig";
import {ProtocolType} from "../config/enum/ProtocolType";
import {StorageConfig} from "./StorageConfig";
import {QualityConfig} from "./QualityConfig";

export type SettingsConfig = {
    autoConnect?:boolean
    autoStart?:boolean
    restartOnFocus?:boolean
    restartOnError?:boolean
    reconnectTime?:number
    enabledProtocols?:Array<ProtocolType>
    quality?:QualityConfig;
    buffer?:BufferConfig
    video?:VideoConfig
    audio?:AudioConfig
    storage?:StorageConfig;
    debug?:DebugConfig
}