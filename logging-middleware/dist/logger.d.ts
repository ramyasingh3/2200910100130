export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogPayload {
    stack?: string;
    level: LogLevel;
    package: string;
    message?: string;
    context?: Record<string, unknown>;
    timestamp?: string;
}
export interface LoggerConfig {
    endpoint: string;
    apiKey?: string;
    timeoutMs?: number;
    maxRetries?: number;
    backoffMs?: number;
}
export declare class LoggerClient {
    private readonly endpoint;
    private readonly apiKey?;
    private readonly timeoutMs;
    private readonly maxRetries;
    private readonly backoffMs;
    constructor(config: LoggerConfig);
    log(payload: LogPayload): Promise<void>;
}
export declare function log(stack: string | undefined, level: LogLevel, pkg: string, extra?: Omit<LogPayload, "stack" | "level" | "package">): Promise<void>;
