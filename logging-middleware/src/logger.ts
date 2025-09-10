import axios, { AxiosRequestConfig } from "axios";

// constrained by assignment (lowercase values)
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogPayload {
  stack?: string;
  level: LogLevel; // one of debug, info, warn, error
  package: string; // constrained names per assignment
  message?: string;
  context?: Record<string, unknown>;
  timestamp?: string;
}

export interface LoggerConfig {
  endpoint: string; // full URL of the logging server
  apiKey?: string; // optional auth header
  timeoutMs?: number;
  maxRetries?: number;
  backoffMs?: number;
}

export class LoggerClient {
  private readonly endpoint: string;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly backoffMs: number;

  constructor(config: LoggerConfig) {
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 4000;
    this.maxRetries = config.maxRetries ?? 2;
    this.backoffMs = config.backoffMs ?? 300;
  }

  async log(payload: LogPayload): Promise<void> {
    const enriched: LogPayload = {
      timestamp: new Date().toISOString(),
      ...payload,
    };

    // Basic validation to match picture constraints
    if (!enriched.package || enriched.package !== enriched.package.toLowerCase()) return;
    if (!enriched.level || enriched.level !== enriched.level.toLowerCase()) return;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const request: AxiosRequestConfig = {
      url: this.endpoint,
      method: "POST",
      headers,
      timeout: this.timeoutMs,
      data: enriched,
    };

    let attempt = 0;
    // fire-and-forget with retries; swallow errors to not break app flow
    // but rethrow last error for optional awaiting caller
    // Here we choose to swallow to keep middleware robust
    while (true) {
      try {
        await axios(request);
        return;
      } catch (error) {
        if (attempt >= this.maxRetries) {
          // last failure, just exit
          return;
        }
        attempt += 1;
        await new Promise((resolve) => setTimeout(resolve, this.backoffMs * attempt));
      }
    }
  }
}

// Convenience singleton using env vars so users can call log(...) quickly
const defaultClient = (() => {
  const endpoint = process.env.LOG_ENDPOINT || "";
  const apiKey = process.env.LOG_API_KEY || undefined;
  if (!endpoint) return undefined;
  return new LoggerClient({ endpoint, apiKey });
})();

export async function log(stack: string | undefined, level: LogLevel, pkg: string, extra?: Omit<LogPayload, "stack" | "level" | "package">): Promise<void> {
  const payload: LogPayload = { stack, level, package: pkg, ...extra };
  if (defaultClient) {
    await defaultClient.log(payload);
    return;
  }
  // Fallback to console if not configured
  const label = `[${level.toUpperCase()}][${pkg}]`;
  // eslint-disable-next-line no-console
  console.log(label, payload.message ?? "", { ...payload, message: undefined });
}

