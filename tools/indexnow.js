#!/usr/bin/env node
/* Submit URLs to IndexNow (feeds Bing, which ChatGPT and Copilot search).
 *
 * The key and the URL list are both read from the repo, so they can never
 * drift from what is deployed: the key comes from the <key>.txt file at the
 * repo root, and the URLs come from sitemap.xml unless you name some.
 *
 *   node tools/indexnow.js                        submit every sitemap URL
 *   node tools/indexnow.js /pricing /about        submit just those
 *   node tools/indexnow.js --dry-run              print the payload, send nothing
 *   node tools/indexnow.js --skip-key-check       skip the live key-file check
 *
 * Exits non-zero if the submission is rejected, so it is safe to chain.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const ENDPOINT = "https://api.indexnow.org/indexnow";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipKeyCheck = args.includes("--skip-key-check");
const explicit = args.filter((a) => !a.startsWith("--"));

function die(msg) {
  console.error("indexnow: " + msg);
  process.exit(1);
}

/* ---- key: the <32-hex>.txt file at the repo root is the single source ---- */
const keyFiles = fs.readdirSync(ROOT).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (keyFiles.length !== 1) {
  die(keyFiles.length === 0
    ? "no IndexNow key file at the repo root (expected one <32-hex>.txt)"
    : "found " + keyFiles.length + " key files at the repo root; expected exactly one — " + keyFiles.join(", "));
}
const key = path.basename(keyFiles[0], ".txt");
const keyFileBody = fs.readFileSync(path.join(ROOT, keyFiles[0]), "utf8").trim();
if (keyFileBody !== key) {
  die(keyFiles[0] + " must contain exactly its own key; it contains " + JSON.stringify(keyFileBody.slice(0, 60)));
}

/* ---- urls: from the sitemap, or the paths named on the command line ---- */
const sitemap = path.join(ROOT, "sitemap.xml");
if (!fs.existsSync(sitemap)) die("sitemap.xml not found at the repo root");
const sitemapUrls = [...fs.readFileSync(sitemap, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
if (!sitemapUrls.length) die("sitemap.xml contains no <loc> entries");

const origin = new URL(sitemapUrls[0]).origin;
const host = new URL(origin).host;

const urlList = explicit.length
  ? explicit.map((u) => (/^https?:\/\//i.test(u) ? u : origin + (u.startsWith("/") ? u : "/" + u)))
  : sitemapUrls;

const foreign = urlList.filter((u) => new URL(u).host !== host);
if (foreign.length) die("these URLs are not on " + host + ", which IndexNow rejects:\n  " + foreign.join("\n  "));

const payload = {
  host,
  key,
  keyLocation: origin + "/" + keyFiles[0],
  urlList,
};

/* ---- helpers ---- */
function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 20000 }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("timeout", () => req.destroy(new Error("timed out")));
    req.on("error", reject);
  });
}

function post(url, json) {
  const data = Buffer.from(JSON.stringify(json));
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: "POST",
      timeout: 30000,
      headers: { "Content-Type": "application/json; charset=utf-8", "Content-Length": data.length },
    }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => resolve({ status: res.statusCode, body }));
    });
    req.on("timeout", () => req.destroy(new Error("timed out")));
    req.on("error", reject);
    req.end(data);
  });
}

const MEANING = {
  200: "OK — URLs submitted",
  202: "Accepted — URLs received, key validation pending",
  400: "Bad request — malformed payload",
  403: "Forbidden — the key file is not valid or not reachable",
  422: "Unprocessable — URLs do not belong to the host, or the key does not match",
  429: "Too many requests — slow down and retry later",
};

(async () => {
  console.log("indexnow: host        " + host);
  console.log("indexnow: key         " + key);
  console.log("indexnow: keyLocation " + payload.keyLocation);
  console.log("indexnow: urls        " + urlList.length + (explicit.length ? " (named on the command line)" : " (from sitemap.xml)"));

  if (dryRun) {
    console.log("\n" + JSON.stringify(payload, null, 2));
    console.log("\nindexnow: dry run — nothing sent.");
    return;
  }

  /* A live, correct key file is the usual cause of a 403/422, so check first. */
  if (!skipKeyCheck) {
    let res;
    try {
      res = await get(payload.keyLocation);
    } catch (e) {
      die("could not reach " + payload.keyLocation + " (" + e.message + ").\n" +
          "  The key file must be publicly served before submitting. Use --skip-key-check to bypass.");
    }
    if (res.status !== 200) die("key file returned HTTP " + res.status + " — it must serve 200 before submitting.");
    if (res.body.trim() !== key) die("key file is live but its contents do not match the key. Redeploy, then retry.");
    console.log("indexnow: key file verified live ✓");
  }

  let res;
  try {
    res = await post(ENDPOINT, payload);
  } catch (e) {
    die("request failed — " + e.message);
  }

  const note = MEANING[res.status] || "unexpected status";
  console.log("\nindexnow: HTTP " + res.status + " — " + note);
  if (res.body.trim()) console.log("indexnow: response " + res.body.trim().slice(0, 300));

  if (res.status === 200 || res.status === 202) {
    console.log("indexnow: " + urlList.length + " URL(s) submitted ✓");
  } else {
    process.exit(1);
  }
})();
