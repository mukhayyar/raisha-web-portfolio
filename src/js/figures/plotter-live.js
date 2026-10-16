import { cameraOf, translateAlong } from "../../../figures/kit/iso-kit.mjs";
import { CELLS, GY_RANGE, HX_RANGE, KINDS, P, PENS, PEN_DOWN, PEN_DX, PEN_REST, PEN_Y, POSTS, REST, SCREEN, TILE, TILE_TOP } from "../../../figures/plotter.mjs";
import { onVisible, reducedMotion } from "./shared.js";

const DRAW_SECONDS = 1.15;
const HOLD_SECONDS = 2.6;
const r1 = (n) => Math.round(n * 10) / 10;
const pad = (n) => String(n).padStart(2, "0");
const smooth = (t) => t * t * (3 - 2 * t);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function mountPlotter(root) {
  const stage = root.querySelector(".fp-stage");
  if (!stage) return;
  const svg = stage.querySelector("svg");
  const q = (sel) => svg.querySelector(sel);
  const gantry = q('[data-part="gantry"]');
  const front = q('[data-part="gantry-front"]');
  const head = q('[data-part="head"]');
  const pens = [...svg.querySelectorAll("[data-pen]")];
  const tiles = [...svg.querySelectorAll(".fp-tile")].map((el, i) => ({ el, wipe: svg.querySelector(`[data-wipe="${i}"]`) }));
  const screen = q('[data-part="screen"]');
  const bar = q('[data-part="screen-bar"]');
  const led = q('[data-part="led"]');
  const readout = root.querySelector("[data-readout]");
  const still = reducedMotion();

  const s = {
    gy: REST.gy,
    hx: REST.hx,
    tips: PEN_DX.map(() => ({ at: PEN_REST, rate: 0 })),
    ink: CELLS.map(() => 0),
    done: CELLS.map(() => false),
    pen: POSTS.map((p) => p.pen),
    job: null, // { cell, pen, phase, t, draw }
    pending: null,
    touring: true,
    hold: 0,
    clearing: -1,
    cycle: 0,
    clock: 0,
    jiggle: 0,
  };

  const targetOf = (cell, pen) => ({ gy: CELLS[cell][1] - PEN_Y, hx: CELLS[cell][0] - PEN_DX[pen] });
  const count = () => s.done.filter(Boolean).length;

  function start(cell, draw = true) {
    s.job = { cell, pen: s.pen[cell], phase: "travel", draw };
  }

  function nextTourJob() {
    const next = s.done.findIndex((d) => !d);
    if (next >= 0) return start(next);
    s.hold += 0; // all done: hold, then clear
  }

  function say(text) {
    if (readout && readout.textContent !== text) readout.textContent = text;
  }

  function draw() {
    const tGantry = translateAlong(P, [0, s.gy, 0]);
    gantry.setAttribute("transform", tGantry);
    front.setAttribute("transform", tGantry);
    head.setAttribute("transform", translateAlong(P, [s.hx + s.jiggle, 0, 0]));
    pens.forEach((el, i) => el.setAttribute("transform", translateAlong(P, [0, 0, s.tips[i].at])));
    tiles.forEach((t, i) => {
      // The pen sweeps the tile in u; the clip grows with it in the tile's own plane.
      const w = r1(46 * smooth(clamp(s.ink[i], 0, 1)));
      t.wipe.setAttribute("d", `M-23 -23h${w}v46h${-w}Z`);
      t.el.style.setProperty("--c", `var(${PENS[s.pen[i]].token})`);
    });
    const n = count();
    screen.textContent = `${pad(n)}/09`;
    bar.setAttribute("d", `M${SCREEN.x + 30} ${-SCREEN.z - SCREEN.h + 3}h${r1(7 * (n / 9)) || 0.1}v2h${-(r1(7 * (n / 9)) || 0.1)}Z`);
    const busy = s.job && s.job.phase === "draw";
    led.style.opacity = busy ? (0.55 + 0.45 * Math.sin(s.clock * 18)).toFixed(2) : "1";
    const job = s.job;
    if (s.clearing >= 0) say("new month · clearing the grid");
    else if (job && job.phase === "draw") say(`drawing post ${pad(job.cell + 1)} · ${KINDS[POSTS[job.cell].kind]} · ${Math.round(s.ink[job.cell] * 100)}%`);
    else if (job && job.draw) say(`to post ${pad(job.cell + 1)} · ${PENS[job.pen].name} pen`);
    else if (job) say(`over post ${pad(job.cell + 1)} · ${KINDS[POSTS[job.cell].kind]}`);
    else say(n === 9 ? "feed curated · 9 of 9 posts" : `ready · ${n} of 9 posts`);
  }

  function springTip(tip, target, dt, calm) {
    if (calm) {
      tip.at = target;
      tip.rate = 0;
      return true;
    }
    for (let i = 0; i < 4; i++) {
      tip.rate += ((target - tip.at) * 520 - tip.rate * 40) * (dt / 4);
      tip.at += tip.rate * (dt / 4);
    }
    if (Math.abs(target - tip.at) < 0.01 && Math.abs(tip.rate) < 0.01) {
      tip.at = target;
      tip.rate = 0;
      return true;
    }
    return false;
  }

  function step(dt) {
    const calm = still.matches;
    s.clock += dt;
    s.jiggle = 0;
    // Clearing a finished month: tiles fade back to paper in a wave.
    if (s.clearing >= 0) {
      s.clearing += dt;
      let all = true;
      s.ink.forEach((v, i) => {
        const age = s.clearing - ((i % 3) + Math.floor(i / 3)) * 0.12;
        if (age > 0) s.ink[i] = Math.max(0, calm ? 0 : v - dt / 0.5);
        if (s.ink[i] > 0) all = false;
      });
      if (all) {
        s.clearing = -1;
        s.cycle += 1;
        s.done = s.done.map(() => false);
        s.pen = POSTS.map((p) => (p.pen + s.cycle) % PENS.length);
      }
    }
    const job = s.job;
    if (!job && s.pending !== null) {
      start(s.pending.cell, s.pending.draw);
      s.pending = null;
    }
    if (!s.job && s.touring && s.clearing < 0) {
      if (count() < 9) nextTourJob();
      else {
        s.hold += dt;
        if (s.hold > HOLD_SECONDS) {
          s.hold = 0;
          s.clearing = 0;
        }
      }
    }
    const j = s.job;
    s.tips.forEach((tip, i) => {
      const down = j && i === j.pen && (j.phase === "down" || j.phase === "draw");
      springTip(tip, down ? PEN_DOWN : PEN_REST, dt, calm);
    });
    if (j) {
      const t = targetOf(j.cell, j.pen);
      if (j.phase === "travel") {
        const ease = calm ? 1 : 1 - Math.exp(-dt / 0.3);
        s.gy += (t.gy - s.gy) * ease;
        s.hx += (t.hx - s.hx) * ease;
        const near = Math.abs(t.gy - s.gy) < 0.12 && Math.abs(t.hx - s.hx) < 0.12;
        if (near) {
          s.gy = t.gy;
          s.hx = t.hx;
          if (!j.draw || s.done[j.cell]) s.job = null;
          else j.phase = "down";
        }
      } else if (j.phase === "down") {
        if (Math.abs(s.tips[j.pen].at - PEN_DOWN) < 0.3) j.phase = "draw";
      } else if (j.phase === "draw") {
        s.ink[j.cell] = calm ? 1 : Math.min(1, s.ink[j.cell] + dt / DRAW_SECONDS);
        s.jiggle = calm ? 0 : Math.sin(s.clock * 31) * 0.5 * Math.sin(Math.PI * s.ink[j.cell]);
        if (s.ink[j.cell] >= 1) {
          s.done[j.cell] = true;
          j.phase = "up";
        }
      } else if (j.phase === "up") {
        if (Math.abs(s.tips[j.pen].at - PEN_REST) < 1) s.job = null;
      }
    }
    s.gy = clamp(s.gy, GY_RANGE[0], GY_RANGE[1]);
    s.hx = clamp(s.hx, HX_RANGE[0], HX_RANGE[1]);
    draw();
    return true;
  }

  // Pointer: find the tile under the pointer on the tile tops.
  const cam = cameraOf(P);
  function cellAt(event) {
    const m = svg.getScreenCTM();
    if (!m) return -1;
    const pt = new DOMPoint(event.clientX, event.clientY).matrixTransform(m.inverse());
    const a = (pt.x - P.origin[0]) / cam.k;
    const b = (pt.y - P.origin[1] + TILE_TOP * cam.cosE * cam.k) / (cam.sinE * cam.k);
    const x = a * cam.sinA + b * cam.cosA;
    const y = -a * cam.cosA + b * cam.sinA;
    return CELLS.findIndex(([cx, cy]) => Math.abs(x - cx) <= TILE / 2 + 4 && Math.abs(y - cy) <= TILE / 2 + 4);
  }

  let idle = 0;
  let focus = 4;
  function request(cell, replot) {
    s.touring = false;
    clearTimeout(idle);
    idle = setTimeout(() => {
      s.touring = !still.matches;
      loop.kick();
    }, 3600);
    if (cell < 0) return;
    focus = cell;
    if (replot && s.done[cell]) {
      s.done[cell] = false;
      s.ink[cell] = 0;
      s.pen[cell] = (s.pen[cell] + 1) % PENS.length;
    }
    const draw = !s.done[cell];
    const job = s.job;
    if (!job || job.phase === "travel") {
      if (job && job.cell === cell && job.draw === draw) return;
      start(cell, draw);
    } else s.pending = { cell, draw };
    loop.kick();
  }

  stage.addEventListener("pointermove", (e) => {
    const cell = cellAt(e);
    if (cell >= 0 && cell !== (s.job?.cell ?? -1)) request(cell, false);
  });
  stage.addEventListener("click", (e) => request(cellAt(e), true));
  stage.addEventListener("keydown", (e) => {
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
    if (e.key in moves) {
      e.preventDefault();
      const next = focus + moves[e.key];
      if (next >= 0 && next < 9 && !(Math.abs(moves[e.key]) === 1 && Math.floor(next / 3) !== Math.floor(focus / 3))) request(next, false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      request(focus, true);
    }
  });

  if (still.matches) {
    s.touring = false;
    s.ink = s.ink.map(() => 1);
    s.done = s.done.map(() => true);
  }
  const loop = onVisible(stage, step);
  draw();
}
