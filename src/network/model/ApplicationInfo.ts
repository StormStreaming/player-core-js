import {AppIngestSettingsBlock, AppPlaybackSettings} from "../StormPacket";

export class ApplicationInfo {

    /**
     * Name of this application
     * @private
     */
    private name:string

    /**
     * Application type
     * @private
     */
    private type:string

    private playbackSettings:AppPlaybackSettings;

    private ingestSettings:AppIngestSettingsBlock;

    /**
     * Constructor
     * @param name name of this application
     * @param dvrEnabled is DVR enabled
     * @param type application type
     */
    constructor(name:string, type:string, playbackSettings:AppPlaybackSettings, ingestSettings:AppIngestSettingsBlock) {
        this.name = name;
        this.type = type;
        this.playbackSettings = playbackSettings;
        this.ingestSettings = ingestSettings;
    }

    /**
     * Returns name of this application e.g. 'live'
     */
    public getName():string {
        return this.name;
    }

    /**
     * Returns type of this application e.g. 'edge'
     */
    public getType():string {
        return this.type;
    }



}