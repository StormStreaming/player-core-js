import {StatQueue} from "../../analyse/items/StatQueue";
import {StormPlayerCore} from "../../StormPlayerCore";

export class BandwidthMeter {

    private _currentBandwidth:number = 0;
    private _totalBytesReceived:number = 0;
    private _currentQueue:StatQueue<{value:number, time:number}>
    private _maxBandwidthQueue:StatQueue<number>
    private _awaitingData:number = 0;
    private _minBandwidth:number = 0;
    private _maxBandwidth:number = 0;
    private _saveIndex:number = 0;
    private _main:StormPlayerCore;

    constructor(queueSize:number = 30, main:StormPlayerCore) {
        this._currentQueue = new StatQueue(queueSize);
        this._maxBandwidthQueue = new StatQueue(queueSize);
        this._main = main;
    }

    public reset():void {
        this._totalBytesReceived = 0;
        this._currentQueue.reset();
        this._awaitingData = 0;
    }

    public addReceivedBytes(value:number){
        this._awaitingData += value;
        this._totalBytesReceived += value;
    }

    public markTimestamp(): void {
        this._currentQueue.enqueue({value: this._awaitingData, time: new Date().getTime()});
        this._awaitingData = 0;

        this._currentBandwidth = this.calculateBandwidth();
        this._maxBandwidthQueue.enqueue(this._currentBandwidth);

        // Oblicz zaktualizowane min/max z pominięciem wartości skrajnych
        const values = this._maxBandwidthQueue.getElements();
        if (values.length > 0) {
            const trimmedValues = this.getTrimmedValues(values);
            this._maxBandwidth = Math.max(...trimmedValues);
            this._minBandwidth = Math.min(...trimmedValues);
        }
    }

    private getTrimmedValues(values: number[]): number[] {
        if (values.length <= 4)
            return values;

        const sorted = [...values].sort((a, b) => a - b);
        const trimCount = Math.floor(values.length * 0.1);
        return sorted.slice(trimCount, sorted.length - trimCount);
    }

    public getTotalBytesReceived():number {
        return this._totalBytesReceived;
    }

    public get maxBandwidth():number {
        return (this._maxBandwidth != 0) ? this._maxBandwidth : this._currentBandwidth;
    }

    public get minBandwidth():number {
        return (this._minBandwidth != 0) ? this._minBandwidth : this._currentBandwidth;
    }

    public get currentBandwidth():number {
        return this._currentBandwidth;
    }

    public calculateBandwidth(): number {
        if (this._currentQueue.size() === 0) {
            return 0;
        }

        let startDate: number = Infinity;
        let endDate: number = -Infinity;
        let bandwidth: number = 0;

        const elements = this._currentQueue.getElements();

        for (const element of elements) {
            if (element != null) {
                bandwidth += element.value;
                startDate = Math.min(startDate, element.time);
                endDate = Math.max(endDate, element.time);
            }
        }

        const timeDiff: number = (endDate - startDate) / 1000;
        if (timeDiff === 0)
            return bandwidth;

        return bandwidth / timeDiff;
    }

}