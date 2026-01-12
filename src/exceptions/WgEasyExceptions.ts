export abstract class WgEasyException extends Error {
    public readonly timestamp: Date;
    public readonly code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.timestamp = new Date();
        Error.captureStackTrace(this, this.constructor);
    }

    public toJSON(): object {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            timestamp: this.timestamp.toISOString(),
            stack: this.stack,
        };
    }
}

export class AuthenticationException extends WgEasyException {
    constructor(message = 'Authentication failed') {
        super(message, 'AUTH_FAILED');
    }
}

export class UnauthorizedException extends WgEasyException {
    constructor(message = 'Unauthorized access') {
        super(message, 'UNAUTHORIZED');
    }
}

export class ClientNotFoundException extends WgEasyException {
    public readonly clientId: string;

    constructor(clientId: string) {
        super(`Client with ID '${clientId}' not found`, 'CLIENT_NOT_FOUND');
        this.clientId = clientId;
    }
}

export class ClientAlreadyExistsException extends WgEasyException {
    public readonly clientName: string;

    constructor(clientName: string) {
        super(`Client with name '${clientName}' already exists`, 'CLIENT_EXISTS');
        this.clientName = clientName;
    }
}

export class NetworkException extends WgEasyException {
    public readonly originalError?: Error;

    constructor(message: string, originalError?: Error) {
        super(message, 'NETWORK_ERROR');
        this.originalError = originalError;
    }
}

export class TimeoutException extends WgEasyException {
    public readonly timeoutMs: number;

    constructor(timeoutMs: number) {
        super(`Request timed out after ${timeoutMs}ms`, 'TIMEOUT');
        this.timeoutMs = timeoutMs;
    }
}

export class ValidationException extends WgEasyException {
    public readonly field: string;
    public readonly value: unknown;

    constructor(field: string, message: string, value?: unknown) {
        super(`Validation error for '${field}': ${message}`, 'VALIDATION_ERROR');
        this.field = field;
        this.value = value;
    }
}

export class ServerException extends WgEasyException {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message, 'SERVER_ERROR');
        this.statusCode = statusCode;
    }
}

export class RateLimitException extends WgEasyException {
    public readonly retryAfter?: number;

    constructor(retryAfter?: number) {
        super('Rate limit exceeded', 'RATE_LIMITED');
        this.retryAfter = retryAfter;
    }
}

export class ConfigurationException extends WgEasyException {
    constructor(message: string) {
        super(message, 'CONFIG_ERROR');
    }
}