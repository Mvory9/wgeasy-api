import { Config } from '../config/Config';
import { HttpClient } from '../utils/HttpClient';
import { Logger, LogLevel } from '../utils/Logger';
import { EventEmitter } from '../utils/EventEmitter';
import { AuthService } from '../services/AuthService';
import { ClientService } from '../services/ClientService';
import { ConfigService } from '../services/ConfigService';
import { ClientRepository } from '../repositories/ClientRepository';
import { Client } from '../models/Client';
import { ClientCollection } from '../models/ClientCollection';
import { Session } from '../models/Session';
import { IWgEasyConfig, IClientCreateDTO, IClientFilter, IPaginationOptions, EventType, EventHandler, ILogger } from '../types';

export interface WgEasyClientOptions extends IWgEasyConfig {
    logLevel?: LogLevel;
    cacheTTL?: number;
}

export class WgEasyClient {
    private readonly config: Config;
    private readonly httpClient: HttpClient;
    private readonly logger: Logger;
    private readonly eventEmitter: EventEmitter;

    // Services
    public readonly auth: AuthService;
    public readonly clients: ClientService;
    public readonly configs: ConfigService;

    // Internal
    private readonly clientRepository: ClientRepository;
    private initialized = false;

    constructor(options: WgEasyClientOptions) {
        this.config = new Config(options);
        this.logger = new Logger('WgEasy', options.logLevel ?? LogLevel.INFO);
        this.eventEmitter = new EventEmitter();

        this.httpClient = new HttpClient(
            this.config.baseUrl,
            this.config.timeout,
            this.config.retryAttempts,
            this.config.retryDelay,
            this.logger.child('Http')
        );

        // Initialize services
        this.auth = new AuthService(
            this.httpClient,
            this.config.password,
            this.eventEmitter,
            this.logger.child('Auth')
        );

        this.clientRepository = new ClientRepository(
            this.httpClient,
            options.cacheTTL ?? 5000,
            this.logger.child('Repository')
        );

        this.clients = new ClientService(
            this.clientRepository,
            this.auth,
            this.eventEmitter,
            this.logger.child('Clients')
        );

        this.configs = new ConfigService(
            this.clients,
            this.logger.child('Config')
        );
    }

    // ============ Quick Access Methods ============

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        this.logger.info('Initializing WgEasy client');
        await this.auth.ensureAuthenticated();
        this.initialized = true;
        this.logger.info('WgEasy client initialized');
    }

    public async login(password?: string): Promise<Session> {
        return this.auth.login(password);
    }

    public async logout(): Promise<void> {
        return this.auth.logout();
    }

    // ============ Client Quick Methods ============

    public async getClients(): Promise<ClientCollection> {
        return this.clients.getAll();
    }

    public async getClient(id: string): Promise<Client> {
        return this.clients.getById(id);
    }

    public async createClient(name: string): Promise<Client> {
        return this.clients.create({ name });
    }

    public async deleteClient(id: string): Promise<void> {
        return this.clients.delete(id);
    }

    public async enableClient(id: string): Promise<Client> {
        return this.clients.enable(id);
    }

    public async disableClient(id: string): Promise<Client> {
        return this.clients.disable(id);
    }

    public async getClientConfig(id: string): Promise<string> {
        return this.clients.getConfiguration(id);
    }

    public async getClientQrCode(id: string): Promise<string> {
        return this.clients.getQrCode(id);
    }

    // ============ Event Methods ============

    public on<T>(event: EventType, handler: EventHandler<T>): this {
        this.eventEmitter.on(event, handler);
        return this;
    }

    public off<T>(event: EventType, handler: EventHandler<T>): this {
        this.eventEmitter.off(event, handler);
        return this;
    }

    public once<T>(event: EventType, handler: EventHandler<T>): this {
        this.eventEmitter.once(event, handler);
        return this;
    }

    // ============ Utility Methods ============

    public getConfig(): IWgEasyConfig {
        return this.config.toJSON();
    }

    public isInitialized(): boolean {
        return this.initialized;
    }

    public isAuthenticated(): boolean {
        return this.auth.isAuthenticated();
    }

    // ============ Static Factory Methods ============

    public static create(options: WgEasyClientOptions): WgEasyClient {
        return new WgEasyClient(options);
    }

    public static fromEnv(): WgEasyClient {
        const config = Config.fromEnv();
        return new WgEasyClient(config);
    }

    public static async connect(options: WgEasyClientOptions): Promise<WgEasyClient> {
        const client = new WgEasyClient(options);
        await client.initialize();
        return client;
    }
}