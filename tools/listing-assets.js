#!/usr/bin/env node
/* Generate the listing / advertising image assets in assets/listings/.
 *
 * Every asset is authored as SVG (committed, so it can be re-rendered or
 * edited later) and rasterized to PNG at exact pixel size through headless
 * Chromium. Brand colours and fonts come from the site's own design system.
 *
 * The depicted project is fictitious and is labelled as such on every plan.
 *
 *   node tools/listing-assets.js            write SVGs and render PNGs
 *   node tools/listing-assets.js --svg-only skip rasterizing
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "assets", "listings");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const svgOnly = process.argv.includes("--svg-only");

/* ---------- brand tokens, mirroring assets/styles.css ---------- */
const C = {
  sheet: "#FAFBF9", paper: "#F0F3EE", ink: "#16232B", inkSoft: "#46575F",
  line: "#D7DDD5", lineSoft: "#E6EAE3", hilite: "#FFD84D", hiliteInk: "#7A6100",
  flooring: "#2FA55F", drywall: "#3E8DE3", glazing: "#21A8BC", metals: "#E0701F",
  painting: "#C94B9B", concrete: "#74838F", acoustic: "#6E5BD0", roofing: "#B4342B", framing: "#8A6A3B",
};
const DISPLAY = "Big Shoulders, 'Arial Narrow', sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const SANS = "'IBM Plex Sans', Helvetica, Arial, sans-serif";
const LS = "0.01em"; /* wordmark letter-spacing, em so it scales linearly */

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- fonts: fetched once, inlined only into the render page ---------- */
function curl(url, binary) {
  return execFileSync("curl", ["-sSL", "--max-time", "40", "-A", UA, url],
    { encoding: binary ? "buffer" : "utf8", maxBuffer: 32 * 1024 * 1024 });
}
function face(query, family, weight) {
  const css = curl("https://fonts.googleapis.com/css2?family=" + query + "&display=swap");
  const block = css.split("/*").find((b) => b.trim().startsWith("latin */") && b.includes("font-weight: " + weight));
  const m = (block || "").match(/url\((https:[^)]+\.woff2)\)/);
  if (!m) throw new Error("no latin woff2 for " + family + " " + weight);
  return `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(data:font/woff2;base64,${curl(m[1], true).toString("base64")}) format('woff2')}`;
}

/* ---------- reusable pieces ---------- */
const gridDef = (id, step, colour, sw) => `
  <pattern id="${id}" width="${step}" height="${step}" patternUnits="userSpaceOnUse">
    <path d="M ${step} 0 L 0 0 0 ${step}" fill="none" stroke="${colour}" stroke-width="${sw || 1}"/>
  </pattern>`;

/* wordmark, laid out from measured ink bounds so the highlight hugs the caps */
function wordmark(M, x, baseline, size, opts) {
  const o = opts || {};
  const s = size / 100;
  const sw = M.sharp.w * s, bw = M.bid.w * s, cap = M.bid.cap * s;
  const gap = size * 0.06, padX = size * 0.14, padY = size * 0.11;
  const boxX = x + sw + gap;
  const boxW = bw + padX * 2;
  const boxY = baseline - cap - padY;
  const boxH = cap + padY * 2;
  const inkC = o.ink || C.ink;
  return {
    width: sw + gap + boxW,
    capTop: baseline - M.sharp.cap * s,
    boxTop: boxY, boxBottom: boxY + boxH,
    svg: `<g>
    <text x="${x}" y="${baseline}" font-family="${DISPLAY}" font-weight="800" font-size="${size}" letter-spacing="${LS}" fill="${inkC}">SHARP</text>
    <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" fill="${C.hilite}"/>
    <text x="${boxX + padX}" y="${baseline}" font-family="${DISPLAY}" font-weight="800" font-size="${size}" letter-spacing="${LS}" fill="${C.ink}">BID</text>
  </g>`,
  };
}

