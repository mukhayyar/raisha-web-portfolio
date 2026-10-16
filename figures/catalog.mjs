// Fig 3 — The Card Catalog.
// A library card cabinet on a surface plate: six drawers, one per kind of admin, each filed
// with as many index cards as it shows. Hover a drawer and it slides out on its runners; the
// service bell on top rings when a task is done. A ruler beside the cabinet reads the pull.
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";

export const W = 640;
export const H = 470;
export const AZ = 50;

const PLATE = { x: -132, y: -78, w: 236, d: 180, r: 10 };
const PLATE_H = 12;
const FOOT_H = 6;

export const FACE_Y = 20;
const CAB = { x: -64, y: -56, w: 120, d: FACE_Y + 56, r: 2 };
const CAB_Z = 20;
const CAB_TOP = 112;
const TOP = { x: -67, y: -59, w: 126, d: 82, r: 3 };
const TOP_Z = 116;
export const DEPTH = 66;
export const PULL = 44; // how far an open drawer comes out

const COLS = [[-58, -6], [-2, 50]];
const ROWS = [[82, 106], [54, 78], [26, 50]];
export const DRAWERS = [
  { label: "INBOX", name: "inbox", cards: 12, token: "--pen-0" },
  { label: "CALENDAR", name: "calendar & meetings", cards: 9, token: "--pen-2" },
  { label: "DOCS", name: "docs & notes", cards: 14, token: "--pen-3" },
  { label: "RESEARCH", name: "research", cards: 8, token: "--pen-1" },
  { label: "INVOICES", name: "invoices", cards: 6, token: "--pen-2" },
  { label: "FOLLOW-UP", name: "client follow-ups", cards: 11, token: "--pen-0" },
].map((d, i) => ({ ...d, x0: COLS[i % 2][0], x1: COLS[i % 2][1], z0: ROWS[Math.floor(i / 2)][0], z1: ROWS[Math.floor(i / 2)][1] }));

export const BELL = { c: [34, -6], z: TOP_Z };

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners(TOP, TOP_Z, TOP_Z + 22)],
  W,
  H,
  { pad: 28, azimuth: AZ, elevation: 30 },
);

export const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 8, -PLATE_H - FOOT_H, 1.8, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 6, -PLATE_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(PLATE, -PLATE_H + 4, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.55 }));
  // Ruler beside the cabinet, along the pull: it reads how far a drawer is out.
  const strip = { x: 66, y: FACE_Y - 2, w: 8, d: PULL + 10, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(FACE_Y, FACE_Y + PULL + 4, 2, 5, strip.x + 0.8, 0.6, [2, 3.8], P, "y");
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 4, strip.y + 2, 0.6]), at([strip.x + 4, strip.y + strip.d - 2, 0.6])], { size: 0.45 }));
  // Label plate.
  const label = { x: 40, y: 76, w: 50, d: 20, r: 2 };
  out.push(S(k.slabOf(label, 0, 0.9, P, 4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.8), 0.9, P), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([label.x + 6, label.y + 8.2], 0.9, P, "x"), "CBR-03", { size: 4.2, tone: "mid" }));
  out.push(L(k.lineOnTop([label.x + 6, label.y + 12.6], [label.x + 36, label.y + 12.6], 0.9, P), { tone: "lo", free: true }));
  out.push(L(k.lineOnTop([label.x + 6, label.y + 15.6], [label.x + 26, label.y + 15.6], 0.9, P), { tone: "lo", free: true }));
  out.push(D([at([label.x + label.w - 4.5, label.y + 4.5, 0.9]), at([label.x + label.w - 4.5, label.y + label.d - 4.5, 0.9])], { size: 0.45 }));
  return out.join("");
}

