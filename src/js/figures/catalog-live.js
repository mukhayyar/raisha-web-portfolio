import { translateAlong } from "../../../figures/kit/iso-kit.mjs";
import { DRAWERS, P, PULL } from "../../../figures/catalog.mjs";
import { onVisible, reducedMotion } from "./shared.js";

const HOLD = 2.6;
const total = DRAWERS.reduce((n, d) => n + d.cards, 0);

export function mountCatalog(root) {
  const stage = root.querySelector(".ct-stage");
  if (!stage) return;
  const svg = stage.querySelector("svg");
  const group = svg.querySelector('[data-part="drawers"]');
  const drawers = DRAWERS.map((d, i) => ({
    d,
    el: svg.querySelector(`.ct-drawer[data-drawer="${i}"]`),
    slide: svg.querySelector(`[data-slide="${i}"]`),
    panel: svg.querySelector(`[data-slide="${i}"] .ct-panel`),
    cavity: svg.querySelector(`[data-cavity="${i}"]`),
    open: 0,
    rate: 0,
  }));
  const plunger = svg.querySelector('[data-part="plunger"]');
  const dome = svg.querySelector('[data-part="dome"]');
  const readout = root.querySelector("[data-readout]");
  const still = reducedMotion();
  const s = { pick: -1, touring: true, clock: 0, tour: 0, ding: -10, done: 0 };
  let order = [];

  function draw() {
    drawers.forEach((dr) => {
      const out = dr.open * PULL;
      dr.slide.setAttribute("transform", translateAlong(P, [0, out, 0]));
      dr.cavity.style.opacity = dr.open > 0.01 ? "1" : "0";
      const lit = drawers.indexOf(dr) === s.pick;
      if (lit !== dr.panel.hasAttribute("data-lit")) lit ? dr.panel.setAttribute("data-lit", "") : dr.panel.removeAttribute("data-lit");
    });
    // Closed fronts first; open drawers lowest first, so an upper drawer covers a lower one.
    const next = [...drawers].sort((a, b) => (a.open > 0.01) - (b.open > 0.01) || a.d.z0 - b.d.z0 || a.d.x0 - b.d.x0).map((dr) => dr.el);
    if (next.some((el, i) => el !== order[i])) {
      const frag = document.createDocumentFragment();
      next.forEach((el) => frag.appendChild(el));
      group.appendChild(frag);
      order = next;
    }
    const age = s.clock - s.ding;
    const press = age < 0.5 ? Math.max(0, 1 - age / 0.18) : 0;
    plunger.setAttribute("transform", translateAlong(P, [0, 0, -1.6 * Math.min(1, press * 1.4)]));
    const shake = age < 1.2 && !still.matches ? Math.sin(age * 70) * Math.exp(-age * 4) * 0.7 : 0;
    dome.setAttribute("transform", `translate(${shake.toFixed(2)} 0)`);
    let text;
    if (age < 1.4) text = `ding · task done · ${s.done} today`;
    else if (s.pick >= 0) {
      const dr = drawers[s.pick];
      text = `${dr.d.name} · ${dr.d.cards} cards · out ${(dr.open * PULL).toFixed(1)}`;
    } else text = `6 drawers · ${total} cards filed`;
    if (readout && readout.textContent !== text) readout.textContent = text;
  }

  function ring() {
    s.ding = s.clock;
    s.done += 1;
    loop.kick();
  }

  function step(dt) {
    const calm = still.matches;
    s.clock += dt;
    if (s.touring && !calm) {
      s.tour += dt;
      const slot = Math.floor(s.tour / HOLD);
      const phase = (s.tour % HOLD) / HOLD;
      const i = slot % (DRAWERS.length + 1);
      s.pick = i < DRAWERS.length && phase < 0.72 ? i : -1;
      if (i === DRAWERS.length && phase > 0.2 && s.clock - s.ding > HOLD) ring();
    }
    let moving = false;
    drawers.forEach((dr, i) => {
      const target = i === s.pick ? 1 : 0;
      if (calm) {
        dr.open = target;
        dr.rate = 0;
        return;
      }
      // A drawer on runners: a stiff, well-damped spring with a little weight.
      for (let n = 0; n < 4; n++) {
        dr.rate += ((target - dr.open) * 90 - dr.rate * 16) * (dt / 4);
        dr.open += dr.rate * (dt / 4);
      }
      if (Math.abs(target - dr.open) < 0.0005 && Math.abs(dr.rate) < 0.0005) {
        dr.open = target;
        dr.rate = 0;
      } else moving = true;
    });
    draw();
    return s.touring || moving || s.clock - s.ding < 1.5;
  }

  let idle = 0;
  const hold = () => {
    s.touring = false;
    clearTimeout(idle);
    idle = setTimeout(() => {
      s.touring = !still.matches;
      s.tour = 0;
      loop.kick();
    }, 4200);
  };
  stage.addEventListener("pointermove", (e) => {
    const hit = e.target.closest?.("[data-drawer]");
    if (hit) {
      hold();
      const i = Number(hit.dataset.drawer);
      if (i !== s.pick) {
        s.pick = i;
        loop.kick();
      }
    }
  });
  stage.addEventListener("pointerleave", () => {
    hold();
    s.pick = -1;
    loop.kick();
  });
  stage.addEventListener("click", (e) => {
    hold();
    if (e.target.closest?.('[data-part="dome"], [data-part="plunger"]')) ring();
    else if (e.target.closest?.("[data-drawer]")) ring();
  });
  stage.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowDown: 2, ArrowLeft: -1, ArrowUp: -2 }[e.key];
    if (step) {
      e.preventDefault();
      hold();
      s.pick = s.pick < 0 ? 0 : (s.pick + step + DRAWERS.length) % DRAWERS.length;
      loop.kick();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      hold();
      ring();
    } else if (e.key === "Escape") {
      s.pick = -1;
      loop.kick();
    }
  });

  if (still.matches) s.touring = false;
  const loop = onVisible(stage, step);
  draw();
}
