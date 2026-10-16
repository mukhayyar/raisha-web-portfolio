// Fig 2 — The Carousel Projector.
// A slide projector whose round tray holds one month of posts: fifteen slides, the package's
// ten reels and five carousels. Each advance turns the tray one slot, lifts the next slide
// into the gate and throws it onto the pull-down screen behind: the content calendar,
// running itself on schedule.
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";

export const W = 640;
export const H = 470;
export const AZ = 56;

const PLATE = { x: -150, y: -132, w: 300, d: 256, r: 10 };
const PLATE_H = 12;
const FOOT_H = 6;

// Projector body and tray.
const BODY = { x: -30, y: -14, w: 100, d: 84, r: 9 };
const BODY_Z = 6;
const BODY_TOP = 42;
export const TRAY = { c: [20, 28], r: 40, z: BODY_TOP, h: 6 };
const TRAY_TOP = TRAY.z + TRAY.h;
export const HUB = { r: 10, h: 10 };
export const SLOTS = 15;
export const PITCH = (Math.PI * 2) / SLOTS;
export const SLIDE = { r0: 13, r1: 37, t: 1.8, z: TRAY_TOP, h: 22, lift: 12 };
export const GATE = Math.PI * 0.12; // the gate faces the viewer's right, just past +x

// The month: ten reels and five carousels, two days apart.
export const KINDS = ["reel", "reel", "carousel"];
export const SCHEDULE = Array.from({ length: SLOTS }, (_, i) => {
  const kind = KINDS[i % 3];
  return { kind, token: kind === "reel" ? (i % 2 ? "--pen-1" : "--pen-0") : i % 2 ? "--pen-2" : "--pen-3", time: i % 2 ? "12:00" : "19:00" };
});

// Screen behind the projector, facing +y.
export const SCREEN_Y = -111.5;
const SCREEN = { x0: -56, x1: 96, z0: 46, z1: 139 };
export const IMAGE = { x0: -15, x1: 55, z0: 57, z1: 127 };
const POSTS_X = [-62, 102];
const LENS = { at: [36, BODY.y, 30], len: 44, r: 8.5 };

export const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [POSTS_X[0], -112, 152], [POSTS_X[1], -112, 152], [-66, -112, 150], [106, -112, 150]],
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
const VIEW = k.towardViewer(P);

// ── Moving parts, shared with the browser ──
export function slideGeometry(theta, lift) {
  const u = [Math.cos(theta), Math.sin(theta)];
  const t = [-Math.sin(theta), Math.cos(theta)];
  const rm = (SLIDE.r0 + SLIDE.r1) / 2;
  const half = (SLIDE.r1 - SLIDE.r0) / 2;
  const c = [TRAY.c[0] + u[0] * rm, TRAY.c[1] + u[1] * rm];
  const ring = [
    [c[0] + u[0] * half + t[0] * SLIDE.t / 2, c[1] + u[1] * half + t[1] * SLIDE.t / 2],
    [c[0] - u[0] * half + t[0] * SLIDE.t / 2, c[1] - u[1] * half + t[1] * SLIDE.t / 2],
    [c[0] - u[0] * half - t[0] * SLIDE.t / 2, c[1] - u[1] * half - t[1] * SLIDE.t / 2],
    [c[0] + u[0] * half - t[0] * SLIDE.t / 2, c[1] + u[1] * half - t[1] * SLIDE.t / 2],
  ];
  const z = SLIDE.z + lift;
  const paths = k.extrude(ring, z, SLIDE.h, P);
  // The film window on whichever face looks at the viewer.
  const side = t[0] * VIEW[0] + t[1] * VIEW[1] >= 0 ? 1 : -1;
  const f = [c[0] + t[0] * side * (SLIDE.t / 2), c[1] + t[1] * side * (SLIDE.t / 2)];
  const q = (dr, dz) => at([f[0] + u[0] * dr, f[1] + u[1] * dr, z + dz]);
  const win = k.pathOf([q(-half + 4, 5), q(half - 4, 5), q(half - 4, SLIDE.h - 4), q(-half + 4, SLIDE.h - 4)], true);
  const depth = k.depthOf([c[0], c[1], z + SLIDE.h / 2], P);
  return { paths, win, depth };
}

export const hubDepth = () => k.depthOf([TRAY.c[0], TRAY.c[1], TRAY_TOP + HUB.h / 2], P);

