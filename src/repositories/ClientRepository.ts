import { Client } from '../models/Client';
import { ClientCollection } from '../models/ClientCollection';
import { HttpClient } from '../utils/HttpClient';
import { IClientData, IClientCreateDTO, ILogger } from '../types';
import { ClientNotFoundException } from '../exceptions/WgEasyExceptions';
import { Logger } from '../utils/Logger';
import { Validator } from '../utils/Validator';
import * as QRCode from 'qrcode';

export class ClientRepository {
    private readonly httpClient: HttpClient;
    private readonly logger: ILogger;
    private cache: ClientCollection | null = null;
    private cacheTimestamp: Date | null = null;
    private readonly cacheTTL: number;

    constructor(httpClient: HttpClient, cacheTTL = 5000, logger?: ILogger) {
        this.httpClient = httpClient;
        this.cacheTTL = cacheTTL;
        this.logger = logger || new Logger('ClientRepository');
    }

    private isCacheValid(): boolean {
        if (!this.cache || !this.cacheTimestamp) return false;
        return Date.now() - this.cacheTimestamp.getTime() < this.cacheTTL;
    }

    private invalidateCache(): void {
        this.cache = null;
        this.cacheTimestamp = null;
    }

    public async findAll(forceRefresh = false): Promise<ClientCollection> {
        if (!forceRefresh && this.isCacheValid()) {
            this.logger.debug('Returning cached clients');
            return this.cache!;
        }

        this.logger.debug('Fetching all clients');
        const response = await this.httpClient.get<IClientData[]>('/api/wireguard/client');

        if (response.success && response.data) {
            this.cache = ClientCollection.fromRawData(response.data);
            this.cacheTimestamp = new Date();
            return this.cache;
        }

        return new ClientCollection();
    }

    public async findById(id: string): Promise<Client> {
        Validator.validateId(id);

        const clients = await this.findAll();
        const client = clients.get(id);

        if (!client) {
            throw new ClientNotFoundException(id);
        }

        return client;
    }

    public async findByName(name: string): Promise<Client | null> {
        const clients = await this.findAll();
        return clients.findByName(name) ?? null;
    }

    public async create(dto: IClientCreateDTO): Promise<Client> {
        Validator.validateClientCreateDTO(dto);

        this.logger.info('Creating new client', { name: dto.name });

        const response = await this.httpClient.post<IClientData>(
            '/api/wireguard/client',
            { name: dto.name }
        );

        this.invalidateCache();

        if (!response.success) {
            throw new Error('Failed to create client');
        }

        // API возвращает только { success: true }, поэтому ищем клиента по имени
        // с конца массива, чтобы получить последний созданный клиент
        const clients = await this.findAll(true);
        const clientsArray = clients.toArray();
        const client = clientsArray
            .slice()
            .reverse()
            .find(c => c.name.toLowerCase() === dto.name.toLowerCase());

        if (!client) {
            throw new Error(`Failed to find created client with name: ${dto.name}`);
        }

        return client;
    }

    public async delete(id: string): Promise<void> {
        Validator.validateId(id);

        this.logger.info('Deleting client', { id });

        await this.httpClient.delete(`/api/wireguard/client/${id}`);
        this.invalidateCache();
    }

    public async updateName(id: string, name: string): Promise<Client> {
        Validator.validateId(id);
        Validator.validateClientName(name);

        this.logger.info('Updating client name', { id, name });

        const response = await this.httpClient.put<IClientData>(
            `/api/wireguard/client/${id}/name`,
            { name }
        );

        this.invalidateCache();

        if (response.success && response.data) {
            return new Client(response.data);
        }

        return this.findById(id);
    }

    public async updateAddress(id: string, address: string): Promise<Client> {
        Validator.validateId(id);
        Validator.validateIPAddress(address);

        this.logger.info('Updating client address', { id, address });

        const response = await this.httpClient.put<IClientData>(
            `/api/wireguard/client/${id}/address`,
            { address }
        );

        this.invalidateCache();

        if (response.success && response.data) {
            return new Client(response.data);
        }

        return this.findById(id);
    }

    public async enable(id: string): Promise<Client> {
        Validator.validateId(id);

        this.logger.info('Enabling client', { id });

        const response = await this.httpClient.post<IClientData>(
            `/api/wireguard/client/${id}/enable`
        );

        this.invalidateCache();

        if (response.success && response.data) {
            return new Client(response.data);
        }

        return this.findById(id);
    }

    public async disable(id: string): Promise<Client> {
        Validator.validateId(id);

        this.logger.info('Disabling client', { id });

        const response = await this.httpClient.post<IClientData>(
            `/api/wireguard/client/${id}/disable`
        );

        this.invalidateCache();

        if (response.success && response.data) {
            return new Client(response.data);
        }

        return this.findById(id);
    }

    public async getConfiguration(id: string): Promise<string> {
        Validator.validateId(id);

        this.logger.debug('Getting client configuration', { id });

        const response = await this.httpClient.get<string>(
            `/api/wireguard/client/${id}/configuration`
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error('Failed to get configuration');
    }

    public async getQrCode(id: string): Promise<string> {
        Validator.validateId(id);

        this.logger.debug('Generating client QR code from configuration', { id });

        // Получаем конфигурацию клиента
        const configuration = await this.getConfiguration(id);

        // Генерируем QR-код в формате SVG из конфигурации
        try {
            const qrCodeSvg = await QRCode.toString(configuration, {
                type: 'svg',
                errorCorrectionLevel: 'M',
                margin: 1,
            });

            return qrCodeSvg;
        } catch (error) {
            this.logger.error('Failed to generate QR code', { id, error });
            throw new Error('Failed to generate QR code');
        }
    }

    public async exists(id: string): Promise<boolean> {
        try {
            await this.findById(id);
            return true;
        } catch {
            return false;
        }
    }

    public async count(): Promise<number> {
        const clients = await this.findAll();
        return clients.size;
    }
}