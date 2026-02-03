export class StreamMetadata {

    private _videoWidth: number = 0;
    private _videoHeight: number = 0;
    private _videoTimeScale: number = 0;
    private _constantFrameRate: boolean = false;
    private _videoDataRate: number = 0;
    private _frameRate: number = 0;
    private _encoder: string = "Unknown";
    private _audioCodec: string = "Unknown";
    private _videoCodec: string = "Unknown";
    private _audioChannels: number = 0;
    private _audioSampleRate: number = 0;
    private _audioSampleSize: number = 0;
    private _audioDataRate: number = 0;

    constructor() { }

    get videoWidth(): number {
        return this._videoWidth;
    }
    set videoWidth(value: number) {
        this._videoWidth = value;
    }

    get videoHeight(): number {
        return this._videoHeight;
    }
    set videoHeight(value: number) {
        this._videoHeight = value;
    }

    get videoTimeScale(): number {
        return this._videoTimeScale;
    }
    set videoTimeScale(value: number) {
        this._videoTimeScale = value;
    }

    get constantFrameRate(): boolean {
        return this._constantFrameRate;
    }
    set constantFrameRate(value: boolean) {
        this._constantFrameRate = value;
    }

    get videoDataRate(): number {
        return this._videoDataRate;
    }
    set videoDataRate(value: number) {
        this._videoDataRate = value;
    }

    get frameRate(): number {
        return this._frameRate;
    }
    set frameRate(value: number) {
        this._frameRate = value;
    }

    get encoder(): string {
        return this._encoder;
    }
    set encoder(value: string) {
        this._encoder = value;
    }

    get audioCodec(): string {
        return this._audioCodec;
    }
    set audioCodec(value: string) {
        this._audioCodec = value;
    }

    set audioCodecID(value: number) {
        switch(value) {
            case 10:
                this._audioCodec = "ACC";
                break;
            default:
                this._audioCodec = "Unknown";
        }
    }

    get videoCodec(): string {
        return this._videoCodec;
    }
    set videoCodec(value: string) {
        this._videoCodec = value;
    }

    set videoCodecID(value: number) {
        switch(value) {
            case 7:
                this._videoCodec = "H.264";
                break;
            default:
                this._videoCodec = "Unknown";
        }
    }

    get audioChannels(): number {
        return this._audioChannels;
    }
    set audioChannels(value: number) {
        this._audioChannels = value;
    }

    get audioSampleRate(): number {
        return this._audioSampleRate;
    }
    set audioSampleRate(value: number) {
        this._audioSampleRate = value;
    }

    get audioSampleSize(): number {
        return this._audioSampleSize;
    }
    set audioSampleSize(value: number) {
        this._audioSampleSize = value;
    }

    get audioDataRate(): number {
        return this._audioDataRate;
    }
    set audioDataRate(value: number) {
        this._audioDataRate = value;
    }

    get isVariableFPS(): boolean {
        return this._constantFrameRate;
    }

    get nominalFPS(): number {
        return this._frameRate;
    }

    toString(): string {
        return `videoWidth: ${this._videoWidth} | ` +
            `videoHeight: ${this._videoHeight} | ` +
            `videoTimeScale: ${this._videoTimeScale} | ` +
            `variableFPS: ${this._constantFrameRate} | ` +
            `nominalFPS: ${this._frameRate} | ` +
            `encoder: ${this._encoder} | ` +
            `audioCodec: ${this._audioCodec} | ` +
            `videoCodec: ${this._videoCodec} | ` +
            `audioChannels: ${this._audioChannels} | ` +
            `audioSampleRate: ${this._audioSampleRate} | ` +
            `audioSampleSize: ${this._audioSampleSize} | ` +
            `audioDataRate: ${this._audioDataRate}`;
    }
}