export function trayLines(theta0) {
  // Slot dividers on the tray deck, between the slides, and index ticks on the rim.
  const [cx, cy] = TRAY.c;
  const out = [];
  for (let i = 0; i < SLOTS; i++) {
    const a = theta0 + (i + 0.5) * PITCH;
    out.push(k.lineOnTop([cx + Math.cos(a) * (HUB.r + 1.5), cy + Math.sin(a) * (HUB.r + 1.5)], [cx + Math.cos(a) * (TRAY.r - 1.6), cy + Math.sin(a) * (TRAY.r - 1.6)], TRAY_TOP, P));
  }
  return out.join("");
}

export function rimTicks(theta0) {
  const [cx, cy] = TRAY.c;
  const out = [];
  for (let i = 0; i < SLOTS * 2; i++) {
    const a = theta0 + (i * PITCH) / 2;
    const n = i % 2 ? 1.6 : 2.4;
    out.push(k.lineOnTop([cx + Math.cos(a) * (TRAY.r - n), cy + Math.sin(a) * (TRAY.r - n)], [cx + Math.cos(a) * TRAY.r, cy + Math.sin(a) * TRAY.r], TRAY_TOP, P));
  }
  return out.join("");
}

// Beam: the hull of the lens mouth and the image on the screen.
export function beamPath() {
  const F = G.frameAlong([LENS.at[0], LENS.at[1] - LENS.len, LENS.at[2]], [0, -1, 0]);
  const mouth = Array.from({ length: 24 }, (_, i) => at(G.pointOf(F, 0, LENS.r - 1, (i / 24) * Math.PI * 2)));
  const img = [[IMAGE.x0, IMAGE.z0], [IMAGE.x1, IMAGE.z0], [IMAGE.x1, IMAGE.z1], [IMAGE.x0, IMAGE.z1]].map(([x, z]) => at([x, SCREEN_Y, z]));
  return { d: k.pathOf(G.hullOf([...mouth, ...img]), true), from: at([LENS.at[0], LENS.at[1] - LENS.len, LENS.at[2]]), to: at([(IMAGE.x0 + IMAGE.x1) / 2, SCREEN_Y, (IMAGE.z0 + IMAGE.z1) / 2]) };
}

// Motifs in screen-face coordinates (x along +x, y = -z), centred on the image.
export const MOTIFS = {
  reel: "M-10 -12 L13 0 L-10 12 Z",
  carousel: "M-15 -14 L9 -14 L9 10 L-15 10 Z M13 -10 L13 14 L-11 14 M-6 20 L-5 20 M-1 20 L1 20 M5 20 L6 20",
};

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
  // Label plate, front right.
  const label = { x: 12, y: 100, w: 52, d: 20, r: 2 };
  out.push(S(k.slabOf(label, 0, 0.9, P, 4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.8), 0.9, P), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([label.x + 6, label.y + 8.2], 0.9, P, "x"), "CBR-02", { size: 4.2, tone: "mid" }));
  out.push(L(k.lineOnTop([label.x + 6, label.y + 12.6], [label.x + 38, label.y + 12.6], 0.9, P), { tone: "lo", free: true }));
  out.push(L(k.lineOnTop([label.x + 6, label.y + 15.6], [label.x + 28, label.y + 15.6], 0.9, P), { tone: "lo", free: true }));
  out.push(D([at([label.x + label.w - 4.5, label.y + 4.5, 0.9]), at([label.x + label.w - 4.5, label.y + label.d - 4.5, 0.9])], { size: 0.45 }));
  return out.join("");
}

