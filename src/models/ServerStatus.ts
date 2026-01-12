import { IServerStatus } from '../types';

export class ServerStatus {
    public readonly isRunning: boolean;
    public readonly interfaceName: string;
    public readonly publicKey: string;
    public readonly address: string;
    public readonly listenPort: number;
    public readonly clients: number;
    public readonly totalTransferRx: number;
    public readonly totalTransferTx: number;
    private readonly _timestamp: Date;

    constructor(data: IServerStatus) {
        this.isRunning = data.isRunning;
        this.interfaceName = data.interfaceName;
        this.publicKey = data.publicKey;
        this.address = data.address;
        this.listenPort = data.listenPort;
        this.clients = data.clients;
        this.totalTransferRx = data.totalTransferRx;
        this.totalTransferTx = data.totalTransferTx;
        this._timestamp = new Date();
    }

    public get timestamp(): Date {
        return this._timestamp;
    }

    public get totalTransfer(): number {
        return this.totalTransferRx + this.totalTransferTx;
    }

    public toJSON(): IServerStatus & { timestamp: string } {
        return {
            isRunning: this.isRunning,
            interfaceName: this.interfaceName,
            publicKey: this.publicKey,
            address: this.address,
            listenPort: this.listenPort,
            clients: this.clients,
            totalTransferRx: this.totalTransferRx,
            totalTransferTx: this.totalTransferTx,
            timestamp: this._timestamp.toISOString(),
        };
    }
}