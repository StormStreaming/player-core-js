import {IPlaybackTask} from "./IPlaybackTask";
import {TaskType} from "../enum/TaskType";

export class PlayTask implements IPlaybackTask{

    private readonly _streamKey:string;

    constructor(streamKey:string) {
        this._streamKey = streamKey
    }

    public getStreamKey(){
        return this._streamKey;
    }

    getType(): TaskType {
        return TaskType.PLAY;
    }



}