/* stacked wordmark for the square mark, vertically centred on cy */
function wordmarkStacked(M, cx, cy, size) {
  const s = size / 100;
  const bw = M.bid.w * s, capS = M.sharp.cap * s, capB = M.bid.cap * s;
  const padX = size * 0.14, padY = size * 0.11, lead = size * 0.13;
  const boxW = bw + padX * 2, boxH = capB + padY * 2;
  const blockH = capS + lead + boxH;
  const top = cy - blockH / 2;
  const b1 = top + capS;
  const boxY = top + capS + lead;
  const b2 = boxY + padY + capB;
  return {
    top, bottom: boxY + boxH,
    svg: `<g>
    <text x="${cx}" y="${b1}" text-anchor="middle" font-family="${DISPLAY}" font-weight="800" font-size="${size}" letter-spacing="${LS}" fill="${C.ink}">SHARP</text>
    <rect x="${cx - boxW / 2}" y="${boxY}" width="${boxW}" height="${boxH}" fill="${C.hilite}"/>
    <text x="${cx}" y="${b2}" text-anchor="middle" font-family="${DISPLAY}" font-weight="800" font-size="${size}" letter-spacing="${LS}" fill="${C.ink}">BID</text>
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

/* ============================================================
   PLAN GEOMETRY — one fictitious sample floor, shown three ways
   ============================================================ */
const PLAN = { x: 90, y: 128, w: 1020, h: 544 };
const ROOMS = [
  { id: "T1", x: 90, y: 128, w: 340, h: 240, name: "OPEN OFFICE A" },
  { id: "T2", x: 430, y: 128, w: 270, h: 240, name: "MEETING 201" },
  { id: "T3", x: 700, y: 128, w: 200, h: 240, name: "OFFICE 202" },
  { id: "T4", x: 900, y: 128, w: 210, h: 240, name: "WASHROOM" },
  { id: "CO", x: 90, y: 368, w: 1020, h: 70, name: "CORRIDOR 200" },
  { id: "B1", x: 90, y: 438, w: 380, h: 234, name: "OPEN OFFICE B" },
  { id: "B2", x: 470, y: 438, w: 270, h: 234, name: "BREAKOUT" },
  { id: "B3", x: 740, y: 438, w: 200, h: 234, name: "STORAGE" },
  { id: "B4", x: 940, y: 438, w: 170, h: 234, name: "JANITOR" },
];
/* interior partitions, typed */
const WALLS = [
  { t: "P2", x1: 430, y1: 128, x2: 430, y2: 368 },
  { t: "P2", x1: 700, y1: 128, x2: 700, y2: 368 },
  { t: "P3", x1: 900, y1: 128, x2: 900, y2: 368 },
  { t: "P3", x1: 90, y1: 368, x2: 1110, y2: 368 },
  { t: "P3", x1: 90, y1: 438, x2: 1110, y2: 438 },
  { t: "P1", x1: 470, y1: 438, x2: 470, y2: 672 },
  { t: "P1", x1: 740, y1: 438, x2: 740, y2: 672 },
  { t: "P3", x1: 940, y1: 438, x2: 940, y2: 672 },
];
const DOORS = [
  { x: 250, y: 368, up: true }, { x: 545, y: 368, up: true },
  { x: 780, y: 368, up: true }, { x: 985, y: 368, up: true },
  { x: 260, y: 438, up: false }, { x: 590, y: 438, up: false },
  { x: 820, y: 438, up: false }, { x: 1010, y: 438, up: false },
];

function doorSvg(d) {
  const g = 46, a = 40;
  const leafY = d.up ? d.y - a : d.y + a;
  const sweep = d.up ? 1 : 0;
  return `<rect x="${d.x}" y="${d.y - 5}" width="${g}" height="10" fill="${C.sheet}"/>
    <line x1="${d.x}" y1="${d.y}" x2="${d.x}" y2="${leafY}" stroke="${C.inkSoft}" stroke-width="1.6"/>
    <path d="M ${d.x} ${leafY} A ${a} ${a} 0 0 ${sweep} ${d.x + a} ${d.y}" fill="none" stroke="${C.inkSoft}" stroke-width="1" stroke-dasharray="3 3"/>`;
}

/* plan sheet chrome: frame, header, legend strip, title block */
function sheet(M, opts) {
  const W = 1200, H = 900;
  const wm = wordmark(M, 52, 74, 34);
  const cells = [
    { l: "PROJECT", v: "SharpBid Estimating · Sample project · Fictitious", w: 560 },
    { l: "DRAWING", v: opts.drawing, w: 380 },
    { l: "SHEET", v: opts.sheet, w: 212 },
  ];
  let cx = 24;
  const tb = cells.map((c, i) => {
    const g = `<g>
      ${i ? `<line x1="${cx}" y1="772" x2="${cx}" y2="876" stroke="${C.line}" stroke-width="1"/>` : ""}
      <text x="${cx + 18}" y="800" font-family="${MONO}" font-size="12" letter-spacing="0.14em" fill="${C.inkSoft}">${esc(c.l)}</text>
      <text x="${cx + 18}" y="834" font-family="${MONO}" font-size="${c.l === "PROJECT" ? 17 : 18}" font-weight="500" fill="${C.ink}">${esc(c.v)}</text>
    </g>`;
    cx += c.w;
    return g;
  }).join("");

  return {
    W, H,
    head: `<rect width="${W}" height="${H}" fill="${C.sheet}"/>
  <rect width="${W}" height="${H}" fill="url(#g32)"/>
  <rect x="24" y="24" width="1152" height="852" fill="none" stroke="${C.ink}" stroke-width="3"/>
  <line x1="24" y1="96" x2="1176" y2="96" stroke="${C.ink}" stroke-width="1.5"/>
  ${wm.svg}
  <text x="1152" y="66" text-anchor="end" font-family="${MONO}" font-size="15" letter-spacing="0.16em" fill="${C.inkSoft}">${esc(opts.header)}</text>
  <text x="1152" y="86" text-anchor="end" font-family="${MONO}" font-size="12" letter-spacing="0.14em" fill="${C.inkSoft}">COLOUR-CODED TAKEOFF MARKUP</text>`,
    foot: `<line x1="24" y1="772" x2="1176" y2="772" stroke="${C.ink}" stroke-width="1.5"/>
  ${tb}
  ${tradeBar(24, 869, 1152, 7)}`,
  };
}

/* legend strip sitting between the plan and the title block */
function legend(entries, title) {
  const x0 = 90, y0 = 706, w = 1020, h = 50;
  const seg = w / entries.length;
  const items = entries.map((e, i) => {
    const x = x0 + i * seg + 16;
    const sw = e.pattern
      ? `<rect x="${x}" y="${y0 + 17}" width="30" height="14" fill="${C.sheet}" stroke="${C.ink}" stroke-width="1"/><rect x="${x}" y="${y0 + 17}" width="30" height="14" fill="url(#actSm)" stroke="${C.ink}" stroke-width="1"/>`
      : `<rect x="${x}" y="${y0 + 17}" width="30" height="14" fill="${e.c}" ${e.o ? `opacity="${e.o}"` : ""} stroke="${C.ink}" stroke-width="1"/>`;
    return `${sw}
      <text x="${x + 40}" y="${y0 + 24}" font-family="${MONO}" font-size="14" font-weight="500" fill="${C.ink}">${esc(e.k)}</text>
      <text x="${x + 40}" y="${y0 + 40}" font-family="${SANS}" font-size="12.5" fill="${C.inkSoft}">${esc(e.d)}</text>`;
  }).join("");
  return `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${C.sheet}" stroke="${C.line}" stroke-width="1"/>
    <text x="${x0}" y="${y0 - 10}" font-family="${MONO}" font-size="12" letter-spacing="0.14em" fill="${C.inkSoft}">${esc(title)}</text>
    ${items}`;
}

const roomLabel = (r, lines, halo) => {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const start = cy - ((lines.length - 1) * 19) / 2;
  const hw = Math.max(...lines.map((L) => L.length)) * 8.8 + 26;
  const bg = halo
    ? `<rect x="${cx - hw / 2}" y="${start - 17}" width="${hw}" height="${lines.length * 19 + 10}" fill="${C.sheet}" opacity="0.88"/>`
    : "";
  return bg + lines.map((L, i) =>
    `<text x="${cx}" y="${start + i * 19}" text-anchor="middle" font-family="${MONO}" font-size="${i ? 13 : 14.5}" font-weight="${i ? 400 : 500}" fill="${i ? C.inkSoft : C.ink}">${esc(L)}</text>`).join("");
};

const outerWalls = () =>
  `<rect x="${PLAN.x}" y="${PLAN.y}" width="${PLAN.w}" height="${PLAN.h}" fill="none" stroke="${C.ink}" stroke-width="6"/>`;

/* ---------- 06 · partition plan ---------- */
function planPartitions(M) {
  const s = sheet(M, { header: "SHEET A-201", drawing: "Partition plan — Level 2", sheet: "A-201" });
  const col = { P1: C.drywall, P2: C.acoustic, P3: C.roofing };
  const walls = WALLS.map((w) =>
    `<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="${col[w.t]}" stroke-width="7" stroke-linecap="square"/>`).join("");
  const marks = [
    { t: "P1", x: 600, y: 628, lx: 470, ly: 628 },
    { t: "P2", x: 612, y: 182, lx: 700, ly: 182 },
    { t: "P3", x: 330, y: 404, lx: 330, ly: 438 },
    { t: "P3", x: 1022, y: 318, lx: 900, ly: 318 },
  ].map((m) => `<line x1="${m.x}" y1="${m.y}" x2="${m.lx}" y2="${m.ly}" stroke="${C.ink}" stroke-width="1"/>
    <circle cx="${m.x}" cy="${m.y}" r="17" fill="${C.sheet}" stroke="${C.ink}" stroke-width="1.6"/>
    <text x="${m.x}" y="${m.y + 5}" text-anchor="middle" font-family="${MONO}" font-size="13" font-weight="500" fill="${C.ink}">${m.t}</text>`).join("");
  const labels = ROOMS.map((r) => roomLabel(r, [r.name])).join("");
  return svgDoc(s.W, s.H, `<defs>${gridDef("g32", 32, C.lineSoft)}</defs>
  ${s.head}
  ${outerWalls()}
  ${walls}
  ${DOORS.map(doorSvg).join("")}
  ${labels}
  ${marks}
  ${legend([
    { k: "P1", d: "Standard partition, 1 layer e/s", c: C.drywall },
    { k: "P2", d: "Acoustic partition, batt insulation", c: C.acoustic },
    { k: "P3", d: "1 hr rated, 2 layers e/s", c: C.roofing },
    { k: "EXT", d: "Existing exterior wall — not in scope", c: C.ink },
  ], "PARTITION TYPES")}
  ${s.foot}`);
}

/* ---------- 07 · flooring plan ---------- */
const FINISH = {
  CPT: { c: C.flooring, d: "Carpet tile, quarter-turn" },
  LVT: { c: C.hilite, d: "Resilient tile, glue-down" },
  PT: { c: C.drywall, d: "Porcelain tile, wet areas" },
  SV: { c: C.glazing, d: "Sheet vinyl, welded seams" },
};
const ROOM_FINISH = {
  T1: ["CPT-1", "1,860 SF"], T2: ["CPT-1", "1,120 SF"], T3: ["CPT-1", "960 SF"],
  T4: ["PT-1", "410 SF"], CO: ["LVT-1", "1,240 SF"], B1: ["CPT-1", "2,040 SF"],
  B2: ["LVT-1", "900 SF"], B3: ["SV-1", "620 SF"], B4: ["SV-1", "300 SF"],
};
function planFlooring(M) {
  const s = sheet(M, { header: "SHEET A-501", drawing: "Finish plan — Level 2", sheet: "A-501" });
  const fills = ROOMS.map((r) => {
    const code = ROOM_FINISH[r.id][0].split("-")[0];
    return `<rect x="${r.x + 3}" y="${r.y + 3}" width="${r.w - 6}" height="${r.h - 6}" fill="${FINISH[code].c}" opacity="0.42"/>`;
  }).join("");
  const grid = ROOMS.map((r) =>
    `<line x1="${r.x}" y1="${r.y}" x2="${r.x + r.w}" y2="${r.y}" stroke="${C.ink}" stroke-width="2"/>
     <line x1="${r.x}" y1="${r.y + r.h}" x2="${r.x + r.w}" y2="${r.y + r.h}" stroke="${C.ink}" stroke-width="2"/>
     <line x1="${r.x}" y1="${r.y}" x2="${r.x}" y2="${r.y + r.h}" stroke="${C.ink}" stroke-width="2"/>
     <line x1="${r.x + r.w}" y1="${r.y}" x2="${r.x + r.w}" y2="${r.y + r.h}" stroke="${C.ink}" stroke-width="2"/>`).join("");
  const labels = ROOMS.map((r) => roomLabel(r, [r.name, ROOM_FINISH[r.id][0], ROOM_FINISH[r.id][1]])).join("");
  return svgDoc(s.W, s.H, `<defs>${gridDef("g32", 32, C.lineSoft)}</defs>
  ${s.head}
  ${fills}
  ${grid}
  ${outerWalls()}
  ${DOORS.map(doorSvg).join("")}
  ${labels}
  ${legend([
    { k: "CPT-1", d: FINISH.CPT.d, c: FINISH.CPT.c, o: 0.55 },
    { k: "LVT-1", d: FINISH.LVT.d, c: FINISH.LVT.c, o: 0.75 },
    { k: "PT-1", d: FINISH.PT.d, c: FINISH.PT.c, o: 0.55 },
    { k: "SV-1", d: FINISH.SV.d, c: FINISH.SV.c, o: 0.55 },
  ], "FINISH SCHEDULE")}
  ${s.foot}`);
}

/* ---------- 08 · quantity workbook ---------- */
const ROWS = [
  ["1.01", "09 22 16", "Metal stud framing — P1, 92 mm @ 406 o.c.", "1,720", "LF"],
  ["1.02", "09 22 16", "Metal stud framing — P2 acoustic, 92 mm", "610", "LF"],
  ["1.03", "09 22 16", "Metal stud framing — P3 rated, 92 mm", "1,480", "LF"],
  ["1.04", "09 22 16", "Deflection head track — P3 condition", "1,480", "LF"],
  ["1.05", "09 22 16", "Door opening framing — head and jambs", "24", "EA"],
  ["2.01", "09 21 16", "Gypsum board — P1, 1 layer each side", "6,880", "SF"],
  ["2.02", "09 21 16", "Gypsum board — P2, 1 layer each side", "2,440", "SF"],
  ["2.03", "09 21 16", "Gypsum board — P3, 2 layers each side", "11,840", "SF"],
  ["3.01", "07 21 00", "Acoustic batt insulation — P2 and P3", "4,160", "SF"],
  ["4.01", "09 51 23", "Acoustical ceiling — ACT-1, 600 × 600", "4,610", "SF"],
  ["4.02", "09 51 23", "Acoustical ceiling — ACT-2, corridor", "1,240", "SF"],
  ["4.03", "09 51 23", "Suspension grid — main and cross tee", "5,940", "LF"],
  ["4.04", "09 51 23", "Perimeter wall angle", "1,180", "LF"],
  ["5.01", "09 68 13", "Carpet tile — CPT-1", "5,980", "SF"],
  ["5.02", "09 65 19", "Resilient tile — LVT-1", "2,140", "SF"],
  ["5.03", "09 30 13", "Porcelain tile — PT-1", "410", "SF"],
  ["5.04", "09 65 16", "Sheet vinyl — SV-1", "920", "SF"],
  ["5.05", "09 65 13", "Resilient base — 100 mm coved", "1,860", "LF"],
];
function workbook(M) {
  const s = sheet(M, { header: "QUANTITY WORKBOOK", drawing: "Quantity workbook — extract", sheet: "T-01" });
  const x0 = 90, w = 1020, top = 136, rh = 31;
  const cols = [x0 + 14, x0 + 96, x0 + 210, x0 + w - 150, x0 + w - 56];
  const header = `<rect x="${x0}" y="${top}" width="${w}" height="40" fill="${C.ink}"/>
    ${["ITEM", "CSI CODE", "DESCRIPTION"].map((t, i) => `<text x="${cols[i]}" y="${top + 26}" font-family="${MONO}" font-size="12.5" letter-spacing="0.12em" fill="${C.sheet}">${t}</text>`).join("")}
    <text x="${cols[3] + 80}" y="${top + 26}" text-anchor="end" font-family="${MONO}" font-size="12.5" letter-spacing="0.12em" fill="${C.sheet}">QTY</text>
    <text x="${cols[4]}" y="${top + 26}" font-family="${MONO}" font-size="12.5" letter-spacing="0.12em" fill="${C.sheet}">UNIT</text>`;
  const body = ROWS.map((r, i) => {
    const y = top + 40 + i * rh;
    const band = i % 2 ? `<rect x="${x0}" y="${y}" width="${w}" height="${rh}" fill="${C.paper}" opacity="0.6"/>` : "";
    return `${band}
      <line x1="${x0}" y1="${y + rh}" x2="${x0 + w}" y2="${y + rh}" stroke="${C.line}" stroke-width="1"/>
      <text x="${cols[0]}" y="${y + 21}" font-family="${MONO}" font-size="13" fill="${C.inkSoft}">${esc(r[0])}</text>
      <text x="${cols[1]}" y="${y + 21}" font-family="${MONO}" font-size="13" fill="${C.inkSoft}">${esc(r[1])}</text>
      <text x="${cols[2]}" y="${y + 21}" font-family="${SANS}" font-size="14.5" fill="${C.ink}">${esc(r[2])}</text>
      <text x="${cols[3] + 80}" y="${y + 21}" text-anchor="end" font-family="${MONO}" font-size="14" font-weight="500" fill="${C.ink}">${esc(r[3])}</text>
      <text x="${cols[4]}" y="${y + 21}" font-family="${MONO}" font-size="13" fill="${C.hiliteInk}">${esc(r[4])}</text>`;
  }).join("");
  const bottom = top + 40 + ROWS.length * rh;
  return svgDoc(s.W, s.H, `<defs>${gridDef("g32", 32, C.lineSoft)}</defs>
  ${s.head}
  <rect x="${x0}" y="${top}" width="${w}" height="${bottom - top}" fill="${C.sheet}" stroke="${C.ink}" stroke-width="1.5"/>
  ${header}${body}
  <rect x="${x0}" y="${top}" width="${w}" height="${bottom - top}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>
  <text x="${x0}" y="${bottom + 26}" font-family="${SANS}" font-size="14" fill="${C.inkSoft}">Quantities are net. Waste is stated per material on the assumptions page, never folded into the quantity.</text>
  ${s.foot}`);
}

/* ---------- 09 · reflected ceiling plan ---------- */
const CEIL = { T1: "ACT-1", T2: "ACT-1", T3: "ACT-1", T4: "GWB", CO: "ACT-2", B1: "ACT-1", B2: "ACT-1", B3: "GWB", B4: "GWB" };
function planCeiling(M) {
  const s = sheet(M, { header: "SHEET A-301", drawing: "Reflected ceiling plan — Level 2", sheet: "A-301" });
  const tint = { "ACT-1": C.acoustic, "ACT-2": C.glazing, GWB: C.concrete };
  const clips = ROOMS.map((r) => `<clipPath id="c${r.id}"><rect x="${r.x + 3}" y="${r.y + 3}" width="${r.w - 6}" height="${r.h - 6}"/></clipPath>`).join("");
  const cells = ROOMS.map((r) => {
    const k = CEIL[r.id];
    const fill = `<rect x="${r.x + 3}" y="${r.y + 3}" width="${r.w - 6}" height="${r.h - 6}" fill="${tint[k]}" opacity="${k === "GWB" ? 0.28 : 0.3}"/>`;
    const grid = k === "GWB" ? "" :
      `<g clip-path="url(#c${r.id})"><rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="url(#act)"/></g>`;
    return fill + grid;
  }).join("");
  const edges = ROOMS.map((r) =>
    `<rect x="${r.x + 3}" y="${r.y + 3}" width="${r.w - 6}" height="${r.h - 6}" fill="none" stroke="${C.ink}" stroke-width="2"/>`).join("");
  const labels = ROOMS.map((r) => roomLabel(r, [r.name, CEIL[r.id]], true)).join("");
  return svgDoc(s.W, s.H, `<defs>${gridDef("g32", 32, C.lineSoft)}${gridDef("act", 34, C.inkSoft, 0.8)}${gridDef("actSm", 7, C.inkSoft, 0.7)}${clips}</defs>
  ${s.head}
  ${cells}
  ${edges}
  ${outerWalls()}
  ${labels}
  ${legend([
    { k: "ACT-1", d: "Acoustical tile, 600 × 600 lay-in", c: C.acoustic, o: 0.45 },
    { k: "ACT-2", d: "Acoustical tile, corridor run", c: C.glazing, o: 0.45 },
    { k: "GWB", d: "Gypsum board ceiling, painted", c: C.concrete, o: 0.4 },
    { k: "GRID", d: "Suspension grid, main and cross tee", c: C.sheet, pattern: true },
  ], "CEILING TYPES")}
  ${s.foot}`);
}

/* ============================================================
   BRAND ASSETS
   ============================================================ */
const TAGLINE = "Construction takeoffs for subcontractors · Canada";

function logoSquare(M) {
  const S = 1200;
  const wm = wordmarkStacked(M, S / 2, S * 0.455, 300);
  return svgDoc(S, S, `<defs>${gridDef("g40", 40, C.lineSoft)}</defs>
  <rect width="${S}" height="${S}" fill="${C.sheet}"/>
  <rect width="${S}" height="${S}" fill="url(#g40)"/>
  <rect x="26" y="26" width="${S - 52}" height="${S - 52}" fill="none" stroke="${C.ink}" stroke-width="18"/>
  ${wm.svg}
  ${tradeBar(230, wm.bottom + 96, 740, 16)}`);
}

function logoLandscape(M) {
  const W = 1200, H = 300;
  const wm = wordmark(M, 0, 0, 150);
  const x = (W - wm.width) / 2;
  const w2 = wordmark(M, x, 202, 150);
  return svgDoc(W, H, `<defs>${gridDef("g30", 30, C.lineSoft)}</defs>
  <rect width="${W}" height="${H}" fill="${C.sheet}"/>
  <rect width="${W}" height="${H}" fill="url(#g30)"/>
  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${C.ink}" stroke-width="10"/>
  ${w2.svg}`);
}

function cover(M) {
  const W = 1024, H = 575;
  const wm = wordmark(M, 78, 300, 150);
  return svgDoc(W, H, `<defs>${gridDef("g34", 34, C.lineSoft)}</defs>
  <rect width="${W}" height="${H}" fill="${C.sheet}"/>
  <rect width="${W}" height="${H}" fill="url(#g34)"/>
  <rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="${C.ink}" stroke-width="9"/>
  <text x="78" y="118" font-family="${MONO}" font-size="17" letter-spacing="0.2em" fill="${C.inkSoft}">SHEET T-01</text>
  <line x1="220" y1="112" x2="${W - 78}" y2="112" stroke="${C.inkSoft}" stroke-width="1" opacity="0.5"/>
  ${wm.svg}
  <text x="78" y="368" font-family="${MONO}" font-size="27" fill="${C.ink}">${esc(TAGLINE)}</text>
  ${tradeBar(78, 420, W - 156, 13)}
  <text x="78" y="500" font-family="${MONO}" font-size="18" letter-spacing="0.12em" fill="${C.inkSoft}">QUANTITY TAKEOFFS · BID LEVELING</text>
  <text x="${W - 78}" y="500" text-anchor="end" font-family="${MONO}" font-size="18" letter-spacing="0.12em" fill="${C.inkSoft}">SHARPBID.CA</text>`);
}

function linkedinCover(M) {
  const W = 1128, H = 191;
  const wm = wordmark(M, 74, 122, 78);
  return svgDoc(W, H, `<defs>${gridDef("g24", 24, C.lineSoft)}</defs>
  <rect width="${W}" height="${H}" fill="${C.sheet}"/>
  <rect width="${W}" height="${H}" fill="url(#g24)"/>
  ${wm.svg}
  <text x="${W - 74}" y="88" text-anchor="end" font-family="${MONO}" font-size="20" fill="${C.ink}">${esc(TAGLINE)}</text>
  <text x="${W - 74}" y="116" text-anchor="end" font-family="${MONO}" font-size="15" letter-spacing="0.14em" fill="${C.inkSoft}">QUANTITY TAKEOFFS · BID LEVELING</text>
  ${tradeBar(74, 148, W - 148, 9)}`);
}

function adImage(M) {
  const W = 1200, H = 628;
  const wm = wordmark(M, 72, 330, 150);
  return svgDoc(W, H, `<defs>${gridDef("g40", 40, C.lineSoft)}</defs>
  <rect width="${W}" height="${H}" fill="${C.sheet}"/>
  <rect width="${W}" height="${H}" fill="url(#g40)"/>
  <rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="${C.ink}" stroke-width="10"/>
  <text x="72" y="112" font-family="${MONO}" font-size="20" letter-spacing="0.2em" fill="${C.inkSoft}">SHEET T-01</text>
  <line x1="232" y1="106" x2="1050" y2="106" stroke="${C.inkSoft}" stroke-width="1" opacity="0.5"/>
  <text x="${W - 72}" y="112" text-anchor="end" font-family="${MONO}" font-size="20" letter-spacing="0.2em" fill="${C.inkSoft}">REV 4.0</text>
  ${wm.svg}
  <text x="72" y="398" font-family="${MONO}" font-size="31" fill="${C.ink}">${esc(TAGLINE)}</text>
  ${tradeBar(72, 448, W - 144, 14)}
  <text x="72" y="556" font-family="${MONO}" font-size="21" letter-spacing="0.12em" fill="${C.inkSoft}">FIXED QUOTE IN 4 BUSINESS HOURS</text>
  <text x="${W - 72}" y="556" text-anchor="end" font-family="${MONO}" font-size="21" letter-spacing="0.12em" fill="${C.inkSoft}">SHARPBID.CA</text>`);
}

/* ============================================================
   BUILD
   ============================================================ */
const ASSETS = [
  { file: "logo-square-1200", w: 1200, h: 1200, make: logoSquare },
  { file: "logo-landscape-1200x300", w: 1200, h: 300, make: logoLandscape },
  { file: "cover-1024x575", w: 1024, h: 575, make: cover },
  { file: "linkedin-cover-1128x191", w: 1128, h: 191, make: linkedinCover },
  { file: "ad-image-1200x628", w: 1200, h: 628, make: adImage },
  { file: "plan-markup-01", w: 1200, h: 900, make: planPartitions },
  { file: "plan-markup-02", w: 1200, h: 900, make: planFlooring },
  { file: "plan-markup-03", w: 1200, h: 900, make: workbook },
  { file: "plan-markup-04", w: 1200, h: 900, make: planCeiling },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const { chromium } = require("playwright");
  const FONTS = [
    face("Big+Shoulders:wght@800", "Big Shoulders", 800),
    face("IBM+Plex+Mono:wght@400;500", "IBM Plex Mono", 400),
    face("IBM+Plex+Mono:wght@400;500", "IBM Plex Mono", 500),
    face("IBM+Plex+Sans:wght@400;500;600", "IBM Plex Sans", 400),
    face("IBM+Plex+Sans:wght@400;500;600", "IBM Plex Sans", 500),
  ].join("\n");

  const browser = await chromium.launch();

  /* measure the wordmark: advance width and true cap height at size 100 */
  const mp = await browser.newPage();
  await mp.setContent(`<style>${FONTS}</style><canvas id="c"></canvas>`, { waitUntil: "load" });
  await mp.evaluate(() => document.fonts.ready);
  const M = await mp.evaluate(async () => {
    /* canvas needs the face loaded explicitly — document.fonts.ready only
       covers fonts used in layout, and a silent fallback here would throw
       every measurement off by ~30%. */
    await document.fonts.load('800 100px "Big Shoulders"');
    await document.fonts.ready;
    const ctx = document.getElementById("c").getContext("2d");
    ctx.font = '800 100px "Big Shoulders"';
    if (!/Big Shoulders/.test(ctx.font)) throw new Error("Big Shoulders did not apply to canvas");
    if ("letterSpacing" in ctx) ctx.letterSpacing = "1px";
    const g = (t) => {
      const m = ctx.measureText(t);
      return { w: m.width, cap: m.actualBoundingBoxAscent };
    };
    return { sharp: g("SHARP"), bid: g("BID") };
  });
  await mp.close();
  console.log("measured @100 (ink):  SHARP " + M.sharp.w.toFixed(1) + "w  BID " + M.bid.w.toFixed(1) + "w  cap " + M.bid.cap.toFixed(1) + "h");

  const results = [];
  for (const a of ASSETS) {
    const svg = a.make(M);
    const svgPath = path.join(OUT, a.file + ".svg");
    fs.writeFileSync(svgPath, svg);

    if (svgOnly) { results.push({ ...a, svgBytes: Buffer.byteLength(svg) }); continue; }

    const page = await browser.newPage();
    await page.setViewportSize({ width: a.w, height: a.h });
    await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${FONTS}
      html,body{margin:0;padding:0;background:${C.sheet}}svg{display:block}</style></head><body>${svg}</body></html>`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    const pngPath = path.join(OUT, a.file + ".png");
    await page.screenshot({ path: pngPath, type: "png" });
    await page.close();

    const st = fs.statSync(pngPath);
    results.push({ ...a, svgBytes: Buffer.byteLength(svg), bytes: st.size });
  }
  await browser.close();

  const pad = (s, n) => String(s).padEnd(n);
  console.log("\n" + pad("FILE", 34) + pad("SIZE", 12) + pad("PNG", 11) + "SVG");
  console.log("-".repeat(70));
  for (const r of results) {
    console.log(pad(r.file, 34) + pad(r.w + "×" + r.h, 12) +
      pad(r.bytes ? (r.bytes / 1024).toFixed(0) + " KB" : "—", 11) + (r.svgBytes / 1024).toFixed(1) + " KB");
  }
  console.log("\nlisting-assets: " + results.length + " asset(s) → assets/listings/");
})();
