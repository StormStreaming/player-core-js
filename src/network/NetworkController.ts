import {StormPlayerCore} from "../StormPlayerCore";
import {StormConnection} from "./StormConnection";
import {
    AppAuthPacket,
    AppDataPacket,
    AuthResultPacket, InvalidLicensePacket,
    PlaybackLinkingPacket,
    PlaybackMetadataPacket,
    PlaybackProgressPacket,
    PlaybackStopPacket, PlayerHandshakePacket,
    PlayRequestPacket,
    PlayResultPacket, ProtocolMismatchPacket,
    ServerHandshakePacket,
    SubscribeRequestPacket,
    SubscriptionResultPacket,
    SubscriptionUpdatePacket, UnauthorizedActionPacket, UnsubscribeRequestPacket
} from "./StormPacket";
import {ServerInfo} from "./model/ServerInfo";
import {Logger} from "../logger/Logger";
import {ApplicationInfo} from "./model/ApplicationInfo";
import {NumberUtilities} from "../utilities/NumberUtilities";
import {SecurityType} from "../config/enum/SecurityType";
import {StreamInfo} from "../model/StreamInfo";
import {StormSourceItem} from "../model/StormSourceItem";
import {ISourceItem} from "../model/ISourceItem";
import {PlaybackState} from "../playback/enum/PlaybackState";
import {StreamMetadata} from "../model/StreamMetadata";
import {IPlayer} from "../playback/player/IPlayer";
import {ConnectionState} from "../playback/enum/ConnectionState";
import {StreamState} from "../playback/enum/StreamState";
import {BandwidthAnalyser} from "../analyse/BandwidthAnalyser";
import {UserCapabilities} from "../utilities/UserCapabilities";

/**
 * Main class for managing socket connections (only one per instance) and parsing packets.
 */
export class NetworkController {

    /**
     * Reference to the main class
     * @private
     */
    private readonly _main:StormPlayerCore;

    /**
     * Object containing WebSocket Connection (only one is needed)
     * @private
     */
    private _connection:StormConnection;

    /**
     * Reference to the player logger
     * @private
     */
    protected _logger:Logger;

    /**
     * Whenever connection is authorized with server (can send requests)
     * @private
     */
    private _isAuthorized:boolean = false;

    /**
     * Holds server data
     * @private
     */
    private _serverInfo:ServerInfo | null;

    /**
     * Holds application data
     * @private
     */
    private _appData:ApplicationInfo | null;

    /**
     * Current streamKey
     * @private
     */
    private _currentStreamKey:string = "none";

    /**
     * Last state
     * @private
     */
    private _lastState:string = "";

    /**
     * Last time subscribe request was made
     * @private
     */
    private _lastSubscribeRequestTime:number = 0;

    private _isUnsubscribe:boolean = false;

    /**
     * Gathers and analyses bandwidth
     * @private
     */
    private _bandwidthAnalyser:BandwidthAnalyser;


    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constructor
     * @param main reference to the main class
     */
    constructor(main:StormPlayerCore) {
        this._main = main;
        this._logger = main.getLogger();
        this._bandwidthAnalyser = new BandwidthAnalyser();

        this._main.addEventListener("serverConnect", this.onServerConnect, false)
        this._main.addEventListener("serverDisconnect", this.onServerDisconnect, false)

    }

    //------------------------------------------------------------------------//
    // MAIN METHODS
    //------------------------------------------------------------------------//

    public initialize():void {

        if(this._connection != null){

            if(this._connection.getConnectionState() == ConnectionState.CONNECTING || this._connection.getConnectionState() == ConnectionState.CONNECTED){
                this._logger.info(this, "Connection is alive, not doing anything!")
            } else {
                this._logger.info(this, "Connection is dead, restarting!")
                this._connection.startConnection();
            }
        } else
            this._connection = new StormConnection(this._main, this);

    }

    public stop():void {
        this._connection.disconnect(true);
        this._lastState = "";
        this._isAuthorized = false;
        this._serverInfo = null;
        this._appData = null;
    }

    public restart(silentRestart:boolean = false):void {

        this._main.dispatchEvent("serverConnectionRestart", {
            ref: this._main,
            isSilent:silentRestart
        });

        this._connection.disconnect();
        stop();
        this._connection = new StormConnection(this._main, this);
        this.subscribe(this._currentStreamKey);
    }

