import {ProtocolType} from "../config/enum/ProtocolType";
import {StreamInfo} from "./StreamInfo";

/**
 * Abstract class for all source items (e.g. webrtc, rtmp, mpeg-dash)
 */
export class AbstractSourceItem {

    /**
     * Protocol type e.g. RTMP, RTSP
     * @private
     */
    protected type: ProtocolType;

    /**
     * Info object (cointains data related to video width, height, fps, bitrate e.g.)
     * @private
     */
    protected streamInfo: StreamInfo;

    /**
     * Constructor
     *
     * @param type
     * @param info
     */
    constructor(type:ProtocolType, info:StreamInfo) {
        this.type = type;
        this.streamInfo = info;
    }

    /**
     * Returns protocol type
     */
    public getType(): ProtocolType {
        return this.type;
    }

    /**
     * Return info object
     */
    public getStreamInfo(): StreamInfo {
        return this.streamInfo;
    }


}