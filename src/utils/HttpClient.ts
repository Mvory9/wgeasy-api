import { IHttpOptions, IApiResponse, ILogger } from '../types';
import {
    NetworkException,
    TimeoutException,
    ServerException,
    UnauthorizedException,
    RateLimitException,
} from '../exceptions/WgEasyExceptions';
import { Logger } from './Logger';

export class HttpClient {
    private readonly baseUrl: string;
    private readonly timeout: number;
    private readonly logger: ILogger;
    private cookies: Map<string, string> = new Map();
    private readonly retryAttempts: number;
    private readonly retryDelay: number;

    constructor(
        baseUrl: string,
        timeout = 30000,
        retryAttempts = 3,
        retryDelay = 1000,
        logger?: ILogger
    ) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.timeout = timeout;
        this.retryAttempts = retryAttempts;
        this.retryDelay = retryDelay;
        this.logger = logger || new Logger('HttpClient');
    }

    private buildHeaders(customHeaders?: Record<string, string>): HeadersInit {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...customHeaders,
        };

        if (this.cookies.size > 0) {
            headers['Cookie'] = Array.from(this.cookies.entries())
                .map(([key, value]) => `${key}=${value}`)
                .join('; ');
        }

        return headers;
    }

    private parseCookies(setCookieHeader: string | null): void {
        if (!setCookieHeader) return;

        const cookies = setCookieHeader.split(',');
        for (const cookie of cookies) {
            const [cookiePair] = cookie.split(';');
            const [name, value] = cookiePair.trim().split('=');
            if (name && value) {
                this.cookies.set(name, value);
            }
        }
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public async request<T>(options: IHttpOptions): Promise<IApiResponse<T>> {
        const url = `${this.baseUrl}${options.path}`;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                this.logger.debug(`Request attempt ${attempt}/${this.retryAttempts}`, {
                    method: options.method,
                    url,
                });

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                const response = await fetch(url, {
                    method: options.method,
                    headers: this.buildHeaders(options.headers),
                    body: options.body ? JSON.stringify(options.body) : undefined,
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                // Parse cookies from response
                this.parseCookies(response.headers.get('set-cookie'));

                // Handle different status codes
                if (response.status === 401) {
                    throw new UnauthorizedException();
                }

                if (response.status === 429) {
                    const retryAfter = parseInt(response.headers.get('retry-after') || '60');
                    throw new RateLimitException(retryAfter);
                }

                if (response.status >= 500) {
                    throw new ServerException(`Server error: ${response.statusText}`, response.status);
                }

                let data: T | undefined;
                const contentType = response.headers.get('content-type');

                if (contentType?.includes('application/json')) {
                    const text = await response.text();
                    if (text) {
                        data = JSON.parse(text);
                    }
                } else if (contentType?.includes('text/plain')) {
                    data = await response.text() as unknown as T;
                }

                return {
                    success: response.ok,
                    data,
                    statusCode: response.status,
                };
            } catch (error) {
                lastError = error as Error;

                if (error instanceof UnauthorizedException || error instanceof RateLimitException) {
                    throw error;
                }

                if ((error as Error).name === 'AbortError') {
                    throw new TimeoutException(this.timeout);
                }

                this.logger.warn(`Request attempt ${attempt} failed`, { error: (error as Error).message });

                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }

        throw new NetworkException(
            `Request failed after ${this.retryAttempts} attempts`,
            lastError || undefined
        );
    }

    public async get<T>(path: string, headers?: Record<string, string>): Promise<IApiResponse<T>> {
        return this.request<T>({ method: 'GET', path, headers });
    }

    public async post<T>(
        path: string,
        body?: unknown,
        headers?: Record<string, string>
    ): Promise<IApiResponse<T>> {
        return this.request<T>({ method: 'POST', path, body, headers });
    }

    public async put<T>(
        path: string,
        body?: unknown,
        headers?: Record<string, string>
    ): Promise<IApiResponse<T>> {
        return this.request<T>({ method: 'PUT', path, body, headers });
    }

    public async delete<T>(path: string, headers?: Record<string, string>): Promise<IApiResponse<T>> {
        return this.request<T>({ method: 'DELETE', path, headers });
    }

    public clearCookies(): void {
        this.cookies.clear();
    }

    public getCookies(): Map<string, string> {
        return new Map(this.cookies);
    }
}