import {StormPlayerCore} from "../../StormPlayerCore";
import {PlayerType} from "../enum/PlayerTypes";
import {PlaybackController} from "../PlaybackController";
import {Logger} from "../../logger/Logger";
import {BandwidthMeter} from "../buffer/BandwidthMeter";
import {BufferAnalyser} from "../../analyse/BufferAnalyser";

/**
 * Abstract Player Class, gathers common fields and methods
 */
export class AbstractPlayer {

    /**
     * Reference to the main class
     * @protected
     */
    protected _main: StormPlayerCore;

    /**
     * Reference to the playback controller
     * @protected
     */
    protected _playbackController:PlaybackController

    /**
     * Reference to the player logger
     * @protected
     */
    protected _logger:Logger;

    /**
     * Player type for this class
     * @protected
     */
    protected _playerType:PlayerType;

    /**
     * Reference to the VideoElement
     * @protected
     */
    protected _videoObject:HTMLVideoElement;

    /**
     * Numer of received data packets
     * @protected
     */
    protected _dataPacketCount:number = 0;

    /**
     * When first data packet arrived
     * @protected
     */
    protected _dataArrivalStartTime:number = 0;

    /**
     * Number of received data since first data package
     * @protected
     */
    protected _totalBytesReceived:number = 0;

    /**
     * VideoBuffer size
     * @protected
     */
    protected _bufferSize:number = 0;

    /**
     * Cycle for reporting latency back to server
     * @private
     */
    protected _latencyReportTimeCycle:number = 0;

    /**
     * Unit for analysing buffer
     * @private
     */
    protected _bufferAnalyser:BufferAnalyser;

    /**
     * Dedicated bandwidth component
     * @private
     */
    protected _bandwidthMeter:BandwidthMeter;


    /**
     * Indicates that playback is about to start
     * @private
     */
    protected _preparingToStart:boolean = false;

    /**
     * Returns player type (e.g. MSE, HLS)
     */
    public getPlayerType(): PlayerType {
        return this._playerType;
    }

    public feedRawData(any:ArrayBuffer):void {

    }

    public setPreparingToStart(preparingToStart:boolean):void{
        this._preparingToStart = preparingToStart
    }

    public setURL(url: string):void{

    }

    public getPlaybackRate():number {
        return (this._videoObject != null) ? this._videoObject.playbackRate : 0;
    }

    public getBufferAnalyser():BufferAnalyser | null {
        return this._bufferAnalyser;
    }

    public getBandwidthMeter():BandwidthMeter | null {
        return this._bandwidthMeter;
    }


    public getBufferSize():number {
        return this._bufferSize;
    }

    public block():void {

    }

    protected onForcePause = () => {
        if(this._videoObject != null){
            try {
                this._videoObject.pause();
            } catch(error){

            }
        }
    }
    

}