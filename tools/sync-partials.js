#!/usr/bin/env node
/* Inject shared partials into every page between marker comments.
   Pages stay complete standalone HTML, so `npx serve .` previews the real site. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PARTIALS = path.join(ROOT, "partials");

const NAMES = fs
  .readdirSync(PARTIALS)
  .filter((f) => f.endsWith(".html"))
  .map((f) => f.replace(/\.html$/, ""));

const bodies = {};
for (const name of NAMES) {
  bodies[name] = fs.readFileSync(path.join(PARTIALS, name + ".html"), "utf8").replace(/\s*$/, "");
}

function htmlFiles(dir, acc) {
  acc = acc || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "build" || entry.name === ".git") continue;
    if (entry.name === "partials" || entry.name === "tools") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

let changed = 0;
let slots = 0;
for (const file of htmlFiles(ROOT)) {
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  for (const name of NAMES) {
    const re = new RegExp("(<!-- #" + name + " -->)[\\s\\S]*?(<!-- /#" + name + " -->)", "g");
    after = after.replace(re, (_m, open, close) => {
      slots++;
      return open + "\n" + bodies[name] + "\n" + close;
    });
  }
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
    console.log("  updated " + path.relative(ROOT, file));
  }
}
console.log("sync-partials: " + slots + " slot(s) filled, " + changed + " file(s) rewritten.");
