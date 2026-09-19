#!/usr/bin/env node
/* Screenshot pages from a running server. Headless Chromium here has no direct
   egress, so Google Fonts requests are fulfilled through curl — otherwise every
   shot falls back to a system sans and the type looks nothing like the site.
   Usage: node tools/shoot.js <baseUrl> <outDir> <name:path:width> ... */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const base = process.argv[2] || "http://127.0.0.1:4321";
const outDir = process.argv[3] || "/tmp/shots";
const shots = process.argv.slice(4);

function curlBuf(url, type) {
  const args = ["-sSL", "--max-time", "40", "-A", UA];
  if (type === "css") args.push("-H", "Accept: text/css,*/*;q=0.1");
  args.push(url);
  return execFileSync("curl", args, { encoding: "buffer", maxBuffer: 32 * 1024 * 1024 });
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => {
    const url = route.request().url();
    const isCss = url.includes("googleapis");
    try {
      const body = curlBuf(url, isCss ? "css" : "font");
      await route.fulfill({ status: 200, contentType: isCss ? "text/css" : "font/woff2", body });
    } catch (e) {
      await route.abort();
    }
  });

  for (const spec of shots) {
    const [name, p, w, full] = spec.split(":");
    const page = await ctx.newPage();
    await page.setViewportSize({ width: +w || 1280, height: 950 });
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const faces = await page.evaluate(() => [...document.fonts].length);
    console.log(name.padEnd(22) + p.padEnd(32) + (w + "px").padEnd(8) + "overflow " + over + "px, " + faces + " font face(s)");
    await page.screenshot({ path: path.join(outDir, name + ".png"), fullPage: full === "full" });
    await page.close();
  }
  await browser.close();
})();