    //------------------------------------------------------------------------//
    // CONNECTION-RELATED METHODS
    //------------------------------------------------------------------------//

    private onServerConnect = () => {

        let playerHandshake: PlayerHandshakePacket = {
            player: {
                type: "js",
                version: this._main.getVersion(),
                branch: this._main.getBranch(),
                protocolVer: this._main.PLAYER_PROTOCOL_VERSION,
            },
            environment: {
                domain: window.location.hostname,
                userAgent: navigator.userAgent,
                locale: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timezoneOffset: new Date().getTimezoneOffset()
            },
            capabilities: {
                mse: UserCapabilities.hasMSESupport(),
                mms: UserCapabilities.hasMMSSupport(),
                webcodecs: UserCapabilities.hasWebCodecsSupport(),
                hls: UserCapabilities.hasHLSSupport(),
                videoCodecs: UserCapabilities.getSupportedVideoCodecs(),
                audioCodecs: UserCapabilities.getSupportedAudioCodecs()
            },
            userId: null,
        }

        this._connection.sendData(JSON.stringify({packetId: "clientHandshake", data: playerHandshake}))

    }

    private onServerDisconnect = () => {
        this._isAuthorized = false;
        this._appData = null;
        this._serverInfo = null;
        this._lastState = "none";
    }

