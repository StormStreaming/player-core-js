/**
 * Logger that helps outputting messages
 */
import {DebugData} from "../config/DebugData";
import {StormPlayerCore} from "../StormPlayerCore";
import {LogType} from "../config/enum/LogType";
import {NumberUtilities} from "../utilities/NumberUtilities";

export class Logger {

    /**
     * Defines what color an info log would be outputted (can be either a color name or #hex)
     * @private
     */
    private static INFO_COLOR: string = "blue";

    /**
     * Defines what color a warning log would be outputted (can be either a color name or #hex)
     * @private
     */
    private static WARNING_COLOR: string = "orange";

    /**
     * Defines what color an error log would be outputted (can be either a color name or #hex)
     * @private
     */
    private static ERROR_COLOR: string = "red";

    /**
     * Defines what color a success log would be outputted (can be either a color name or #hex)
     * @private
     */
    private static SUCCESS_COLOR: string = "green";

    /**
     * Defines what color a success log would be outputted (can be either a color name or #hex)
     * @private
     */
    private static TRACE_COLOR: string = "black";

    /**
     * Stores original debug config object
     * @private
     */
    private debugConfig: DebugData;

    /**
     * Reference to main object
     * @private
     */
    private _stormPlayer: StormPlayerCore;

    /**
     * List of colors used for monoColor option
     * @private
     */
    private colorOrder: Array<string> = ["red", "green", "blue", "orange", "black", "violet"];

    /**
     * Selected monocolor
     * @private
     */
    private monoColor: string;

    /**
     * Stores all loges within this array
     * @private
     */
    private logMemory: Array<string> = [];

    /**
     * Main name of the instance
     * @private
     */
    private libraryInstanceID:number = -1;

    private playerInstanceID:number = -1

    /**
     * Constructor
     *
     * @param config object containing settings for logger
     * @param stormLibrary reference to main class
     */
    public constructor(config: DebugData, stormLibrary: StormPlayerCore) {
        this.debugConfig = config;
        this._stormPlayer = stormLibrary;
        this.libraryInstanceID = this._stormPlayer.getLibraryID();

        let colorID: number = (this.colorOrder.length < stormLibrary.getLibraryID()) ? this.colorOrder.length - 1 : stormLibrary.getLibraryID();

        this.monoColor = this.colorOrder[colorID];

    }

    /**
     * Creates new "info" type log
     *
     * @param objectName object that called the log
     * @param message log message
     */
    public info(objectName: any, message: string): void {

        let output: string = this.logData(objectName, message);

        if (this.debugConfig.consoleLogEnabled) {
            if (this.debugConfig.enabledConsoleTypes.indexOf(LogType.INFO) >= 0) {
                let consoleColor: string = (this.debugConfig.consoleLogMonoColor) ? this.monoColor : Logger.INFO_COLOR;
                console.log('%c ' + output, 'color: ' + consoleColor);
            }
        }

        if (this.debugConfig.containerLogEnabled) {
            if (this.debugConfig.enabledContainerTypes.indexOf(LogType.INFO) >= 0) {
                let containerColor: string = (this.debugConfig.containerLogMonoColor) ? this.monoColor : Logger.INFO_COLOR;
                this.writeToContainer(output, containerColor);
            }
        }

    }

    /**
     * Creates new "warning" type log
     *
     * @param objectName object that called the log
     * @param message log message
     */
    public warning(objectName: any, message: string): void {

        let output: string = this.logData(objectName, message);

        if (this.debugConfig.consoleLogEnabled) {
            if (this.debugConfig.enabledConsoleTypes.indexOf(LogType.WARNING) >= 0) {
                let consoleColor: string = (this.debugConfig.consoleLogMonoColor) ? this.monoColor : Logger.WARNING_COLOR;
                console.log('%c ' + output, 'color: ' + consoleColor);
            }
        }

        if (this.debugConfig.containerLogEnabled) {
            if (this.debugConfig.enabledContainerTypes.indexOf(LogType.WARNING) >= 0) {
                let containerColor: string = (this.debugConfig.containerLogMonoColor) ? this.monoColor : Logger.WARNING_COLOR;
                this.writeToContainer(output, containerColor);
            }
        }

    }

    /**
     * Creates new "error" type log
     *
     * @param objectName object that called the log
     * @param message log message
     */
    public error(objectName: any, message: string): void {

        let output: string = this.logData(objectName, message);

        if (this.debugConfig.consoleLogEnabled) {
            if (this.debugConfig.enabledConsoleTypes.indexOf(LogType.ERROR) >= 0) {
                let consoleColor: string = (this.debugConfig.consoleLogMonoColor) ? this.monoColor : Logger.ERROR_COLOR;
                console.log('%c ' + output, 'color: ' + consoleColor);
            }
        }

        if (this.debugConfig.containerLogEnabled) {
            if (this.debugConfig.enabledContainerTypes.indexOf(LogType.ERROR) >= 0) {
                let containerColor: string = (this.debugConfig.containerLogMonoColor) ? this.monoColor : Logger.ERROR_COLOR;
                this.writeToContainer(output, containerColor);
            }
        }

    }

