/**
 * Simple cooldown mechanism
 */
export class CooldownMonitor {
    private cooldownDuration: number;
    private lastCooldownTime: number = 0;

    /**
     * Constructs a new instance of CooldownMonitor.
     * @param cooldownDuration The cooldown duration in seconds.
     */
    constructor(cooldownDuration: number = 30) {
        this.cooldownDuration = cooldownDuration;
    }

    /**
     * Triggers the cooldown, setting the last cooldown time to the current timestamp.
     */
    public triggerCooldown(): void {
        this.lastCooldownTime = new Date().getTime();
    }

    public setCooldownDuration(newTime:number){
        this.cooldownDuration = newTime;
    }

    /**
     * Checks if the cooldown is still in effect.
     * @returns true if within cooldown period, otherwise false.
     */
    public isCooling(): boolean {
        const nowTime: number = new Date().getTime();
        return (this.lastCooldownTime + (this.cooldownDuration * 1000)) > nowTime;
    }

    /**
     * Resets the cooldown by setting the last cooldown time to zero.
     */
    public reset(): void {
        this.lastCooldownTime = 0;
    }
}