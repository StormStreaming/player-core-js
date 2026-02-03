export class OverloadMeter {

    private queue: number[];
    private duration: number;
    private currentCount: number;

    constructor(duration: number) {
        this.queue = [];
        this.duration = duration *1000;
        this.currentCount = 0;
    }

    addEntry(): void {
        const now = Date.now();
        this.queue.push(now);
    }

    markTimestamp(): void {
        const now = Date.now();
        const threshold = now - this.duration;

        // Usuwanie starych wpisów
        while (this.queue.length > 0 && this.queue[0] < threshold) {
            this.queue.shift();
        }

        this.currentCount = this.queue.length;
    }

    getCurrentCount(): number {
        return this.currentCount;
    }

    public reset():void {
        this.queue = [];
        this.currentCount =0;
    }

}