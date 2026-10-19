#!/usr/bin/env node
/* Quote-form check: every page that carries the on-page quote form, in a real
   browser, with Formspree and Google Analytics intercepted so no real lead
   email is sent and no test conversion reaches GA / Google Ads.
   Serves build/ itself (cleanUrls, like Vercel) unless a base URL is given.
   Usage: npm run build && node tools/form-check.js [baseUrl] */
"use strict";
const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "build");
const GIVEN = process.argv[2];

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/* every page whose source has the form, plus what its select should preselect */
const PAGES = fs.readdirSync(ROOT)
  .filter((f) => f.endsWith(".html"))
  .map((f) => ({ file: f, html: fs.readFileSync(path.join(ROOT, f), "utf8") }))
  .filter((p) => p.html.includes('id="quote-form"'))
  .map((p) => {
    const tag = (p.html.match(/<section id="quote"[^>]*>/) || [""])[0];
    const want = (tag.match(/data-trade="([^"]*)"/) || [, ""])[1];
    return { url: p.file === "index.html" ? "/" : "/" + p.file.replace(/\.html$/, ""), trade: decode(want) };
  });

function serve() {
  const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "application/javascript", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".xlsx": "application/octet-stream", ".txt": "text/plain", ".xml": "application/xml" };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
    if (p === "/") p = "/index.html";
    let file = path.join(OUT, p);
    if (!path.extname(file)) file += ".html";
    if (!file.startsWith(OUT) || !fs.existsSync(file)) {
      res.writeHead(404, { "content-type": types[".html"] });
      return res.end(fs.readFileSync(path.join(OUT, "404.html")));
    }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    res.end(fs.readFileSync(file));
  });
  return new Promise((r) => server.listen(0, "127.0.0.1", () => r(server)));
}

const problems = [];
const rows = [];
function fail(url, msg) { problems.push(url + ": " + msg); }

