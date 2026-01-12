export interface IWgEasyConfig {
    baseUrl: string;
    password?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}

export interface IClientData {
    id: string;
    name: string;
    enabled: boolean;
    address: string;
    publicKey: string;
    createdAt: string;
    updatedAt: string;
    downloadableConfig: boolean;
    persistentKeepalive: string;
    latestHandshakeAt: string | null;
    transferRx: number;
    transferTx: number;
}

export interface IClientCreateDTO {
    name: string;
}

export interface IClientUpdateDTO {
    name?: string;
    enabled?: boolean;
    address?: string;
}

export interface IServerStatus {
    isRunning: boolean;
    interfaceName: string;
    publicKey: string;
    address: string;
    listenPort: number;
    clients: number;
    totalTransferRx: number;
    totalTransferTx: number;
}

export interface ISessionData {
    authenticated: boolean;
    requiresPassword: boolean;
}

export interface IApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode: number;
}

export interface IHttpOptions {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
}

export interface ILogger {
    debug(message: string, meta?: unknown): void;
    info(message: string, meta?: unknown): void;
    warn(message: string, meta?: unknown): void;
    error(message: string, meta?: unknown): void;
}

export type EventType =
    | 'client:created'
    | 'client:deleted'
    | 'client:updated'
    | 'client:enabled'
    | 'client:disabled'
    | 'auth:login'
    | 'auth:logout'
    | 'error';

export type EventHandler<T = unknown> = (data: T) => void;

export interface IEventEmitter {
    on<T>(event: EventType, handler: EventHandler<T>): void;
    off<T>(event: EventType, handler: EventHandler<T>): void;
    emit<T>(event: EventType, data: T): void;
}

export interface IClientFilter {
    enabled?: boolean;
    nameContains?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    hasRecentHandshake?: boolean;
    minTransferRx?: number;
    minTransferTx?: number;
}

export interface IPaginationOptions {
    page: number;
    limit: number;
}

export interface IPaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}