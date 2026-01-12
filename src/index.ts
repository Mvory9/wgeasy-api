// Client
export { WgEasyClient } from './client/WgEasyClient';
export type { WgEasyClientOptions } from './client/WgEasyClient';

// Models
export { Client } from './models/Client';
export { ClientCollection } from './models/ClientCollection';
export { Session } from './models/Session';
export { ServerStatus } from './models/ServerStatus';

// Services
export { AuthService } from './services/AuthService';
export { ClientService } from './services/ClientService';
export { ConfigService } from './services/ConfigService';
export type { ConfigExport } from './services/ConfigService';

// Repository
export { ClientRepository } from './repositories/ClientRepository';

// Config
export { Config } from './config/Config';

// Utils
export { HttpClient } from './utils/HttpClient';
export { Logger, LogLevel } from './utils/Logger';
export { EventEmitter } from './utils/EventEmitter';
export { Validator } from './utils/Validator';

// Exceptions
export {
    WgEasyException,
    AuthenticationException,
    UnauthorizedException,
    ClientNotFoundException,
    ClientAlreadyExistsException,
    NetworkException,
    TimeoutException,
    ValidationException,
    ServerException,
    RateLimitException,
    ConfigurationException,
} from './exceptions/WgEasyExceptions';

// Types
export * from './types';