// Fig 1 — The Feed Plotter.
// A pen plotter on a surface plate: a gantry rides two rails in y, a tool head rides the
// gantry beam in x and carries four pens (the brand palette). Each visit drops one pen onto
// one of nine tiles and draws a post: the 3 × 3 grid is the Instagram feed being curated.
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";

export const W = 640;
export const H = 470;
export const AZ = 52;

export const PLATE = { x: -150, y: -150, w: 300, d: 300, r: 10 };
const PLATE_H = 12;
const FOOT_H = 6;

export const BED = { x: -88, y: -70, w: 176, d: 176, r: 6 };
const BED_H = 6;
export const TILE = 44;
export const PITCH = 54;
export const BED_C = [0, 18];
export const TILE_Z = BED_H;
export const TILE_TOP = BED_H + 2.5;
export const CELLS = Array.from({ length: 9 }, (_, i) => [BED_C[0] + ((i % 3) - 1) * PITCH, BED_C[1] + (Math.floor(i / 3) - 1) * PITCH]);

export const RAIL_X = 112;
const RAIL_Y0 = -108;
const RAIL_Y1 = 112;
const RAIL_BASE_TOP = 8;
const RAIL_TOP = 12;

const CAR_TOP = 22;
const UPRIGHT_TOP = 86;
export const BEAM = { z: 86, h: 16 };
const BEAM_TOP = BEAM.z + BEAM.h;

// Tool head (built at hx = 0, gy = 0, moved with translateAlong).
export const PEN_Y = 40; // pen axis: head front (33) + pen rail (2.2) + clip (2.2) + radius
export const PEN_DX = [-15, -5, 5, 15];
export const PEN_R = 2.6;
export const PEN_REST = 17; // tip height when lifted
export const PEN_DOWN = TILE_TOP; // tip height when drawing
const HEAD = { x: -20, y: 15, w: 40, d: 18, r: 3 };
const HEAD_Z0 = 32;
const HEAD_Z1 = 96;

// Gantry travel: pen p over cell c means gy = cy - PEN_Y, hx = cx - PEN_DX[p].
export const GY_RANGE = [CELLS[0][1] - PEN_Y - 6, CELLS[8][1] - PEN_Y + 6];
export const HX_RANGE = [CELLS[0][0] - 15 - 6, CELLS[8][0] + 15 + 6];

const CONTROLLER = { x: -52, y: -147, w: 84, d: 24, r: 3 };
const CTRL_H = 34;
export const SCREEN = { x: -44, z: 12, w: 40, h: 16 }; // on the controller's +y face
export const CTRL_FACE_Y = CONTROLLER.y + CONTROLLER.d;
// Y drive: one motor at the back of the left rail turns a cross shaft to the right rail.
const SHAFT_Y = -117;
const SHAFT_Z = 9;
const MOTOR = { x: -121, y: -134, w: 18, d: 26, r: 2 };

export const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...k.boxCorners({ x: -124, y: GY_RANGE[0] - 9, w: 262, d: 18, r: 0 }, BEAM.z, BEAM_TOP),
    ...k.boxCorners({ x: -124, y: GY_RANGE[1] - 9, w: 248, d: 18, r: 0 }, BEAM.z, BEAM_TOP),
  ],
  W,
  H,
  { pad: 26, azimuth: AZ, elevation: 30 },
);

export const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const r1 = (n) => Math.round(n * 10) / 10;

export const PENS = [
  { name: "pink", token: "--pen-0" },
  { name: "tangerine", token: "--pen-1" },
  { name: "lime", token: "--pen-2" },
  { name: "cobalt", token: "--pen-3" },
];

// What each tile becomes: the content mix of a month's feed.
export const POSTS = [
  { kind: "reel", pen: 0 },
  { kind: "carousel", pen: 3 },
  { kind: "photo", pen: 1 },
  { kind: "quote", pen: 2 },
  { kind: "reel", pen: 1 },
  { kind: "heart", pen: 0 },
  { kind: "carousel", pen: 2 },
  { kind: "sparkle", pen: 3 },
  { kind: "photo", pen: 0 },
];

