/**
 * Class containing information related to the stream
 */
export class StreamInfo {

    /**
     * Label (e.g. "720p)
     * @private
     */
    private label!: string;

    /**
     * Monogram (e.g. "hd")
     * @private
     */
    private monogram!: string;

    /**
     * Video width
     * @private
     */
    private width!: number;

    /**
     * Video height
     * @private
     */
    private height!: number;

    /**
     * Video Frames Per Seconds
     * @private
     */
    private fps!: number;

    /**
     * Video BitRate
     * @private
     */
    private bitrate: number = 0;

    /**
     * Constructor
     * @param config object with video data
     */
    constructor(config: any) {

        if (config !== undefined && config !== null) {

            if (config.label !== undefined && config.label !== null)
                this.label = config.label;

            if (config.width !== undefined && config.width !== null)
                this.width = config.width;

            if (config.height !== undefined && config.height !== null)
                this.height = config.height;

            if (config.fps !== undefined && config.fps !== null)
                this.fps = config.fps;

            if (config.bitrate !== undefined && config.bitrate !== null)
                this.bitrate = config.bitrate;

        }

        this.assignMonogram();

    }

    public assignMonogram(): void {
        if(this.width != null && this.height != null) {

            const baseValue = Math.min(this.width, this.height);

            if(baseValue <= 360) {
                this.monogram = "LQ";
            } else if(baseValue <= 480) {
                this.monogram = "SD";
            } else if(baseValue <= 720) {
                this.monogram = "HD";
            } else if(baseValue <= 1080) {
                this.monogram = "FH";
            } else if(baseValue <= 1440) {
                this.monogram = "2K";
            } else if(baseValue <= 2160) {
                this.monogram = "4K";
            } else {
                this.monogram = "UN";
            }
        } else {
            this.monogram = "UN";
        }
    }

    /**
     * Returns source label
     */
    public getLabel(): string {
        return this.label;
    }

    public getMonogram():string {
        return this.monogram;
    }

    /**
     * Returns video width
     */
    public getWidth(): number {
        return this.width;
    }

    /**
     * Returns video height
     */
    public getHeight(): number {
        return this.height;
    }

    /**
     * Returns video fps
     */
    public getFPS(): number {
        return this.fps;
    }

    /**
     * Returns video BitRate
     */
    public getBitrate(): number {
        return this.bitrate;
    }

    public toString():string {
        return "label: "+this.label+" | width: "+this.width+" | height: "+this.height+" | bitrate: "+this.bitrate;
    }

}