// The out-tray: finished paperwork, the top sheet stamped.
function outTray() {
  const out = [];
  const tray = { x: -120, y: 34, w: 44, d: 56, r: 2.4 };
  out.push(`<path class="iso-halo" d="${k.haloOf(tray, 0, 2, P)}" style="filter:blur(4px)"/>`);
  out.push(S(k.slabOf(tray, 0, 2, P, 3, 0.4), { tone: "mid" }));
  for (let i = 0; i < 4; i++) {
    const sheet = { x: tray.x + 4 + (i % 2) * 0.8, y: tray.y + 4 - (i % 3) * 0.6, w: 36, d: 48, r: 0.6 };
    out.push(S(k.slabOf(sheet, 2 + i * 0.9, 0.9, P, 1), { tone: "hi", crease: "lo" }));
  }
  const top = 2 + 4 * 0.9;
  const sx = tray.x + 6;
  const sy = tray.y + 4;
  out.push(L(k.lineOnTop([sx, sy + 8], [sx + 24, sy + 8], top, P), { tone: "lo", free: true }));
  out.push(L(k.lineOnTop([sx, sy + 13], [sx + 30, sy + 13], top, P), { tone: "lo", free: true }));
  out.push(L(k.lineOnTop([sx, sy + 18], [sx + 18, sy + 18], top, P), { tone: "lo", free: true }));
  // The DONE stamp mark, inked in the plate's lit colour.
  out.push(`<g class="ct-stampmark">${L(k.ring(tray.x + 26, tray.y + 38, 8, top, P, 40), { tone: "lit" })}${L(k.ring(tray.x + 26, tray.y + 38, 6.4, top, P, 40), { tone: "lit" })}</g>`);
  out.push(k.faceTextSvg(k.topMatrix([tray.x + 26, tray.y + 39.6], top, P, "x"), "DONE", { size: 4, tone: "hi", anchor: "middle" }).replace('class="iso-face-text"', 'class="iso-face-text ct-done"'));
  // Low tray walls in front of the sheets.
  out.push(S(k.slabOf({ x: tray.x, y: tray.y + tray.d - 1.6, w: tray.w, d: 1.6, r: 0.5 }, 2, 6, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: tray.x + tray.w - 1.6, y: tray.y, w: 1.6, d: tray.d, r: 0.5 }, 2, 6, P, 2), { tone: "mid" }));
  return out.join("");
}

function cabinet() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CAB, 0, CAB_Z, P)}" style="filter:blur(6px)"/>`];
  for (const [x, y] of byDepth(k.corners(CAB, 6))) {
    out.push(S(k.cylinder(x, y, 4.4, 0, 1.6, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 3.2, 1.6, 12.4, P, 20), { tone: "mid", inner: L(k.sideArc(x, y, 3.2, 8, P, 12), { tone: "faint" }) }));
  }
  const plinth = k.insetPlan(CAB, 2);
  out.push(S(k.slabOf(plinth, 14, CAB_Z - 14, P, 3, 0.4), { tone: "lo" }));
  out.push(S(k.slabOf(CAB, CAB_Z, CAB_TOP - CAB_Z, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(CAB, CAB_Z + 3, P, 3), { tone: "faint" }) }));
  // Side panel: a raised field on the +x face.
  const side = k.sideMatrix([CAB.x + CAB.w, 0], 0, P, "right");
  out.push(`<path class="iso-line" data-tone="faint" transform="${side}" d="M${-(CAB.y + 8)} ${-(CAB_TOP - 8)}H${-(CAB.y + CAB.d - 8)}V${-(CAB_Z + 8)}H${-(CAB.y + 8)}Z"/>`);
  out.push(S(k.slabOf(TOP, CAB_TOP, TOP_Z - CAB_TOP, P, 4, 1), { tone: "mid", crease: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(TOP, 4), TOP_Z, P, 3), { tone: "faint" }));
  // Openings in the face frame.
  const face = k.sideMatrix([0, FACE_Y], 0, P, "left");
  const rects = DRAWERS.map((d) => `M${d.x0} ${-d.z1}H${d.x1}V${-d.z0}H${d.x0}Z`).join("");
  out.push(`<path class="iso-line" data-tone="lo" transform="${face}" d="${rects}"/>`);
  out.push(D([[-61, 109], [53, 109], [-61, 23], [53, 23], [-4, 109], [-4, 23]].map(([x, z]) => at([x, FACE_Y, z])), { size: 0.5 }));
  return out.join("");
}

function bell() {
  const [x, y] = BELL.c;
  const z = BELL.z;
  const out = [];
  out.push(S(k.cylinder(x, y, 12.5, z, 2.4, P, 56, 0.5), { tone: "mid", crease: "lo" }));
  const F = G.frameAlong([x, y, z + 2.4], [0, 0, 1]);
  const R = 10.5;
  const dome = Array.from({ length: 14 }, (_, i) => {
    const s = (R * Math.sin((i / 13) * (Math.PI / 2)));
    return [s, Math.sqrt(Math.max(0, R * R - s * s)), 1];
  });
  dome[dome.length - 1] = [R, 0];
  out.push(`<g data-part="dome">${S(G.solidOf(dome, F, P), { tone: "hi", crease: "lo" })}</g>`);
  const plunger = `${S(k.cylinder(x, y, 1, z + 2.4 + R - 0.6, 3.4, P, 14), { tone: "mid", crease: "none" })}${S(k.cylinder(x, y, 2.8, z + 2.4 + R + 2.8, 1.8, P, 24, 0.3), { tone: "hi", lit: true })}`;
  out.push(`<g data-part="plunger">${plunger}</g>`);
  return out.join("");
}