// Motifs in tile-top coordinates (u along +x, v along +y), tile spans ±22.
const MOTIFS = {
  reel: "M-9 -11 L11 0 L-9 11 Z M-15 -15 L15 -15 M-15 15 L15 15",
  carousel: "M-12 -13 L12 -13 L12 9 L-12 9 Z M-5 15.5 L-4 15.5 M-0.5 15.5 L0.5 15.5 M4 15.5 L5 15.5 M15 -9 L15 5 M-15 -9 L-15 5",
  photo: "M-14 12 L-5 0 L1 7 L6 2 L14 12 Z M8 -10 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0",
  quote: "M-13 -12 L-9 -12 L-11 -6 M-5 -12 L-1 -12 L-3 -6 M-13 0 L13 0 M-13 6 L8 6 M-13 12 L3 12",
  heart: "M0 12 C-18 0 -12 -15 0 -6 C12 -15 18 0 0 12 Z",
  sparkle: "M0 -14 C1 -4 4 -1 14 0 C4 1 1 4 0 14 C-1 4 -4 1 -14 0 C-4 -1 -1 -4 0 -14 Z M11 -12 L11 -8 M9 -10 L13 -10",
};
export const KINDS = { reel: "reel", carousel: "carousel", photo: "photo", quote: "quote card", heart: "story", sparkle: "launch post" };

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 24))) {
    out.push(S(k.cylinder(x, y, 8, -PLATE_H - FOOT_H, 1.8, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 6, -PLATE_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(PLATE, -PLATE_H + 4, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.55 }));
  return out.join("");
}

function frontStrip() {
  const out = [];
  // Ruler strip along the front edge, measuring the head's x travel.
  const strip = { x: -74, y: 126, w: 132, d: 8, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2.2, 4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 4, 0.6]), at([strip.x + strip.w - 2, strip.y + 4, 0.6])], { size: 0.45 }));
  // Label plate with an engraved mark and three rule lines.
  const label = { x: -138, y: 120, w: 54, d: 22, r: 2 };
  out.push(S(k.slabOf(label, 0, 0.9, P, 4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.8), 0.9, P), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([label.x + 6, label.y + 8.4], 0.9, P, "x"), "CBR-01", { size: 4.2, tone: "mid" }));
  out.push(L(k.lineOnTop([label.x + 6, label.y + 13], [label.x + 40, label.y + 13], 0.9, P), { tone: "lo", free: true }));
  out.push(L(k.lineOnTop([label.x + 6, label.y + 16.4], [label.x + 32, label.y + 16.4], 0.9, P), { tone: "lo", free: true }));
  out.push(D([at([label.x + label.w - 4.5, label.y + 4.5, 0.9]), at([label.x + label.w - 4.5, label.y + label.d - 4.5, 0.9])], { size: 0.45 }));
  return out.join("");
}

function inkTray() {
  // Four ink pots in a tray: the same palette the pens carry.
  const out = [];
  const tray = { x: 66, y: 118, w: 80, d: 26, r: 3 };
  out.push(S(k.slabOf(tray, 0, 3, P, 4, 0.5), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(tray, 2.4), 3, P, 4), { tone: "faint" }));
  [0, 1, 2, 3].forEach((i) => {
    const [x, y] = [76 + i * 20, 131];
    out.push(S(k.cylinder(x, y, 8, 3, 9, P, 40, 0.6), { tone: "hi", crease: "lo", inner: L(k.sideArc(x, y, 8, 8, P, 24), { tone: "faint" }) }));
    out.push(`<path class="fp-ink" style="fill:var(${PENS[i].token})" d="${k.pathOf(k.circleRing(x, y, 5.6, 40).map(([px, py]) => at([px, py, 12])), true)}"/>`);
    out.push(L(k.ring(x, y, 5.6, 12, P, 40), { tone: "mid" }));
  });
  return out.join("");
}

