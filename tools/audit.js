#!/usr/bin/env node
/* Per-page audit over build/: title, meta description, H1 count, canonical,
   og tags, JSON-LD validity + types, GA tag, word count of visible copy. */
"use strict";
const fs = require("fs");
const path = require("path");

const OUT = path.resolve(__dirname, "..", "build");
const SITE = "https://sharpbid.ca";

function walk(dir, acc) {
  acc = acc || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (e.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function urlOf(rel) {
  const p = "/" + rel.split(path.sep).join("/");
  return p.replace(/\.html$/, "").replace(/\/index$/, "") || "/";
}

/* search engines render entities, so measure decoded lengths */
function decode(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

function wordCount(html) {
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, html])[1];
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}

const rows = [];
const problems = [];
const titles = new Map();
const descs = new Map();

for (const f of walk(OUT).sort()) {
  const rel = path.relative(OUT, f);
  const html = fs.readFileSync(f, "utf8");
  const url = urlOf(rel);
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1].trim());
  const desc = decode((html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [, ""])[1]);
  const canon = (html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i) || [, ""])[1];
  const h1s = [...html.matchAll(/<h1[\s>]/gi)].length;
  const robots = (html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i) || [, ""])[1];
  const noindex = /noindex/i.test(robots);
  const ga = html.includes("G-CHM6RB8YY1");
  const ogUrl = (html.match(/<meta\s+property="og:url"\s+content="([^"]*)"/i) || [, ""])[1];
  const ogImg = (html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i) || [, ""])[1];

  const types = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = Array.isArray(data) ? data : data["@graph"] || [data];
      for (const n of nodes) {
        const t = n["@type"];
        (Array.isArray(t) ? t : [t]).forEach((x) => x && types.push(x));
      }
    } catch (e) {
      problems.push(url + ": JSON-LD does not parse — " + e.message);
    }
  }

  const words = wordCount(html);
  rows.push({ url, title, tlen: title.length, dlen: desc.length, h1s, words, types: types.join(", ") || "—", noindex });

  if (!noindex) {
    if (!title) problems.push(url + ": missing <title>");
    else if (title.length > 60) problems.push(url + ": title " + title.length + " chars (>60)");
    if (!desc) problems.push(url + ": missing meta description");
    else if (desc.length > 155) problems.push(url + ": meta description " + desc.length + " chars (>155)");
    if (h1s !== 1) problems.push(url + ": " + h1s + " <h1> (expected exactly 1)");
    const want = SITE + (url === "/" ? "/" : url);
    if (canon !== want) problems.push(url + ": canonical is '" + canon + "', expected '" + want + "'");
    if (ogUrl !== want) problems.push(url + ": og:url is '" + ogUrl + "', expected '" + want + "'");
    if (!ogImg) problems.push(url + ": missing og:image");
    if (!ga) problems.push(url + ": missing GA tag G-CHM6RB8YY1");
    if (titles.has(title)) problems.push(url + ": duplicate title with " + titles.get(title));
    else titles.set(title, url);
    if (desc && descs.has(desc)) problems.push(url + ": duplicate meta description with " + descs.get(desc));
    else if (desc) descs.set(desc, url);
  }
}

const pad = (s, n) => String(s).padEnd(n).slice(0, n);
console.log(pad("URL", 42) + pad("TITLE", 60) + pad("T", 4) + pad("D", 5) + pad("H1", 4) + pad("WORDS", 7) + "SCHEMA");
console.log("-".repeat(160));
for (const r of rows) {
  console.log(pad(r.url + (r.noindex ? " (noindex)" : ""), 42) + pad(r.title, 60) + pad(r.tlen, 4) + pad(r.dlen, 5) + pad(r.h1s, 4) + pad(r.words, 7) + r.types);
}
console.log("");
if (problems.length) {
  console.error("audit: " + problems.length + " problem(s) —\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log("audit: all checks pass ✓");
