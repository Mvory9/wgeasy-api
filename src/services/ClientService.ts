import { Client } from '../models/Client';
import { ClientCollection } from '../models/ClientCollection';
import { ClientRepository } from '../repositories/ClientRepository';
import { AuthService } from './AuthService';
import { EventEmitter } from '../utils/EventEmitter';
import { IClientCreateDTO, IClientFilter, IPaginationOptions, IPaginatedResult, ILogger } from '../types';
import { Logger } from '../utils/Logger';

export class ClientService {
    private readonly repository: ClientRepository;
    private readonly authService: AuthService;
    private readonly eventEmitter: EventEmitter;
    private readonly logger: ILogger;

    constructor(
        repository: ClientRepository,
        authService: AuthService,
        eventEmitter?: EventEmitter,
        logger?: ILogger
    ) {
        this.repository = repository;
        this.authService = authService;
        this.eventEmitter = eventEmitter || new EventEmitter();
        this.logger = logger || new Logger('ClientService');
    }

    private async ensureAuth(): Promise<void> {
        await this.authService.ensureAuthenticated();
    }

    public async getAll(): Promise<ClientCollection> {
        await this.ensureAuth();
        return this.repository.findAll();
    }

    public async getById(id: string): Promise<Client> {
        await this.ensureAuth();
        return this.repository.findById(id);
    }

    public async getByName(name: string): Promise<Client | null> {
        await this.ensureAuth();
        return this.repository.findByName(name);
    }

    public async create(dto: IClientCreateDTO): Promise<Client> {
        await this.ensureAuth();

        const client = await this.repository.create(dto);
        this.eventEmitter.emit('client:created', { client });

        return client;
    }

    public async delete(id: string): Promise<void> {
        await this.ensureAuth();

        const client = await this.repository.findById(id);
        await this.repository.delete(id);
        this.eventEmitter.emit('client:deleted', { client });
    }

    public async deleteByName(name: string): Promise<void> {
        const client = await this.getByName(name);
        if (client) {
            await this.delete(client.id);
        }
    }

    public async enable(id: string): Promise<Client> {
        await this.ensureAuth();

        const client = await this.repository.enable(id);
        this.eventEmitter.emit('client:enabled', { client });

        return client;
    }

    public async disable(id: string): Promise<Client> {
        await this.ensureAuth();

        const client = await this.repository.disable(id);
        this.eventEmitter.emit('client:disabled', { client });

        return client;
    }

    public async toggle(id: string): Promise<Client> {
        const client = await this.getById(id);
        return client.enabled ? this.disable(id) : this.enable(id);
    }

    public async rename(id: string, newName: string): Promise<Client> {
        await this.ensureAuth();

        const client = await this.repository.updateName(id, newName);
        this.eventEmitter.emit('client:updated', { client });

        return client;
    }

    public async updateAddress(id: string, address: string): Promise<Client> {
        await this.ensureAuth();

        const client = await this.repository.updateAddress(id, address);
        this.eventEmitter.emit('client:updated', { client });

        return client;
    }

    public async getConfiguration(id: string): Promise<string> {
        await this.ensureAuth();
        return this.repository.getConfiguration(id);
    }

    public async getQrCode(id: string): Promise<string> {
        await this.ensureAuth();
        return this.repository.getQrCode(id);
    }

    public async filter(filters: IClientFilter): Promise<ClientCollection> {
        const clients = await this.getAll();
        return clients.filterBy(filters);
    }

    public async search(query: string): Promise<ClientCollection> {
        const clients = await this.getAll();
        return clients.search(query);
    }

    public async paginate(options: IPaginationOptions): Promise<IPaginatedResult<Client>> {
        const clients = await this.getAll();
        return clients.paginate(options);
    }

    public async getOnline(): Promise<ClientCollection> {
        const clients = await this.getAll();
        return clients.getOnline();
    }

    public async getOffline(): Promise<ClientCollection> {
        const clients = await this.getAll();
        return clients.getOffline();
    }

    public async getEnabled(): Promise<ClientCollection> {
        const clients = await this.getAll();
        return clients.getEnabled();
    }

    public async getDisabled(): Promise<ClientCollection> {
        const clients = await this.getAll();
        return clients.getDisabled();
    }

    public async getStatistics() {
        const clients = await this.getAll();
        return clients.getStatistics();
    }

    public async count(): Promise<number> {
        return this.repository.count();
    }

    public async exists(id: string): Promise<boolean> {
        return this.repository.exists(id);
    }

    public async bulkCreate(names: string[]): Promise<Client[]> {
        const results: Client[] = [];

        for (const name of names) {
            const client = await this.create({ name });
            results.push(client);
        }

        return results;
    }

    public async bulkDelete(ids: string[]): Promise<void> {
        for (const id of ids) {
            await this.delete(id);
        }
    }

    public async bulkEnable(ids: string[]): Promise<Client[]> {
        const results: Client[] = [];

        for (const id of ids) {
            const client = await this.enable(id);
            results.push(client);
        }

        return results;
    }

    public async bulkDisable(ids: string[]): Promise<Client[]> {
        const results: Client[] = [];

        for (const id of ids) {
            const client = await this.disable(id);
            results.push(client);
        }

        return results;
    }
}