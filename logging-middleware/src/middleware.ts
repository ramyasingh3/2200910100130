import type { Request, Response, NextFunction } from "express";
import { log, LoggerClient, type LogLevel } from "./logger";

export interface RequestLoggerOptions {
  level?: LogLevel;
  package: string;
  endpoint?: string;
  apiKey?: string;
}

export function requestLogger(options: RequestLoggerOptions) {
  const level = options.level ?? "info";
  const client = options.endpoint
    ? new LoggerClient({ endpoint: options.endpoint, apiKey: options.apiKey })
    : undefined;

  return async function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const end = () => Date.now() - start;

    res.on("finish", async () => {
      const durationMs = end();
      const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`;
      const payload = {
        message,
        context: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          durationMs,
          ip: req.ip,
          userAgent: req.get("user-agent"),
          requestId: req.headers["x-request-id"],
        },
      } as const;

      if (client) {
        await client.log({ level, package: options.package, ...payload });
      } else {
        await log(undefined, level, options.package, payload);
      }
    });

    next();
  };
}

export function errorLogger(options: { package: string; endpoint?: string; apiKey?: string; level?: LogLevel } ) {
  const level = options.level ?? "error";
  const client = options.endpoint
    ? new LoggerClient({ endpoint: options.endpoint, apiKey: options.apiKey })
    : undefined;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return async function errorLoggerMiddleware(err: unknown, req: Request, res: Response, next: NextFunction) {
    const error = err instanceof Error ? err : new Error(String(err));
    const stack = error.stack ?? String(error);
    const message = error.message;
    const context = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId: req.headers["x-request-id"],
    } as const;

    if (client) {
      await client.log({ stack, level, package: options.package, message, context });
    } else {
      await log(stack, level, options.package, { message, context });
    }

    next(err);
  };
}

