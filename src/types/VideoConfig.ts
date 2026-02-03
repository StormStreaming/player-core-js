import debounce from "lodash.debounce";

export type VideoConfig = {
    scalingMode?: "fill" | "letterbox" | "crop" | "original";
    containerID?: string;
    width?: number | string;
    height?: number | string;
    aspectRatio?:string;
    sizeCalculationMethod?: "clientDimensions" | "boundingBox" | "fullBox";
    resizeDebounce?:number;

}