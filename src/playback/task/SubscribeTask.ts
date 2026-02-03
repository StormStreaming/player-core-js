import {IPlaybackTask} from "./IPlaybackTask";
import {TaskType} from "../enum/TaskType";

export class SubscribeTask implements IPlaybackTask{

    private readonly _streamKey:string;

    constructor(streamKey:string) {
        this._streamKey = streamKey
    }

    public getStreamKey(){
        return this._streamKey;
    }

    getType(): TaskType {
        return TaskType.SUBSCRIBE;
    }



}