async function newContext(browser, opts) {
  const ctx = await browser.newContext(opts || {});
  ctx.posts = [];
  ctx.formspreeStatus = 200;
  /* nothing leaves the machine: analytics and fonts are blocked, Formspree is answered locally */
  await ctx.route(/googletagmanager\.com|google-analytics\.com|doubleclick\.net|fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await ctx.route(/formspree\.io/, async (r) => {
    ctx.posts.push(JSON.parse(r.request().postData() || "{}"));
    await r.fulfill({ status: ctx.formspreeStatus, contentType: "application/json", body: ctx.formspreeStatus === 200 ? '{"ok":true}' : '{"error":"test"}' });
  });
  return ctx;
}

const leads = (page) => page.evaluate(() => (window.dataLayer || []).filter((a) => a && a[0] === "event" && a[1] === "generate_lead").map((a) => a[2]));

(async () => {
  const server = GIVEN ? null : await serve();
  const BASE = GIVEN || "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch();

  for (const { url, trade } of PAGES) {
    const row = { url, preselect: "", links: "", scroll: "", submit: "", fail: "", mobile: "", nojs: "" };
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 140)));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE + url + "?gclid=TEST-NOT-A-REAL-CLICK", { waitUntil: "load" });

    /* structure */
    const counts = await page.evaluate(() => ({
      forms: document.querySelectorAll("#quote-form").length,
      sections: document.querySelectorAll("#quote").length,
      h1: document.querySelectorAll("h1").length,
      homeLinks: document.querySelectorAll('a[href="/#quote"]').length,
      localLinks: document.querySelectorAll('a[href="#quote"]').length,
    }));
    if (counts.forms !== 1 || counts.sections !== 1) fail(url, counts.forms + " form(s), " + counts.sections + " #quote section(s)");
    if (counts.h1 !== 1) fail(url, counts.h1 + " <h1>");
    if (counts.homeLinks) fail(url, counts.homeLinks + " link(s) still point to /#quote");
    row.links = counts.localLinks + " → #quote";

    /* trade preselect */
    const sel = await page.$eval("#q-trade", (s) => s.value);
    row.preselect = sel || "(none)";
    if (sel !== trade) fail(url, "trade preselect is '" + sel + "', expected '" + trade + "'");

    /* primary CTA scrolls on-page, no page load */
    if (url !== "/") {
      const cta = page.locator("main a.btn-ink[href='#quote']").first();
      await cta.click();
      await page.waitForTimeout(1200);
      const inView = await page.evaluate(() => {
        const r = document.getElementById("quote-form").getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      const still = new URL(page.url()).pathname;
      row.scroll = inView && still === url ? "ok" : "NO";
      if (!inView) fail(url, "hero CTA did not bring the form into view");
      if (still !== url) fail(url, "hero CTA navigated away to " + still);
    }

    /* validation: no email → nothing sent */
    await page.click("#quote-form button[type=submit]");
    await page.waitForTimeout(300);
    if (ctx.posts.length) fail(url, "form sent without the required email");

    /* failure path: Formspree error → alert, button usable again, no conversion */
    ctx.formspreeStatus = 500;
    let alerted = "";
    page.once("dialog", async (d) => { alerted = d.message(); await d.dismiss(); });
    if (!trade) await page.selectOption("#q-trade", { label: "Painting" });
    await page.fill("#q-email", "form-check@example.com");
    await page.click("#quote-form button[type=submit]");
    await page.waitForTimeout(600);
    const afterFail = await page.evaluate(() => ({
      btn: document.querySelector("#quote-form button[type=submit]").disabled,
      visible: getComputedStyle(document.getElementById("quote-form")).display !== "none",
    }));
    const failLeads = await leads(page);
    row.fail = alerted && !afterFail.btn && afterFail.visible && !failLeads.length ? "ok" : "NO";
    if (row.fail !== "ok") fail(url, "Formspree error path: alert=" + !!alerted + " btnDisabled=" + afterFail.btn + " leads=" + failLeads.length);

    /* success path */
    ctx.formspreeStatus = 200;
    ctx.posts.length = 0;
    await page.click("#moreToggle");
    await page.fill("#q-name", "Form Check");
    await page.fill("#q-drawings", "https://example.com/drawings");
    await page.click("#quote-form button[type=submit]");
    await page.waitForTimeout(600);
    const okShown = await page.evaluate(() => getComputedStyle(document.querySelector(".form-ok")).display === "block" &&
      getComputedStyle(document.getElementById("quote-form")).display === "none");
    const sent = ctx.posts[0] || {};
    const conv = await leads(page);
    const expectTrade = trade || "Painting";
    const okPayload = sent.email === "form-check@example.com" && sent.trade === expectTrade && sent.sent_from_page === url &&
      sent.landing_page === url && sent.source === "Google Ads" && /\(Google Ads\)$/.test(sent._subject || "") &&
      sent.drawings_link === "https://example.com/drawings" && sent.name === "Form Check";
    const okConv = conv.length === 1 && conv[0].form_id === "quote-form" && conv[0].trade === expectTrade && conv[0].form_page === url;
    row.submit = okShown && okPayload && okConv ? "ok" : "NO";
    if (!okShown) fail(url, "success message not shown after submit");
    if (ctx.posts.length !== 1) fail(url, ctx.posts.length + " Formspree request(s) on submit");
    if (!okPayload) fail(url, "unexpected payload " + JSON.stringify(sent));
    if (!okConv) fail(url, "generate_lead events: " + JSON.stringify(conv));
    if (errors.length) fail(url, "JS error — " + errors[0]);
    await ctx.close();

    /* mobile 375: no sideways scroll, sticky bar targets the on-page form and hides over it */
    const mctx = await newContext(browser, { viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true });
    const m = await mctx.newPage();
    await m.goto(BASE + url, { waitUntil: "load" });
    await m.waitForTimeout(400);
    const mob = await m.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bar: (document.querySelector(".sticky-bar .sb-quote") || {}).getAttribute ? document.querySelector(".sticky-bar .sb-quote").getAttribute("href") : null,
    }));
    if (url !== "/") {
      /* tapping the hero button lands on the form fields, not the heading above them */
      await m.locator("main a.btn-ink[href='#quote']").first().tap();
      await m.waitForTimeout(1200);
      const top = await m.evaluate(() => Math.round(document.getElementById("quote-form").getBoundingClientRect().top));
      if (top < 0 || top > 160) fail(url, "mobile: form top at " + top + "px after tapping the hero button");
    }
    await m.evaluate(() => document.getElementById("quote").scrollIntoView());
    await m.waitForTimeout(700);
    const barOff = await m.evaluate(() => document.querySelector(".sticky-bar").classList.contains("off"));
    row.mobile = mob.overflow <= 0 && mob.bar === "#quote" && barOff ? "ok" : "NO";
    if (mob.overflow > 0) fail(url, mob.overflow + "px sideways scroll at 375px");
    if (mob.bar !== "#quote") fail(url, "sticky bar quote link is " + mob.bar);
    if (!barOff) fail(url, "sticky bar stays over the form");
    await mctx.close();

    /* no JavaScript: the form and its fields are still on the page and visible */
    const nctx = await browser.newContext({ javaScriptEnabled: false });
    await nctx.route(/googletagmanager\.com|google-analytics\.com|fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const n = await nctx.newPage();
    await n.goto(BASE + url, { waitUntil: "load" });
    row.nojs = (await n.isVisible("#quote-form")) && (await n.isVisible("#q-email")) ? "ok" : "NO";
    if (row.nojs !== "ok") fail(url, "form not visible with JavaScript off");
    await nctx.close();

    rows.push(row);
  }

  /* pricing: a retainer button notes the plan */
  {
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE + "/pricing", { waitUntil: "load" });
    await page.click("a[data-plan='Growth']");
    await page.waitForTimeout(800);
    const det = await page.evaluate(() => ({ v: document.getElementById("q-details").value, open: !document.getElementById("more-fields").hidden }));
    if (!/Growth retainer/.test(det.v) || !det.open) fail("/pricing", "Growth button did not note the plan: " + JSON.stringify(det));
    else rows.push({ url: "/pricing → Start with Growth", preselect: det.v, links: "", scroll: "", submit: "", fail: "", mobile: "", nojs: "" });
    await ctx.close();
  }

  /* ad click on one page, lead sent from another: landing page and source carry over */
  {
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE + "/flooring-takeoffs?gclid=TEST-NOT-A-REAL-CLICK", { waitUntil: "load" });
    await page.goto(BASE + "/pricing", { waitUntil: "load" });
    await page.selectOption("#q-trade", { label: "Flooring / Div 09" });
    await page.fill("#q-email", "form-check@example.com");
    await page.click("#quote-form button[type=submit]");
    await page.waitForTimeout(600);
    const s = ctx.posts[0] || {};
    if (s.landing_page !== "/flooring-takeoffs" || s.sent_from_page !== "/pricing" || s.source !== "Google Ads") fail("cross-page", "attribution lost: " + JSON.stringify(s));
    await ctx.close();
  }

  /* organic visit: no ads label */
  {
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE + "/painting-takeoffs", { waitUntil: "load" });
    await page.fill("#q-email", "form-check@example.com");
    await page.click("#quote-form button[type=submit]");
    await page.waitForTimeout(600);
    const s = ctx.posts[0] || {};
    if (s.source || /Google Ads/.test(s._subject || "")) fail("organic", "organic lead labelled as ads: " + JSON.stringify(s));
    await ctx.close();
  }

  /* homepage calculator still hands its numbers to the form */
  {
    const ctx = await newContext(browser);
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "load" });
    if (await page.$("#calcLock")) {
      await page.click(".calc .pill[data-trade='drywall']");
      await page.click("#calcLock");
      await page.waitForTimeout(600);
      const v = await page.evaluate(() => ({ t: document.getElementById("q-trade").value, d: document.getElementById("q-details").value }));
      if (v.t !== "Drywall & steel stud" || !/^Scope Check: Drywall/.test(v.d)) fail("/", "scope check no longer prefills the form: " + JSON.stringify(v));
    }
    await ctx.close();
  }

  await browser.close();
  if (server) server.close();

  const pad = (s, n) => String(s).padEnd(n).slice(0, n);
  console.log(pad("PAGE", 38) + pad("PRESELECT", 34) + pad("LINKS", 12) + pad("CTA", 5) + pad("SEND", 6) + pad("ERR", 5) + pad("375", 5) + "NO-JS");
  console.log("-".repeat(112));
  for (const r of rows) console.log(pad(r.url, 38) + pad(r.preselect, 34) + pad(r.links, 12) + pad(r.scroll, 5) + pad(r.submit, 6) + pad(r.fail, 5) + pad(r.mobile, 5) + r.nojs);
  console.log("");
  if (problems.length) {
    console.error("form-check: " + problems.length + " problem(s) —\n  " + problems.join("\n  "));
    process.exit(1);
  }
  console.log("form-check: " + PAGES.length + " page(s), all checks pass ✓ (no real lead sent, no analytics hit)");
})().catch((e) => { console.error(e); process.exit(1); });
