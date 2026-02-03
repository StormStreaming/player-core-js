import {IPlaybackTask} from "./IPlaybackTask";
import {TaskType} from "../enum/TaskType";

export class PauseTask implements IPlaybackTask{


    private _isStopped:boolean = false;

    constructor(isStopped:boolean = false) {
        this._isStopped = isStopped
    }

    public getIfStopped():boolean {
        return this._isStopped;
    }

    getType(): TaskType {
        return TaskType.PAUSE;
    }



}