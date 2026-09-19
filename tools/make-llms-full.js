#!/usr/bin/env node
/* Generate llms-full.txt — the plain-text content of the trade and pricing
   pages, extracted from the real HTML so it can never drift from the site. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SITE = "https://sharpbid.ca";

/* trade pages first, then the pricing-bearing pages; missing files are skipped
   so this stays correct while pages are still being published. */
const PAGES = [
  "drywall-steel-stud-takeoffs",
  "acoustic-ceiling-takeoffs",
  "flooring-takeoffs",
  "painting-takeoffs",
  "glazing-takeoffs",
  "roofing-envelope-takeoffs",
  "misc-metals-takeoffs",
  "concrete-formwork-takeoffs",
  "framing-takeoffs",
  "pricing",
  "bid-leveling",
];

const ENTS = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", times: "×", deg: "°", sup2: "²", sup3: "³" };

function decode(s) {
  return s.replace(/&([a-z0-9#]+);/gi, (m, e) => (e.toLowerCase() in ENTS ? ENTS[e.toLowerCase()] : m));
}

function toText(html) {
  let body = (html.match(/<main[^>]*>([\s\S]*)<\/main>/i) || html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, html])[1];
  body = body
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  body = body
    .replace(/<h1[^>]*>/gi, "\n\n# ")
    .replace(/<h2[^>]*>/gi, "\n\n## ")
    .replace(/<h3[^>]*>/gi, "\n\n### ")
    .replace(/<summary[^>]*>/gi, "\n\n**Q: ")
    .replace(/<\/summary>/gi, "**\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<t[dh][^>]*>/gi, " | ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|h1|h2|h3|h4|ul|ol|table|section|details|caption)>/gi, "\n");
  return decode(body.replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const today = new Date().toISOString().slice(0, 10);
const parts = [
  "# SharpBid Estimating — full page text",
  "",
  "Plain-text content of the SharpBid trade and pricing pages, for machine",
  "reading. Canonical HTML lives at " + SITE + ". Generated " + today + ".",
  "",
  "Contact: info@sharpbid.ca · (604) 245-4344 · " + SITE,
  "",
];

let n = 0;
for (const slug of PAGES) {
  const file = path.join(ROOT, slug + ".html");
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [, slug])[1].trim());
  parts.push("=".repeat(72), "SOURCE: " + SITE + "/" + slug, "TITLE: " + title, "=".repeat(72), "", toText(html), "");
  n++;
}

fs.writeFileSync(path.join(ROOT, "llms-full.txt"), parts.join("\n").replace(/\n{3,}/g, "\n\n") + "\n");
console.log("llms-full: wrote llms-full.txt from " + n + " page(s)");
