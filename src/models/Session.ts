import { ISessionData } from '../types';

export class Session {
    private _authenticated: boolean;
    private readonly _requiresPassword: boolean;
    private _authenticatedAt: Date | null;
    private _expiresAt: Date | null;

    constructor(data: ISessionData) {
        this._authenticated = data.authenticated;
        this._requiresPassword = data.requiresPassword;
        this._authenticatedAt = data.authenticated ? new Date() : null;
        this._expiresAt = null;
    }

    public get authenticated(): boolean {
        if (this._expiresAt && new Date() > this._expiresAt) {
            this._authenticated = false;
            this._authenticatedAt = null;
        }
        return this._authenticated;
    }

    public get requiresPassword(): boolean {
        return this._requiresPassword;
    }

    public get authenticatedAt(): Date | null {
        return this._authenticatedAt;
    }

    public get expiresAt(): Date | null {
        return this._expiresAt;
    }

    public setAuthenticated(authenticated: boolean, expiresIn?: number): void {
        this._authenticated = authenticated;
        this._authenticatedAt = authenticated ? new Date() : null;
        this._expiresAt = authenticated && expiresIn
            ? new Date(Date.now() + expiresIn)
            : null;
    }

    public isExpired(): boolean {
        if (!this._expiresAt) return false;
        return new Date() > this._expiresAt;
    }

    public toJSON(): ISessionData & { authenticatedAt: string | null } {
        return {
            authenticated: this.authenticated,
            requiresPassword: this._requiresPassword,
            authenticatedAt: this._authenticatedAt?.toISOString() ?? null,
        };
    }
}