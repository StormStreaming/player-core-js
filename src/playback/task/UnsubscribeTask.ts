import {IPlaybackTask} from "./IPlaybackTask";
import {TaskType} from "../enum/TaskType";

export class UnsubscribeTask implements IPlaybackTask{


    constructor() {
    }


    getType(): TaskType {
        return TaskType.UNSUBSCRIBE;
    }



}