function stamp() {
  const out = [];
  const pad = { x: -50, y: -46, w: 28, d: 20, r: 2 };
  out.push(S(k.slabOf(pad, TOP_Z, 3, P, 3, 0.5), { tone: "mid" }));
  const ink = k.insetPlan(pad, 2.4);
  out.push(`<path class="ct-ink" d="${k.slabOf(ink, TOP_Z + 3, 0.01, P, 3).top}"/>`);
  out.push(L(k.planOutline(ink, TOP_Z + 3, P, 3), { tone: "lo" }));
  const block = { x: -46, y: -42, w: 14, d: 10, r: 1.4 };
  out.push(S(k.slabOf(block, TOP_Z + 3, 6, P, 3, 0.4), { tone: "hi", crease: "lo" }));
  out.push(S(k.cylinder(-39, -37, 1.8, TOP_Z + 9, 6, P, 16), { tone: "mid", crease: "none" }));
  out.push(S(G.sphereOf([-39, -37, TOP_Z + 18.4], 4, P), { tone: "hi" }));
  return out.join("");
}

function cardStack() {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const card = { x: -14 + (i % 2) * 1.2 - (i % 3) * 0.6, y: -40 + (i % 3) * 0.8, w: 30, d: 20, r: 0.6 };
    out.push(S(k.slabOf(card, TOP_Z + i * 0.9, 0.9, P, 1), { tone: "hi", crease: "lo" }));
  }
  const z = TOP_Z + 6 * 0.9;
  out.push(L(k.lineOnTop([-10, -33], [10, -33], z, P), { tone: "lo", free: true }));
  out.push(L(k.lineOnTop([-10, -29], [5, -29], z, P), { tone: "lo", free: true }));
  // A binder clip on the near edge.
  out.push(S(k.slabOf({ x: -4, y: -22.4, w: 8, d: 2.6, r: 0.4 }, TOP_Z - 0.4, z - TOP_Z + 1.6, P, 2), { tone: "mid" }));
  return out.join("");
}

// One drawer, built closed; the live code slides it along +y.
function drawer(i) {
  const d = DRAWERS[i];
  const out = [];
  const w = d.x1 - d.x0;
  const back = FACE_Y - DEPTH;
  out.push(S(k.slabOf({ x: d.x0 + 1, y: back, w: w - 2, d: DEPTH - 2, r: 0.5 }, d.z0 + 0.5, 1.2, P, 1), { tone: "lo" }));
  out.push(S(k.slabOf({ x: d.x0 + 1, y: back, w: w - 2, d: 1.4, r: 0.4 }, d.z0 + 0.5, 15, P, 1), { tone: "mid" }));
  out.push(S(k.slabOf({ x: d.x0 + 1, y: back, w: 1.4, d: DEPTH - 2, r: 0.4 }, d.z0 + 0.5, 15, P, 1), { tone: "mid" }));
  // Index cards, back to front, each with a coloured tab at its own place.
  for (let n = 0; n < d.cards; n++) {
    const y = back + 5 + (n * (DEPTH - 14)) / Math.max(1, d.cards - 1);
    const card = { x: d.x0 + 4, y, w: w - 8, d: 0.8, r: 0.2 };
    const h = 14.6 - (n % 3) * 0.6;
    out.push(S(k.slabOf(card, d.z0 + 1.7, h, P, 1), { tone: "hi", crease: "lo" }));
    const tab = { x: d.x0 + 5 + ((n * 11) % (w - 20)), y, w: 9, d: 0.8, r: 0.2 };
    const tp = k.slabOf(tab, d.z0 + 1.7 + h, 3.2, P, 1);
    out.push(`<g class="ct-tab">${S(tp, { tone: "hi", crease: "lo" })}<path class="ct-tab-ink" d="${tp.fill}"/></g>`);
  }
  out.push(S(k.slabOf({ x: d.x1 - 2.4, y: back, w: 1.4, d: DEPTH - 2, r: 0.4 }, d.z0 + 0.5, 15, P, 1), { tone: "mid" }));
  // Front panel, flush with the face frame, with its label holder, pull and rod.
  const panel = { x: d.x0 + 0.5, y: FACE_Y - 2.4, w: w - 1, d: 2.4, r: 0.6 };
  out.push(S(k.slabOf(panel, d.z0 + 0.5, d.z1 - d.z0 - 1, P, 2, 0.4), { tone: "hi", crease: "lo", className: "ct-panel" }));
  const xc = (d.x0 + d.x1) / 2;
  const face = k.sideMatrix([0, FACE_Y], 0, P, "left");
  const zl = d.z1 - 7.5;
  out.push(`<g transform="${face}"><path class="ct-holder" d="M${xc - 11} ${-(zl + 4)}h22v8h-22Z"/><path class="iso-line" data-tone="mid" d="M${xc - 11} ${-(zl + 4)}h22v8h-22Z"/></g>`);
  out.push(k.faceTextSvg(`${face} translate(${xc} ${-(zl - 1.6)})`, d.label, { size: 3.6, tone: "hi", anchor: "middle" }));
  out.push(D([at([xc - 12.4, FACE_Y, zl]), at([xc + 12.4, FACE_Y, zl])], { size: 0.45 }));
  const zp = d.z0 + 7.4;
  for (const dx of [-7, 7]) out.push(S(k.slabOf({ x: xc + dx - 1, y: FACE_Y, w: 2, d: 3, r: 0.5 }, zp - 1, 2, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: xc - 9, y: FACE_Y + 3, w: 18, d: 1.8, r: 0.8 }, zp - 1.3, 2.6, P, 3, 0.3), { tone: "hi", crease: "lo" }));
  const Fr = G.frameAlong([xc, FACE_Y, d.z0 + 3.2], [0, 1, 0]);
  out.push(S(G.disc(0, 1.6, 1.4, Fr, P), { tone: "mid" }));
  return out.join("");
}

