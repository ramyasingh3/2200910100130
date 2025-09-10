import type { Request, Response, NextFunction } from "express";
import { type LogLevel } from "./logger";
export interface RequestLoggerOptions {
    level?: LogLevel;
    package: string;
    endpoint?: string;
    apiKey?: string;
}
export declare function requestLogger(options: RequestLoggerOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function errorLogger(options: {
    package: string;
    endpoint?: string;
    apiKey?: string;
    level?: LogLevel;
}): (err: unknown, req: Request, res: Response, next: NextFunction) => Promise<void>;
