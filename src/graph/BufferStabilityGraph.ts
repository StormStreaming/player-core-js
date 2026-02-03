import {StormPlayerCore} from "../StormPlayerCore";
import {GraphDrawer} from "./GraphDrawer";
import {IGraph} from "./IGraph";

export class BufferStabilityGraph implements IGraph {

    private _object:string | HTMLElement;
    private _interval:number = -1;
    private _intervalValue:number = 50;
    private _main:StormPlayerCore;
    private _graph:GraphDrawer | null;

    constructor(main: StormPlayerCore, container:string | HTMLElement, interval:number){

        this._main = main;
        this._object = container;
        this._intervalValue = interval;
        this._main.addGraph(this);

    }

    public start():BufferStabilityGraph {

        if(this._graph != null)
            stop();

        if(this._main.getConfigManager() != null) {

            const valueRanges = [
                0.02,
                0.05,
            ];

            const colors: string[] = [
                '#2bbf22', // 0 - Buffering
                '#d8ba14', // Buffering - Start
                '#d33423', // Start - MinTarget
            ];

            this._graph = new GraphDrawer(this._object, valueRanges, colors);

            this._interval = setInterval(() => {

                if(this._graph != null && this._main.getBufferAnalyser() != null)
                    this._graph.addEntry(this._main.getBufferAnalyser()!.bufferDeviation)

            },this._intervalValue)

        }

        return this;

    }

    public stop():BufferStabilityGraph {

        clearInterval(this._interval);
        if(this._graph != null)
            this._graph.destroy();

        this._graph = null;

        return this;
    }


}