function screen() {
  const out = [];
  // Two stand posts on weighted feet.
  for (const x of POSTS_X) {
    const foot = { x: x - 9, y: -121, w: 18, d: 18, r: 3 };
    out.push(S(k.slabOf(foot, 0, 4, P, 4, 0.6), { tone: "mid" }));
    out.push(D(k.corners(foot, 3.4).map(([px, py]) => at([px, py, 4])), { size: 0.42 }));
    out.push(S(k.cylinder(x, -112, 4.4, 4, 4, P, 24), { tone: "mid" }));
    out.push(S(k.cylinder(x, -112, 2.6, 8, 140, P, 20), { tone: "mid", crease: "none", inner: L([60, 100].map((z) => k.sideArc(x, -112, 2.6, z, P, 12)).join(""), { tone: "faint" }) }));
  }
  // The roller case across the top, with end caps sitting on the posts.
  const F = G.frameAlong([-66, -112, 145], [1, 0, 0]);
  out.push(S(G.disc(0, 172, 5, F, P), { tone: "mid", crease: "lo" }));
  for (const s of [0, 172]) out.push(S(G.disc(s - 2, s + 2, 6.2, F, P), { tone: "mid", inner: L(G.arcOf(F, s, 6.2, P), { tone: "faint" }) }));
  // The panel hanging from the roller, with its weight bar.
  const panel = { x: SCREEN.x0, y: SCREEN_Y - 2, w: SCREEN.x1 - SCREEN.x0, d: 2, r: 0.4 };
  out.push(S(k.slabOf(panel, SCREEN.z0, SCREEN.z1 - SCREEN.z0, P, 1), { tone: "hi", crease: "lo" }));
  const face = k.sideMatrix([0, SCREEN_Y], 0, P, "left");
  const img = `M${IMAGE.x0} ${-IMAGE.z1}H${IMAGE.x1}V${-IMAGE.z0}H${IMAGE.x0}Z`;
  const cx = (IMAGE.x0 + IMAGE.x1) / 2;
  const cz = (IMAGE.z0 + IMAGE.z1) / 2;
  out.push(`<g transform="${face}">`);
  out.push(`<path class="pj-screen-border" d="M${SCREEN.x0 + 4} ${-SCREEN.z1 + 4}H${SCREEN.x1 - 4}V${-SCREEN.z0 - 4}H${SCREEN.x0 + 4}Z"/>`);
  out.push(`<g class="pj-image" data-part="image"><path class="pj-image-fill" data-part="image-fill" d="${img}"/>`);
  out.push(`<path class="pj-image-motif" data-part="image-motif" transform="translate(${cx} ${-cz})" d="${MOTIFS.reel}"/>`);
  out.push(`<path class="pj-image-rule" d="M${IMAGE.x0 + 6} ${-IMAGE.z0 - 6}h22M${IMAGE.x0 + 6} ${-IMAGE.z0 - 10}h32"/>`);
  out.push(`<text class="pj-image-text" data-part="image-text" x="${IMAGE.x1 - 5}" y="${-IMAGE.z1 + 10}" text-anchor="end" font-size="6.4">01 · 19:00</text></g>`);
  out.push(`<path class="pj-image-edge" d="${img}"/>`);
  out.push(`</g>`);
  out.push(S(G.disc(0, SCREEN.x1 - SCREEN.x0 + 4, 1.6, G.frameAlong([SCREEN.x0 - 2, SCREEN_Y - 1, SCREEN.z0], [1, 0, 0]), P), { tone: "mid" }));
  return out.join("");
}

function lens() {
  // The lens barrel leaves the body's back face toward the screen.
  // Three turned pieces, far to near: the focusing ring, the barrel, the mounting flange.
  const F = G.frameAlong(LENS.at, [0, -1, 0]);
  const out = [];
  out.push(S(G.disc(LENS.len - 4, LENS.len, LENS.r + 1.4, F, P), { tone: "mid" }));
  out.push(k.fadedSvg(G.ribsOf(F, LENS.len - 4, LENS.len, LENS.r + 1.4, 40, P, { fade: [0.1, 0.55] }), { tone: "lo" }));
  out.push(S(G.disc(3, LENS.len - 4, 9.4, F, P), { tone: "mid", inner: L([12, 22].map((s) => G.arcOf(F, s, 9.4, P)).join(""), { tone: "lo" }) }));
  out.push(S(G.disc(0, 3, 11, F, P), { tone: "mid" }));
  return out.join("");
}