    /**
     * Creates new "success" type log
     *
     * @param objectName object that called the log
     * @param message log message
     */
    public success(objectName: any, message: string): void {

        let output: string = this.logData(objectName, message);

        if (this.debugConfig.consoleLogEnabled) {
            if (this.debugConfig.enabledConsoleTypes.indexOf(LogType.SUCCESS) >= 0) {
                let consoleColor: string = (this.debugConfig.consoleLogMonoColor) ? this.monoColor : Logger.SUCCESS_COLOR;
                console.log('%c ' + output, 'color: ' + consoleColor);
            }
        }

        if (this.debugConfig.containerLogEnabled) {
            if (this.debugConfig.enabledContainerTypes.indexOf(LogType.SUCCESS) >= 0) {
                let containerColor: string = (this.debugConfig.containerLogMonoColor) ? this.monoColor : Logger.SUCCESS_COLOR;
                this.writeToContainer(output, containerColor);
            }
        }

    }

    /**
     * Creates new "trace" type log
     *
     * @param objectName object that called the log
     * @param message log message
     */
    public trace(objectName: any, message: string): void {

        let output: string = this.logData(objectName, message);

        if (this.debugConfig.consoleLogEnabled) {
            if (this.debugConfig.enabledConsoleTypes.indexOf(LogType.TRACE) >= 0) {
                let consoleColor: string = (this.debugConfig.consoleLogMonoColor) ? this.monoColor : Logger.TRACE_COLOR;
                console.log('%c ' + output, 'color: ' + consoleColor);
            }
        }

        if (this.debugConfig.containerLogEnabled) {
            if (this.debugConfig.enabledContainerTypes.indexOf(LogType.TRACE) >= 0) {
                let containerColor: string = (this.debugConfig.containerLogMonoColor) ? this.monoColor : Logger.TRACE_COLOR;
                this.writeToContainer(output, containerColor);
            }
        }

    }

    /**
     * Prepares console message and formats its text
     * @param _objectName object that called the log
     * @param message log message
     * @private
     */
    private logData(_objectName: any, message: string): string {

        let date: Date = new Date();
        let hour: string = NumberUtilities.addLeadingZero(date.getHours());
        let minutes: string = NumberUtilities.addLeadingZero(date.getMinutes());
        let seconds: string = NumberUtilities.addLeadingZero(date.getSeconds());

        let label:string = String(this.libraryInstanceID);
        if(this.playerInstanceID >= 0)
            label+= "|"+this.playerInstanceID

        let finalString: string = "[Storm-ID:" + label + "] [" + hour + ":" + minutes + ":" + seconds + "] :: " + message;

        this.logMemory.push(finalString);

        return finalString;
    }

    /**
     * Writes log to a DOM container
     *
     * @param message the message
     * @param color of the log
     * @private
     */
    private writeToContainer(message: string, color: string): void {

        let containerName: string | null = this.debugConfig.containerID;
        if(containerName) {
            let container: any = document.getElementById(containerName);
            let log: any = document.createElement('span');

            log.innerText = message;
            log.style.color = color;

            container.appendChild(log);
        }
    }

    public decoratedLog(text: string, scheme: string) {
        const EMOJI_MAP = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

        const COLOR_SCHEMES: { [key: string]: string } = {
            'dark-blue': '#4c9fee',
            'dark-green': '#4bcb64',
            'dark-orange': '#daa33a',
            'dark-red': '#f86464',
            'dark-pink': '#f864e8',
            'dark-yellow': '#e1f864'
        };

        const id = this._stormPlayer.getLibraryID();
        const keyCaps = (id >= 0 && id < EMOJI_MAP.length)
            ? EMOJI_MAP[id]
            : `[${id}]`;

        const color = COLOR_SCHEMES[scheme];
        if (!color) return; // Early return if invalid scheme

        const style = `background: black; color: ${color}; border: 1px solid ${color}; padding: 5px 5px 5px 0px`;
        console.log(`%c ▶️${keyCaps} ${text}`, style);
    }

    /**
     * Sets player id
     * @param playerID
     */
    public setPlayerID(playerID:number){
        this.playerInstanceID = playerID;
    }

    /**
     * Returns all logs
     */
    public getAllLogs(): Array<string> {
        return this.logMemory
    }

}
