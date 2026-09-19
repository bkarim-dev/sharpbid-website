#!/usr/bin/env node
/* Render assets/og-sharpbid.png (1200x630) on-brand, using the site's own
   fonts and colours. Dev-only: run `npm run og` when the brand changes. */
"use strict";
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const OUT = path.resolve(__dirname, "..", "assets", "og-sharpbid.png");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/* Headless Chromium here has no outbound font access, so inline the two
   webfaces we need (latin subset) as data URIs before rendering. */
function curl(url, binary) {
  const args = ["-sSL", "--max-time", "40", "-A", UA, url];
  return execFileSync("curl", args, { encoding: binary ? "buffer" : "utf8", maxBuffer: 32 * 1024 * 1024 });
}
function face(familyQuery, family, weight) {
  const css = curl("https://fonts.googleapis.com/css2?family=" + familyQuery + "&display=swap");
  const blocks = css.split("/*").filter((b) => b.trim().startsWith("latin */") && b.includes("font-weight: " + weight));
  const url = (blocks[0] || "").match(/url\((https:[^)]+\.woff2)\)/);
  if (!url) throw new Error("no latin woff2 for " + family + " " + weight);
  const b64 = curl(url[1], true).toString("base64");
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
}
const FONTS = [
  face("Big+Shoulders:wght@800", "Big Shoulders", 800),
  face("IBM+Plex+Mono:wght@400;500", "IBM Plex Mono", 400),
  face("IBM+Plex+Mono:wght@400;500", "IBM Plex Mono", 500),
].join("\n");

const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
${FONTS}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#FAFBF9;
    background-image:linear-gradient(#E6EAE3 1px,transparent 1px),linear-gradient(90deg,#E6EAE3 1px,transparent 1px);
    background-size:40px 40px;font-family:"IBM Plex Mono",monospace;color:#16232B;
    display:flex;flex-direction:column;justify-content:space-between;
    border:10px solid #16232B;padding:64px 72px}
  .top{display:flex;align-items:center;gap:18px}
  .code{font-size:20px;letter-spacing:.2em;text-transform:uppercase;color:#46575F}
  .rule{flex:1;height:1px;background:#46575F;opacity:.5}
  .word{font-family:"Big Shoulders","Arial Narrow",sans-serif;font-weight:800;
    font-size:150px;line-height:.92;text-transform:uppercase;letter-spacing:.01em;display:flex;align-items:center}
  .word em{font-style:normal;background:#FFD84D;padding:0 18px;margin-left:14px}
  .tag{font-size:31px;letter-spacing:.02em;color:#16232B;margin-top:26px;line-height:1.45}
  .bar{display:flex;gap:0;margin-top:40px}
  .bar span{flex:1;height:14px}
  .bottom{display:flex;justify-content:space-between;align-items:flex-end;font-size:21px;letter-spacing:.12em;text-transform:uppercase;color:#46575F}
</style></head><body>
  <div class="top"><span class="code">Sheet T-01</span><span class="rule"></span><span class="code">Rev 4.0</span></div>
  <div>
    <div class="word">SHARP<em>BID</em></div>
    <div class="tag">Construction takeoffs for subcontractors · Canada</div>
    <div class="bar">
      <span style="background:#2FA55F"></span><span style="background:#3E8DE3"></span><span style="background:#21A8BC"></span>
      <span style="background:#E0701F"></span><span style="background:#C94B9B"></span><span style="background:#6E5BD0"></span>
      <span style="background:#B4342B"></span><span style="background:#8A6A3B"></span><span style="background:#74838F"></span>
    </div>
  </div>
  <div class="bottom"><span>Fixed quote in 4 business hours</span><span>sharpbid.ca</span></div>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(HTML, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: OUT, type: "png" });
  await browser.close();
  console.log("og: wrote " + OUT);
})();