export function clipOf(i) {
  const d = DRAWERS[i];
  const pts = [];
  for (const y of [FACE_Y, FACE_Y + PULL + 30]) for (const [x, z] of [[d.x0, d.z0], [d.x1, d.z0], [d.x1, d.z1], [d.x0, d.z1]]) pts.push(at([x, y, z]));
  return k.pathOf(G.hullOf(pts), true);
}

function cavity(i) {
  const d = DRAWERS[i];
  return k.pathOf([at([d.x0, FACE_Y, d.z0]), at([d.x1, FACE_Y, d.z0]), at([d.x1, FACE_Y, d.z1]), at([d.x0, FACE_Y, d.z1])], true);
}

export function catalogHtml() {
  const tops = [
    { depth: k.depthOf([-36, -36, TOP_Z], P), svg: stamp() },
    { depth: k.depthOf([1, -30, TOP_Z], P), svg: cardStack() },
    { depth: k.depthOf([BELL.c[0], BELL.c[1], TOP_Z], P), svg: bell() },
  ].sort((a, b) => a.depth - b.depth);
  const svg = k.figureSvg({
    width: W,
    height: H,
    label:
      "A library card catalog on a surface plate. Six labelled drawers (inbox, calendar, docs, research, invoices and follow-ups) slide out to show their index cards with coloured tabs. A service bell, an ink pad with a stamp and a stack of cards sit on top; an out-tray holds stamped, finished paperwork.",
    body: [
      plate(),
      outTray(),
      cabinet(),
      ...tops.map((t) => t.svg),
      ...DRAWERS.map((_, i) => `<path class="ct-cavity" data-cavity="${i}" d="${cavity(i)}"/>`),
      `<defs>${DRAWERS.map((_, i) => `<clipPath id="ct-clip-${i}"><path d="${clipOf(i)}"/></clipPath>`).join("")}</defs>`,
      `<g data-part="drawers">${DRAWERS.map((d, i) => `<g class="ct-drawer" data-drawer="${i}" clip-path="url(#ct-clip-${i})" style="--c:var(${d.token})"><g data-slide="${i}">${drawer(i)}</g></g>`).join("")}</g>`,
    ],
  });
  return k.plateHtml({
    fig: "Fig 3",
    title: "Card catalog",
    hint: "Hover a drawer · click the bell",
    readout: "6 drawers · 60 cards filed",
    body: `<div class="iso-stage ct-stage" tabindex="0" role="group" aria-label="Card catalog. Arrow keys open each drawer in turn; Enter rings the bell.">${svg}</div>`,
  });
}
