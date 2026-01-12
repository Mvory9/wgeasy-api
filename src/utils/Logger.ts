import { ILogger } from '../types';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    SILENT = 4,
}

export class Logger implements ILogger {
    private readonly prefix: string;
    private readonly level: LogLevel;
    private readonly useColors: boolean;

    private static readonly COLORS = {
        reset: '\x1b[0m',
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
    };

    constructor(
        prefix = 'WgEasy',
        level: LogLevel = LogLevel.INFO,
        useColors = true
    ) {
        this.prefix = prefix;
        this.level = level;
        this.useColors = useColors;
    }

    private formatMessage(level: string, message: string, meta?: unknown): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${this.prefix}] [${level.toUpperCase()}] ${message}${metaStr}`;
    }

    private colorize(color: keyof typeof Logger.COLORS, text: string): string {
        if (!this.useColors) return text;
        return `${Logger.COLORS[color]}${text}${Logger.COLORS.reset}`;
    }

    public debug(message: string, meta?: unknown): void {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(this.colorize('debug', this.formatMessage('debug', message, meta)));
        }
    }

    public info(message: string, meta?: unknown): void {
        if (this.level <= LogLevel.INFO) {
            console.info(this.colorize('info', this.formatMessage('info', message, meta)));
        }
    }

    public warn(message: string, meta?: unknown): void {
        if (this.level <= LogLevel.WARN) {
            console.warn(this.colorize('warn', this.formatMessage('warn', message, meta)));
        }
    }

    public error(message: string, meta?: unknown): void {
        if (this.level <= LogLevel.ERROR) {
            console.error(this.colorize('error', this.formatMessage('error', message, meta)));
        }
    }

    public child(prefix: string): Logger {
        return new Logger(`${this.prefix}:${prefix}`, this.level, this.useColors);
    }
}