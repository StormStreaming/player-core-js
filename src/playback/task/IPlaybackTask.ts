import {Logger} from "../../logger/Logger";
import {TaskType} from "../enum/TaskType";

/**
 * Interface for all configs within the player
 */
export interface IPlaybackTask {
    getType(): TaskType;
}
