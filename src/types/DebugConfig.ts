export type DebugConfig = {
    console?: IDebugConsoleConfig
    container?: IDebugContainerConfig
    playbackController?:boolean
    playerUnit?:boolean
    qualityController?:boolean
    stageController?:boolean
}

export type IDebugConsoleConfig = {
    enabled?: boolean
    logTypes?: Array<string>
    monoColor?: false
}

export type IDebugContainerConfig = {
    enabled?: boolean
    logTypes?: Array<string>
    monoColor?: false
    containerID?:string
}