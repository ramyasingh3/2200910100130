import axios from "axios";
export class LoggerClient {
    constructor(config) {
        this.endpoint = config.endpoint;
        this.apiKey = config.apiKey;
        this.timeoutMs = config.timeoutMs ?? 4000;
        this.maxRetries = config.maxRetries ?? 2;
        this.backoffMs = config.backoffMs ?? 300;
    }
    async log(payload) {
        const enriched = {
            timestamp: new Date().toISOString(),
            ...payload,
        };
        // Basic validation to match picture constraints
        if (!enriched.package || enriched.package !== enriched.package.toLowerCase())
            return;
        if (!enriched.level || enriched.level !== enriched.level.toLowerCase())
            return;
        const headers = { "Content-Type": "application/json" };
        if (this.apiKey)
            headers["Authorization"] = `Bearer ${this.apiKey}`;
        const request = {
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
            }
            catch (error) {
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
    if (!endpoint)
        return undefined;
    return new LoggerClient({ endpoint, apiKey });
})();
export async function log(stack, level, pkg, extra) {
    const payload = { stack, level, package: pkg, ...extra };
    if (defaultClient) {
        await defaultClient.log(payload);
        return;
    }
    // Fallback to console if not configured
    const label = `[${level.toUpperCase()}][${pkg}]`;
    // eslint-disable-next-line no-console
    console.log(label, payload.message ?? "", { ...payload, message: undefined });
}
