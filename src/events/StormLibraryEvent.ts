import {StormPlayerCore} from "../StormPlayerCore";
import {StreamMetadata} from "../model/StreamMetadata";
import {ISourceItem} from "../model/ISourceItem";
import {ConfigManager} from "../config/ConfigManager";
import {PlaybackState} from "../playback/enum/PlaybackState";
import {StreamState} from "../playback/enum/StreamState";
import {QualityItem} from "../model/QualityItem";

export interface StormLibraryEvent {


    /**
     * This event is triggered when a library instance is initialized via initialize() method.
     */
    "playerReady": {ref:StormPlayerCore};

    /**
     * This event is fired when a library instance initiates a connection with a Storm Streaming Server/Cloud instance.
     */
    "serverConnectionInitiate": {ref:StormPlayerCore, serverURL:string};

    /**
     * This event is triggered when a library instance successfully establishes a connection with a Storm Streaming Server/Cloud instance.
     */
    "serverConnect": {ref:StormPlayerCore, serverURL:string, sequenceNum:number};

    /**
     *  This event is called when a library instance is disconnected from the Storm Streaming Server/Cloud (after a connection was previously established), which may occur due to viewer networking issues or Storm Streaming Server/Cloud problems
     */
    "serverDisconnect": {ref:StormPlayerCore, serverURL:string, restart:boolean, sequenceNum:number};

    /**
     * This event is fired whenever a library instance needs to restart a connection with a Storm Streaming Server/Cloud instance.
     */
    "serverConnectionRestart": {ref:StormPlayerCore, isSilent:boolean}

    /**
     * This event is triggered when a library instance fails to establish a connection with a Storm Streaming Server/Cloud instance, possibly due to networking issues. If there are additional servers on the configuration list and the "restartOnError" parameter is set to true, the library will attempt to connect to a different server instead
     */
    "serverConnectionError": {ref:StormPlayerCore, serverURL:string, restart:boolean, sequenceNum:number};

    /**
     * This event is associated with serverConnectionError. If a library instance is unable to connect to any of the servers provided in the configuration list, this event indicates that no further action can be taken.
     */
    "allConnectionsFailed": { ref:StormPlayerCore, mode:string};

    /**
     * Certain browsers and devices do not permit a video element to initiate on its own and necessitate direct user interaction, such as a mouse click or a touch gesture. This event signifies that such an engagement is required.
     */
    "interactionRequired": { ref:StormPlayerCore, mode:string};

    /**
     * This event is triggered if a browser or device does not support any of the provided sources. Please note that the library will attempt all possible measures (switching between various modes) to ensure maximum compatibility with a given device. However, there may be instances where it is simply impossible to initiate a video.
     */
    "compatibilityError": { ref:StormPlayerCore, message:string};

    /**
     * This event is indicates that a request for a stream playback has been created.
     */
    "playbackRequest": {ref:StormPlayerCore, streamKey:string}

    /**
     * This event is fired whenever a playback of a stream is successfully requested form a Storm Streaming Server/Cloud instance.
     */
    "playbackInitiate": {ref:StormPlayerCore, streamKey:string}

    /**
     * This event indicates a video content is being readied for playback. The video buffer must fill in order for the video to start
     */
    "bufferingStart": {ref:StormPlayerCore}

    /**
     * This event indicates that the buffer is full and playback is about to start.
     */
    "bufferingComplete": {ref:StormPlayerCore}

    /**
     * This event notifies that video playback has started (video is now playing)
     */
    "playbackStart": {ref:StormPlayerCore, streamKey:string | null}

    /**
     * This event notifies that video playback has been paused (due to end-user or system interaction)
     */
    "playbackPause": {ref:StormPlayerCore, streamKey:string | null}

    /**
     * This event is fired when the playback is forcefully paused by the system (not by user interaction)
     */
    "playbackForcePause": {ref:StormPlayerCore}

    /**
     * This event is fired when the playback is forcefully muted by the system (not by user interaction)
     */
    "playbackForceMute": {ref:StormPlayerCore}

    /**
     * This event notifies that video playback has been stopped
     */
    "playbackStop": {ref:StormPlayerCore, streamKey:string | null}

    /**
     * This event informs on video progress, stream/playback start-time, stream/playback duration and nDVR cache size
     */
    "playbackProgress": {ref:StormPlayerCore, streamKey:string, streamStartTime:number, streamDuration:number, playbackStartTime:number, playbackDuration:number, dvrCacheSize:number}

    /**
     * This event indicates that there was a problem with the playback (it usually means that the browser was not able to play a source material due to malformed bitcode)
     */
    "playbackError": {ref:StormPlayerCore, mode:string, streamKey:string}

