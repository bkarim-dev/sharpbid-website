#!/usr/bin/env node
/* Google Business Profile photos: colour-coded sample takeoff markups for
 * the trades the first photo set didn't cover (concrete, roofing, glazing,
 * misc metals). Same sheet chrome and brand tokens as tools/listing-assets.js.
 *
 * Every project shown is FICTITIOUS and labelled that way twice per image
 * (header tag + title block). The concrete sheet uses the same fictitious
 * project and numbers as downloads/SharpBid-Sample-Takeoff-Concrete-Foundations.xlsx.
 *
 *   node tools/gbp-photos.js                  render SVG + PNG to assets/listings/
 *   FONT_DIR=/path node tools/gbp-photos.js   use local @fontsource woff2 files
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "assets", "listings");

const C = {
  sheet: "#FAFBF9", paper: "#F0F3EE", ink: "#16232B", inkSoft: "#46575F",
  line: "#D7DDD5", lineSoft: "#E6EAE3", hilite: "#FFD84D", hiliteInk: "#7A6100",
  flooring: "#2FA55F", drywall: "#3E8DE3", glazing: "#21A8BC", metals: "#E0701F",
  painting: "#C94B9B", concrete: "#74838F", acoustic: "#6E5BD0", roofing: "#B4342B", framing: "#8A6A3B",
};
const DISPLAY = "Big Shoulders, 'Arial Narrow', sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const SANS = "'IBM Plex Sans', Helvetica, Arial, sans-serif";
const LS = "0.01em";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const f1 = (n) => Number(n.toFixed(1));

/* ---------- fonts ---------- */
const FACES = [
  { family: "Big Shoulders", weight: 800, pkg: "big-shoulders", q: "Big+Shoulders:wght@800" },
  { family: "IBM Plex Mono", weight: 400, pkg: "ibm-plex-mono", q: "IBM+Plex+Mono:wght@400;500" },
  { family: "IBM Plex Mono", weight: 500, pkg: "ibm-plex-mono", q: "IBM+Plex+Mono:wght@400;500" },
  { family: "IBM Plex Sans", weight: 400, pkg: "ibm-plex-sans", q: "IBM+Plex+Sans:wght@400;500;600" },
  { family: "IBM Plex Sans", weight: 500, pkg: "ibm-plex-sans", q: "IBM+Plex+Sans:wght@400;500;600" },
  { family: "IBM Plex Sans", weight: 600, pkg: "ibm-plex-sans", q: "IBM+Plex+Sans:wght@400;500;600" },
];
function fontCss() {
  const dir = process.env.FONT_DIR;
  return FACES.map((f) => {
    let b64;
    if (dir) {
      const p = path.join(dir, f.pkg, "package", "files", `${f.pkg}-latin-${f.weight}-normal.woff2`);
      b64 = fs.readFileSync(p).toString("base64");
    } else {
      const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
      const css = execFileSync("curl", ["-sSL", "-A", UA, "https://fonts.googleapis.com/css2?family=" + f.q + "&display=swap"], { encoding: "utf8" });
      const block = css.split("/*").find((b) => b.trim().startsWith("latin */") && b.includes("font-weight: " + f.weight));
      const m = (block || "").match(/url\((https:[^)]+\.woff2)\)/);
      b64 = execFileSync("curl", ["-sSL", "-A", UA, m[1]], { maxBuffer: 32 << 20 }).toString("base64");
    }
    return `@font-face{font-family:'${f.family}';font-style:normal;font-weight:${f.weight};src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
  }).join("\n");
}

/* ---------- shared pieces (mirroring listing-assets.js) ---------- */
const gridDef = (id, step, colour, sw) => `
  <pattern id="${id}" width="${step}" height="${step}" patternUnits="userSpaceOnUse">
    <path d="M ${step} 0 L 0 0 0 ${step}" fill="none" stroke="${colour}" stroke-width="${sw || 1}"/>
  </pattern>`;
const hatchDef = (id, colour, step, sw) => `
  <pattern id="${id}" width="${step}" height="${step}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="${step}" stroke="${colour}" stroke-width="${sw || 1.4}"/>
  </pattern>`;

function wordmark(M, x, baseline, size) {
  const s = size / 100;
  const sw = M.sharp.w * s, bw = M.bid.w * s, cap = M.bid.cap * s;
  const gap = size * 0.06, padX = size * 0.14, padY = size * 0.11;
  const boxX = x + sw + gap, boxW = bw + padX * 2, boxY = baseline - cap - padY, boxH = cap + padY * 2;
  return {
    width: sw + gap + boxW,
    svg: `<g>
    <text x="${x}" y="${baseline}" font-family="${DISPLAY}" font-weight="800" font-size="${size}" letter-spacing="${LS}" fill="${C.ink}">SHARP</text>
    <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" fill="${C.hilite}"/>
    <text x="${boxX + padX}" y="${baseline}" font-family="${DISPLAY}" font-weight="800" font-size="${size}" letter-spacing="${LS}" fill="${C.ink}">BID</text>
  </g>`,
  };
}
const tradeBar = (x, y, w, h) => {
  const cols = [C.flooring, C.drywall, C.glazing, C.metals, C.painting, C.acoustic, C.roofing, C.framing, C.concrete];
  const seg = w / cols.length;
  return cols.map((c, i) => `<rect x="${x + i * seg}" y="${y}" width="${seg + 0.5}" height="${h}" fill="${c}"/>`).join("");
};
const svgDoc = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">\n${body}\n</svg>\n`;

/* sheet chrome: frame, header with trade + fictitious tag, title block */
function sheet(M, o) {
  const W = 1200, H = 900;
  const wm = wordmark(M, 52, 74, 34);
  const tagText = "SAMPLE · FICTITIOUS PROJECT";
  const tagW = tagText.length * 8.25 + 22;
  const cells = [
    { l: "PROJECT", v: "SharpBid Estimating · Sample project · Fictitious", w: 560 },
    { l: "DRAWING", v: o.drawing, w: 380 },
    { l: "SHEET", v: o.sheet, w: 212 },
  ];
  let cx = 24;
  const tb = cells.map((c, i) => {
    const g = `${i ? `<line x1="${cx}" y1="772" x2="${cx}" y2="876" stroke="${C.line}" stroke-width="1"/>` : ""}
      <text x="${cx + 18}" y="800" font-family="${MONO}" font-size="12" letter-spacing="0.14em" fill="${C.inkSoft}">${esc(c.l)}</text>
      <text x="${cx + 18}" y="834" font-family="${MONO}" font-size="${c.l === "PROJECT" ? 17 : 18}" font-weight="500" fill="${C.ink}">${esc(c.v)}</text>`;
    cx += c.w;
    return g;
  }).join("");
  const tx = 52 + wm.width + 34;
  return {
    W, H,
    head: `<rect width="${W}" height="${H}" fill="${C.sheet}"/>
  <rect width="${W}" height="${H}" fill="url(#g32)"/>
  <rect x="24" y="24" width="1152" height="852" fill="none" stroke="${C.ink}" stroke-width="3"/>
  <line x1="24" y1="96" x2="1176" y2="96" stroke="${C.ink}" stroke-width="1.5"/>
  ${wm.svg}
  <line x1="${tx - 17}" y1="44" x2="${tx - 17}" y2="78" stroke="${C.line}" stroke-width="1.5"/>
  <rect x="${tx}" y="53" width="14" height="14" fill="${o.colour}"/>
  <text x="${tx + 24}" y="66" font-family="${MONO}" font-size="16" font-weight="500" letter-spacing="0.12em" fill="${C.ink}">${esc(o.trade)}</text>
  <text x="1152" y="58" text-anchor="end" font-family="${MONO}" font-size="15" letter-spacing="0.16em" fill="${C.inkSoft}">${esc("SHEET " + o.sheet)}</text>
  <rect x="${1152 - tagW}" y="67" width="${tagW}" height="21" fill="${C.hilite}"/>
  <text x="${1152 - tagW / 2}" y="82" text-anchor="middle" font-family="${MONO}" font-size="12.5" font-weight="500" letter-spacing="0.08em" fill="${C.ink}">${tagText}</text>`,
    foot: `<line x1="24" y1="772" x2="1176" y2="772" stroke="${C.ink}" stroke-width="1.5"/>
  ${tb}
  ${tradeBar(24, 869, 1152, 7)}`,
  };
}

/* quantity panel on the right of each sheet */
function qtyPanel(o) {
  const x = 800, w = 352, top = 118, rh = o.rh || 50;
  const two = o.cols.length === 2;
  const edge = two ? [x + w - 92, x + w - 14] : [x + w - 58];
  let s = `<rect x="${x}" y="${top}" width="${w}" height="34" fill="${C.ink}"/>
    <text x="${x + 14}" y="${top + 22}" font-family="${MONO}" font-size="12" letter-spacing="0.12em" fill="${C.sheet}">${esc(o.title)}</text>`;
  if (two) o.cols.forEach((h, i) => {
    s += `<text x="${edge[i]}" y="${top + 22}" text-anchor="end" font-family="${MONO}" font-size="11.5" letter-spacing="0.06em" fill="${C.hilite}">${esc(h)}</text>`;
  });
  let y = top + 34;
  const rows = o.rows.map((r, i) => {
    const yy = y + i * rh;
    const band = i % 2 ? `<rect x="${x}" y="${yy}" width="${w}" height="${rh}" fill="${C.paper}" opacity="0.7"/>` : `<rect x="${x}" y="${yy}" width="${w}" height="${rh}" fill="${C.sheet}"/>`;
    const sw = r.pat
      ? `<rect x="${x + 12}" y="${yy + 11}" width="16" height="16" fill="url(#${r.pat})" stroke="${C.ink}" stroke-width="1"/>`
      : r.line
        ? `<line x1="${x + 12}" y1="${yy + 19}" x2="${x + 28}" y2="${yy + 19}" stroke="${r.sw}" stroke-width="5" ${r.dash ? `stroke-dasharray="${r.dash}"` : ""}/>`
        : r.dot
          ? `<circle cx="${x + 20}" cy="${yy + 19}" r="7" fill="${r.sw}" stroke="${C.ink}" stroke-width="1"/>`
          : `<rect x="${x + 12}" y="${yy + 11}" width="16" height="16" fill="${r.sw}" ${r.o ? `fill-opacity="${r.o}"` : ""} stroke="${C.ink}" stroke-width="1"/>`;
    const vals = two
      ? r.v.map((v, j) => `<text x="${edge[j]}" y="${yy + 24}" text-anchor="end" font-family="${MONO}" font-size="14.5" font-weight="500" fill="${C.ink}">${esc(v)}</text>`).join("")
      : `<text x="${edge[0]}" y="${yy + 24}" text-anchor="end" font-family="${MONO}" font-size="14.5" font-weight="500" fill="${C.ink}">${esc(r.v)}</text>
         <text x="${edge[0] + 7}" y="${yy + 24}" font-family="${MONO}" font-size="11.5" fill="${C.hiliteInk}">${esc(r.u)}</text>`;
    return `${band}
      <line x1="${x}" y1="${yy + rh}" x2="${x + w}" y2="${yy + rh}" stroke="${C.line}" stroke-width="1"/>
      ${sw}
      <text x="${x + 38}" y="${yy + 23}" font-family="${SANS}" font-size="13.5" font-weight="500" fill="${C.ink}">${esc(r.k)}</text>
      <text x="${x + 38}" y="${yy + 40}" font-family="${MONO}" font-size="11" fill="${C.inkSoft}">${esc(r.d)}</text>
      ${vals}`;
  }).join("");
  y += o.rows.length * rh;
  let total = "";
  if (o.total) {
    total = `<rect x="${x}" y="${y}" width="${w}" height="${rh}" fill="${C.hilite}" fill-opacity="0.35"/>
      <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${C.ink}" stroke-width="1.5"/>
      <text x="${x + 14}" y="${y + 23}" font-family="${SANS}" font-size="14" font-weight="600" fill="${C.ink}">${esc(o.total.k)}</text>
      <text x="${x + 14}" y="${y + 40}" font-family="${MONO}" font-size="11" fill="${C.inkSoft}">${esc(o.total.d)}</text>
      ${o.total.v.map((v, j) => `<text x="${edge[j]}" y="${y + 24}" text-anchor="end" font-family="${MONO}" font-size="15" font-weight="500" fill="${C.ink}">${esc(v)}</text>`).join("")}`;
    y += rh;
  }
  const frame = `<rect x="${x}" y="${top}" width="${w}" height="${y - top}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
  const notes = (o.notes || []).map((n, i) =>
    `<text x="${x}" y="${y + 26 + i * 18}" font-family="${SANS}" font-size="12.5" fill="${C.inkSoft}">${esc(n)}</text>`).join("");
  return `${s}${rows}${total}${frame}${notes}`;
}

/* small callout tag */
function tag(x, y, text, colour, opts) {
  const o = opts || {};
  const w = text.length * 6.9 + 14, h = 19;
  return `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" fill="${o.fill || C.sheet}" stroke="${colour}" stroke-width="1.6"/>
    <text x="${x}" y="${y + 4}" text-anchor="middle" font-family="${MONO}" font-size="11.5" font-weight="500" fill="${C.ink}">${esc(text)}</text>`;
}
const bubble = (x, y, t) => `<circle cx="${x}" cy="${y}" r="12" fill="${C.sheet}" stroke="${C.ink}" stroke-width="1.4"/>
  <text x="${x}" y="${y + 4.5}" text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="500" fill="${C.ink}">${t}</text>`;
const keyRow = (x, y, sw, text) => `${sw(x, y)}<text x="${x + 34}" y="${y + 4}" font-family="${SANS}" font-size="12.5" fill="${C.inkSoft}">${esc(text)}</text>`;

/* =====================================================================
   1 · CONCRETE & FORMWORK — S-101 foundation plan
   Geometry and quantities from the sample workbook (fictitious project).
   x = 0 at grid 1, y = 0 at grid A, metres.
   ===================================================================== */
function concrete(M) {
  const s = sheet(M, { trade: "CONCRETE & FORMWORK TAKEOFF", colour: C.concrete, drawing: "Foundation plan — Div 03", sheet: "S-101" });
  const k = 11, X0 = 112, Y0 = 566;
  const X = (m) => X0 + m * k, Y = (m) => Y0 - m * k;
  const gx = [0, 8.4, 16.8, 25.2, 33.6, 42, 50.4, 58.8], gy = [0, 8, 16, 24, 32];
  const col = { sof: C.metals, sf2: C.roofing, f1: C.drywall, f2: C.acoustic, raft: C.glazing, sog: C.flooring, wall: C.ink };
  const out = [];

  /* slab on grade field */
  out.push(`<rect x="${X(0)}" y="${Y(32)}" width="${58.8 * k}" height="${32 * k}" fill="${col.sog}" fill-opacity="0.16"/>`);
  /* SOG construction joints and pour numbers */
  [12.6, 21.0, 37.8, 46.2].forEach((x) => out.push(`<line x1="${X(x)}" y1="${Y(32)}" x2="${X(x)}" y2="${Y(0)}" stroke="${C.roofing}" stroke-width="1.8" stroke-dasharray="9 6"/>`));
  [[6.3, 1], [16.8, 2], [29.4, 3], [42.0, 4], [52.5, 5]].forEach(([x, n]) => {
    if (n === 3) return; /* pour 3 runs under the core label; tagged lower down */
    out.push(tag(X(x), Y(29.6), "POUR " + n, C.roofing));
  });
  out.push(tag(X(29.4), Y(4.0), "POUR 3", C.roofing));
  /* grid lines */
  gx.forEach((x) => out.push(`<line x1="${X(x)}" y1="${Y(33.6)}" x2="${X(x)}" y2="${Y(-2.6)}" stroke="${C.inkSoft}" stroke-width="0.8" stroke-dasharray="14 4 2 4" opacity="0.7"/>`));
  gy.forEach((y) => out.push(`<line x1="${X(-3.2)}" y1="${Y(y)}" x2="${X(60.2)}" y2="${Y(y)}" stroke="${C.inkSoft}" stroke-width="0.8" stroke-dasharray="14 4 2 4" opacity="0.7"/>`));
  /* shoring at grid 1 (by others) */
  out.push(`<rect x="${X(-1.25)}" y="${Y(32.6)}" width="${1.1 * k}" height="${33.2 * k}" fill="url(#hShore)" stroke="${C.roofing}" stroke-width="1"/>`);
  out.push(`<text transform="translate(${X(-2.1)} ${Y(16)}) rotate(-90)" text-anchor="middle" font-family="${MONO}" font-size="11" letter-spacing="0.1em" fill="${C.roofing}">SHORING BY OTHERS · GRID 1 WALL FORMED ONE SIDE</text>`);
  /* strip footings: SF1 (A, E, 8) and eccentric SF2 (grid 1) */
  out.push(`<rect x="${X(1.35)}" y="${Y(0.5)}" width="${(59.3 - 1.35) * k}" height="${1.0 * k}" fill="${col.sof}" fill-opacity="0.75"/>`);
  out.push(`<rect x="${X(1.35)}" y="${Y(32.5)}" width="${(59.3 - 1.35) * k}" height="${1.0 * k}" fill="${col.sof}" fill-opacity="0.75"/>`);
  out.push(`<rect x="${X(58.3)}" y="${Y(31.5)}" width="${1.0 * k}" height="${31 * k}" fill="${col.sof}" fill-opacity="0.75"/>`);
  out.push(`<rect x="${X(-0.15)}" y="${Y(32.5)}" width="${1.5 * k}" height="${33 * k}" fill="${col.sf2}" fill-opacity="0.75"/>`);
  /* F2 pilaster pads (2400 along wall × 2000 across) */
  const f2 = [];
  [8.4, 16.8, 25.2, 33.6, 42, 50.4].forEach((x) => { f2.push([x - 1.2, -1.0, 2.4, 2.0]); f2.push([x - 1.2, 31.0, 2.4, 2.0]); });
  [8, 16, 24].forEach((y) => f2.push([57.8, y - 1.2, 2.0, 2.4]));
  [8, 16, 24].forEach((y) => f2.push([-0.15, y - 1.2, 2.0, 2.4]));
  f2.forEach(([x, y, w, h]) => out.push(`<rect x="${X(x)}" y="${Y(y + h)}" width="${w * k}" height="${h * k}" fill="${col.f2}" fill-opacity="0.55" stroke="${col.f2}" stroke-width="1.2"/>`));
  /* F1 column pads 3000 square + C1 columns */
  const core = (x, y) => (x === 25.2 || x === 33.6) && (y === 16 || y === 24);
  [8.4, 16.8, 25.2, 33.6, 42, 50.4].forEach((x) => [8, 16, 24].forEach((y) => {
    if (core(x, y)) return;
    out.push(`<rect x="${X(x - 1.5)}" y="${Y(y + 1.5)}" width="${3 * k}" height="${3 * k}" fill="${col.f1}" fill-opacity="0.5" stroke="${col.f1}" stroke-width="1.4"/>`);
    out.push(`<rect x="${X(x) - 3.5}" y="${Y(y) - 3.5}" width="7" height="7" fill="${C.ink}"/>`);
  }));
  /* core raft MF1, core walls, elevator pit */
  out.push(`<rect x="${X(24.2)}" y="${Y(25)}" width="${10.4 * k}" height="${10 * k}" fill="${col.raft}" fill-opacity="0.45" stroke="${col.raft}" stroke-width="1.6"/>`);
  out.push(`<rect x="${X(25.2)}" y="${Y(24)}" width="${8.4 * k}" height="${8 * k}" fill="none" stroke="${C.ink}" stroke-width="4"/>`);
  out.push(`<rect x="${X(25.35)}" y="${Y(18.75)}" width="${2.7 * k}" height="${2.6 * k}" fill="url(#hPit)" stroke="${C.ink}" stroke-width="1.2"/>`);
  out.push(`<rect x="${X(29.2)}" y="${Y(24)}" width="${0.3 * k}" height="${8 * k}" fill="${C.ink}"/>`);
  out.push(`<rect x="${X(29.4) - 54}" y="${Y(21.6)}" width="108" height="20" fill="${C.sheet}" fill-opacity="0.9"/>`);
  out.push(`<text x="${X(29.4)}" y="${Y(21.6) + 14}" text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="500" fill="${C.ink}">CORE · MF1</text>`);
  /* sump SP1 */
  out.push(`<rect x="${X(9.7)}" y="${Y(2.8)}" width="${1.6 * k}" height="${1.6 * k}" fill="url(#hPit)" stroke="${C.ink}" stroke-width="1.2"/>`);
  /* foundation walls W1 (300) on grids — drawn over footings */
  out.push(`<rect x="${X(-0.15)}" y="${Y(32.15)}" width="${58.95 * k + 0.15 * k}" height="${32.3 * k}" fill="none" stroke="${col.wall}" stroke-width="4.5"/>`);
  /* ramp opening in wall E, bay 7–8, and stub */
  out.push(`<rect x="${X(51.35)}" y="${Y(32) - 4}" width="${6.5 * k}" height="8" fill="${C.sheet}"/>`);
  out.push(`<rect x="${X(51.35)}" y="${Y(32) - 44}" width="${6.5 * k}" height="40" fill="${C.hilite}" fill-opacity="0.45" stroke="${C.hiliteInk}" stroke-width="1" stroke-dasharray="4 3"/>`);
  out.push(`<text x="${X(54.6)}" y="${Y(32) - 26}" text-anchor="middle" font-family="${MONO}" font-size="10.5" fill="${C.ink}">RAMP</text>`);
  out.push(`<text x="${X(54.6)}" y="${Y(32) - 13}" text-anchor="middle" font-family="${MONO}" font-size="10.5" fill="${C.ink}">S-301</text>`);
  /* bubbles */
  gx.forEach((x, i) => out.push(bubble(X(x), Y(-4.2), String(i + 1))));
  ["A", "B", "C", "D", "E"].forEach((t, i) => out.push(bubble(X(-4.8), Y(gy[i]), t)));
  /* overall dimension */
  const dy = Y(38.4);
  out.push(`<line x1="${X(-0.15)}" y1="${dy}" x2="${X(58.95)}" y2="${dy}" stroke="${C.inkSoft}" stroke-width="1"/>
    <line x1="${X(-0.15)}" y1="${dy - 6}" x2="${X(-0.15)}" y2="${dy + 6}" stroke="${C.inkSoft}" stroke-width="1"/>
    <line x1="${X(58.95)}" y1="${dy - 6}" x2="${X(58.95)}" y2="${dy + 6}" stroke="${C.inkSoft}" stroke-width="1"/>
    <rect x="${X(18)}" y="${dy - 9}" width="${23 * k}" height="18" fill="${C.sheet}"/>
    <text x="${X(29.4)}" y="${dy + 4}" text-anchor="middle" font-family="${MONO}" font-size="11.5" fill="${C.inkSoft}">59.10 m TO OUTSIDE OF WALLS</text>`);
  /* element tags */
  out.push(tag(X(4.2), Y(1.9), "SF1", col.sof));
  out.push(tag(X(4.2), Y(16), "SF2", col.sf2));
  out.push(tag(X(12.6) + 30, Y(18.6), "F1 ×14", col.f1));
  out.push(tag(X(42) + 6, Y(-1.9), "F2 ×18", col.f2));
  out.push(tag(X(57.0), Y(4.2), "W1 300", C.ink));
  out.push(tag(X(54.6), Y(12), "SOG 150", col.sog));
  out.push(tag(X(10.5), Y(4.4), "SP1", C.ink));
  out.push(tag(X(26.7), Y(14.3), "EP1", C.ink));

  /* key under the plan */
  const ky = 664;
  const key = [
    keyRow(64, ky, (x, y) => `<line x1="${x}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="${C.roofing}" stroke-width="1.8" stroke-dasharray="7 4"/>`, "SOG construction joint · 5 pours"),
    keyRow(64, ky + 26, (x, y) => `<rect x="${x}" y="${y - 7}" width="24" height="14" fill="url(#hShore)" stroke="${C.roofing}" stroke-width="1"/>`, "Cast against shoring — not formed"),
    keyRow(400, ky, (x, y) => `<rect x="${x}" y="${y - 7}" width="24" height="14" fill="url(#hPit)" stroke="${C.ink}" stroke-width="1"/>`, "Pit / sump void — deducted"),
    keyRow(400, ky + 26, (x, y) => `<rect x="${x + 8}" y="${y - 4}" width="8" height="8" fill="${C.ink}"/>`, "C1 column 500 × 500 on F1 pad"),
  ].join("");
  const scale = `<text x="64" y="${ky + 62}" font-family="${MONO}" font-size="11" letter-spacing="0.06em" fill="${C.inkSoft}">METRIC · GRID 8.40 × 8.00 m · T/O FOOTINGS 96.200 · T/O SOG 96.500</text>`;

  const panel = qtyPanel({
    title: "QUANTITIES",
    cols: ["CONC m³", "FORMS m²"],
    rows: [
      { sw: col.sof, o: 0.75, k: "SF1 strip footings", d: "Grids A, E, 8 · 1000×400", v: ["58.8", "117.5"] },
      { sw: col.sf2, o: 0.75, k: "SF2 eccentric strip", d: "Grid 1 · against shoring", v: ["19.8", "13.6"] },
      { sw: col.f1, o: 0.5, k: "F1 column pads ×14", d: "3000×3000×750", v: ["94.5", "126.0"] },
      { sw: col.f2, o: 0.55, k: "F2 pilaster pads ×18", d: "Net of strip overlap", v: ["33.1", "35.6"] },
      { sw: col.raft, o: 0.45, k: "MF1 raft + pits", d: "Core, EP1, SP1, blinding", v: ["105.4", "82.0"] },
      { sw: C.ink, k: "Walls and columns", d: "W1, CW1, PL1, C1", v: ["259.7", "1,595.0"] },
      { sw: col.sog, o: 0.3, k: "SOG 150 · 5 pours", d: "1,741 m² slab · bulkheads", v: ["261.2", "19.0"] },
    ],
    total: { k: "TOTAL · P1 FOUNDATIONS", d: "Ramp on its own sheet (S-301)", v: ["832.4", "1,988.7"] },
    notes: [
      "No waste included — your waste % goes on top.",
      "Each line traces to a dimension on the workbook's",
      "Measurement tab. Same fictitious project as the",
      "free sample workbook at sharpbid.ca.",
    ],
  });

  return svgDoc(s.W, s.H, `<defs>${gridDef("g32", 32, C.lineSoft)}${hatchDef("hShore", C.roofing, 7, 1.3)}${hatchDef("hPit", C.ink, 5, 1)}</defs>
  ${s.head}
  ${out.join("\n  ")}
  ${key}${scale}
  ${panel}
  ${s.foot}`);
}

/* =====================================================================
   2 · ROOFING — roof plan, tapered layout to six drains
   160 ft × 100 ft roof, x east from the west parapet, y south from north.
   ===================================================================== */
function roofing(M) {
  const s = sheet(M, { trade: "ROOFING & ENVELOPE TAKEOFF", colour: C.roofing, drawing: "Roof plan — Div 07", sheet: "A-110" });
  const k = 3.9, X0 = 118, Y0 = 186;
  const X = (f) => X0 + f * k, Y = (f) => Y0 + f * k;
  const out = [];
  /* R1 field */
  out.push(`<rect x="${X(0)}" y="${Y(0)}" width="${160 * k}" height="${100 * k}" fill="${C.concrete}" fill-opacity="0.13"/>`);
  /* drain areas: 3 × 2, hips/valleys from each drain to its area corners */
  const xs = [0, 160 / 3, 320 / 3, 160], ys = [0, 50, 100];
  const drains = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const x1 = xs[i], x2 = xs[i + 1], y1 = ys[j], y2 = ys[j + 1];
    const dx = (x1 + x2) / 2, dy = (y1 + y2) / 2;
    drains.push([dx, dy]);
    [[x1, y1], [x2, y1], [x2, y2], [x1, y2]].forEach(([cx, cy]) =>
      out.push(`<line x1="${X(dx)}" y1="${Y(dy)}" x2="${X(cx)}" y2="${Y(cy)}" stroke="${C.metals}" stroke-width="1.6"/>`));
    /* slope arrows toward the drain from the middle of each high edge */
    [[dx, y1 + 7, dx, dy - 9], [dx, y2 - 7, dx, dy + 9], [x1 + 8, dy, dx - 11, dy], [x2 - 8, dy, dx + 11, dy]].forEach(([ax, ay, bx, by]) =>
      out.push(`<line x1="${X(ax)}" y1="${Y(ay)}" x2="${X(bx)}" y2="${Y(by)}" stroke="${C.inkSoft}" stroke-width="1.1" marker-end="url(#arr)"/>`));
  }
  /* area boundaries = high lines (ridges) */
  [160 / 3, 320 / 3].forEach((x) => out.push(`<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(100)}" stroke="${C.metals}" stroke-width="1" stroke-dasharray="6 4"/>`));
  out.push(`<line x1="${X(0)}" y1="${Y(50)}" x2="${X(160)}" y2="${Y(50)}" stroke="${C.metals}" stroke-width="1" stroke-dasharray="6 4"/>`);
  /* penthouse R2 (40 × 30) with base flashing */
  out.push(`<rect x="${X(108)}" y="${Y(36)}" width="${40 * k}" height="${30 * k}" fill="${C.sheet}"/>`);
  out.push(`<rect x="${X(108)}" y="${Y(36)}" width="${40 * k}" height="${30 * k}" fill="${C.acoustic}" fill-opacity="0.35" stroke="${C.ink}" stroke-width="5"/>`);
  out.push(`<rect x="${X(108) - 5}" y="${Y(36) - 5}" width="${40 * k + 10}" height="${30 * k + 10}" fill="none" stroke="${C.drywall}" stroke-width="2.4"/>`);
  out.push(`<rect x="${X(128) - 50}" y="${Y(51) - 20}" width="100" height="40" fill="${C.sheet}" fill-opacity="0.92"/>`);
  out.push(`<text x="${X(128)}" y="${Y(51) - 4}" text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="500" fill="${C.ink}">PENTHOUSE</text>`);
  out.push(`<text x="${X(128)}" y="${Y(51) + 12}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${C.inkSoft}">R2 · 40'×30'</text>`);
  /* RTU curbs 8 × 5 */
  [[33, 63], [58, 13], [84, 70]].forEach(([x, y]) =>
    out.push(`<rect x="${X(x)}" y="${Y(y)}" width="${8 * k}" height="${5 * k}" fill="${C.hilite}" stroke="${C.ink}" stroke-width="1.6"/>
      <line x1="${X(x)}" y1="${Y(y)}" x2="${X(x + 8)}" y2="${Y(y + 5)}" stroke="${C.ink}" stroke-width="0.8"/>
      <line x1="${X(x + 8)}" y1="${Y(y)}" x2="${X(x)}" y2="${Y(y + 5)}" stroke="${C.ink}" stroke-width="0.8"/>`));
  /* roof hatch 3 × 3 */
  out.push(`<rect x="${X(100)}" y="${Y(70)}" width="${3 * k}" height="${3 * k}" fill="${C.sheet}" stroke="${C.ink}" stroke-width="1.6"/>
    <line x1="${X(100)}" y1="${Y(70)}" x2="${X(103)}" y2="${Y(73)}" stroke="${C.ink}" stroke-width="0.8"/>`);
  /* pipe penetrations */
  [[12, 40], [45, 30], [70, 44], [92, 20], [140, 12], [150, 84], [118, 88], [64, 92], [22, 88]].forEach(([x, y]) =>
    out.push(`<circle cx="${X(x)}" cy="${Y(y)}" r="3.6" fill="${C.sheet}" stroke="${C.ink}" stroke-width="1.4"/>`));
  /* drains */
  drains.forEach(([x, y]) => out.push(`<circle cx="${X(x)}" cy="${Y(y)}" r="8" fill="${C.drywall}" stroke="${C.ink}" stroke-width="1.2"/><circle cx="${X(x)}" cy="${Y(y)}" r="2.6" fill="${C.sheet}"/>`));
  /* overflow scuppers on north and south parapets */
  [[40, 0], [120, 0], [40, 100], [120, 100]].forEach(([x, y]) =>
    out.push(`<rect x="${X(x) - 7}" y="${Y(y) - 6}" width="14" height="12" fill="${C.drywall}" stroke="${C.ink}" stroke-width="1"/>`));
  /* parapet */
  out.push(`<rect x="${X(0)}" y="${Y(0)}" width="${160 * k}" height="${100 * k}" fill="none" stroke="${C.roofing}" stroke-width="7"/>`);
  /* tags */
  out.push(tag(X(26.7), Y(14), "R1", C.concrete));
  out.push(tag(X(80) + 30, Y(25) + 22, "RD-1", C.drywall));
  out.push(tag(X(37), Y(60) - 10, "CURB", C.ink));
  out.push(tag(X(101.5), Y(79), "RH-1", C.ink));
  out.push(tag(X(80), Y(-4.6), "PARAPET · BOTH FACES", C.roofing));
  out.push(tag(X(40), Y(104.6), "OVERFLOW SCUPPER", C.drywall));
  /* dimensions */
  out.push(`<text x="${X(80)}" y="${Y(100) + 46}" text-anchor="middle" font-family="${MONO}" font-size="11.5" fill="${C.inkSoft}">160'-0" × 100'-0" TO INSIDE OF PARAPET · TAPERED ¼" PER FT TO DRAINS</text>`);
  /* key */
  const ky = 664;
  const key = [
    keyRow(64, ky, (x, y) => `<line x1="${x}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="${C.metals}" stroke-width="2"/>`, "Valley line of the tapered layout"),
    keyRow(64, ky + 26, (x, y) => `<line x1="${x}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="${C.metals}" stroke-width="1.2" stroke-dasharray="6 4"/>`, "High line between drain areas"),
    keyRow(420, ky, (x, y) => `<line x1="${x}" y1="${y}" x2="${x + 22}" y2="${y}" stroke="${C.inkSoft}" stroke-width="1.1" marker-end="url(#arr)"/>`, "Slope direction"),
    keyRow(420, ky + 26, (x, y) => `<circle cx="${x + 12}" cy="${y}" r="3.6" fill="${C.sheet}" stroke="${C.ink}" stroke-width="1.4"/>`, "Pipe penetration"),
  ].join("");
  const panel = qtyPanel({
    title: "QUANTITIES · THIS SHEET",
    cols: ["QTY"],
    rows: [
      { sw: C.concrete, o: 0.3, k: "R1 main roof", d: "2-ply SBS · tapered polyiso", v: "14,680", u: "SF" },
      { sw: C.acoustic, o: 0.4, k: "R2 penthouse roof", d: "2-ply SBS · sloped insul.", v: "1,200", u: "SF" },
      { sw: C.roofing, line: true, k: "Parapet flashing", d: "Both faces + metal cap", v: "520", u: "LF" },
      { sw: C.drywall, line: true, k: "Penthouse base flashing", d: "R1 up the R2 walls", v: "140", u: "LF" },
      { sw: C.hilite, k: "RTU curbs 8'×5'", d: "78 LF of curb flashing", v: "3", u: "EA" },
      { sw: C.drywall, dot: true, k: "Roof drains RD-1", d: "Plus 4 overflow scuppers", v: "6", u: "EA" },
      { sw: C.sheet, dot: true, k: "Pipe penetrations", d: "Boots / sealant pockets", v: "9", u: "EA" },
      { sw: C.sheet, k: "Roof hatch RH-1", d: "3'×3' · curb flashing", v: "1", u: "EA" },
    ],
    notes: [
      "R1 = 16,000 SF less penthouse (1,200) and",
      "curbs (120). Openings over 10 SF deducted.",
      "Parapet measured on both faces, cap separate.",
    ],
  });
  return svgDoc(s.W, s.H, `<defs>${gridDef("g32", 32, C.lineSoft)}
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${C.inkSoft}"/></marker></defs>
  ${s.head}
  ${out.join("\n  ")}
  ${key}
  ${panel}
  ${s.foot}`);
}

