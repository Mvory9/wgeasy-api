import { HttpClient } from '../utils/HttpClient';
import { Session } from '../models/Session';
import { ISessionData, ILogger } from '../types';
import { AuthenticationException } from '../exceptions/WgEasyExceptions';
import { Logger } from '../utils/Logger';
import { EventEmitter } from '../utils/EventEmitter';

export class AuthService {
    private readonly httpClient: HttpClient;
    private readonly logger: ILogger;
    private readonly eventEmitter: EventEmitter;
    private session: Session | null = null;
    private readonly password?: string;

    constructor(
        httpClient: HttpClient,
        password?: string,
        eventEmitter?: EventEmitter,
        logger?: ILogger
    ) {
        this.httpClient = httpClient;
        this.password = password;
        this.eventEmitter = eventEmitter || new EventEmitter();
        this.logger = logger || new Logger('AuthService');
    }

    public async getSession(): Promise<Session> {
        if (this.session && this.session.authenticated && !this.session.isExpired()) {
            return this.session;
        }

        this.logger.debug('Checking session status');

        const response = await this.httpClient.get<ISessionData>('/api/session');

        if (response.success && response.data) {
            this.session = new Session(response.data);
            return this.session;
        }

        this.session = new Session({
            authenticated: false,
            requiresPassword: true,
        });

        return this.session;
    }

    public async login(password?: string): Promise<Session> {
        const passwordToUse = password || this.password;

        if (!passwordToUse) {
            throw new AuthenticationException('Password is required');
        }

        this.logger.info('Attempting login');

        const response = await this.httpClient.post<ISessionData>('/api/session', {
            password: passwordToUse,
        });

        if (response.success) {
            this.session = new Session({
                authenticated: true,
                requiresPassword: true,
            });
            this.eventEmitter.emit('auth:login', { session: this.session });
            this.logger.info('Login successful');
            return this.session;
        }

        throw new AuthenticationException('Invalid password');
    }

    public async logout(): Promise<void> {
        this.logger.info('Logging out');

        await this.httpClient.delete('/api/session');
        this.httpClient.clearCookies();
        this.session = null;
        this.eventEmitter.emit('auth:logout', {});
        this.logger.info('Logout successful');
    }

    public async ensureAuthenticated(): Promise<void> {
        const session = await this.getSession();

        if (!session.authenticated) {
            if (this.password) {
                await this.login(this.password);
            } else {
                throw new AuthenticationException('Not authenticated and no password provided');
            }
        }
    }

    public isAuthenticated(): boolean {
        return this.session?.authenticated ?? false;
    }

    public getSessionInfo(): Session | null {
        return this.session;
    }
}