import { IWgEasyConfig } from '../types';
import { ConfigurationException } from '../exceptions/WgEasyExceptions';

export class Config implements IWgEasyConfig {
    public readonly baseUrl: string;
    public readonly password?: string;
    public readonly timeout: number;
    public readonly retryAttempts: number;
    public readonly retryDelay: number;

    private static readonly DEFAULT_TIMEOUT = 30000;
    private static readonly DEFAULT_RETRY_ATTEMPTS = 3;
    private static readonly DEFAULT_RETRY_DELAY = 1000;

    constructor(config: IWgEasyConfig) {
        this.validateConfig(config);

        this.baseUrl = this.normalizeUrl(config.baseUrl);
        this.password = config.password;
        this.timeout = config.timeout ?? Config.DEFAULT_TIMEOUT;
        this.retryAttempts = config.retryAttempts ?? Config.DEFAULT_RETRY_ATTEMPTS;
        this.retryDelay = config.retryDelay ?? Config.DEFAULT_RETRY_DELAY;
    }

    private validateConfig(config: IWgEasyConfig): void {
        if (!config.baseUrl) {
            throw new ConfigurationException('baseUrl is required');
        }

        try {
            new URL(config.baseUrl);
        } catch {
            throw new ConfigurationException('Invalid baseUrl format');
        }

        if (config.timeout !== undefined && config.timeout <= 0) {
            throw new ConfigurationException('timeout must be a positive number');
        }

        if (config.retryAttempts !== undefined && config.retryAttempts < 0) {
            throw new ConfigurationException('retryAttempts must be a non-negative number');
        }

        if (config.retryDelay !== undefined && config.retryDelay < 0) {
            throw new ConfigurationException('retryDelay must be a non-negative number');
        }
    }

    private normalizeUrl(url: string): string {
        return url.replace(/\/+$/, '');
    }

    public static fromEnv(): Config {
        const baseUrl = process.env.WGEASY_URL;
        const password = process.env.WGEASY_PASSWORD;
        const timeout = process.env.WGEASY_TIMEOUT
            ? parseInt(process.env.WGEASY_TIMEOUT, 10)
            : undefined;
        const retryAttempts = process.env.WGEASY_RETRY_ATTEMPTS
            ? parseInt(process.env.WGEASY_RETRY_ATTEMPTS, 10)
            : undefined;
        const retryDelay = process.env.WGEASY_RETRY_DELAY
            ? parseInt(process.env.WGEASY_RETRY_DELAY, 10)
            : undefined;

        if (!baseUrl) {
            throw new ConfigurationException('WGEASY_URL environment variable is required');
        }

        return new Config({
            baseUrl,
            password,
            timeout,
            retryAttempts,
            retryDelay,
        });
    }

    public toJSON(): IWgEasyConfig {
        return {
            baseUrl: this.baseUrl,
            password: this.password ? '***' : undefined,
            timeout: this.timeout,
            retryAttempts: this.retryAttempts,
            retryDelay: this.retryDelay,
        };
    }
}