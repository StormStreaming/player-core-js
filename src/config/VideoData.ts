import {IConfig} from "./IConfig";
import {ScalingType} from "./enum/ScalingType";
import {Logger} from "../logger/Logger";
import {VideoConfig} from "../types/VideoConfig";
import {SizeCalculationType} from "./enum/SizeCalculationType";

/**
 * Class contains settings for video object
 */
export class VideoData implements IConfig {

    /**
     * Original config
     * @private
     */
    private videoConfig: VideoConfig | null;

    /**
     * Selected scaling mode
     * @private
     */
    private _scalingMode: ScalingType = ScalingType.LETTER_BOX;

    /**
     * Container ID for video object (must be created prior to starting the player)
     * @private
     */
    private _containerID: string | null;

    /**
     * Aspect ratio saved as a string (two numbers with : in between)
     * @private
     */
    private _aspectRatio: string = "none";

    /**
     * Initial video container width
     * @private
     */
    private _videoWidthValue:number = 100;

    /**
     * Whenever width is in pixels
     * @private
     */
    private _isVideoWidthInPixels:boolean = false;

    /**
     * Whenever width was provided
     * @private
     */
    private _wasVideoWidthProvided:boolean = false;

    /**
     * Initial video container height;
     * @private
     */
    private _videoHeightValue:number = 100;

    /**
     * Whenever height is in pixels
     * @private
     */
    private _isVideoHeightInPixels:boolean = false;

    /**
     * Whenever height was provided
     * @private
     */
    private _wasVideoHeightProvided:boolean = false;

    /**
     * Resize debounce parameter
     * @private
     */
    private _resizeDebounce:number = 250;

    /**
     * Method used for calculating parent size;
     * @private
     */
    private _parentSizeCalculationMethod:SizeCalculationType = SizeCalculationType.CLIENT_DIMENSIONS;

    //------------------------------------------------------------------------//
    // CONSTRUCTOR
    //------------------------------------------------------------------------//

    /**
     * Constructor
     *
     * @param videoConfig video config object
     */
    constructor(videoConfig: VideoConfig | null) {
        this.parse(videoConfig);
    }

    //------------------------------------------------------------------------//
    // MAIN METHODS
    //------------------------------------------------------------------------//

    /**
     * Parses provided config
     */
    public parse(config: VideoConfig | null) {

        this.videoConfig = config;

        if (this.videoConfig != null) {

            if(this.videoConfig.aspectRatio != null){

                const aspectRatioRegexString: string = '^[0-9]*\\.?[0-9]+:[0-9]*\\.?[0-9]+$';
                const aspectRatioRegex: RegExp = new RegExp(aspectRatioRegexString);

                let tempAspectRatio:string = this.videoConfig.aspectRatio;

                if(aspectRatioRegex.test(tempAspectRatio)){
                    this._aspectRatio = tempAspectRatio;
                } else
                    throw new Error("Parameter \"aspectRatio\" - must match \"number:number\" pattern ");

                this._aspectRatio = this.videoConfig.aspectRatio;

            }

            if (this.videoConfig.scalingMode != null) {
                let newScalingMode: string = this.videoConfig.scalingMode;
                switch (newScalingMode.toLowerCase()) {
                    case "fill":
                        this._scalingMode = ScalingType.FILL;
                        break;
                    case "letterbox":
                        this._scalingMode = ScalingType.LETTER_BOX;
                        break;
                    case "crop":
                        this._scalingMode = ScalingType.CROP;
                        break;
                    case "original":
                        this._scalingMode = ScalingType.ORIGINAL;
                        break;
                    default:
                        throw new Error("Unknown video scaling mode. Please check player config!")
                        break;
                }
            }

            if(this.videoConfig.width !== undefined){
                if(this.videoConfig.width !== null) {

                    if (typeof this.videoConfig.width === "number") {
                        this._videoWidthValue = this.videoConfig.width;
                        this._isVideoWidthInPixels = true;
                    } else if (typeof this.videoConfig.width === "string") {
                        if (this.videoConfig.width.toLowerCase().endsWith('px')) {
                            this._videoWidthValue = parseInt(this.videoConfig.width);
                            this._isVideoWidthInPixels = true;
                        } else if (this.videoConfig.width.toLowerCase().endsWith('%')) {
                            this._videoWidthValue = parseInt(this.videoConfig.width);
                            this._isVideoWidthInPixels = false;
                        }
                    }  else
                        throw new Error("Unknown type for parameter \"width\" - it must be a number or a string! ")

                    this._wasVideoWidthProvided = true;

                } else
                    throw new Error("Parameter \"width\" cannot be empty")
            }

            if(this.videoConfig.height !== undefined){
                if(this.videoConfig.height !== null) {

                    if (typeof this.videoConfig.height === "number") {
                        this._videoHeightValue= this.videoConfig.height;
                        this._isVideoHeightInPixels = true;
                    } else if (typeof this.videoConfig.height === "string") {
                        if (this.videoConfig.height.toLowerCase().endsWith('px')) {
                            this._videoHeightValue = parseInt(this.videoConfig.height);
                            this._isVideoHeightInPixels = true;
                        } else if (this.videoConfig.height.toLowerCase().endsWith('%')) {
                            this._videoHeightValue = parseInt(this.videoConfig.height);
                            this._isVideoHeightInPixels = false;
                        }
                    } else
                        throw new Error("Unknown type for parameter \"height\" - it must be a number or a string!")

                    this._wasVideoHeightProvided = true;

                } else
                    throw new Error("Parameter \"height\" cannot be empty")
            }

            if(this.videoConfig.sizeCalculationMethod !== undefined){
                if(this.videoConfig.sizeCalculationMethod !== null){

                    switch(this.videoConfig.sizeCalculationMethod){
                        case "clientDimensions":
                            this._parentSizeCalculationMethod = SizeCalculationType.CLIENT_DIMENSIONS;
                            break;
                        case "boundingBox":
                            this._parentSizeCalculationMethod = SizeCalculationType.BOUNDING_BOX;
                            break;
                        case "fullBox":
                            this._parentSizeCalculationMethod = SizeCalculationType.FULL_BOX;
                            break;
                    }
                }
            }

            this._containerID = this.videoConfig.containerID ?? null;

            this._resizeDebounce = this.videoConfig.resizeDebounce ?? this._resizeDebounce;


        } else
            throw new Error("Missing video configuration. Please check player config!")

    }