function controller() {
  const out = [];
  const c = CONTROLLER;
  out.push(`<path class="iso-halo" d="${k.haloOf(c, 0, 4, P)}" style="filter:blur(5px)"/>`);
  out.push(S(k.slabOf(c, 0, 4, P, 4), { tone: "lo" }));
  out.push(S(k.slabOf(k.insetPlan(c, 1.2), 4, CTRL_H - 4, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(k.insetPlan(c, 1.2), CTRL_H - 6, P, 4), { tone: "faint" }) }));
  // Vent slots on top, as closed outlines.
  for (let i = 0; i < 6; i++) out.push(L(k.planOutline({ x: c.x + 50 + i * 4.6, y: c.y + 6, w: 2, d: 16, r: 1 }, CTRL_H, P, 3), { tone: "lo" }));
  // Knob with knurl and pointer.
  const knob = [c.x + 14, c.y + 13];
  out.push(S(k.cylinder(knob[0], knob[1], 7, CTRL_H, 5, P, 36), { tone: "mid" }));
  out.push(L(k.knurl(knob[0], knob[1], 7, CTRL_H, CTRL_H + 5, 40, P), { tone: "lo" }));
  out.push(L(k.lineOnTop(knob, [knob[0] + 5, knob[1] - 3.4], CTRL_H + 5, P), { tone: "hi", free: "end" }));
  out.push(D([at([knob[0], knob[1], CTRL_H + 5])], { size: 0.6, tone: "hi" }));
  // Screen recess on the +y face.
  const face = k.sideMatrix([0, CTRL_FACE_Y], 0, P, "left");
  const s = SCREEN;
  const rect = `M${s.x} ${-s.z - s.h}h${s.w}v${s.h}h${-s.w}Z`;
  out.push(`<clipPath id="fp-screen-clip"><path transform="${face}" d="${rect}"/></clipPath>`);
  out.push(`<g transform="${face}"><path class="fp-screen" d="${rect}"/></g>`);
  out.push(`<g clip-path="url(#fp-screen-clip)"><g transform="${face}">`);
  out.push(`<text class="fp-screen-text" data-part="screen" x="${s.x + 3}" y="${-s.z - 4.2}" font-size="9.6">00/09</text>`);
  out.push(`<path class="fp-screen-bar" data-part="screen-bar" d="M${s.x + 30} ${-s.z - s.h + 3}h7v2h-7Z"/>`);
  out.push(`</g></g>`);
  out.push(L(k.pathOf([at([s.x, CTRL_FACE_Y, s.z]), at([s.x + s.w, CTRL_FACE_Y, s.z]), at([s.x + s.w, CTRL_FACE_Y, s.z + s.h]), at([s.x, CTRL_FACE_Y, s.z + s.h])], true), { tone: "mid" }));
  // Status LED and two screws on the face.
  out.push(D([at([s.x + s.w + 8, CTRL_FACE_Y, 22])], { size: 1.3, tone: "hi" }).replace("<circle", '<circle data-part="led"'));
  out.push(D([at([c.x + 4, CTRL_FACE_Y, CTRL_H - 4]), at([c.x + c.w - 4, CTRL_FACE_Y, CTRL_H - 4])], { size: 0.45 }));
  return out.join("");
}

function drive() {
  const out = [];
  // Cross shaft between two pillow blocks, behind the bed.
  const F = G.frameAlong([-103, SHAFT_Y, SHAFT_Z], [1, 0, 0]);
  for (const x of [-60, 60]) {
    const block = { x: x - 5, y: SHAFT_Y - 6, w: 10, d: 12, r: 1.4 };
    out.push(S(k.slabOf(block, 0, SHAFT_Z, P, 3, 0.4), { tone: "mid" }));
  }
  out.push(S(G.disc(0, 206, 2.2, F, P), { tone: "hi", crease: "lo" }));
  for (const x of [-60, 60]) {
    const cap = { x: x - 5, y: SHAFT_Y - 6, w: 10, d: 12, r: 1.4 };
    out.push(S(G.disc(x + 103 - 5, x + 103 + 5, 4.2, F, P), { tone: "mid", inner: L(G.arcOf(F, x + 103, 4.2, P), { tone: "faint" }) }));
    out.push(D([at([cap.x + 2, cap.y + 2, SHAFT_Z]), at([cap.x + cap.w - 2, cap.y + cap.d - 2, SHAFT_Z])], { size: 0.4 }));
  }
  // Pulley housing at the back of the right rail.
  const pulley = { x: 103, y: -134, w: 18, d: 26, r: 2 };
  out.push(S(k.slabOf(pulley, 0, 16, P, 3, 0.6), { tone: "mid" }));
  out.push(L(k.ring(112, -121, 5, 16, P, 28), { tone: "lo" }));
  out.push(D([at([112, -121, 16])], { size: 0.6 }));
  // The motor: a can with fins, its flange against the rail end.
  out.push(S(k.slabOf(MOTOR, 0, 20, P, 3, 0.6), { tone: "mid", inner: L([5, 9, 13].map((z) => k.sideSeam(MOTOR, z, P, 3)).join(""), { tone: "lo" }) }));
  out.push(L(k.planOutline(k.insetPlan(MOTOR, 2.4), 20, P, 3), { tone: "faint" }));
  out.push(S(k.cylinder(-112, -121, 4.4, 20, 2, P, 24), { tone: "hi", crease: "lo" }));
  out.push(D(k.corners(MOTOR, 3).map(([x, y]) => at([x, y, 20])), { size: 0.45 }));
  // Motor cable: from the controller's left face, along the plate, into the motor.
  const from = at([CONTROLLER.x, CONTROLLER.y + 12, 8]);
  const to = at([MOTOR.x + MOTOR.w, MOTOR.y + 6, 9]);
  const via = [[CONTROLLER.x - 6, CONTROLLER.y + 12, 1.2], [CONTROLLER.x - 22, CONTROLLER.y + 10, 1.2], [MOTOR.x + MOTOR.w + 8, MOTOR.y + 7, 1.2], [MOTOR.x + MOTOR.w + 3, MOTOR.y + 6, 4]].map(at);
  out.push(k.wireSvg(from, to, { via, tone: "mid", size: 1.1 }));
  return out.join("");
}

