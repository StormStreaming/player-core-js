import {StormLibraryEvent} from "./StormLibraryEvent";

export type StormLibraryListener<K extends keyof StormLibraryEvent> = [K, (ev: StormLibraryEvent[K]) => void, boolean];