    //------------------------------------------------------------------------//
    // GETS & SETS
    //------------------------------------------------------------------------//

    /**
     * Returns selected scaling mode
     */
    public get scalingMode(): ScalingType {
        return this._scalingMode;
    }

    /**
     * Returns ID of the main video container
     */
    public get containerID(): string | null {
        return this._containerID;
    }

    /**
     * Returns video screen initial width
     */
    public get videoWidthValue():number {
        return this._videoWidthValue
    }

    /**
     * Returns whenever screen width was provided in pixels
     */
    public get videoWidthInPixels():boolean {
        return this._isVideoWidthInPixels;
    }

    /**
     * Returns whenever screen width was provided in pixels
     */
    public get videoWidthProvided():boolean {
        return this._wasVideoWidthProvided;
    }

    /**
     * Returns video container initial width
     */
    public get videoHeightValue():number {
        return this._videoHeightValue
    }

    /**
     * Returns video container initial width
     */
    public get videoHeightInPixels():boolean {
        return this._isVideoHeightInPixels;
    }

    /**
     * Returns whenever screen width was provided in pixels
     */
    public get videoHeightProvided():boolean {
        return this._wasVideoHeightProvided;
    }

    /**
     * Returns aspect ratio;
     */
    public get aspectRatio():string {
        return this._aspectRatio;
    }

    public get resizeDebounce():number {
        return this._resizeDebounce;
    }

    public set resizeDebounce(newValue:number){
        this._resizeDebounce = newValue;
    }

    /**
     * Sets new width to the player config
     * @param newWidth
     */
    public set videoWidthValue(newWidth:number) {
        this._videoWidthValue = newWidth;
    }

    /**
     * Sets new width to the player config
     * @param newWidth
     */
    public set videoWidthInPixels(value:boolean) {
        this._isVideoWidthInPixels = value;
    }

    /**
     * Sets new height to the player config
     * @param newHeight
     */
    public set videoHeightValue(newHeight:number) {
        this._videoHeightValue = newHeight;
    }

    /**
     * Sets new width to the player config
     * @param newWidth
     */
    public set videoHeightInPixels(value:boolean) {
        this._isVideoHeightInPixels = value;
    }

    /**
     * Sets new containerID for the player
     * @param newContainerID
     */
    public set containerID(newContainerID:string) {
        this._containerID = newContainerID;
    }

    /**
     * Sets new scaling mode
     * @param newScalingMode
     */
    public set scalingMode(newScalingMode:string) {

        switch (newScalingMode.toLowerCase()) {
            case "fill":
                this._scalingMode = ScalingType.FILL;
                break;
            case "letterbox":
                this._scalingMode = ScalingType.LETTER_BOX;
                break;
            case "crop":
                this._scalingMode = ScalingType.CROP;
                break;
            case "original":
                this._scalingMode = ScalingType.ORIGINAL;
                break;
            default:
                throw new Error("Unknown video scaling mode. Please check player config!")
                break;
        }

    }

    public get parentSizeCalculationMethod():SizeCalculationType {
        return this._parentSizeCalculationMethod;
    }

    //------------------------------------------------------------------------//
    // OTHER
    //------------------------------------------------------------------------//

    /**
     * Prints current settings
     *
     * @param logger
     */
    public print(logger: Logger): void {

        let scalingMode: string = "";

        switch (this._scalingMode) {
            case ScalingType.FILL:
                scalingMode = "fill";
                break;
            case ScalingType.LETTER_BOX:
                scalingMode = "letterbox";
                break;
            case ScalingType.CROP:
                scalingMode = "crop";
                break;
            case ScalingType.ORIGINAL:
                scalingMode = "original";
                break;
        }

        logger.info(this, "VideoConfig :: containerID: " + this._containerID);
        logger.info(this, "VideoConfig :: scalingMode: " + scalingMode);
        logger.info(this, "VideoConfig :: width: "+this._videoWidthValue+(this._isVideoWidthInPixels ? "px" : "%")+(this._wasVideoWidthProvided ? " (provided)" : " (default)"))
        logger.info(this, "VideoConfig :: height: "+this._videoHeightValue+(this._isVideoHeightInPixels ? "px" : "%")+(this._wasVideoHeightProvided ? " (provided)" : " (default)"))
        logger.info(this, "VideoConfig :: aspectRatio: "+this._aspectRatio)

    }

}