function body() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BODY, 0, BODY_Z, P)}" style="filter:blur(5px)"/>`];
  for (const [x, y] of byDepth(k.corners(BODY, 12))) out.push(S(k.cylinder(x, y, 4.2, 0, BODY_Z, P, 24), { tone: "lo" }));
  out.push(S(k.slabOf(BODY, BODY_Z, BODY_TOP - BODY_Z, P, 8, 1.2), { tone: "mid", inner: L(k.sideSeam(BODY, BODY_TOP - 7, P, 8) + k.sideSeam(BODY, BODY_Z + 5, P, 8), { tone: "faint" }) }));
  // Cooling vents on the +x face: closed slots in the face plane.
  const side = k.sideMatrix([BODY.x + BODY.w, 0], 0, P, "right");
  const slots = [];
  for (let i = 0; i < 7; i++) slots.push(`M${-(4 + i * 6)} -14h-2.4v-14h2.4Z`);
  out.push(`<path class="iso-line" data-tone="lo" transform="${side}" d="${slots.join("")}"/>`);
  // Focus knob on the +x face.
  const Fk = G.frameAlong([BODY.x + BODY.w, 6, 24], [1, 0, 0]);
  out.push(S(G.disc(0, 3, 5.4, Fk, P), { tone: "mid" }));
  out.push(S(G.disc(3, 7, 4.6, Fk, P), { tone: "hi", crease: "lo" }));
  out.push(k.fadedSvg(G.ribsOf(Fk, 3, 7, 4.6, 28, P, { fade: [0.1, 0.55] }), { tone: "lo" }));
  // Front (+y) face: power rocker, the remote socket and a badge.
  const front = k.sideMatrix([0, BODY.y + BODY.d], 0, P, "left");
  out.push(`<g transform="${front}"><path class="pj-badge" d="M-12 -34h44v9h-44Z"/><path class="iso-line" data-tone="mid" d="M-12 -34h44v9h-44Z"/></g>`);
  out.push(k.faceTextSvg(`${front} translate(-9 -27.6)`, "CAROUSEL", { size: 4.6, tone: "hi" }));
  out.push(S(k.slabOf({ x: 44, y: BODY.y + BODY.d, w: 10, d: 2, r: 0.6 }, 16, 7, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: 46.4, y: BODY.y + BODY.d + 2, w: 5.2, d: 1.2, r: 0.4 }, 17.6, 3.8, P, 2), { tone: "hi", lit: true }));
  out.push(S(k.cylinder(-14, BODY.y + BODY.d, 3, 14, 0.01, P, 16), { tone: "mid" }));
  out.push(L(k.sideRing([-14, BODY.y + BODY.d, 18], 3.2, "y", P), { tone: "mid" }));
  out.push(D([at([-14, BODY.y + BODY.d, 18])], { size: 0.9, tone: "hi" }));
  // Top deck around the tray: screws and a lamp-housing lid outline.
  out.push(L(k.planOutline({ x: BODY.x + 6, y: BODY.y + 6, w: 18, d: 22, r: 2 }, BODY_TOP, P, 3), { tone: "faint" }));
  out.push(D([[BODY.x + 6, BODY.y + 6], [BODY.x + BODY.w - 6, BODY.y + 6], [BODY.x + 6, BODY.y + BODY.d - 6], [BODY.x + BODY.w - 6, BODY.y + BODY.d - 6]].map(([x, y]) => at([x, y, BODY_TOP])), { size: 0.5 }));
  return out.join("");
}

function tray() {
  const [cx, cy] = TRAY.c;
  const out = [];
  out.push(S(k.cylinder(cx, cy, TRAY.r + 2, TRAY.z, 1.4, P, 72), { tone: "lo" }));
  out.push(S(k.cylinder(cx, cy, TRAY.r, TRAY.z + 1.4, TRAY.h - 1.4, P, 72, 0.6), { tone: "mid", crease: "lo" }));
  out.push(L(k.ring(cx, cy, HUB.r + 1.5, TRAY_TOP, P, 48), { tone: "faint" }));
  out.push(`<path class="iso-line" data-tone="faint" data-part="dividers" d="${trayLines(GATE)}"/>`);
  out.push(`<path class="iso-line" data-tone="lo" data-part="ticks" d="${rimTicks(GATE)}"/>`);
  // Gate mark: a small lit arrow on the body deck pointing at the gate slot.
  const g = [cx + Math.cos(GATE) * (TRAY.r + 6), cy + Math.sin(GATE) * (TRAY.r + 6)];
  out.push(L(k.onTop([[g[0] + Math.cos(GATE) * 4 - Math.sin(GATE) * 2.6, g[1] + Math.sin(GATE) * 4 + Math.cos(GATE) * 2.6], g, [g[0] + Math.cos(GATE) * 4 + Math.sin(GATE) * 2.6, g[1] + Math.sin(GATE) * 4 - Math.cos(GATE) * 2.6]], BODY_TOP, P), { tone: "lit", free: true }));
  return out.join("");
}

