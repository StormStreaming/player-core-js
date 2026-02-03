import {SettingsConfig} from "./SettingsConfig";
import {StreamConfig} from "./StreamConfig";

export type StormStreamConfig = {
    stream:StreamConfig
    settings:SettingsConfig
    demoMode?:boolean
}