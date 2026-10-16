import { translateAlong } from "../../../figures/kit/iso-kit.mjs";
import { GATE, MOTIFS, P, PITCH, SCHEDULE, SLIDE, SLOTS, hubDepth, rimTicks, slideGeometry, trayLines } from "../../../figures/projector.mjs";
import { onVisible, reducedMotion } from "./shared.js";

const STEP_SECONDS = 2.8;
const pad = (n) => String(n).padStart(2, "0");
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// The month the tray holds: this month, a post every other day.
function datesOf() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return SCHEDULE.map((_, i) => fmt.format(new Date(now.getFullYear(), now.getMonth(), 1 + i * 2)).replace(",", ""));
}

export function mountProjector(root) {
  const stage = root.querySelector(".pj-stage");
  if (!stage) return;
  const svg = stage.querySelector("svg");
  const q = (sel) => svg.querySelector(sel);
  const group = q('[data-part="slides"]');
  const hub = q('[data-part="hub"]');
  const slides = [...svg.querySelectorAll("[data-slide]")]
    .sort((a, b) => a.dataset.slide - b.dataset.slide)
    .map((el) => ({
      el,
      fill: el.querySelector(".iso-fill"),
      shades: [...el.querySelectorAll(".iso-shade")],
      top: el.querySelector(".iso-top"),
      crease: el.querySelector(".iso-crease"),
      edge: el.querySelector(".iso-edge"),
      film: el.querySelector(".pj-film"),
    }));
  const dividers = q('[data-part="dividers"]');
  const ticks = q('[data-part="ticks"]');
  const image = q('[data-part="image"]');
  const imageFill = q('[data-part="image-fill"]');
  const imageMotif = q('[data-part="image-motif"]');
  const imageText = q('[data-part="image-text"]');
  const button = q('[data-part="button"]');
  const lcd = q('[data-part="lcd"]');
  const readout = root.querySelector("[data-readout]");
  const still = reducedMotion();
  const dates = datesOf();

  const s = {
    slot: 0,
    theta0: GATE,
    from: GATE,
    to: GATE,
    turn: 1, // 0..1 progress of the current turn
    lifts: slides.map((_, i) => (i === 0 ? SLIDE.lift : 0)),
    phase: "idle", // idle → lower → turn → raise
    t: 0,
    dir: 1,
    clock: 0,
    press: 0,
    touring: true,
    queue: 0,
  };
  let order = [];

  function show(slot) {
    const post = SCHEDULE[slot];
    root.style.setProperty("--beam", `var(${post.token})`);
    image.style.setProperty("--c", `var(${post.token})`);
    imageMotif.setAttribute("d", MOTIFS[post.kind]);
    imageText.textContent = `${pad(slot + 1)} · ${post.time}`;
    lcd.textContent = SCHEDULE[(slot + 1) % SLOTS].time;
  }

  function draw() {
    const items = slides.map((sl, i) => {
      const g = slideGeometry(s.theta0 + i * PITCH, s.lifts[i]);
      sl.fill.setAttribute("d", g.paths.fill);
      sl.shades.forEach((el, n) => el.setAttribute("d", g.paths.shades[n] || ""));
      sl.top.setAttribute("d", g.paths.top);
      sl.crease.setAttribute("d", g.paths.crease);
      sl.edge.setAttribute("d", g.paths.outline);
      sl.film.setAttribute("d", g.win);
      return { el: sl.el, depth: g.depth };
    });
    items.push({ el: hub, depth: hubDepth() });
    items.sort((a, b) => a.depth - b.depth);
    const next = items.map((it) => it.el);
    if (next.some((el, i) => el !== order[i])) {
      const frag = document.createDocumentFragment();
      next.forEach((el) => frag.appendChild(el));
      group.appendChild(frag);
      order = next;
    }
    dividers.setAttribute("d", trayLines(s.theta0));
    ticks.setAttribute("d", rimTicks(s.theta0));
    button.setAttribute("transform", translateAlong(P, [0, 0, -1.8 * s.press]));
    const post = SCHEDULE[s.slot];
    const text = s.phase === "idle" ? `slot ${pad(s.slot + 1)} of ${SLOTS} · ${dates[s.slot]} · ${post.time} · ${post.kind}` : `advancing · slot ${pad(((s.slot + s.dir + SLOTS) % SLOTS) + 1)}`;
    if (readout && readout.textContent !== text) readout.textContent = text;
  }

  function advance(dir = 1) {
    if (s.phase !== "idle") {
      s.queue = dir;
      return;
    }
    s.dir = dir;
    s.phase = "lower";
    s.t = 0;
    s.press = 1;
    loop.kick();
  }

  function step(dt) {
    const calm = still.matches;
    s.clock += dt;
    s.press = Math.max(0, s.press - dt / 0.22);
    const cur = s.slot;
    const nxt = (cur + s.dir + SLOTS) % SLOTS;
    if (s.phase === "idle") {
      if (s.queue) {
        const d = s.queue;
        s.queue = 0;
        advance(d);
      } else if (s.touring && !calm) {
        s.t += dt;
        if (s.t > STEP_SECONDS) advance(1);
      }
    } else if (s.phase === "lower") {
      s.t += dt;
      s.lifts[cur] = calm ? 0 : SLIDE.lift * (1 - ease(Math.min(1, s.t / 0.32)));
      if (calm || s.t >= 0.32) {
        s.phase = "turn";
        s.t = 0;
        s.from = s.theta0;
        s.to = GATE - nxt * PITCH;
        // Take the short way round.
        while (s.to - s.from > Math.PI) s.to -= Math.PI * 2;
        while (s.from - s.to > Math.PI) s.to += Math.PI * 2;
        image.classList.add("is-off");
      }
    } else if (s.phase === "turn") {
      s.t += dt;
      const p = calm ? 1 : ease(Math.min(1, s.t / 0.7));
      s.theta0 = s.from + (s.to - s.from) * p;
      if (p >= 1) {
        s.slot = nxt;
        s.phase = "raise";
        s.t = 0;
        show(nxt);
      }
    } else if (s.phase === "raise") {
      s.t += dt;
      const p = calm ? 1 : Math.min(1, s.t / 0.38);
      // A little overshoot as the gate seats the slide.
      s.lifts[s.slot] = SLIDE.lift * (p < 1 ? ease(p) + Math.sin(p * Math.PI) * 0.12 : 1);
      if (p > 0.4) image.classList.remove("is-off");
      if (p >= 1) {
        s.phase = "idle";
        s.t = 0;
      }
    }
    draw();
    return s.touring || s.phase !== "idle" || s.press > 0 || s.queue !== 0;
  }

  let idle = 0;
  const hold = () => {
    s.touring = false;
    clearTimeout(idle);
    idle = setTimeout(() => {
      s.touring = !still.matches;
      s.t = 0;
      loop.kick();
    }, 4200);
  };
  stage.addEventListener("click", () => {
    hold();
    advance(1);
  });
  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      hold();
      advance(1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      hold();
      advance(-1);
    }
  });
  stage.addEventListener("pointerenter", hold);

  if (still.matches) s.touring = false;
  show(0);
  const loop = onVisible(stage, step);
  draw();
}