/* =====================================================================
   3 · GLAZING — north elevation: curtain wall, storefront, punched windows
   80 ft wide; x east from the west end, z up from L1.
   ===================================================================== */
function glazing(M) {
  const s = sheet(M, { trade: "GLAZING & CURTAIN WALL TAKEOFF", colour: C.glazing, drawing: "North elevation — Div 08", sheet: "A-401" });
  const k = 7.9, X0 = 148, Z0 = 604;
  const X = (f) => X0 + f * k, Z = (f) => Z0 - f * k;
  const out = [];
  /* masonry (not in scope) on the east half */
  out.push(`<rect x="${X(40)}" y="${Z(41)}" width="${40 * k}" height="${41 * k}" fill="url(#hMas)" stroke="${C.inkSoft}" stroke-width="1.2"/>`);
  /* CW-1: spandrel and vision bands, x 0–40, z 12–41 */
  const sp = [[12, 15], [24, 28], [37, 41]], vi = [[15, 24], [28, 37]];
  sp.forEach(([a, b]) => out.push(`<rect x="${X(0)}" y="${Z(b)}" width="${40 * k}" height="${(b - a) * k}" fill="${C.ink}" fill-opacity="0.62"/>`));
  vi.forEach(([a, b]) => out.push(`<rect x="${X(0)}" y="${Z(b)}" width="${40 * k}" height="${(b - a) * k}" fill="${C.glazing}" fill-opacity="0.38"/>`));
  for (let x = 0; x <= 40; x += 5) out.push(`<line x1="${X(x)}" y1="${Z(12)}" x2="${X(x)}" y2="${Z(41)}" stroke="${C.ink}" stroke-width="${x % 40 ? 2.2 : 3}"/>`);
  [12, 15, 24, 28, 37, 41].forEach((z) => out.push(`<line x1="${X(0)}" y1="${Z(z)}" x2="${X(40)}" y2="${Z(z)}" stroke="${C.ink}" stroke-width="2.2"/>`));
  /* reflections on vision lites */
  vi.forEach(([a, b]) => { for (let x = 0; x < 40; x += 5) out.push(`<line x1="${X(x + 1)}" y1="${Z(b - 1.5)}" x2="${X(x + 2.6)}" y2="${Z(b - 4.5)}" stroke="${C.sheet}" stroke-width="1.6" opacity="0.7"/>`); });
  /* SF-1 storefront x 0–40, z 0–12 with door pair D1 at x 15–21 */
  out.push(`<rect x="${X(0)}" y="${Z(12)}" width="${40 * k}" height="${12 * k}" fill="${C.glazing}" fill-opacity="0.22"/>`);
  out.push(`<rect x="${X(15)}" y="${Z(8)}" width="${6 * k}" height="${8 * k}" fill="${C.hilite}" fill-opacity="0.55"/>`);
  [0, 5, 10, 15, 21, 25, 30, 35, 40].forEach((x) => out.push(`<line x1="${X(x)}" y1="${Z(0)}" x2="${X(x)}" y2="${Z(12)}" stroke="${C.ink}" stroke-width="${x % 40 ? 2 : 3}"/>`));
  out.push(`<line x1="${X(18)}" y1="${Z(0)}" x2="${X(18)}" y2="${Z(8)}" stroke="${C.ink}" stroke-width="1.6"/>`);
  out.push(`<line x1="${X(15)}" y1="${Z(8)}" x2="${X(21)}" y2="${Z(8)}" stroke="${C.ink}" stroke-width="2"/>`);
  out.push(`<line x1="${X(0)}" y1="${Z(12)}" x2="${X(40)}" y2="${Z(12)}" stroke="${C.ink}" stroke-width="3"/>`);
  [16.9, 19.1].forEach((x) => out.push(`<line x1="${X(x)}" y1="${Z(3.4)}" x2="${X(x)}" y2="${Z(4.6)}" stroke="${C.ink}" stroke-width="2.4"/>`));
  /* W1 punched windows 5 × 6 ft, three per level */
  const wins = [];
  [[3, 9], [17, 23], [30, 36]].forEach(([a, b]) => [45, 57.5, 70].forEach((x) => wins.push([x, a, b])));
  wins.forEach(([x, a, b]) => out.push(`<rect x="${X(x)}" y="${Z(b)}" width="${5 * k}" height="${(b - a) * k}" fill="${C.drywall}" fill-opacity="0.4" stroke="${C.ink}" stroke-width="2.2"/>
    <line x1="${X(x + 2.5)}" y1="${Z(b)}" x2="${X(x + 2.5)}" y2="${Z(a)}" stroke="${C.ink}" stroke-width="1.4"/>`));
  /* perimeter sealant highlight */
  out.push(`<rect x="${X(0) - 3}" y="${Z(41) - 3}" width="${40 * k + 6}" height="${41 * k + 3}" fill="none" stroke="${C.painting}" stroke-width="2" stroke-dasharray="5 3"/>`);
  wins.forEach(([x, a, b]) => out.push(`<rect x="${X(x) - 3}" y="${Z(b) - 3}" width="${5 * k + 6}" height="${(b - a) * k + 6}" fill="none" stroke="${C.painting}" stroke-width="1.6" stroke-dasharray="5 3"/>`));
  /* grade and levels */
  out.push(`<line x1="${X(-2)}" y1="${Z(0)}" x2="${X(82)}" y2="${Z(0)}" stroke="${C.ink}" stroke-width="3"/>`);
  [["L1", 0, "0'-0\""], ["L2", 14, "14'-0\""], ["L3", 27, "27'-0\""], ["ROOF", 40, "40'-0\""]].forEach(([n, z, e]) => {
    out.push(`<line x1="${X(-12)}" y1="${Z(z)}" x2="${X(-1)}" y2="${Z(z)}" stroke="${C.inkSoft}" stroke-width="1" stroke-dasharray="6 4"/>`);
    out.push(`<text x="${X(-12)}" y="${Z(z) - 6}" font-family="${MONO}" font-size="11.5" font-weight="500" fill="${C.ink}">${n}</text>`);
    out.push(`<text x="${X(-12)}" y="${Z(z) + 14}" font-family="${MONO}" font-size="10.5" fill="${C.inkSoft}">${esc(e)}</text>`);
  });
  out.push(`<rect x="${X(60) - 92}" y="${Z(26.4) - 12}" width="184" height="20" fill="${C.sheet}" fill-opacity="0.92"/>
    <text x="${X(60)}" y="${Z(26.4) + 3}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${C.inkSoft}">MASONRY · NOT IN SCOPE</text>`);
  /* type tags */
  out.push(tag(X(20), Z(20.6), "CW-1 VISION", C.glazing));
  out.push(tag(X(20), Z(26), "CW-1 SPANDREL", C.ink));
  out.push(tag(X(7.5), Z(10.2), "SF-1", C.glazing));
  out.push(tag(X(18), Z(10.2), "D1", C.hiliteInk));
  out.push(tag(X(72.5), Z(39), "W1 ×9", C.drywall));
  out.push(`<text x="${X(40)}" y="${Z(0) + 34}" text-anchor="middle" font-family="${MONO}" font-size="11.5" fill="${C.inkSoft}">80'-0" FACADE · CURTAIN WALL ON 5'-0" MODULE · STOREFRONT BELOW</text>`);
  /* key */
  const ky = 686;
  const key = [
    keyRow(64, ky, (x, y) => `<rect x="${x}" y="${y - 7}" width="24" height="14" fill="url(#hMas)" stroke="${C.inkSoft}" stroke-width="1"/>`, "Masonry by others"),
    keyRow(300, ky, (x, y) => `<line x1="${x}" y1="${y}" x2="${x + 24}" y2="${y}" stroke="${C.painting}" stroke-width="2" stroke-dasharray="5 3"/>`, "Perimeter sealant measured"),
  ].join("");
  const panel = qtyPanel({
    title: "QUANTITIES · THIS ELEVATION",
    cols: ["QTY"],
    rows: [
      { sw: C.glazing, o: 0.45, k: "CW-1 vision", d: "Insulating glass units", v: "720", u: "SF" },
      { sw: C.ink, o: 0.62, k: "CW-1 spandrel", d: "Insulated back-pan", v: "440", u: "SF" },
      { sw: C.ink, line: true, k: "CW-1 framing", d: "Verticals 261 + horiz. 240", v: "501", u: "LF" },
      { sw: C.glazing, o: 0.25, k: "SF-1 storefront", d: "Net of door opening", v: "432", u: "SF" },
      { sw: C.hilite, o: 0.7, k: "D1 entrance pair", d: "6'×8' · transom over", v: "1", u: "PR" },
      { sw: C.drywall, o: 0.45, k: "W1 punched windows", d: "5'×6' · 270 SF total", v: "9", u: "EA" },
      { sw: C.painting, line: true, dash: "5 3", k: "Perimeter sealant", d: "CW 138 · SF 64 · W1 198", v: "400", u: "LF" },
    ],
    notes: [
      "CW-1: 40' × 29' = 1,160 SF = 720 vision",
      "+ 440 spandrel. Glass and framing kept",
      "apart, so the glass quote and the metal",
      "quote run on the same numbers.",
    ],
  });
  return svgDoc(s.W, s.H, `<defs>${gridDef("g32", 32, C.lineSoft)}${hatchDef("hMas", "#B9C1C4", 8, 1.2)}</defs>
  ${s.head}
  ${out.join("\n  ")}
  ${key}
  ${panel}
  ${s.foot}`);
}

