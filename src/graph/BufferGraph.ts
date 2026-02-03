import {StormPlayerCore} from "../StormPlayerCore";
import {GraphDrawer} from "./GraphDrawer";
import {IGraph} from "./IGraph";

export class BufferGraph implements IGraph {

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

    public start():BufferGraph {

        if(this._graph != null)
            stop();

        if(this._main.getConfigManager() != null) {

            const valueRanges = [
                this._main.getConfigManager()!.getSettingsData().getBufferData().minValue,
                this._main.getConfigManager()!.getSettingsData().getBufferData().startValue,
                this._main.getConfigManager()!.getSettingsData().getBufferData().targetValue - 0.1,
                this._main.getConfigManager()!.getSettingsData().getBufferData().targetValue,
                this._main.getConfigManager()!.getSettingsData().getBufferData().targetValue + 0.1,
                this._main.getConfigManager()!.getSettingsData().getBufferData().maxValue
            ];

            const colors: string[] = [
                '#000000', // 0 - Buffering
                '#1b4386', // Buffering - Start
                '#3b86bb', // Start - MinTarget
                '#6bc2a5', // MinTarget - Target
                '#e5f69b', // Target - MaxTarget
                '#fab067', // MaxTarget - MaxBuffer
                '#fa6767'  // MaxBuffer - End
            ];

            this._graph = new GraphDrawer(this._object, valueRanges, colors);

            this._interval = setInterval(() => {

                if(this._graph != null && this._main.getBufferAnalyser() != null)
                    this._graph.addEntry(this._main.getBufferAnalyser()!.bufferSize)

            },this._intervalValue)

        }

        return this;

    }

    public stop():BufferGraph {

        clearInterval(this._interval);
        if(this._graph != null)
            this._graph.destroy();

        this._graph = null;

        return this;
    }


}