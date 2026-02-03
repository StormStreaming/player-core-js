export class BufferData {

    private _bufferSize:number = 0;
    private _minBuffer:number = 0;
    private _maxBuffer:number = 0;
    private _startBuffer:number = 0;
    private _targetBuffer:number = 0;
    private _targetMargin:number = 0;
    private _deviation:number = 0;
    private _bufferCondition: "none" | "normal" | "too-slow" | "too-fast" | "not-enough" | "over-shoot";

    constructor() {

    }

    public get bufferSize():number {
        return this._bufferSize;
    }

    public get deviation():number {
        return this._deviation;
    }

    public get minBuffer():number {
        return this._minBuffer;
    }

    public get maxBuffer():number {
        return this._maxBuffer;
    }

    public get targetBuffer():number {
        return this._targetBuffer;
    }

    public get startBuffer():number {
        return this._startBuffer;
    }

    public get targetMargin():number {
        return this._targetMargin;
    }

    public get bufferCondition(): "none" | "normal" | "too-slow" | "too-fast" | "not-enough" | "over-shoot" {
        return this._bufferCondition;
    }

    public set bufferSize(value:number){
        this._bufferSize = value;
    }

    public set minBuffer(value:number){
        this._minBuffer = value;
    }

    public set maxBuffer(value:number){
        this._maxBuffer = value;
    }

    public set startBuffer(value:number){
        this._startBuffer = value;
    }

    public set deviation(value:number){
        this._deviation = value;
    }

    public set targetBuffer(value:number){
        this._targetBuffer = value;
    }

    public set targetMargin(value:number){
        this._targetMargin = value;
    }

    public set bufferCondition(value: "none" | "normal" | "too-slow" | "too-fast" | "not-enough" | "over-shoot"){
        this._bufferCondition = value;
    }

    public drawBufferStatus(totalLength: number): string {
        // Ensure minimum representation for each section (1 character each)
        const minSectionsCount = 5;
        if (totalLength < minSectionsCount) {
            totalLength = minSectionsCount;
        }

        // Calculate base empty space (pre-min and post-max)
        const emptySpaceEach = Math.max(1, Math.floor(totalLength * 0.1));
        const mainSpace = totalLength - (2 * emptySpaceEach);

        // Calculate all positions
        const minPos = emptySpaceEach;
        const startPos = minPos + Math.max(2, Math.floor(mainSpace * 0.2));
        const targetPos = startPos + Math.max(2, Math.floor(mainSpace * 0.3));
        const targetUpperPos = targetPos + Math.max(1, Math.floor(mainSpace * 0.1));
        const maxPos = targetUpperPos + Math.max(2, Math.floor(mainSpace * 0.3));

        // Ensure currentPos is always valid
        let currentPos = minPos + Math.floor(this._bufferSize * mainSpace);
        if (currentPos >= totalLength) currentPos = maxPos - 1;
        if (currentPos < minPos) currentPos = minPos;

        // Create array with background fills
        const result: string[] = new Array(totalLength).fill('').map((_, i) => {
            if (i < minPos) {
                return '░';
            } else if (i < startPos) {
                return '▒';
            } else if (i < targetPos) {
                return '▓';
            } else if (i < targetUpperPos) {
                return '█';
            } else if (i < maxPos) {
                return '▒';
            } else {
                return '░';
            }
        });

        // Add the dot
        if (currentPos >= 0 && currentPos < result.length) {
            result[currentPos] = '•';
        }

        return result.join('');
    }


}