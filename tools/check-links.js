#!/usr/bin/env node
/* Local link check over build/ — resolves internal hrefs the way Vercel's
   cleanUrls:true / trailingSlash:false serves them, and verifies in-page anchors. */
"use strict";
const fs = require("fs");
const path = require("path");

const OUT = path.resolve(__dirname, "..", "build");
const SITE = "https://sharpbid.ca";

/* Pages on the v4 roadmap that later phases publish. Links to these are
   reported as PENDING, not broken. This list must be empty before launch. */
const PENDING = new Set([
  "/takeoff-services-british-columbia",
  "/takeoff-services-alberta",
  "/takeoff-services-ontario",
  "/pricing",
  "/bid-leveling",
  "/about",
  "/guides",
  "/guides/construction-takeoff-cost-canada",
  "/guides/drywall-takeoff-checklist",
  "/guides/flooring-takeoff-checklist",
  "/guides/outsourcing-takeoffs-vs-in-house-estimator",
  "/bid-traps",
]);

function walk(dir, acc) {
  acc = acc || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

const files = walk(OUT);
const pages = files.filter((f) => f.endsWith(".html"));
const ids = new Map(); /* page path → Set of ids */

function pageKey(rel) {
  let p = "/" + rel.split(path.sep).join("/");
  return p.replace(/\.html$/, "").replace(/\/index$/, "/") || "/";
}

for (const f of pages) {
  const rel = path.relative(OUT, f);
  const html = fs.readFileSync(f, "utf8");
  const set = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  set.add("");
  ids.set(pageKey(rel), set);
}

function resolve(p) {
  if (p === "/" ) return "/index.html";
  const cands = [p, p + ".html", p.replace(/\/$/, "") + ".html", path.posix.join(p, "index.html")];
  for (const c of cands) {
    const full = path.join(OUT, c.replace(/^\//, ""));
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return c;
  }
  return null;
}

let broken = [];
const pending = new Map();
let checked = 0;

for (const f of pages) {
  const rel = path.relative(OUT, f);
  const from = pageKey(rel);
  const html = fs.readFileSync(f, "utf8");
  const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    if (/^(mailto:|tel:|data:|javascript:)/i.test(href)) continue;
    let target = href;
    if (target.startsWith(SITE)) target = target.slice(SITE.length) || "/";
    if (/^https?:\/\//i.test(target)) continue; /* external — not crawled here */
    checked++;
    const [rawPath, hash] = target.split("#");
    const pathPart = rawPath.split("?")[0];
    const abs = pathPart === "" ? from : pathPart.startsWith("/") ? pathPart : path.posix.resolve(path.posix.dirname(from), pathPart);
    const hit = resolve(abs);
    if (!hit) {
      if (PENDING.has(abs)) pending.set(abs, (pending.get(abs) || 0) + 1);
      else broken.push(from + "  →  " + href + "   (no such page/file)");
      continue;
    }
    if (hash) {
      const key = pageKey(path.relative(OUT, path.join(OUT, hit.replace(/^\//, ""))));
      const set = ids.get(key);
      if (set && !set.has(hash)) broken.push(from + "  →  " + href + "   (no #" + hash + " on that page)");
    }
  }
}

console.log("link check: " + pages.length + " page(s), " + checked + " internal link(s) checked");
if (pending.size) {
  console.log("link check: " + pending.size + " page(s) not published yet (later phases) —");
  for (const [p, n] of [...pending].sort()) console.log("  " + p + "   (" + n + " link" + (n === 1 ? "" : "s") + ")");
}
if (broken.length) {
  console.error("link check: " + broken.length + " BROKEN —\n  " + broken.join("\n  "));
  process.exit(1);
}
console.log("link check: no broken internal links ✓");
