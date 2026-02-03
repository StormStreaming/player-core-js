import { StormPlayerCore } from "./StormPlayerCore";
import { StormStreamConfig } from "./types/StormStreamConfig";
import { StormLibraryListener } from "./events/StormLibraryListener";
import { StormLibraryEvent } from "./events/StormLibraryEvent";
import { StreamMetadata } from "./model/StreamMetadata";
import { PlaybackState } from "./playback/enum/PlaybackState";
import { StreamState } from "./playback/enum/StreamState";
import { QualityItem } from "./model/QualityItem";
import { ScalingType } from "./config/enum/ScalingType";
import {Logger} from "./logger/Logger";

export { StormPlayerCore } from "./StormPlayerCore";
export { PlaybackState } from "./playback/enum/PlaybackState";
export { StreamState } from "./playback/enum/StreamState";
export {QualityControlMode} from "./enum/QualityControlMode";
export type { StormStreamConfig } from "./types/StormStreamConfig";
export type { StormLibraryListener } from "./events/StormLibraryListener";
export type { StormLibraryEvent } from "./events/StormLibraryEvent";
export type { StreamMetadata } from "./model/StreamMetadata";
export type { ISourceItem } from "./model/ISourceItem";
export type { QualityItem } from "./model/QualityItem";
export type { SourceItem } from "./types/SourceItem";
export type { StormSourceItem } from "./model/StormSourceItem";
export type  {ScalingType} from "./config/enum/ScalingType";
export type {Logger} from "./logger/Logger";

export function create(config:StormStreamConfig):StormPlayerCore{
    return new StormPlayerCore(config);
}