    public onMessage = (event: MessageEvent) => {

        if(typeof event.data == "string") {

            const jsonObj: any = JSON.parse(event.data);
            const packetId: string = jsonObj.packetId;

            switch(packetId){
                //-----------------------------------------------------------------------//
                // UNAUTHORIZED ACTION
                //-----------------------------------------------------------------------//
                case "unauthorizedAction": {

                    const packet: UnauthorizedActionPacket = jsonObj.data as UnauthorizedActionPacket;

                    this._logger.error(this, `Could not perform action: ${packet.action}, due to lack of authentication with the server`);

                }
                break;
                //-----------------------------------------------------------------------//
                // PROTOCOL MISMATCH
                //-----------------------------------------------------------------------//
                case "protocolMismatch": {

                    const packet: ProtocolMismatchPacket = jsonObj.data as ProtocolMismatchPacket;

                    this._logger.error(this, `Incompatible protocol version - player is ${this._main.PLAYER_PROTOCOL_VERSION}, but server is ${packet.serverProtocolVer}`);
                    this._main.dispatchEvent("incompatibleProtocol", {
                        ref: this._main,
                        clientProtocolVer: this._main.PLAYER_PROTOCOL_VERSION,
                        serverProtocolVersion: Number(packet.serverProtocolVer),
                    });

                }
                break;
                //-----------------------------------------------------------------------//
                // INVALID LICENSE
                //-----------------------------------------------------------------------//
                case "invalidLicense": {

                    const packet: InvalidLicensePacket = jsonObj.data as InvalidLicensePacket;
                    this._logger.error(this, `Invalid server license, licease state: ${packet.licenseState}`);

                    this._main.dispatchEvent("invalidLicense", {
                        ref: this._main,
                        licenseState: packet.licenseState
                    });

                }
                break;
                //-----------------------------------------------------------------------//
                // SERVER HANDSHAKE
                //-----------------------------------------------------------------------//
                case "serverHandshake": {

                    const packet: ServerHandshakePacket = jsonObj.data as ServerHandshakePacket;
                    this._serverInfo = new ServerInfo(packet.serverName, packet.groupName, packet.hostName, packet.serverVersion);

                }
                break;
                //-----------------------------------------------------------------------//
                // APPLICATION INFO
                //-----------------------------------------------------------------------//
                case "appInfo": {

                    const packet: AppDataPacket = jsonObj.data as AppDataPacket;
                    this._appData = new ApplicationInfo(packet.name, packet.type, packet.playbackSettings, packet.ingestSettings);

                    this._logger.info(this, "ApplicationData :: App Name: "+this._appData.getName()+" | App Type: "+this._appData.getType());

                    let packetData: AppAuthPacket | null = null;

                    const secret:string | null | undefined = this._main.getConfigManager()?.getStreamData().getSecurityData().secret;

                    if (packet.playbackSettings.tokenRequired) {

                        if (this._main.getConfigManager()?.getStreamData().getSecurityData().securityType == SecurityType.TOKEN) {

                            const token:string | null | undefined = this._main.getConfigManager()?.getStreamData().getSecurityData().token;

                            packetData = {
                                token: token,
                                secret: secret,
                            } as unknown as AppAuthPacket;

                        } else {
                            this._logger.error(this, `Application ${packet.name} requires token for authentication and no token was provided! Disconnecting!`);
                            this._main.dispatchEvent("authorizationError", {ref: this._main, reason: "No token has been provided"});
                            this._connection.disconnect();
                        }

                    } else
                        packetData = {
                            secret:secret,
                        } as unknown as AppAuthPacket;

                    this._connection.sendData(JSON.stringify({packetId: "appAuthRequest", data: packetData}))

                }
                break;
                //-----------------------------------------------------------------------//
                // AUTH RESULT
                //-----------------------------------------------------------------------//
                case "appAuthResult": {

                    const packet: AuthResultPacket = jsonObj.data as AuthResultPacket;
                    if (packet.result == "success") {

                        const ipAddress: string = packet.ipAddress;

                        this._isAuthorized = true;
                        this._logger.success(this, `Authorization with the sever is complete!`);
                        this._main.dispatchEvent("authorizationComplete", {ref: this._main, clientIP: ipAddress});

                    } else {

                        let reason: string = "Unknown";
                        if (packet.reason != null)
                            reason = packet.reason;

                        this._logger.error(this, `Authorization with the sever has failed!`);
                        this._main.dispatchEvent("authorizationError", {ref: this._main, reason: reason});

                    }
                    break;
                }
                //-----------------------------------------------------------------------//
                // SUBSCRIPTION RESULT PACKET
                //-----------------------------------------------------------------------//
                case "subscribeResult": {

                    const packet: SubscriptionResultPacket = jsonObj.data as SubscriptionResultPacket;

                    const origStreamKey: string | null = this._main.getConfigManager()?.getStreamData().streamKey ?? null;
                    const packetStreamKey: string = packet.streamKey;



                    if (origStreamKey != packetStreamKey) {
                        this._logger.error(this, "Subscribe result denied, original: " + origStreamKey + " | packet: " + packetStreamKey);
                        return;
                    }

                    if (packet.status == "success") {

                        // opt parameters
                        if (packet.optParameters != null) {
                            this._logger.info(this, "Optional Stream Data: " + packet.optParameters);
                            this._main.dispatchEvent("optionalStreamData", {
                                ref: this._main,
                                optData: packet.optParameters
                            });
                        }

                        this._lastState = "unkown";

                        this.parseSources(packet);
                        this.updateStreamStatus(packet);

                        this._main.dispatchEvent("subscriptionComplete", {
                            ref: this._main,
                            streamKey: this._currentStreamKey,
                            sourceList: this._main.getConfigManager()!.getStreamData().getSourceList()
                        });

                    } else {

                        this._lastState = "unknown";

                        this._main.dispatchEvent("subscriptionFailed", {
                            ref: this._main,
                            streamKey: this._currentStreamKey
                        });

                        switch (packet.reason) {
                            case "Stream not found": {

                                this._logger.error(this, "Stream not found")
                                this._main.dispatchEvent("streamNotFound", {
                                    ref: this._main,
                                    streamKey: packet.streamKey
                                });

                                this._main.getPlaybackController()?.setStreamState(StreamState.NOT_FOUND, packet.streamKey);
                            }
                            break;
                            case "Not authorized": {
                                this._logger.error(this, "Not authorized for play")
                            }
                            break;
                            default: {
                                this._logger.error(this, "Could get data from the server: " + packet.reason);
                            }

                        }

                    }
                }
                break;
                //-----------------------------------------------------------------------//
                // PLAY RESULT PACKET
                //-----------------------------------------------------------------------//
                case "playResult": {

                    const packet: PlayResultPacket = jsonObj.data as PlayResultPacket;
                    const origStreamKey: string | null = this._main.getConfigManager()?.getStreamData().streamKey ?? null;

                    if (origStreamKey != packet.streamKey) {
                        this._logger.error(this, "Play result denied, requested streamKey: \"" + origStreamKey + "\" | packet: " + packet.streamKey);
                        return;
                    }

                    if (packet.status == "success") {

                        switch (packet.streamState) {

                            case "PUBLISHED":

                                this._logger.success(this, `Playback initialized! StreamKey: ${packet.streamKey}`);
                                this._main.dispatchEvent("playbackInitiate", {
                                    ref: this._main,
                                    streamKey: packet.streamKey
                                });

                                break;
                            case "AWAITING":

                                this._main.getPlaybackController()?.setPlaybackState(PlaybackState.STOPPED);
                                this._main.getPlaybackController()?.setStreamState(StreamState.AWAITING, packet.streamKey);

                                this._logger.info(this, "Stream is not ready yet (state: AWAITING)");

                                break;
                            case "NOT_PUBLISHED":

                                this._main.getPlaybackController()?.setPlaybackState(PlaybackState.STOPPED);
                                this._main.getPlaybackController()?.setStreamState(StreamState.NOT_PUBLISHED, packet.streamKey);

                                break;
                            case "UNPUBLISHED":

                                this._main.getPlaybackController()?.setPlaybackState(PlaybackState.STOPPED);
                                this._main.getPlaybackController()?.setStreamState(StreamState.UNPUBLISHED, packet.streamKey);

                                this._logger.info(this, "Stream is not ready yet (state: UNPUBLISHED")

                                break;

                            case "INITIALIZED":

                                this._main.getPlaybackController()?.setPlaybackState(PlaybackState.STOPPED);
                                this._main.getPlaybackController()?.setStreamState(StreamState.INITIALIZED, packet.streamKey);

                                this._logger.info(this, "Stream is not ready yet (state: INITIALIZED/UNPUBLISHED")

                                break;
                        }

                    } else {

                        switch (packet.reason) {
                            case "NOT_FOUND":

                                this._logger.info(this, "Stream not found")
                                this._main.dispatchEvent("streamNotFound", {
                                    ref: this._main,
                                    streamKey: packet.streamKey
                                });

                                this._main.getPlaybackController()?.setStreamState(StreamState.NOT_FOUND, packet.streamKey);

                                break;
                            case "Incorrect streamKey":
                                this._logger.info(this, "Stream not found (incorrect streamKey)")
                                this._main.dispatchEvent("streamNotFound", {
                                    ref: this._main,
                                    streamKey: packet.streamKey
                                });
                                break;
                            case "Maximum viewers reached":
                                this._logger.info(this, "Maximum viewers reached")
                                this._main.dispatchEvent("viewerLimitReached", {
                                    ref: this._main,
                                    streamKey: packet.streamKey
                                });
                                break;
                        }

                    }

                }
                break;
                //-----------------------------------------------------------------------//
                // METADATA
                //-----------------------------------------------------------------------//
                case "streamMetadata": {

                    const packet: PlaybackMetadataPacket = jsonObj.data as PlaybackMetadataPacket;
                    let metaData:StreamMetadata = new StreamMetadata();

                    metaData.videoCodecID = packet.videoCodecID;
                    metaData.videoWidth = packet.videoWidth;
                    metaData.videoHeight = packet.videoHeight;
                    metaData.videoDataRate = packet.videoDataRate;

                    if(packet.constFrameRate){
                        metaData.constantFrameRate = true;
                        metaData.frameRate = <number>packet.frameRate
                    } else
                        metaData.constantFrameRate = false;

                    metaData.audioCodecID = packet.audioCodecID;
                    metaData.audioDataRate = packet.audioDataRate;
                    metaData.audioSampleSize = packet.audioSampleSize;
                    metaData.audioSampleRate = packet.audioSampleRate;
                    metaData.audioChannels = packet.audioChannels;

                    this._logger.success(this, `MetaData has arrived!`);
                    this._main.dispatchEvent("streamMetadataUpdate", {
                        ref: this._main,
                        metadata:metaData
                    });

                }
                break;
                //-----------------------------------------------------------------------//
                // PROGRESS
                //-----------------------------------------------------------------------//
                case "playbackProgress": {


                    const packet:PlaybackProgressPacket = jsonObj.data as PlaybackProgressPacket;
                    this._main.dispatchEvent("playbackProgress", {
                        ref: this._main,
                        streamKey:this._currentStreamKey,
                        streamStartTime: packet.streamStartTime,
                        streamDuration: packet.streamDuration,
                        playbackStartTime: packet.playbackStartTime,
                        playbackDuration: packet.playbackDuration,
                        dvrCacheSize: packet.dvrCacheSize,
                    });

                    this._bandwidthAnalyser.addEntry(packet.recentUndeliveredPackets);

                }
                break
                //-----------------------------------------------------------------------//
                // PLAYBACK STOP
                //-----------------------------------------------------------------------//
                case "playbackStop": {

                    const packet: PlaybackStopPacket = jsonObj.data as PlaybackStopPacket;
                    const newState = packet.newState;

                    this._logger.success(this, `Stream Stop`);
                    this._main.dispatchEvent("streamStop", {
                        ref: this._main,
                        streamKey:this._currentStreamKey
                    });

                }
                break;
                //-----------------------------------------------------------------------//
                // SUBSCRIPTION UPDATE
                //-----------------------------------------------------------------------//
                case "subscribeUpdate": {

                    const packet:SubscriptionUpdatePacket = jsonObj.data as SubscriptionUpdatePacket;

                    const oldStreamState:StreamState = this._main.getStreamState();

                    this.parseSources(packet);
                    this.updateStreamStatus(packet)

                }
                break;
                //-----------------------------------------------------------------------//
                // LINKIN PAKET
                //-----------------------------------------------------------------------//
                case "playbackLinkingPacket": {

                    const packet:PlaybackLinkingPacket = jsonObj.data as PlaybackLinkingPacket;

                    let filePath = (this._connection?.getCurrentServer()?.getIfSSL() ? "https://" : "http://");
                    filePath += this._connection?.getCurrentServer()?.getHost()+":"+this._connection?.getCurrentServer()?.getPort()+"/";
                    filePath += packet.path;

                    this._main.getPlaybackController()?.getPlayer()?.setURL(filePath);

                }
                break
                //-----------------------------------------------------------------------//
                case "unsubscribeResult":{
                    this._isUnsubscribe = false;
                }
                break;
            }

        } else {

            const player:IPlayer | null | undefined = this._main.getPlaybackController()?.getPlayer();
            if(player != null){
                player.feedRawData(event.data)
            }

        }

    }

