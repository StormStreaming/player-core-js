import {PlayerType} from "../enum/PlayerTypes";
import {BufferData} from "../BufferData";
import {BandwidthMeter} from "../buffer/BandwidthMeter";
import {BufferAnalyser} from "../../analyse/BufferAnalyser";


export interface IPlayer {

    feedRawData(data:ArrayBuffer):void
    pause(isStopped:boolean):void
    clear():void
    getBandwidthMeter():BandwidthMeter | null
    getBufferSize():number
    setURL(url: string):void
    getBufferData():BufferData;
    getPlayerType():PlayerType;
    getPlaybackRate():number;
    getBufferAnalyser():BufferAnalyser | null;
    setPreparingToStart(preparingToStart:boolean):void;
    block():void;

}