function bed() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BED, 0, BED_H, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(BED, 0, BED_H, P, 6, 1.2), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BED, 4), BED_H, P, 6), { tone: "faint" }));
  out.push(D(k.corners(BED, 7).map(([x, y]) => at([x, y, BED_H])), { size: 0.5 }));
  CELLS.forEach(([cx, cy], i) => {
    const plan = { x: cx - TILE / 2, y: cy - TILE / 2, w: TILE, d: TILE, r: 1.2 };
    out.push(L(k.planOutline(k.insetPlan(plan, -2.2), BED_H, P, 3), { tone: "faint" }));
    const tile = k.slabOf(plan, TILE_Z, TILE_TOP - TILE_Z, P, 3, 0.4);
    const post = POSTS[i];
    const face = k.topMatrix([cx, cy], TILE_TOP, P, "x");
    out.push(`<clipPath id="fp-wipe-${i}"><path data-wipe="${i}" transform="${face}" d="M-23 -23h0v46h0Z"/></clipPath>`);
    out.push(`<g class="fp-tile" data-cell="${i}" style="--c:var(${PENS[post.pen].token})">`);
    out.push(S(tile, { tone: "hi", crease: "lo" }));
    out.push(`<g clip-path="url(#fp-wipe-${i})"><path class="fp-tile-ink" d="${tile.top}"/>`);
    out.push(`<path class="fp-motif" data-free="" transform="${face}" d="${MOTIFS[post.kind]}"/></g>`);
    out.push(`<path class="fp-tile-ring" d="${tile.top}"/>`);
    out.push(`</g>`);
  });
  return out.join("");
}

function rails(front) {
  const out = [];
  for (const x of [-RAIL_X, RAIL_X]) {
    if (!front) {
      const base = { x: x - 9, y: RAIL_Y0, w: 18, d: RAIL_Y1 - RAIL_Y0, r: 2 };
      out.push(S(k.slabOf(base, 0, RAIL_BASE_TOP, P, 3, 0.6), { tone: "mid" }));
      out.push(S(k.slabOf({ x: x - 3.5, y: RAIL_Y0 + 6, w: 7, d: RAIL_Y1 - RAIL_Y0 - 12, r: 1 }, RAIL_BASE_TOP, RAIL_TOP - RAIL_BASE_TOP, P, 3, 0.4), { tone: "hi", crease: "lo" }));
      const screws = [];
      for (let y = RAIL_Y0 + 16; y < RAIL_Y1 - 10; y += 22) screws.push(at([x - 6.4, y, RAIL_BASE_TOP]), at([x + 6.4, y, RAIL_BASE_TOP]));
      out.push(D(screws, { size: 0.42 }));
    }
    const y = front ? RAIL_Y1 - 6 : RAIL_Y0;
    out.push(S(k.slabOf({ x: x - 8, y, w: 16, d: 6, r: 1.2 }, RAIL_BASE_TOP, 9, P, 3, 0.5), { tone: "mid" }));
    out.push(D([at([x - 4, y + 3, RAIL_BASE_TOP + 9]), at([x + 4, y + 3, RAIL_BASE_TOP + 9])], { size: 0.45 }));
  }
  return out.join("");
}

