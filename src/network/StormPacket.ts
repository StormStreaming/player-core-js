
// Zagnieżdżone bloki
interface PlayerInfo {
    type: string;           // "js" | "ios" | "android"
    version: string;
    branch: string;
    protocolVer: number;
}

interface EnvironmentInfo {
    domain: string;
    userAgent: string;
    locale: string;
    timezone: string;
    timezoneOffset: number;
}

interface Capabilities {
    mse: boolean;
    mms: boolean;
    webcodecs: boolean;
    hls: boolean;
    videoCodecs: string[];
    audioCodecs: string[];
}

// Główna paczka
export interface PlayerHandshakePacket {
    player: PlayerInfo;
    environment: EnvironmentInfo;
    capabilities: Capabilities;
    userId: string | null;
}

export interface ProtocolMismatchPacket {
    serverProtocolVer: string;
    clientProtocolVer: string;
}

export interface InvalidLicensePacket {
    licenseState: string;
}


export interface ServerHandshakePacket {
    groupName:string;
    hostName:string;
    serverName:string;
    serverVersion:string;
};

export interface AppPlaybackSettings {
    tokenRequired: boolean;
    dvrEnabled: boolean;
    allowedHarnesses: string[];
}

export interface AppIngestSettingsBlock {
    ingestEnabled:boolean;
    authMethod:string;

}

export interface AppDataPacket {
    name:string;
    type: string;
    playbackSettings:AppPlaybackSettings;
    ingestSettings:AppIngestSettingsBlock;
};

export interface AppAuthPacket {
    token?:string;
    secret?:string | null;
    username?:string;
    password?:string;
};

export interface UnauthorizedActionPacket {
    action:string;
};

export interface AuthResultPacket {
    result:string;
    reason?:string;
    ipAddress:string;
};

export interface PlayRequestPacket {
    protocol:string;
    streamKey:string;
    accessPoint:number;
    subscriptionKey:string;
    packetizer:string;
};

export interface PlayResultPacket {
    reason?:string;
    status:string;
    streamState?:string;
    streamKey:string;
};

export interface PlaybackMetadataPacket {
    audioCodecID:number;
    audioDataRate:number;
    audioSampleRate:number;
    audioSampleSize:number;
    encoder:string;
    frameRate?:number;
    constFrameRate:boolean;
    videoHeight:number;
    videoWidth:number;
    videoCodecID:number;
    videoDataRate:number;
    width:number;
    audioChannels:number;

};

export interface PlaybackStopPacket {
    newState:string
}

export interface PlaybackLinkingPacket {
    path:string
}


export interface SubscribeRequestPacket {
    streamKey:string;
};

export interface UnsubscribeRequestPacket {
    streamKey:string;
};


export interface LatencyReportPacket {
    streamKey:string;
    latency:number;
};


export interface SubscriptionResultPacket {
    reason?:string;
    status:string;
    streamState:string;
    optParameters?:any;
    streamList?:any;
    streamKey:string;

};

export interface SubscriptionUpdatePacket {
    streamKey:string;
    streamState:string;
    streamList?:any;
}

export interface PlaybackProgressPacket {
    streamDuration:number;
    streamStartTime:number;
    playbackStartTime:number;
    playbackDuration:number;
    dvrCacheSize:number;
    recentUndeliveredPackets:number;

}
