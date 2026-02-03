export class StatQueue<T> {
    private queue: T[];
    private maxSize: number;
    private maxValue:T;
    private minValue:T;

    /**
     * Constructs a new instance of StatQueue with a specified maximum size.
     * @param maxSize The maximum size of the queue.
     */
    constructor(maxSize: number) {
        if (maxSize <= 0) {
            throw new Error("Max size must be greater than 0.");
        }
        this.maxSize = maxSize;
        this.queue = [];
    }

    public reset():void {
        this.queue = [];
    }

    /**
     * Adds a new element to the queue. If the queue is at maximum capacity,
     * it removes the oldest element before adding the new one.
     * @param element The element to add to the queue.
     */
    public enqueue(element: T): void {
        if (this.queue.length === this.maxSize) {
            this.dequeue(); // Remove the oldest element if at capacity
        }
        this.queue.push(element);
    }

    /**
     * Removes and returns the oldest element from the queue.
     * @returns The oldest element from the queue, or undefined if the queue is empty.
     */
    public dequeue(): T | undefined {
        return this.queue.shift();
    }

    /**
     * Returns the current size of the queue.
     * @returns The number of elements in the queue.
     */
    public size(): number {
        return this.queue.length;
    }

    public getMaxSize():number {
        return this.maxSize;
    }

    /**
     * Returns the current elements of the queue as an array.
     * @returns An array of the current elements in the queue.
     */
    public getElements(): T[] {
        return [...this.queue];
    }
}