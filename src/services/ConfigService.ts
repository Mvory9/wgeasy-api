import { ClientService } from './ClientService';
import { ILogger } from '../types';
import { Logger } from '../utils/Logger';

export interface ConfigExport {
    clientId: string;
    clientName: string;
    configuration: string;
    qrCode: string;
}

export class ConfigService {
    private readonly clientService: ClientService;
    private readonly logger: ILogger;

    constructor(clientService: ClientService, logger?: ILogger) {
        this.clientService = clientService;
        this.logger = logger || new Logger('ConfigService');
    }

    public async exportClient(id: string): Promise<ConfigExport> {
        this.logger.info('Exporting client configuration', { id });

        const client = await this.clientService.getById(id);
        const [configuration, qrCode] = await Promise.all([
            this.clientService.getConfiguration(id),
            this.clientService.getQrCode(id),
        ]);

        return {
            clientId: client.id,
            clientName: client.name,
            configuration,
            qrCode,
        };
    }

    public async exportAllClients(): Promise<ConfigExport[]> {
        this.logger.info('Exporting all client configurations');

        const clients = await this.clientService.getAll();
        const exports: ConfigExport[] = [];

        for (const client of clients) {
            try {
                const exported = await this.exportClient(client.id);
                exports.push(exported);
            } catch (error) {
                this.logger.warn(`Failed to export client ${client.id}`, { error });
            }
        }

        return exports;
    }

    public generateConfigFile(config: string, clientName: string): { filename: string; content: string } {
        return {
            filename: `${clientName}.conf`,
            content: config,
        };
    }

    public parseConfigFile(content: string): Record<string, Record<string, string>> {
        const result: Record<string, Record<string, string>> = {};
        let currentSection = '';

        const lines = content.split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
                currentSection = trimmedLine.slice(1, -1);
                result[currentSection] = {};
            } else if (trimmedLine.includes('=') && currentSection) {
                const [key, ...valueParts] = trimmedLine.split('=');
                result[currentSection][key.trim()] = valueParts.join('=').trim();
            }
        }

        return result;
    }
}