    /**
     * Subscribes to a given channel (streamKey)
     * @param streamKey name of stream we want to watch for
     */
    public subscribe(streamKey:string):void {

        if(this._isUnsubscribe){
            setTimeout(() => {
                this.subscribe(streamKey)
            },100);
            return;
        }

        if(!this._isAuthorized){
            setTimeout(() => {
                this.subscribe(streamKey)
            },100);
            return;
        }

        this._logger.info(this, "StreamKey registered: "+streamKey);
        this._main.dispatchEvent("subscriptionStart", {ref:this._main, streamKey:streamKey});

        if(this._connection != null && this._connection.isConnectionActive()){

            let packetData: SubscribeRequestPacket | null = null;
            packetData = {
                streamKey: streamKey,
            } as unknown as SubscribeRequestPacket;

            this._currentStreamKey = streamKey;
            this._lastSubscribeRequestTime = new Date().getTime();
            this._main.getConfigManager()!.getStreamData().streamKey = streamKey;

            this._connection.sendData(JSON.stringify({packetId: "subscribeRequest", data: packetData}))

        } else {
            this.initialize();
        }

    }

    /**
     * Unsubscribes selected channel (streamKey)
     */
    public unsubscribe():void {

        if(!this._isAuthorized)
            return;

        const currentStreamKey: string | null = this._main.getConfigManager()!.getStreamData().streamKey;

        this._isUnsubscribe = true;
        this._lastState = "none";

        if(this._connection != null && this._connection.isConnectionActive()){

            let packetData: UnsubscribeRequestPacket | null = null;
            packetData = {
               // streamKey: currentStreamKey,
            } as unknown as UnsubscribeRequestPacket;

            this._connection.sendData(JSON.stringify({packetId: "unsubscribeRequest", data: packetData}))
        } else {
            this.initialize();
        }

    }