function gantryFrame() {
  // Built at gy = 0. Carriages and uprights, then the beam above them.
  const out = [];
  for (const x of [-RAIL_X, RAIL_X]) {
    const car = { x: x - 10, y: -13, w: 20, d: 26, r: 2.4 };
    out.push(S(k.slabOf(car, RAIL_TOP, CAR_TOP - RAIL_TOP, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(car, RAIL_TOP + 3, P, 4), { tone: "faint" }) }));
    out.push(D(k.corners(car, 3.6).map(([px, py]) => at([px, py, CAR_TOP])), { size: 0.45 }));
    // Lube nipple on the carriage's +y face end.
    const up = { x: x - 6, y: -7, w: 12, d: 14, r: 1.6 };
    out.push(S(k.slabOf(up, CAR_TOP, UPRIGHT_TOP - CAR_TOP, P, 3, 0.5), { tone: "mid", inner: L([40, 62].map((z) => k.sideSeam(up, z, P, 3)).join(""), { tone: "faint" }) }));
    // Gusset plates where the upright meets the carriage.
    out.push(S(k.slabOf({ x: x - 9, y: -10, w: 18, d: 20, r: 1.6 }, CAR_TOP, 3, P, 3, 0.4), { tone: "mid" }));
  }
  const beam = { x: -124, y: -9, w: 248, d: 18, r: 2.4 };
  out.push(S(k.slabOf(beam, BEAM.z, BEAM.h, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(beam, BEAM.z + 4, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline({ x: -118, y: -4, w: 236, d: 8, r: 2 }, BEAM_TOP, P, 3), { tone: "faint" }));
  out.push(D([-118, -100, 100, 118].flatMap((x) => [at([x, -5.5, BEAM_TOP]), at([x, 5.5, BEAM_TOP])]), { size: 0.45 }));
  // Linear guide on the beam's front face.
  const guide = { x: -108, y: 9, w: 216, d: 2.6, r: 0.6 };
  out.push(S(k.slabOf(guide, BEAM.z + 5, 6, P, 2), { tone: "hi", crease: "lo" }));
  // Belt end clamps.
  for (const x of [-116, 110]) out.push(S(k.slabOf({ x, y: 9, w: 6, d: 4, r: 1 }, BEAM.z + 2, 12, P, 2, 0.3), { tone: "mid" }));
  // X motor on the beam's right end, with its cooling fins and a cable to the head.
  const xm = { x: 124, y: -8, w: 14, d: 16, r: 1.6 };
  out.push(S(k.slabOf(xm, BEAM.z - 1, BEAM.h + 2, P, 3, 0.5), { tone: "mid" }));
  out.push(L([BEAM.z + 3, BEAM.z + 7, BEAM.z + 11].map((z) => k.sideSeam(xm, z, P, 3)).join(""), { tone: "lo" }));
  out.push(S(k.cylinder(131, 0, 4, BEAM_TOP + 1, 1.6, P, 24), { tone: "hi", crease: "lo" }));
  out.push(D([at([127, -4, BEAM_TOP + 1]), at([135, 4, BEAM_TOP + 1])], { size: 0.45 }));
  return out.join("");
}

function head() {
  // Built at hx = 0, gy = 0.
  const out = [];
  const plate = { x: -19, y: 11.6, w: 38, d: 3.4, r: 0.8 };
  out.push(S(k.slabOf(plate, BEAM.z - 6, BEAM.h + 8, P, 2, 0.3), { tone: "mid" }));
  out.push(D([[-15, 0], [15, 0]].flatMap(([x]) => [at([x, 15, BEAM.z + 14]), at([x, 15, BEAM.z - 2])]), { size: 0.45 }));
  out.push(S(k.slabOf(HEAD, HEAD_Z0, HEAD_Z1 - HEAD_Z0, P, 4, 0.8), { tone: "hi", crease: "lo", inner: L([HEAD_Z0 + 8, HEAD_Z1 - 10].map((z) => k.sideSeam(HEAD, z, P, 4)).join(""), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(HEAD, 3), HEAD_Z1, P, 3), { tone: "faint" }));
  for (let i = 0; i < 4; i++) out.push(L(k.planOutline({ x: -12 + i * 6.6, y: HEAD.y + 6, w: 2.2, d: 7, r: 1 }, HEAD_Z1, P, 3), { tone: "lo" }));
  // Camera on the +x face: a lens barrel reading each finished post.
  out.push(S(k.slabOf({ x: HEAD.x + HEAD.w, y: HEAD.y + 4, w: 3, d: 10, r: 0.8 }, HEAD_Z1 - 22, 12, P, 2), { tone: "mid" }));
  const lens = [HEAD.x + HEAD.w + 3, HEAD.y + 9, HEAD_Z1 - 16];
  out.push(`<g data-part="lens">${L(k.sideRing(lens, 3.6, "x", P), { tone: "mid" })}${L(k.sideRing(lens, 2, "x", P), { tone: "hi" })}</g>`);
  // Pen rail: the bar the pens clip to.
  out.push(S(k.slabOf({ x: -20, y: HEAD.y + HEAD.d, w: 40, d: 2.2, r: 0.6 }, HEAD_Z0, 22, P, 2, 0.3), { tone: "mid" }));
  return out.join("");
}

export function penSvg(i) {
  // Built with the tip at z = 0; moved up to its rest or down to draw.
  const x = PEN_DX[i];
  const y = PEN_Y;
  const out = [];
  out.push(S(k.slabOf({ x: x - 3.6, y: y - PEN_R - 2.2, w: 7.2, d: 2.2, r: 0.6 }, 25, 9, P, 2), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 1.1, 0, 5, P, 16), { tone: "hi", crease: "none" }));
  out.push(S(k.cylinder(x, y, 1.9, 5, 3, P, 18), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, PEN_R, 8, 26, P, 24), { tone: "hi", crease: "lo", inner: L([18, 24].map((z) => k.sideArc(x, y, PEN_R, z, P, 12)).join(""), { tone: "lo" }) }));
  const cap = k.cylinder(x, y, PEN_R + 0.4, 34, 9, P, 24, 0.3);
  out.push(`<g class="fp-cap" style="--c:var(${PENS[i].token})">${S(cap, { tone: "hi", crease: "lo" })}<path class="fp-cap-ink" d="${cap.fill}"/></g>`);
  out.push(L(k.ring(x, y, 1.2, 43, P, 12), { tone: "hi" }));
  return out.join("");
}

