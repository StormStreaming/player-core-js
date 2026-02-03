export class ClientUser {

    private bandwidthCapabilities:number = 0;

    constructor() {
    }

    public setBandwidthCapabilities(newCapabilities:number){
        this.bandwidthCapabilities = newCapabilities;
    }

    public getBandwidthCapabilities():number {
        return this.bandwidthCapabilities;
    }

}