const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
(async () => {
  const outDir = `${process.cwd()}/../docs/frontend`;
  fs.mkdirSync(outDir, { recursive: true });
  await new Promise((res, rej) => {
    const p = spawn("npm", ["run", "build"], { stdio: "inherit" });
    p.on("exit", (code) => (code === 0 ? res() : rej(new Error("build failed"))));
  });
  const preview = spawn("npm", ["run", "preview", "--", "--host", "--port", "4173"], { stdio: "inherit" });
  const base = "http://localhost:4173";
  await new Promise((res) => {
    const start = Date.now();
    (function poll() {
      http.get(base, () => res()).on("error", () => {
        if (Date.now() - start > 15000) res(); else setTimeout(poll, 300);
      });
    })();
  });
  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  async function snap(path, width, height, route) {
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.goto(base + route, { waitUntil: "networkidle2" });
    await page.screenshot({ path });
  }
  await snap(`${outDir}/shorten-desktop.png`, 1366, 900, "/");
  await snap(`${outDir}/stats-desktop.png`, 1366, 900, "/stats");
  await snap(`${outDir}/shorten-mobile.png`, 390, 844, "/");
  await snap(`${outDir}/stats-mobile.png`, 390, 844, "/stats");
  await browser.close();
  preview.kill("SIGINT");
  console.log("Saved screenshots to", outDir);
})();
