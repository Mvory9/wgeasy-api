import { Client } from './Client';
import { IClientData, IClientFilter, IPaginationOptions, IPaginatedResult } from '../types';

export class ClientCollection implements Iterable<Client> {
    private readonly clients: Map<string, Client>;

    constructor(clients: Client[] = []) {
        this.clients = new Map(clients.map(c => [c.id, c]));
    }

    public static fromRawData(data: IClientData[]): ClientCollection {
        return new ClientCollection(data.map(d => new Client(d)));
    }

    public get size(): number {
        return this.clients.size;
    }

    public get isEmpty(): boolean {
        return this.size === 0;
    }

    public [Symbol.iterator](): Iterator<Client> {
        return this.clients.values();
    }

    public toArray(): Client[] {
        return Array.from(this.clients.values());
    }

    public get(id: string): Client | undefined {
        return this.clients.get(id);
    }

    public has(id: string): boolean {
        return this.clients.has(id);
    }

    public add(client: Client): ClientCollection {
        const newClients = new Map(this.clients);
        newClients.set(client.id, client);
        return new ClientCollection(Array.from(newClients.values()));
    }

    public remove(id: string): ClientCollection {
        const newClients = new Map(this.clients);
        newClients.delete(id);
        return new ClientCollection(Array.from(newClients.values()));
    }

    public update(id: string, updates: Partial<IClientData>): ClientCollection {
        const client = this.clients.get(id);
        if (!client) return this;

        const updatedClient = client.clone(updates);
        return this.add(updatedClient);
    }

    public filter(predicate: (client: Client) => boolean): ClientCollection {
        return new ClientCollection(this.toArray().filter(predicate));
    }

    public filterBy(filters: IClientFilter): ClientCollection {
        return this.filter(client => {
            if (filters.enabled !== undefined && client.enabled !== filters.enabled) {
                return false;
            }
            if (filters.nameContains && !client.name.toLowerCase().includes(filters.nameContains.toLowerCase())) {
                return false;
            }
            if (filters.createdAfter && client.createdAt < filters.createdAfter) {
                return false;
            }
            if (filters.createdBefore && client.createdAt > filters.createdBefore) {
                return false;
            }
            if (filters.hasRecentHandshake !== undefined) {
                const hasRecent = client.isOnline;
                if (filters.hasRecentHandshake !== hasRecent) {
                    return false;
                }
            }
            if (filters.minTransferRx !== undefined && client.transferRx < filters.minTransferRx) {
                return false;
            }
            if (filters.minTransferTx !== undefined && client.transferTx < filters.minTransferTx) {
                return false;
            }
            return true;
        });
    }

    public sort(compareFn: (a: Client, b: Client) => number): ClientCollection {
        return new ClientCollection([...this.toArray()].sort(compareFn));
    }

    public sortByName(ascending = true): ClientCollection {
        return this.sort((a, b) => {
            const result = a.name.localeCompare(b.name);
            return ascending ? result : -result;
        });
    }

    public sortByCreatedAt(ascending = true): ClientCollection {
        return this.sort((a, b) => {
            const result = a.createdAt.getTime() - b.createdAt.getTime();
            return ascending ? result : -result;
        });
    }

    public sortByTransfer(ascending = false): ClientCollection {
        return this.sort((a, b) => {
            const result = a.totalTransfer - b.totalTransfer;
            return ascending ? result : -result;
        });
    }

    public paginate(options: IPaginationOptions): IPaginatedResult<Client> {
        const { page, limit } = options;
        const total = this.size;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const items = this.toArray().slice(offset, offset + limit);

        return {
            items,
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };
    }

    public getEnabled(): ClientCollection {
        return this.filter(c => c.enabled);
    }

    public getDisabled(): ClientCollection {
        return this.filter(c => !c.enabled);
    }

    public getOnline(): ClientCollection {
        return this.filter(c => c.isOnline);
    }

    public getOffline(): ClientCollection {
        return this.filter(c => !c.isOnline);
    }

    public findByName(name: string): Client | undefined {
        return this.toArray().find(c => c.name.toLowerCase() === name.toLowerCase());
    }

    public search(query: string): ClientCollection {
        const lowerQuery = query.toLowerCase();
        return this.filter(
            c =>
                c.name.toLowerCase().includes(lowerQuery) ||
                c.address.includes(query) ||
                c.publicKey.includes(query)
        );
    }

    public getStatistics() {
        const clients = this.toArray();
        return {
            total: this.size,
            enabled: clients.filter(c => c.enabled).length,
            disabled: clients.filter(c => !c.enabled).length,
            online: clients.filter(c => c.isOnline).length,
            offline: clients.filter(c => !c.isOnline).length,
            totalTransferRx: clients.reduce((sum, c) => sum + c.transferRx, 0),
            totalTransferTx: clients.reduce((sum, c) => sum + c.transferTx, 0),
        };
    }
}