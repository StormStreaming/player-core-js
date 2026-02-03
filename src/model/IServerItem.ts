/**
 * Interface for source item
 */
export interface IServerItem {

    getHost(): string;
    getApplication():string;
    getPort(): number;
    getIfSSL(): boolean;
    getIfFaild(): boolean;
    setAsFaild(value: boolean): void;
    toString(): string;

}