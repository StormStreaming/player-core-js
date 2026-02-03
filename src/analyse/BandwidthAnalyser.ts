import {StatQueue} from "./items/StatQueue";
import {Trend} from "../enum/Trend";

export class BandwidthAnalyser {

    private _packetDataQueue: StatQueue<number>;
    private _trend: Trend = Trend.STABLE;
    private _trendStartTime: number = Date.now();
    private _trendDuration: number = 0;

    private readonly SIGNIFICANT_CHANGE_THRESHOLD = 25;
    private readonly STABILITY_THRESHOLD = 10;

    constructor() {
        this._packetDataQueue = new StatQueue<number>(20);
    }

    public addEntry(awaitingPackets: number): void {
        this._packetDataQueue.enqueue(awaitingPackets);
        this.calculateTrend();
    }

    private calculateTrend(): void {
        const elements = this._packetDataQueue.getElements();
        if (elements.length < 2) {
            this.updateTrend(Trend.STABLE);
            return;
        }

        const currentValue = elements[elements.length - 1];
        const previousValue = elements[elements.length - 2];
        const change = currentValue - previousValue;

        // Sprawdzamy nagłe skoki
        if (Math.abs(change) > this.SIGNIFICANT_CHANGE_THRESHOLD) {
            this.updateTrend(change > 0 ? Trend.RISING : Trend.FALLING);
            return;
        }

        // Analizujemy trend
        let isRising = false;
        let isFalling = false;
        let significantChanges = 0;

        for (let i = 1; i < elements.length; i++) {
            const diff = elements[i] - elements[i-1];
            if (Math.abs(diff) > this.STABILITY_THRESHOLD) {
                significantChanges++;
                if (diff > 0) isRising = true;
                if (diff < 0) isFalling = true;
            }
        }

        if (significantChanges > 0) {
            if (isRising && !isFalling) {
                this.updateTrend(Trend.RISING);
            } else if (isFalling && !isRising) {
                this.updateTrend(Trend.FALLING);
            } else {
                // Przy mieszanym trendzie, decyduje ostatnia zmiana
                this.updateTrend(change > 0 ? Trend.RISING : Trend.FALLING);
            }
        } else {
            this.updateTrend(Trend.STABLE);
        }
    }

    private updateTrend(newTrend: Trend): void {
        if (this._trend !== newTrend) {
            this._trend = newTrend;
            this._trendStartTime = Date.now();
            this._trendDuration = 0;
        } else {
            this._trendDuration = Date.now() - this._trendStartTime;
        }
    }

    public get currentTrend():Trend {
      return this._trend;
    }

    public get trendDuration():number {
        return (this._trendDuration != 0 ) ? this._trendDuration/1000 : 0;
    }

    public reset(): void {
        this._packetDataQueue = new StatQueue<number>(20);
        this._trend = Trend.STABLE;
        this._trendStartTime = Date.now();
        this._trendDuration = 0;
    }
}