    /**
     * Sends play signal to a server
      * @param source
     */
    public playSignal(source:ISourceItem):void {

        if(this._connection != null && this._connection.isConnectionActive()){

            const player:IPlayer | null | undefined = this._main.getPlaybackController()?.getPlayer();
            if(player != null){

                const stormSource = source as StormSourceItem;

                this._main.dispatchEvent("playbackRequest", {ref:this._main, streamKey:stormSource.getStreamKey()});

                let packetData = {
                    protocol:"storm",
                    streamKey:stormSource.getStreamKey(),
                    subscriptionKey:this._main.getConfigManager()!.getStreamData().streamKey,
                    packetizer:player.getPlayerType(),
                    startTime:0
                } as unknown as PlayRequestPacket;

                this._connection.sendData(JSON.stringify({packetId: "playRequest", data: packetData}))

            } else {
                this._logger.error(this, "No player for playback");
            }
        } else {
            this.initialize();
        }

    }

    /**
     * Sends pause signal to a server
     */
    public pauseSignal():void {

        if(this._connection != null && this._connection.isConnectionActive()){
            this._connection.sendData(JSON.stringify({packetId: "pauseRequest"}))
        }
    }

    /**
     * Parses sources from SubscriptionResult & SubscriptionUpdate Packets into main config manager
     * @param packet
     * @private
     */
    private parseSources(packet: SubscriptionResultPacket | SubscriptionUpdatePacket){

        let sourceList:Array<ISourceItem> = new Array<ISourceItem>();

        for (let i: number = 0; i < packet.streamList.length; i++) {
            let streamInfo: StreamInfo = new StreamInfo(packet.streamList[i].streamInfo);
            let sourceItem: StormSourceItem = new StormSourceItem(packet.streamList[i].streamKey, streamInfo, false);
            sourceList.push(sourceItem);
        }

        this._main.getConfigManager()!.getStreamData().sourceList = sourceList;

        this._main.dispatchEvent("sourceListUpdate", {
            ref:this._main,
            sourceList:sourceList
        })

    }