export const REST = { gy: CELLS[4][1] - PEN_Y, hx: CELLS[4][0] - PEN_DX[1] };

export function plotterHtml() {
  const svg = k.figureSvg({
    width: W,
    height: H,
    label:
      "A pen plotter on a surface plate. A gantry rides two rails over a bed of nine square tiles laid out like an Instagram grid. Its tool head carries four coloured pens; one pen at a time drops onto a tile and draws a post on it, while a controller at the back counts the finished posts.",
    body: [
      plate(),
      frontStrip(),
      controller(),
      drive(),
      rails(false),
      bed(),
      `<g data-part="gantry" transform="${k.translateAlong(P, [0, REST.gy, 0])}">`,
      gantryFrame(),
      `</g>`,
      `<g data-part="gantry-front" transform="${k.translateAlong(P, [0, REST.gy, 0])}">`,
      `<g data-part="head" transform="${k.translateAlong(P, [REST.hx, 0, 0])}">`,
      head(),
      ...[0, 1, 2, 3].map((i) => `<g data-pen="${i}" transform="${k.translateAlong(P, [0, 0, PEN_REST])}">${penSvg(i)}</g>`),
      `</g></g>`,
      rails(true),
      inkTray(),
    ],
  });
  return k.plateHtml({
    fig: "Fig 1",
    title: "Feed plotter",
    hint: "Hover a tile to plot it",
    readout: "ready · 0 of 9 posts",
    body: `<div class="iso-stage fp-stage" tabindex="0" role="group" aria-label="Feed plotter. Arrow keys pick a tile, Enter plots it.">${svg}</div>`,
  });
}