/* =====================================================================
   4 · MISC METALS — exit stair plan, typical storey (stair serves L1–L4)
   Inside of CMU enclosure 19'-0" × 9'-0"; x east, y south, feet.
   ===================================================================== */
function metals(M) {
  const s = sheet(M, { trade: "MISC METALS TAKEOFF · DIV 05", colour: C.metals, drawing: "Exit stair 2 — typical", sheet: "A-501" });
  const k = 30, X0 = 150, Y0 = 214;
  const X = (f) => X0 + f * k, Y = (f) => Y0 + f * k;
  const out = [];
  const wall = 190 / 304.8; /* 190 CMU */
  /* CMU enclosure */
  out.push(`<rect x="${X(-wall)}" y="${Y(-wall)}" width="${(19 + 2 * wall) * k}" height="${(9 + 2 * wall) * k}" fill="url(#hCmu)" stroke="${C.ink}" stroke-width="1.5"/>`);
  out.push(`<rect x="${X(0)}" y="${Y(0)}" width="${19 * k}" height="${9 * k}" fill="${C.sheet}" stroke="${C.ink}" stroke-width="1.5"/>`);
  /* door in the west wall at the floor landing: 3'-4" opening, y 2.84–6.17, swings into the stair */
  const d1 = 2.84, d2 = 6.17;
  out.push(`<rect x="${X(-wall) - 1}" y="${Y(d1)}" width="${wall * k + 2}" height="${(d2 - d1) * k}" fill="${C.sheet}"/>`);
  out.push(`<line x1="${X(0)}" y1="${Y(d2)}" x2="${X(3.33)}" y2="${Y(d2)}" stroke="${C.inkSoft}" stroke-width="1.6"/>
    <path d="M ${X(3.33)} ${Y(d2)} A ${3.33 * k} ${3.33 * k} 0 0 0 ${X(0)} ${Y(d1)}" fill="none" stroke="${C.inkSoft}" stroke-width="1" stroke-dasharray="3 3"/>`);
  out.push(`<line x1="${X(-wall / 2)}" y1="${Y(d1 - 0.67)}" x2="${X(-wall / 2)}" y2="${Y(d2 + 0.67)}" stroke="${C.roofing}" stroke-width="6"/>`);
  /* louvre in the east wall at the landing, y 2–7 (5'-0"), lintel L2 */
  out.push(`<rect x="${X(19) - 1}" y="${Y(2)}" width="${wall * k + 2}" height="${5 * k}" fill="${C.sheet}" stroke="${C.inkSoft}" stroke-width="1"/>`);
  for (let i = 0; i < 6; i++) out.push(`<line x1="${X(19) + 2}" y1="${Y(2.4 + i * 0.8)}" x2="${X(19 + wall) - 2}" y2="${Y(2.8 + i * 0.8)}" stroke="${C.inkSoft}" stroke-width="1"/>`);
  out.push(`<line x1="${X(19 + wall / 2)}" y1="${Y(2 - 0.67)}" x2="${X(19 + wall / 2)}" y2="${Y(7 + 0.67)}" stroke="${C.roofing}" stroke-width="6"/>`);
  /* flights: 11 treads at 11" = 10'-1", x 4 → 14.08. South flight UP, north flight DN (both east from the floor landing) */
  const run = 11 * 11 / 12, xa = 4, xb = 4 + run;
  [[5, 9, "UP"], [0, 4, "DN"]].forEach(([ya, yb, word]) => {
    out.push(`<rect x="${X(xa)}" y="${Y(ya)}" width="${run * k}" height="${(yb - ya) * k}" fill="${C.metals}" fill-opacity="0.16"/>`);
    for (let i = 0; i <= 11; i++) out.push(`<line x1="${X(xa + i * 11 / 12)}" y1="${Y(ya)}" x2="${X(xa + i * 11 / 12)}" y2="${Y(yb)}" stroke="${C.ink}" stroke-width="1.2"/>`);
    out.push(`<line x1="${X(xa)}" y1="${Y(ya) + 2}" x2="${X(xb)}" y2="${Y(ya) + 2}" stroke="${C.metals}" stroke-width="4"/>`);
    out.push(`<line x1="${X(xa)}" y1="${Y(yb) - 2}" x2="${X(xb)}" y2="${Y(yb) - 2}" stroke="${C.metals}" stroke-width="4"/>`);
    const mid = (ya + yb) / 2;
    out.push(`<rect x="${X(xa + 0.25)}" y="${Y(mid) - 10}" width="28" height="20" fill="${C.sheet}"/>`);
    out.push(`<text x="${X(xa + 0.25) + 14}" y="${Y(mid) + 5}" text-anchor="middle" font-family="${MONO}" font-size="12" font-weight="500" fill="${C.ink}">${word}</text>`);
    out.push(`<line x1="${X(xa + 1.3)}" y1="${Y(mid)}" x2="${X(xb - 0.5)}" y2="${Y(mid)}" stroke="${C.ink}" stroke-width="1.4" marker-end="url(#arr)"/>`);
  });
  /* break line across the UP flight */
  out.push(`<rect x="${X(10.2)}" y="${Y(5) + 3}" width="${0.6 * k}" height="${4 * k - 6}" fill="${C.sheet}" fill-opacity="0.0"/>`);
  out.push(`<path d="M ${X(9.9)} ${Y(9)} L ${X(10.3)} ${Y(7.3)} L ${X(9.8)} ${Y(6.8)} L ${X(10.2)} ${Y(5)}" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);
  /* intermediate landing LF-1 */
  out.push(`<rect x="${X(xb)}" y="${Y(0)}" width="${(19 - xb) * k}" height="${9 * k}" fill="${C.concrete}" fill-opacity="0.2" stroke="${C.metals}" stroke-width="2"/>`);
  out.push(`<text x="${X((xb + 19) / 2)}" y="${Y(4.5) - 4}" text-anchor="middle" font-family="${MONO}" font-size="11.5" font-weight="500" fill="${C.ink}">LANDING</text>
    <text x="${X((xb + 19) / 2)}" y="${Y(4.5) + 12}" text-anchor="middle" font-family="${MONO}" font-size="11" fill="${C.inkSoft}">LF-1</text>`);
  out.push(`<text x="${X(2)}" y="${Y(1.3)}" text-anchor="middle" font-family="${MONO}" font-size="11.5" font-weight="500" fill="${C.ink}">FLOOR</text>`);
  /* handrail HR-1 on both walls with 12" extensions */
  out.push(`<line x1="${X(xa - 1)}" y1="${Y(9) - 7}" x2="${X(xb + 1)}" y2="${Y(9) - 7}" stroke="${C.drywall}" stroke-width="5" stroke-linecap="round"/>`);
  out.push(`<line x1="${X(xa - 1)}" y1="${Y(0) + 7}" x2="${X(xb + 1)}" y2="${Y(0) + 7}" stroke="${C.drywall}" stroke-width="5" stroke-linecap="round"/>`);
  /* guard GR-1 around the well */
  out.push(`<path d="M ${X(xa)} ${Y(4) + 4} L ${X(xb + 0.45)} ${Y(4) + 4} L ${X(xb + 0.45)} ${Y(5) - 4} L ${X(xa)} ${Y(5) - 4}" fill="none" stroke="${C.acoustic}" stroke-width="5" stroke-linejoin="round"/>`);
  /* embed plates EP-1 at stringer ends */
  [[xa, 0], [xa, 4], [xa, 5], [xa, 9], [xb, 0], [xb, 4], [xb, 5], [xb, 9]].forEach(([x, y]) => {
    const yy = y === 0 || y === 5 ? Y(y) + 2 : Y(y) - 2;
    out.push(`<rect x="${X(x) - 5}" y="${yy - 5}" width="10" height="10" fill="${C.painting}" stroke="${C.ink}" stroke-width="1"/>`);
  });
  /* tags */
  out.push(tag(X(-wall) - 26, Y(4.5), "L1", C.roofing));
  out.push(tag(X(19 + wall) + 28, Y(4.5), "L2", C.roofing));
  out.push(tag(X(9), Y(9) + 32, "HR-1", C.drywall));
  out.push(tag(X(12.4), Y(4.5), "GR-1", C.acoustic));
  out.push(tag(X(xa) - 30, Y(9) + 32, "EP-1", C.painting));
  out.push(tag(X(7.6), Y(2.0) - 2, "ST-1", C.metals));
  out.push(`<text x="${X(9.5)}" y="${Y(-wall) - 22}" text-anchor="middle" font-family="${MONO}" font-size="11.5" fill="${C.inkSoft}">19'-0" × 9'-0" INSIDE · FLOOR-TO-FLOOR 14'-0" · 24 RISERS AT 7"</text>`);

  /* flight in section: 12 risers at 7", 11 treads at 11"; 1.6 px per inch */
  const p = 1.6, sx = 96, sy = 748, R = 7 * p, T = 11 * p;
  let d = `M ${sx} ${sy}`;
  for (let i = 1; i <= 12; i++) { d += ` L ${sx + (i - 1) * T} ${sy - i * R}`; if (i < 12) d += ` L ${sx + i * T} ${sy - i * R}`; }
  const n0 = [sx, sy - R], n1 = [sx + 11 * T, sy - 12 * R];
  const m = (n1[1] - n0[1]) / (n1[0] - n0[0]);
  const yAt = (x, off) => n0[1] + (x - n0[0]) * m + off;
    out.push(`<line x1="${sx - 6}" y1="${yAt(sx - 6, 24)}" x2="${n1[0] + 10}" y2="${yAt(n1[0] + 10, 24)}" stroke="${C.metals}" stroke-width="7"/>`);
  out.push(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="2"/>`);
  out.push(`<line x1="${sx - 19}" y1="${yAt(sx - 19, -34 * p)}" x2="${n1[0] + 19}" y2="${yAt(n1[0] + 19, -34 * p)}" stroke="${C.drywall}" stroke-width="4" stroke-linecap="round"/>`);
  [0, 5.5, 11].forEach((t) => { const x = sx + t * T; out.push(`<line x1="${x}" y1="${yAt(x, 0)}" x2="${x}" y2="${yAt(x, -34 * p)}" stroke="${C.drywall}" stroke-width="1.4"/>`); });
  const tx = n1[0] + 44;
  out.push(`<text x="${tx}" y="${sy - 124}" font-family="${MONO}" font-size="11" letter-spacing="0.12em" fill="${C.inkSoft}">ST-1 IN SECTION · 12 RISERS · 11 TREADS</text>`);
  out.push(`<text x="${tx}" y="${sy - 96}" font-family="${SANS}" font-size="12.5" fill="${C.inkSoft}">Channel stringers · pan treads for concrete fill</text>`);
  out.push(`<text x="${tx}" y="${sy - 76}" font-family="${SANS}" font-size="12.5" fill="${C.inkSoft}">HR-1 at 34"–38" above the nosings, 12" extensions</text>`);
  out.push(`<text x="${tx}" y="${sy - 56}" font-family="${SANS}" font-size="12.5" fill="${C.inkSoft}">Enclosure: 190 CMU by others — lintels by mark</text>`);

  const panel = qtyPanel({
    title: "QUANTITIES · L1 TO L4",
    cols: ["QTY"],
    rows: [
      { sw: C.metals, o: 0.5, k: "ST-1 steel pan flights", d: "11 treads · 12 risers each", v: "6", u: "EA" },
      { sw: C.concrete, o: 0.35, k: "LF-1 landing frames", d: "Intermediate · pan for fill", v: "3", u: "EA" },
      { sw: C.drywall, line: true, k: "HR-1 wall handrail", d: "Detail 5/A-501 · 12\" ext.", v: "72", u: "LF" },
      { sw: C.acoustic, line: true, k: "GR-1 guard + handrail", d: "Detail 6/A-501 · at well", v: "66", u: "LF" },
      { sw: C.roofing, line: true, k: "L1 lintels · doors", d: "L102×102×9.5 · 18.7 LF", v: "4", u: "EA" },
      { sw: C.roofing, line: true, k: "L2 lintels · louvres", d: "L127×89×9.5 · 19.0 LF", v: "3", u: "EA" },
      { sw: C.painting, k: "EP-1 embed plates", d: "Stringer bearing at slabs", v: "24", u: "EA" },
    ],
    notes: [
      "3 storeys × 2 flights. Rails by detail number",
      "in lineal feet; lintels by mark, each with",
      "8\" bearing per end. A fabrication-ready list,",
      "not a lump sum.",
    ],
  });
  return svgDoc(s.W, s.H, `<defs>${gridDef("g32", 32, C.lineSoft)}
    <pattern id="hCmu" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M 0 0 L 0 8 M 0 0 L 8 0" stroke="#9AA6AD" stroke-width="1"/></pattern>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${C.ink}"/></marker></defs>
  ${s.head}
  ${out.join("\n  ")}
  ${panel}
  ${s.foot}`);
}

/* ============================================================ */
const ASSETS = [
  { file: "gbp-concrete-foundation-plan", make: concrete },
  { file: "gbp-roofing-roof-plan", make: roofing },
  { file: "gbp-glazing-elevation", make: glazing },
  { file: "gbp-misc-metals-stair", make: metals },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const FONTS = fontCss();
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const mp = await browser.newPage();
  await mp.setContent(`<style>${FONTS}</style><canvas id="c"></canvas>`, { waitUntil: "load" });
  const M = await mp.evaluate(async () => {
    await document.fonts.load('800 100px "Big Shoulders"');
    await document.fonts.ready;
    const ctx = document.getElementById("c").getContext("2d");
    ctx.font = '800 100px "Big Shoulders"';
    if (!/Big Shoulders/.test(ctx.font)) throw new Error("Big Shoulders did not apply");
    if ("letterSpacing" in ctx) ctx.letterSpacing = "1px";
    const g = (t) => { const m = ctx.measureText(t); return { w: m.width, cap: m.actualBoundingBoxAscent }; };
    return { sharp: g("SHARP"), bid: g("BID") };
  });
  await mp.close();
  for (const a of ASSETS) {
    const svg = a.make(M);
    fs.writeFileSync(path.join(OUT, a.file + ".svg"), svg);
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}
      html,body{margin:0;padding:0;background:${C.sheet}}svg{display:block}</style></head><body>${svg}</body></html>`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const png = path.join(OUT, a.file + ".png");
    await page.screenshot({ path: png, type: "png" });
    await page.close();
    console.log(a.file.padEnd(34) + (fs.statSync(png).size / 1024).toFixed(0) + " KB");
  }
  await browser.close();
})();
