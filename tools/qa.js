#!/usr/bin/env node
/* Phase 5 QA sweep: every sitemap URL, in a real browser, at desktop and
   375px, with and without JavaScript. Checks the things a static audit can't:
   rendered overflow, tables that escape their container, the sticky bar, the
   mobile menu, and whether the copy is actually visible with JS disabled.
   Usage: node tools/qa.js [baseUrl] */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const BASE = process.argv[2] || "http://127.0.0.1:4330";
const ROOT = path.resolve(__dirname, "..");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const urls = [...fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].replace("https://sharpbid.ca", "") || "/");
urls.push("/404");

function fontRoute(ctx) {
  return ctx.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => {
    const url = route.request().url();
    const isCss = url.includes("googleapis");
    try {
      const body = execFileSync("curl", ["-sSL", "--max-time", "40", "-A", UA, ...(isCss ? ["-H", "Accept: text/css,*/*;q=0.1"] : []), url], { encoding: "buffer", maxBuffer: 33554432 });
      await route.fulfill({ status: 200, contentType: isCss ? "text/css" : "font/woff2", body });
    } catch (e) { await route.abort(); }
  });
}

const problems = [];
const rows = [];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  await fontRoute(ctx);
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  await fontRoute(nojs);

  for (const url of urls) {
    const row = { url };

    /* ---- desktop 1280 ---- */
    let page = await ctx.newPage();
    await page.setViewportSize({ width: 1280, height: 950 });
    const consoleErrors = [];
    page.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 120)));
    await page.goto(BASE + url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
    row.d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    /* images without intrinsic size */
    const badImg = await page.evaluate(() =>
      [...document.querySelectorAll("img")].filter((i) => !i.getAttribute("width") || !i.getAttribute("height")).length);
    if (badImg) problems.push(url + ": " + badImg + " <img> without width/height");
    if (consoleErrors.length) problems.push(url + ": JS error — " + consoleErrors[0]);
    await page.close();

    /* ---- mobile 375 ---- */
    page = await ctx.newPage();
    await page.setViewportSize({ width: 375, height: 760 });
    await page.goto(BASE + url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(900);
    row.m = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (row.m > 0) problems.push(url + ": " + row.m + "px horizontal overflow at 375px");

    /* tables must scroll inside a container, not push the page */
    const loose = await page.evaluate(() =>
      [...document.querySelectorAll("table")].filter((t) => {
        const w = t.getBoundingClientRect().width;
        if (w <= document.documentElement.clientWidth) return false;
        let p = t.parentElement;
        while (p) { if (getComputedStyle(p).overflowX === "auto" || getComputedStyle(p).overflowX === "scroll") return false; p = p.parentElement; }
        return true;
      }).length);
    if (loose) problems.push(url + ": " + loose + " wide table(s) not inside a scroll container at 375px");

    /* sticky call/quote bar */
    const bar = await page.evaluate(() => {
      const b = document.querySelector(".sticky-bar");
      if (!b) return "missing";
      const s = getComputedStyle(b);
      return s.display !== "none" && b.querySelectorAll("a").length === 2 ? "ok" : "hidden";
    });
    row.bar = bar;
    if (bar !== "ok") problems.push(url + ": sticky mobile bar " + bar);

    /* mobile menu opens */
    const menu = await page.evaluate(async () => {
      const btn = document.querySelector(".menu-btn");
      const links = document.querySelector(".nav-links");
      if (!btn || !links) return "missing";
      if (getComputedStyle(btn).display === "none") return "btn-hidden";
      btn.click();
      await new Promise((r) => setTimeout(r, 250));
      const open = getComputedStyle(links).display !== "none";
      const exp = btn.getAttribute("aria-expanded");
      return open && exp === "true" ? "ok" : "did-not-open";
    });
    row.menu = menu;
    if (menu !== "ok") problems.push(url + ": mobile menu " + menu);
    await page.close();

    /* ---- JS disabled ---- */
    page = await nojs.newPage();
    await page.setViewportSize({ width: 1280, height: 950 });
    await page.goto(BASE + url, { waitUntil: "load" });
    await page.waitForTimeout(500);
    /* prose only — form UI that is hidden by design (progressive fields, the
       post-submit confirmation) is not page copy and is excluded. */
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll("main *")].filter((e) => {
        if (e.closest("form") || e.closest(".form-ok") || e.closest("details")) return false;
        const s = getComputedStyle(e);
        return (s.opacity === "0" || s.display === "none" || s.visibility === "hidden") && e.textContent.trim().length > 40;
      }).length);
    const words = await page.evaluate(() => (document.querySelector("main") || document.body).innerText.trim().split(/\s+/).length);
    row.nojs = hidden === 0 ? "readable" : hidden + " hidden";
    row.nojsWords = words;
    if (hidden > 0) problems.push(url + ": " + hidden + " text block(s) invisible with JS disabled");
    if (words < 150 && url !== "/404") problems.push(url + ": only " + words + " words render without JS");
    await page.close();

    rows.push(row);
  }

  await browser.close();

  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  console.log(pad("URL", 52) + pad("DESK", 6) + pad("375px", 7) + pad("BAR", 6) + pad("MENU", 7) + pad("NO-JS", 10) + "WORDS(no-js)");
  console.log("-".repeat(104));
  for (const r of rows) console.log(pad(r.url, 52) + pad(r.d + "px", 6) + pad(r.m + "px", 7) + pad(r.bar, 6) + pad(r.menu, 7) + pad(r.nojs, 10) + r.nojsWords);
  console.log("");
  if (problems.length) { console.error("qa: " + problems.length + " problem(s) —\n  " + problems.join("\n  ")); process.exit(1); }
  console.log("qa: " + rows.length + " page(s), all rendered checks pass ✓");
})();
