export class QualityItem  {

    private _id:number
    private _label:string;
    private _monogram:string;
    private _isSelected:boolean = false;
    private _isAuto:boolean = false;

    public constructor(id:number, label:string, monogram:string){
        this._id = id;
        this._label = label;
        this._monogram = monogram;
    }

    public get isSelected():boolean {
        return this._isSelected;
    }

    public set isSelected(newValue:boolean){
        this._isSelected = newValue
    }

    public get label():string {
        return this._label;
    }

    public set label(newValue:string){
        this._label = newValue;
    }

    public get id():number {
        return this._id;
    }

    public get monogram():string {
        return this._monogram;
    }

    public set monogram(newValue:string){
        this._monogram = newValue;
    }

    public get isAuto():boolean {
        return this._isAuto;
    }

    public set isAuto(newValue:boolean){
        this._isAuto = true;
    }



}