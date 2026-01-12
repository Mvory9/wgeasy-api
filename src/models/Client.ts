import { IClientData, IClientUpdateDTO } from '../types';

export class Client {
    public readonly id: string;
    public readonly name: string;
    public readonly enabled: boolean;
    public readonly address: string;
    public readonly publicKey: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;
    public readonly downloadableConfig: boolean;
    public readonly persistentKeepalive: string;
    public readonly latestHandshakeAt: Date | null;
    public readonly transferRx: number;
    public readonly transferTx: number;

    constructor(data: IClientData) {
        this.id = data.id;
        this.name = data.name;
        this.enabled = data.enabled;
        this.address = data.address;
        this.publicKey = data.publicKey;
        this.createdAt = new Date(data.createdAt);
        this.updatedAt = new Date(data.updatedAt);
        this.downloadableConfig = data.downloadableConfig;
        this.persistentKeepalive = data.persistentKeepalive;
        this.latestHandshakeAt = data.latestHandshakeAt
            ? new Date(data.latestHandshakeAt)
            : null;
        this.transferRx = data.transferRx;
        this.transferTx = data.transferTx;
    }

    public get isOnline(): boolean {
        if (!this.latestHandshakeAt) return false;
        const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
        return this.latestHandshakeAt > threeMinutesAgo;
    }

    public get totalTransfer(): number {
        return this.transferRx + this.transferTx;
    }

    public get transferRxFormatted(): string {
        return Client.formatBytes(this.transferRx);
    }

    public get transferTxFormatted(): string {
        return Client.formatBytes(this.transferTx);
    }

    public get totalTransferFormatted(): string {
        return Client.formatBytes(this.totalTransfer);
    }

    public get age(): number {
        return Date.now() - this.createdAt.getTime();
    }

    public get ageFormatted(): string {
        return Client.formatDuration(this.age);
    }

    public get lastSeenFormatted(): string | null {
        if (!this.latestHandshakeAt) return null;
        const diff = Date.now() - this.latestHandshakeAt.getTime();
        return Client.formatDuration(diff) + ' ago';
    }

    private static formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    private static formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    public toJSON(): IClientData {
        return {
            id: this.id,
            name: this.name,
            enabled: this.enabled,
            address: this.address,
            publicKey: this.publicKey,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString(),
            downloadableConfig: this.downloadableConfig,
            persistentKeepalive: this.persistentKeepalive,
            latestHandshakeAt: this.latestHandshakeAt?.toISOString() ?? null,
            transferRx: this.transferRx,
            transferTx: this.transferTx,
        };
    }

    public clone(updates?: Partial<IClientData>): Client {
        return new Client({
            ...this.toJSON(),
            ...updates,
        });
    }

    public equals(other: Client): boolean {
        return this.id === other.id;
    }

    public toString(): string {
        return `Client(id=${this.id}, name=${this.name}, enabled=${this.enabled}, online=${this.isOnline})`;
    }
}