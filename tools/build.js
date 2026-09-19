#!/usr/bin/env node
/* Build: copy every publishable asset into build/ — no hard-coded page list.
   Copies all *.html (including subfolders), assets/, downloads/, and any
   *.txt / *.xml / *.ico / *.png at the repo root (incl. the IndexNow key file). */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "build");

const SKIP_DIRS = new Set(["build", "node_modules", ".git", ".github", "tools", "partials", ".vercel"]);
const ROOT_FILE_EXT = new Set([".html", ".txt", ".xml", ".ico", ".png", ".svg", ".webmanifest"]);
const COPY_DIRS = ["assets", "downloads"];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

/* every *.html anywhere in the repo, preserving its folder (e.g. guides/foo.html) */
function collectHtml(dir, rel, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const r = rel ? path.join(rel, entry.name) : entry.name;
    if (entry.isDirectory()) collectHtml(full, r, acc);
    else if (entry.name.endsWith(".html")) acc.push(r);
  }
  return acc;
}

rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

let count = 0;

for (const d of COPY_DIRS) {
  const src = path.join(ROOT, d);
  if (!fs.existsSync(src)) continue;
  copyDir(src, path.join(OUT, d));
}

for (const rel of collectHtml(ROOT, "", [])) {
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(ROOT, rel), dest);
  count++;
}

for (const name of fs.readdirSync(ROOT)) {
  if (SKIP_DIRS.has(name)) continue;
  const full = path.join(ROOT, name);
  if (!fs.statSync(full).isFile()) continue;
  if (name.endsWith(".html")) continue; /* already copied */
  if (!ROOT_FILE_EXT.has(path.extname(name))) continue;
  fs.copyFileSync(full, path.join(OUT, name));
}

/* verify: every <loc> in sitemap.xml resolves to a file in build/ */
const sitemapPath = path.join(ROOT, "sitemap.xml");
const missing = [];
let urls = [];
if (fs.existsSync(sitemapPath)) {
  const xml = fs.readFileSync(sitemapPath, "utf8");
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const url of urls) {
    let p = url.replace(/^https?:\/\/[^/]+/, "");
    if (p === "" || p === "/") p = "/index.html";
    else if (!path.extname(p)) p += ".html";
    if (!fs.existsSync(path.join(OUT, p))) missing.push(url + "  →  build" + p);
  }
}

console.log("build: " + count + " html page(s) + assets/ + downloads/ + root files → build/");
console.log("build: sitemap lists " + urls.length + " URL(s)");
if (missing.length) {
  console.error("build: MISSING from build/ —\n  " + missing.join("\n  "));
  process.exit(1);
}
console.log("build: every sitemap URL exists in build/ ✓");
