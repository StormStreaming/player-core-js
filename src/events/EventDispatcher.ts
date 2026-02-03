import {StormLibraryEvent} from "./StormLibraryEvent";
import {StormLibraryListener} from "./StormLibraryListener";
import {Logger} from "../logger/Logger";

/**
 * General class for event-listeners
 */
export class EventDispatcher {

    private readonly DEBUG_OUTPUT:boolean = false

    /**
     * Whenever instance of this class has been removed
     * @protected
     */
    protected _isRemoved:boolean = false;

    /**
     * Logger attached to this player
     * @private
     */
    protected _logger:Logger;

    /**
     * An array storing all the listeners
     * @private
     */
    protected _listeners: { [K in keyof StormLibraryEvent]?: Array<StormLibraryListener<K>>; } = {};

    public constructor() {
        // nothing
    }

    /**
     * Method registers event listener with the object
     * @param eventName name of an event (as a string)
     * @param listener a reference to a method
     * @param removable whenever this listener can be removed or not
     */
    public addEventListener<K extends keyof StormLibraryEvent>(eventName: K, listener: (ev: StormLibraryEvent[K]) => void, removable:boolean = true): boolean{

        if (!this._listeners[eventName])
            this._listeners[eventName] = [];

        let elementFound = false;

        if(this._listeners[eventName] != undefined){
            if((this._listeners[eventName] as StormLibraryListener<K>[]).length > 0){
                for(let i=0; i<(this._listeners[eventName] as StormLibraryListener<K>[]).length; i++){
                    let element:StormLibraryListener<K> = (this._listeners[eventName] as StormLibraryListener<K>[])[i];
                    if(element[1] == listener){
                        elementFound = true;
                        break;
                    }
                }
            }
        }

        this._logger.success(this, "Registering a new event: "+eventName);

        if(!elementFound) {
            (this._listeners[eventName] as StormLibraryListener<K>[]).push([eventName, listener, removable]);

            return true;
        } else
            return false;

    }

    /**
     * Method removes a listener from this object based on event name and used method
     * @param eventName name of an event (as a string)
     * @param listenera reference to a method (optional)
     */
    public removeEventListener<K extends keyof StormLibraryEvent>(eventName: K, listener?: (ev: StormLibraryEvent[K]) => void): boolean {

        let elementFound = false;

        if(this._listeners[eventName] != undefined){
            if((this._listeners[eventName] as StormLibraryListener<K>[]).length > 0){
                for(let i=0; i<(this._listeners[eventName] as StormLibraryListener<K>[]).length; i++){
                    let element:StormLibraryListener<K> = (this._listeners[eventName] as StormLibraryListener<K>[])[i];
                    if(listener) {
                        if (element[1] == listener) {
                            if (element[2] == true) {
                                elementFound = true;
                                (this._listeners[eventName] as StormLibraryListener<K>[]).splice(i, 1);
                                break;
                            } else
                                break;
                        }
                    } else {
                        elementFound = true;
                        if (element[2] == true) {
                            (this._listeners[eventName] as StormLibraryListener<K>[]).splice(i, 1);
                        }
                    }
                }
            }
        }

        this._logger.success(this, "Removing listener: "+eventName);

        return elementFound;

    }

    /**
     * Method removes all event listeners
     */
    public removeAllEventListeners<K extends keyof StormLibraryEvent>(): void {

        this._logger.success(this, "Removing all listeners!");
        let counter = 0;

        for (const eventName in this._listeners) {
            const typedEventName = eventName as K;
            const branch = this._listeners[typedEventName];
            if (branch && branch.length > 0) {
                for (let i = branch.length - 1; i >= 0; i--) {
                    const element = branch[i];
                    if (element[2] === true) {
                        branch.splice(i, 1);
                        counter++;
                    }
                }
            }
        }

    }

    /**
     * Method dispatches an event of a given eventName
     * @param eventName
     * @param event
     */
    public dispatchEvent<K extends keyof StormLibraryEvent>(eventName: K, event: StormLibraryEvent[K]): void {

        if(this._isRemoved)
            return;

        let count:number = 0;

        if(this._listeners[eventName] != undefined){
            if((this._listeners[eventName] as StormLibraryListener<K>[]).length > 0){
                for(let i=0; i<(this._listeners[eventName] as StormLibraryListener<K>[]).length; i++){
                    count++;
                    let element:StormLibraryListener<K> = (this._listeners[eventName] as StormLibraryListener<K>[])[i];
                    (element[1] as Function).call(this, event);
                }
            }
        }

    }

}