export function slideMarkup(i, theta, lift) {
  const { paths, win } = slideGeometry(theta, lift);
  const sh = paths.shades.map((d, n) => `<path class="iso-shade" data-shade="${n}" d="${d}"/>`).join("");
  return `<g class="pj-slide" data-slide="${i}" style="--c:var(${SCHEDULE[i].token})"><g class="iso-solid"><path class="iso-fill" d="${paths.fill}"/>${sh}<path class="iso-top" d="${paths.top}"/><path class="iso-line iso-crease" data-tone="lo" d="${paths.crease}"/><path class="iso-line iso-edge" data-tone="hi" d="${paths.outline}"/></g><path class="pj-film" d="${win}"/></g>`;
}

function hub() {
  const [cx, cy] = TRAY.c;
  const out = [];
  out.push(S(k.cylinder(cx, cy, HUB.r, TRAY_TOP, HUB.h, P, 40, 0.5), { tone: "mid", inner: L(k.sideArc(cx, cy, HUB.r, TRAY_TOP + 4, P, 24), { tone: "faint" }) }));
  out.push(S(k.cylinder(cx, cy, 7, TRAY_TOP + HUB.h, 3, P, 36), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(cx, cy, 7, TRAY_TOP + HUB.h, TRAY_TOP + HUB.h + 3, 36, P), { tone: "lo" }));
  out.push(L(k.lineOnTop([cx, cy], [cx + 4.4, cy], TRAY_TOP + HUB.h + 3, P), { tone: "hi", free: "end" }));
  out.push(D([at([cx, cy, TRAY_TOP + HUB.h + 3])], { size: 0.6, tone: "hi" }));
  return `<g data-part="hub">${out.join("")}</g>`;
}

const REMOTE = { x: -122, y: 58, w: 30, d: 48, r: 7 };
const REMOTE_H = 9;
export const BUTTON = [-107, 72];

