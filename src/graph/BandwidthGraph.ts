import {StormPlayerCore} from "../StormPlayerCore";
import {GraphDrawer} from "./GraphDrawer";
import {IGraph} from "./IGraph";

export class BandwidthGraph implements IGraph  {

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

    public start(): BandwidthGraph{

        if(this._graph != null)
            stop();

        if(this._main.getConfigManager() != null) {

            const valueRanges = [
                1000000,
                2000000,
                3000000,
                5000000,
                6000000,
                7000000,
            ];

            const colors: string[] = [
                '#000000', // 0 - Buffering
                '#0a3980', // Buffering - Start
                '#2793dd', // Start - MinTarget
                '#3bc39c', // MinTarget - Target
                '#c3df3e', // Target - MaxTarget
                '#f89539', // MaxTarget - MaxBuffer
                '#f83f3f'  // MaxBuffer - End
            ];

            this._graph = new GraphDrawer(this._object, valueRanges, colors);

            this._interval = setInterval(() => {
                if(this._graph != null && this._main.getBandwidthMeter() != null)
                    this._graph.addEntry(this._main.getBandwidthMeter()!.currentBandwidth)

            }, this._intervalValue)

        }

        return this;

    }

    public stop():BandwidthGraph {

        clearInterval(this._interval);
        if(this._graph != null)
            this._graph.destroy();

        this._graph = null;

        return this;

    }


}