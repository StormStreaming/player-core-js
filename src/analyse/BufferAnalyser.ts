import {StatQueue} from "./items/StatQueue";
import {Stability} from "../enum/Stability";

export class BufferAnalyser {

    private _bufferQueue:StatQueue<number>

    private previousBufferSize:number = 0;
    private currentBufferSize:number = 0;
    private averageDelay:number = 0;
    private minimalDelay:number = 0;
    private maximalDelay:number = 0;
    private delayDeviation:number = 0;

    constructor() {

        this._bufferQueue = new StatQueue<number>(20);

    }

    public addEntry(bufferSize:number):void {

        this.previousBufferSize = this.currentBufferSize;
        this.currentBufferSize = bufferSize;

        this._bufferQueue.enqueue(bufferSize);

        this.calculateData();

    }

    private calculateData(): void {

        const elements = this._bufferQueue.getElements();

        let minElement: number = elements[0];
        let maxElement: number = elements[0];
        let tempAverage: number = 0;
        let sum: number = 0;
        let sumOfSquares: number = 0;

        // Obliczanie minimum, maximum oraz sumy
        for (let i = 0; i < elements.length; i++) {
            const currentElement = elements[i];
            if (minElement > currentElement) {
                minElement = currentElement;
            }
            if (maxElement < currentElement) {
                maxElement = currentElement;
            }
            sum += currentElement;
        }

        // Obliczanie średniej
        tempAverage = sum / elements.length;

        // Obliczanie sumy kwadratów różnic
        for (let i = 0; i < elements.length; i++) {
            sumOfSquares += Math.pow(elements[i] - tempAverage, 2);
        }

        // Obliczanie odchylenia standardowego
        this.delayDeviation = parseFloat(Math.sqrt(sumOfSquares / elements.length).toFixed(4));

        // Aktualizacja wartości w obiekcie
        this.minimalDelay = parseFloat(minElement.toFixed(4));
        this.maximalDelay = parseFloat(maxElement.toFixed(4));
        this.averageDelay = parseFloat(tempAverage.toFixed(4));


        this.logs();
    }

    public get bufferSize():number {
        return this.currentBufferSize;
    }

    private logs():void {
       // console.log("av: "+this.averageDelay+" | de: "+this.delayDeviation+" | min: "+this.minimalDelay+" | max: "+this.maximalDelay);
    }

    private isReady():boolean {
        return (this._bufferQueue.size() == this._bufferQueue.getMaxSize());
    }

    public get bufferDeviation(){
        return this.delayDeviation
    }

    public get stability(): Stability {
        if (!this.isReady()) {
            return Stability.MEDIUM; // Domyślna wartość gdy bufor nie jest jeszcze pełny
        }

        if (this.delayDeviation < 0.02) {
            return Stability.GOOD;
        } else if (this.delayDeviation < 0.05) {
            return Stability.MEDIUM;
        } else {
            return Stability.BAD;
        }
    }

    reset():void {
        this._bufferQueue = new StatQueue<number>(20);
        this.previousBufferSize = 0;
        this.currentBufferSize = 0;
        this.averageDelay = 0;
        this.minimalDelay = 0;
        this.maximalDelay = 0;
        this.delayDeviation = 0;

    }



}