function remote() {
  const out = [`<path class="iso-halo" d="${k.haloOf(REMOTE, 0, 2, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(REMOTE, 0, REMOTE_H, P, 6, 1), { tone: "mid", inner: L(k.sideSeam(REMOTE, 3.4, P, 6), { tone: "faint" }) }));
  // Display window with the next slot time.
  const win = { x: REMOTE.x + 5, y: REMOTE.y + 21, w: 20, d: 10, r: 1.4 };
  out.push(`<path class="pj-lcd" d="${k.slabOf(win, REMOTE_H, 0.01, P, 2).top}"/>`);
  out.push(L(k.planOutline(win, REMOTE_H, P, 2), { tone: "mid" }));
  out.push(`<text class="pj-lcd-text" data-part="lcd" transform="${k.topMatrix([win.x + win.w / 2, win.y + 6.9], REMOTE_H, P, "x")}" font-size="5" text-anchor="middle">19:00</text>`);
  out.push(D([at([REMOTE.x + 9, REMOTE.y + 40, REMOTE_H]), at([REMOTE.x + 15, REMOTE.y + 40, REMOTE_H]), at([REMOTE.x + 21, REMOTE.y + 40, REMOTE_H])], { size: 0.6, tone: "mid" }));
  out.push(L(k.ring(BUTTON[0], BUTTON[1], 7.2, REMOTE_H, P, 32), { tone: "faint" }));
  out.push(`<g data-part="button" transform="${k.translateAlong(P, [0, 0, 0])}">${S(k.cylinder(BUTTON[0], BUTTON[1], 5.4, REMOTE_H, 3.2, P, 32, 0.4), { tone: "hi", lit: true })}</g>`);
  // Cable from the remote's +x face, across the plate, into the socket on the projector.
  const from = at([REMOTE.x + REMOTE.w, REMOTE.y + 30, 4.5]);
  const to = at([-14, BODY.y + BODY.d, 18]);
  const via = [[REMOTE.x + REMOTE.w + 4, REMOTE.y + 30, 1], [-74, 104, 1], [-30, 96, 1], [-16, 82, 1], [-14, BODY.y + BODY.d + 5, 9]].map(at);
  out.push(k.wireSvg(from, to, { via, tone: "mid", size: 1.1 }));
  return out.join("");
}

// Next month's slides, waiting in their box.
function slideBox() {
  const out = [];
  const box = { x: 86, y: 70, w: 48, d: 40, r: 3 };
  out.push(`<path class="iso-halo" d="${k.haloOf(box, 0, 2, P)}" style="filter:blur(4px)"/>`);
  // Floor and the back and left walls first, then the slides, then the front and right walls.
  out.push(S(k.slabOf(box, 0, 2, P, 3), { tone: "lo" }));
  out.push(S(k.slabOf({ x: box.x, y: box.y, w: box.w, d: 2, r: 0.6 }, 2, 14, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: box.x, y: box.y, w: 2, d: box.d, r: 0.6 }, 2, 14, P, 2), { tone: "mid" }));
  const tokens = ["--pen-3", "--pen-0", "--pen-2", "--pen-1", "--pen-0", "--pen-3", "--pen-1"];
  tokens.forEach((token, i) => {
    const y = box.y + 6 + i * 4.4;
    const card = { x: box.x + 5, y, w: box.w - 10, d: 1.6, r: 0.3 };
    const z1 = 17 + (i % 3) * 1.6;
    out.push(S(k.slabOf(card, 2, z1 - 2, P, 1), { tone: "hi", crease: "lo" }));
    const tab = { x: box.x + 8 + ((i * 9) % 26), y, w: 8, d: 1.6, r: 0.3 };
    out.push(`<g style="--c:var(${token})">${S(k.slabOf(tab, z1, 3.2, P, 1), { tone: "hi", crease: "lo" })}<path class="pj-tab" d="${k.slabOf(tab, z1, 3.2, P, 1).fill}"/></g>`);
  });
  out.push(S(k.slabOf({ x: box.x, y: box.y + box.d - 2, w: box.w, d: 2, r: 0.6 }, 2, 9, P, 2), { tone: "mid", inner: L(k.sideSeam({ x: box.x, y: box.y + box.d - 2, w: box.w, d: 2, r: 0.6 }, 6, P, 2), { tone: "faint" }) }));
  out.push(S(k.slabOf({ x: box.x + box.w - 2, y: box.y, w: 2, d: box.d, r: 0.6 }, 2, 9, P, 2), { tone: "mid" }));
  return out.join("");
}

// The hint corner speaks to the input in hand: CSS shows one span or the other.
const touchHint = (html, mouse, touch) => html.replace(`>${mouse}<`, `><span class="only-mouse">${mouse}</span><span class="only-touch">${touch}</span><`);

export function projectorHtml() {
  const beam = beamPath();
  const items = Array.from({ length: SLOTS }, (_, i) => {
    const lift = i === 0 ? SLIDE.lift : 0;
    return { depth: slideGeometry(GATE + i * PITCH, lift).depth, svg: slideMarkup(i, GATE + i * PITCH, lift) };
  });
  items.push({ depth: hubDepth(), svg: hub() });
  items.sort((a, b) => a.depth - b.depth);
  const svg = k.figureSvg({
    width: W,
    height: H,
    label:
      "A carousel slide projector on a surface plate. Its round tray holds fifteen slides, one for each post of the month; each advance turns the tray one slot, lifts the next slide into the gate and projects that post onto a pull-down screen behind it. A wired remote with a clock display advances it.",
    body: [
      plate(),
      screen(),
      `<defs><linearGradient id="pj-beam-grad" gradientUnits="userSpaceOnUse" x1="${r1(beam.from[0])}" y1="${r1(beam.from[1])}" x2="${r1(beam.to[0])}" y2="${r1(beam.to[1])}"><stop offset="0" stop-color="var(--beam)" stop-opacity=".5"/><stop offset="1" stop-color="var(--beam)" stop-opacity=".12"/></linearGradient></defs>`,
      `<path class="pj-beam" data-part="beam" d="${beam.d}" fill="url(#pj-beam-grad)"/>`,
      lens(),
      body(),
      tray(),
      `<g data-part="slides">${items.map((it) => it.svg).join("")}</g>`,
      remote(),
      slideBox(),
    ],
  });
  return touchHint(k.plateHtml({
    fig: "Fig 2",
    title: "Carousel projector",
    hint: "Click to advance the month",
    readout: "slot 01 of 15 · reel · 19:00",
    body: `<div class="iso-stage pj-stage" tabindex="0" role="group" aria-label="Carousel projector. Click, Space or the arrow keys advance the tray one post.">${svg}</div>`,
  }), "Click to advance the month", "Tap to advance the month");
}
