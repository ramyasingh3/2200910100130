import express from "express";
import { z } from "zod";
import { requestLogger, errorLogger, log } from "../../logging-middleware/dist";
const app = express();
app.use(express.json());
const LOG_ENDPOINT = process.env.LOG_ENDPOINT || "http://20.204.56.144/evaluation-service/logs";
app.use(requestLogger({ package: "controller", endpoint: LOG_ENDPOINT }));
const codeToShort = new Map();
const CreateSchema = z.object({
    url: z.string().url(),
    validity: z.number().int().positive().max(24 * 60).optional(),
    shortcode: z.string().regex(/^[a-z0-9]{4,10}$/).optional(),
});
function generateCode() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < 6; i += 1)
        out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}
app.post("/shorturls", async (req, res) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ message: "invalid input" });
    const { url, validity = 30, shortcode } = parsed.data;
    const code = shortcode ?? (() => {
        let c = generateCode();
        while (codeToShort.has(c))
            c = generateCode();
        return c;
    })();
    if (codeToShort.has(code))
        return res.status(409).json({ message: "shortcode already exists" });
    const now = new Date();
    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + validity * 60000).toISOString();
    codeToShort.set(code, { code, url, createdAt, expiresAt, clicks: [] });
    const shortLink = `${req.protocol}://${req.get("host")}/${code}`;
    await log(undefined, "info", "controller", { message: "short url created", context: { code, url } });
    return res.status(201).json({ shortLink, expiry: expiresAt });
});
app.get("/:code", (req, res) => {
    const code = String(req.params.code || "").toLowerCase();
    const item = codeToShort.get(code);
    if (!item)
        return res.status(404).json({ message: "not found" });
    if (new Date(item.expiresAt).getTime() <= Date.now())
        return res.status(410).json({ message: "link expired" });
    item.clicks.push({ timestamp: new Date().toISOString(), referrer: req.get("referer") || req.get("referrer"), ip: req.ip });
    return res.redirect(302, item.url);
});
app.get("/shorturls/:code/stats", (req, res) => {
    const code = String(req.params.code || "").toLowerCase();
    const item = codeToShort.get(code);
    if (!item)
        return res.status(404).json({ message: "not found" });
    const response = {
        shortCode: code,
        originalUrl: item.url,
        createdAt: item.createdAt,
        expiry: item.expiresAt,
        totalClicks: item.clicks.length,
        clicks: item.clicks.map((c) => ({ timestamp: c.timestamp, referrer: c.referrer, ip: c.ip })),
    };
    return res.json(response);
});
app.use(errorLogger({ package: "controller", endpoint: LOG_ENDPOINT }));
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`url shortener listening on :${PORT}`);
});
