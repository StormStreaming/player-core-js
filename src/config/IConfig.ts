import {Logger} from "../logger/Logger";

/**
 * Interface for all configs within the player
 */
export interface IConfig {
    print(logger: Logger, force: boolean): void;
}