    /**
     * This event is called whenever a stream with a specific name was not found on the server (this includes hibernated streams or sub-streams)
     */
    "streamNotFound": {ref:StormPlayerCore, streamKey:string}

    /**
     * This event delivers optional stream data that was provided by the publisher
     */
    "optionalStreamData": {ref:StormPlayerCore, optData:any}

    /**
     * This event is fired when a subscription request is initiated
     */
    "subscriptionStart": {ref:StormPlayerCore, streamKey:string}

    /**
     * This event is fired when a subscription request is completed
     */
    "subscriptionComplete": {ref:StormPlayerCore, streamKey:string, sourceList:Array<ISourceItem>}

    /**
     * This event notifies that a subscription request has failed
     */
    "subscriptionFailed": {ref:StormPlayerCore, streamKey:string}

    /**
     * This event notifies that stream state has changed (stream state always refers to the original stream on a server)
     */
    "streamStateChange": {ref:StormPlayerCore, streamKey:string | null, state:StreamState}

    /**
     * This event informs on video playback state change
     */
    "playbackStateChange": {ref:StormPlayerCore, streamKey:string | null, state:PlaybackState}

    /**
     * This event will be called when the stream is closed on the server side (usually it means that the broadcaster has stopped streaming, or stream was unpublished)
     */
    "streamStop": {ref:StormPlayerCore, streamKey:string}

    /**
     * This event is activated whenever a new video source is added to the library
     */
    "streamSourceAdd": {ref:StormPlayerCore, mode:string, streamKey:string}

    /**
     * This event is fired whenever the list of available source items is updated
     */
    "sourceListUpdate": {ref:StormPlayerCore, sourceList:Array<ISourceItem>}

    /**
     * This event is fired whenever a list of available qualities (substreams) is updated
     */
    "qualityListUpdate": {ref:StormPlayerCore, qualityList:Array<QualityItem>}

    /**
     * This event informs of metadata arrival for current video. MetaData contains information about stream codecs, width, height, bitrate etc
     */
    "streamMetadataUpdate": {ref:StormPlayerCore, metadata:StreamMetadata}

    /**
     * This event notifies that video volume was changed (either its value was changed, or video was muted/un-muted)
     */
    "volumeChange": {ref:StormPlayerCore, volume:number, muted:boolean, invokedBy:"user" | "browser" | "service" };

    /**
     * This event is triggered whenever a video element within a library instance is either created or recreated
     */
    "videoElementCreate": {ref:StormPlayerCore, videoElement:HTMLVideoElement};

    /**
     * This event is fired whenever a library is detached or attached to a new container
     */
    "containerChange": {ref:StormPlayerCore, container: HTMLElement | null;};

    /**
     * This event is triggered when the video size is changed or updated
     */
    "resizeUpdate": {ref:StormPlayerCore, width:number, height:number};

    /**
     * This event is fired when the video source is downgraded due to bandwidth limitations
     */
    "sourceDowngrade": {ref:StormPlayerCore, bandwidthCap:number};

    /**
     * This event is fired when the video is successfully unmuted
     */
    "videoUnmuted": {ref:StormPlayerCore};

    /**
     * This event is fired if an SSL layer is required for specific sources and the browser does not provide it
     */
    "SSLError": { ref:StormPlayerCore, mode:string};

    /**
     * This event is fired when there is a protocol version mismatch between the client and server
     */
    "incompatibleProtocol": {ref:StormPlayerCore, clientProtocolVer:number, serverProtocolVersion:number}

    /**
     * This event is fired when a library instance fails to authorize with a server application on Storm Streaming Server/Cloud instance (e.g. incorrect token)
     */
    "authorizationError": {ref:StormPlayerCore, reason:string}

    /**
     * This event is called when a library instance successfully authorizes with a server application on Storm Streaming Server/Cloud instance
     */
    "authorizationComplete": {ref:StormPlayerCore, clientIP:string}

    /**
     * This event is fired whenever a Storm Streaming Server/Cloud license expires
     */
    "invalidLicense": {ref:StormPlayerCore, licenseState:string}

    /**
     * This event is fired whenever given server, application or stream reached maximum number of viewers
     */
    "viewerLimitReached": {ref:StormPlayerCore, streamKey:string}

    /**
     * This event notifies that basic stream configuration has been updated
     */
    "streamConfigChange": {ref:StormPlayerCore, newConfig:ConfigManager}

    /**
     * This event is fired whenever a library instance enters browser fullscreen mode (either native or overlay type)
     */
    "fullScreenEnter": {ref:StormPlayerCore}

    /**
     * This event is fired whenever a library instance exits fullscreen mode (either native or overlay type)
     */
    "fullScreenExit": {ref:StormPlayerCore}
}