    /**
     * Updates broadcast status
     * @param packet
     */
    private updateStreamStatus = (packet: SubscriptionResultPacket | SubscriptionUpdatePacket) => {

        if(this._lastState == packet.streamState)
            return;

        this._lastState = packet.streamState;

        switch(packet.streamState){
            case "AWAITING":
                this._logger.success(this, "Stream is awaiting start (AWAITING)")

                this._main.getPlaybackController()?.setStreamState(StreamState.AWAITING, packet.streamKey);

                break;
            case "NOT_PUBLISHED":
                this._logger.success(this, "Stream is awaiting start (NOT_PUBLISHED)")

                this._main.getPlaybackController()?.setStreamState(StreamState.NOT_PUBLISHED, packet.streamKey);

                break;
            case "UNPUBLISHED":
                this._logger.success(this, "Stream has been unpublished (UNPUBLISHED)")

                this._main.getPlaybackController()?.setStreamState(StreamState.NOT_PUBLISHED, packet.streamKey);

                break;
            case "PUBLISHED":
                this._logger.success(this, "Stream is published (PUBLISHED)")

                this._main.getPlaybackController()?.setStreamState(StreamState.PUBLISHED, packet.streamKey);

                break;
            case "CLOSING":
            case "CLOSED":
                this._logger.success(this, "Stream is closed (CLOSED)")
                this._main.getPlaybackController()?.setStreamState(StreamState.CLOSED, packet.streamKey);

                break;
            default:
                this._logger.success(this, "Incorrect state: "+packet.streamState);
        }


    }

    public sendUserReportPacket(data:Object):void {
        if(this._connection.isConnectionActive())
            this._connection.sendData(JSON.stringify(
                {packetId: "viewerReport",
                    data: data})
            );
    }

    //------------------------------------------------------------------------//
    // SETS & GETS
    //------------------------------------------------------------------------//

    public getLastSubscribeRequestTime():number {
        return this._lastSubscribeRequestTime;
    }

    /**
     * Returns true/false depending on whenever a connection is authorized with a server
     */
    public getIfAuthorized():boolean {
        return this._isAuthorized;
    }

    /**
     * Returns current SocketConnection object
     */
    public getConnection():StormConnection {
        return this._connection
    }

    public getBandwidthAnalyser():BandwidthAnalyser {
        return this._bandwidthAnalyser;
    }

    public getServerInfo():ServerInfo | null {
        return this._serverInfo;
    }





}