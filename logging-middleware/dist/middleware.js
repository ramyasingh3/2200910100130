import { log, LoggerClient } from "./logger";
export function requestLogger(options) {
    const level = options.level ?? "info";
    const client = options.endpoint
        ? new LoggerClient({ endpoint: options.endpoint, apiKey: options.apiKey })
        : undefined;
    return async function requestLoggerMiddleware(req, res, next) {
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
            };
            if (client) {
                await client.log({ level, package: options.package, ...payload });
            }
            else {
                await log(undefined, level, options.package, payload);
            }
        });
        next();
    };
}
export function errorLogger(options) {
    const level = options.level ?? "error";
    const client = options.endpoint
        ? new LoggerClient({ endpoint: options.endpoint, apiKey: options.apiKey })
        : undefined;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return async function errorLoggerMiddleware(err, req, res, next) {
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
        };
        if (client) {
            await client.log({ stack, level, package: options.package, message, context });
        }
        else {
            await log(stack, level, options.package, { message, context });
        }
        next(err);
    };
}
