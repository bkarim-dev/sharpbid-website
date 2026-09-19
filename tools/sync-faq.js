#!/usr/bin/env node
/* Rebuild every page's FAQPage JSON-LD from the FAQ that is actually visible on
   it. Structured data must match visible content, so the page is the source of
   truth and the markup is generated — it can never drift. Pages with no
   <div class="faq"> are left alone. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SKIP = new Set(["build", "node_modules", ".git", "tools", "partials"]);

const ENTS = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", times: "×", deg: "°", sup2: "²", sup3: "³", rsquo: "’", lsquo: "‘" };
const decode = (s) => s.replace(/&([a-z0-9#]+);/gi, (m, e) => (e.toLowerCase() in ENTS ? ENTS[e.toLowerCase()] : m));
const strip = (s) => decode(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

function htmlFiles(dir, acc) {
  acc = acc || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) htmlFiles(full, acc);
    else if (e.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

let changed = 0;
let skipped = 0;

for (const file of htmlFiles(ROOT)) {
  const src = fs.readFileSync(file, "utf8");

  const faqBlock = src.match(/<div class="faq[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>/);
  if (!faqBlock) { skipped++; continue; }

  const pairs = [...faqBlock[1].matchAll(/<summary>([\s\S]*?)<\/summary>\s*<div class="a">([\s\S]*?)<\/div>/g)];
  if (!pairs.length) { skipped++; continue; }

  const entities = pairs.map(([, q, a]) => ({
    "@type": "Question",
    name: strip(q),
    acceptedAnswer: { "@type": "Answer", text: strip(a) },
  }));

  const json = JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: entities }, null, 2);
  const block = '  <script type="application/ld+json">\n  ' + json.replace(/\n/g, "\n  ") + "\n  </script>";

  let out;
  const existing = src.match(/  <script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "FAQPage"[\s\S]*?<\/script>/);
  if (existing) {
    out = src.replace(existing[0], block);
  } else {
    out = src.replace("</head>", block + "\n</head>");
  }

  if (out !== src) {
    fs.writeFileSync(file, out);
    changed++;
    console.log("  faq → " + path.relative(ROOT, file) + "  (" + entities.length + " Q)");
  }
}

console.log("sync-faq: " + changed + " page(s) rewritten, " + skipped + " without a visible FAQ.");
