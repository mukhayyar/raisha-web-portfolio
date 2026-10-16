import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(Flip);

// Nine posts, four colours: three pink, two of each of the rest. A curated grid has
// no two neighbours (across or down) in the same colour; that is always reachable.
const POSTS = [
  { c: "pink", kind: "reel" },
  { c: "pink", kind: "photo" },
  { c: "pink", kind: "quote" },
  { c: "lime", kind: "carousel" },
  { c: "lime", kind: "heart" },
  { c: "cobalt", kind: "reel" },
  { c: "cobalt", kind: "sparkle" },
  { c: "tangerine", kind: "photo" },
  { c: "tangerine", kind: "carousel" },
];
const ICONS = {
  reel: '<path d="M-7 -9 L9 0 L-7 9 Z"/>',
  carousel: '<path d="M-10 -10 H6 V8 H-10 Z M10 -6 V12 H-6"/>',
  photo: '<path d="M-11 9 L-4 0 L1 5 L5 1 L11 9 Z"/><circle cx="6" cy="-6" r="3"/>',
  quote: '<path d="M-10 -9 h4 l-2 5 M-2 -9 h4 l-2 5 M-10 3 H10 M-10 8 H5"/>',
  heart: '<path d="M0 9 C-14 0 -9 -12 0 -5 C9 -12 14 0 0 9 Z"/>',
  sparkle: '<path d="M0 -11 C1 -3 3 -1 11 0 C3 1 1 3 0 11 C-1 3 -3 1 -11 0 C-3 -1 -1 -3 0 -11 Z"/>',
};
const PAIRS = [];
for (let r = 0; r < 3; r++)
  for (let c = 0; c < 3; c++) {
    if (c < 2) PAIRS.push([r * 3 + c, r * 3 + c + 1]);
    if (r < 2) PAIRS.push([r * 3 + c, (r + 1) * 3 + c]);
  }

export function initCurate(root) {
  if (!root) return;
  const grid = root.querySelector("[data-grid]");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scoreEls = [root.querySelector("[data-score]"), root.querySelector("[data-score-2]")];
  const clashEl = root.querySelector("[data-clashes]");
  const status = root.querySelector("[data-status]");
  const needle = root.querySelector("[data-gauge-needle]");
  const fill = root.querySelector("[data-gauge-fill]");
  const done = root.querySelector("[data-done]");
  const cta = document.querySelector("[data-win-cta]");
  let selected = null;
  let solved = false;
  const shown = { v: 0 };

  grid.innerHTML = POSTS.map(
    (p, i) =>
      `<button class="post" type="button" role="gridcell" data-c="${p.c}" data-id="${i}" style="--c:var(--${p.c})" aria-label="${p.c} ${p.kind} post"><svg viewBox="-16 -16 32 32" aria-hidden="true">${ICONS[p.kind]}</svg></button>`,
  ).join("");
  const tiles = () => [...grid.children];

  function measure() {
    const colours = tiles().map((t) => t.dataset.c);
    const clashes = PAIRS.filter(([a, b]) => colours[a] === colours[b]);
    return { clashes, score: Math.round(((PAIRS.length - clashes.length) / PAIRS.length) * 100) };
  }

  function render(animate = true) {
    const { clashes, score } = measure();
    const bad = new Set(clashes.flat());
    tiles().forEach((t, i) => t.classList.toggle("is-clash", bad.has(i)));
    clashEl.textContent = clashes.length;
    status.textContent = clashes.length ? `${clashes.length} clash${clashes.length > 1 ? "es" : ""} left` : "Perfectly curated ✓";
    gsap.to(shown, {
      v: score,
      duration: animate && !still ? 0.9 : 0,
      ease: "expo.out",
      onUpdate() {
        const v = Math.round(shown.v);
        scoreEls[0].textContent = v;
        scoreEls[1].textContent = `${v}%`;
        needle.style.transform = `rotate(${-90 + (shown.v / 100) * 180}deg)`;
        fill.style.strokeDashoffset = String(1 - shown.v / 100);
      },
    });
    root.classList.toggle("is-solved", clashes.length === 0);
    if (clashes.length === 0 && !solved) celebrate();
    if (clashes.length) solved = false;
  }

  function celebrate() {
    solved = true;
    if (still) return;
    gsap.fromTo(tiles(), { scale: 1 }, { scale: 1.12, duration: 0.25, yoyo: true, repeat: 1, ease: "power2.out", stagger: { each: 0.06, grid: [3, 3], from: "center" } });
    gsap.fromTo(done, { scale: 0.6, opacity: 0, rotate: -8 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.7, delay: 0.4, ease: "back.out(2)" });
    if (cta) gsap.fromTo(cta, { scale: 1 }, { scale: 1.12, duration: 0.3, yoyo: true, repeat: 3, ease: "power2.inOut", delay: 0.6 });
    // Confetti: little posts flung out of the phone.
    const box = grid.getBoundingClientRect();
    const host = root;
    const base = host.getBoundingClientRect();
    const colours = ["--pink", "--lime", "--cobalt", "--tangerine", "--butter", "--lilac"];
    for (let i = 0; i < 36; i++) {
      const bit = document.createElement("i");
      bit.className = "confetti";
      bit.style.background = `var(${colours[i % colours.length]})`;
      bit.style.left = `${box.left - base.left + box.width / 2}px`;
      bit.style.top = `${box.top - base.top + box.height / 2}px`;
      host.appendChild(bit);
      const angle = Math.random() * Math.PI * 2;
      const dist = 140 + Math.random() * 260;
      gsap
        .timeline({ onComplete: () => bit.remove() })
        .to(bit, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist * 0.7 - 120, rotate: gsap.utils.random(-540, 540), duration: 0.9, ease: "expo.out" })
        .to(bit, { y: "+=320", opacity: 0, duration: 1.2, ease: "power2.in" }, ">-0.2");
    }
  }

  function swap(a, b, from) {
    if (a === b) return;
    const state = Flip.getState(tiles());
    if (from) gsap.set(a, { x: 0, y: 0 });
    const marker = document.createElement("span");
    grid.replaceChild(marker, a);
    grid.replaceChild(a, b);
    grid.replaceChild(b, marker);
    Flip.from(state, { duration: still ? 0 : 0.55, ease: "power3.inOut", zIndex: 5 });
    render();
  }

  function shuffle(first = false) {
    // Deal a clumsy grid: colours clumped together, at least three clashes.
    let order;
    do {
      order = gsap.utils.shuffle([...tiles()]);
      const colours = order.map((t) => t.dataset.c);
      if (PAIRS.filter(([a, b]) => colours[a] === colours[b]).length >= 3) break;
    } while (true);
    const state = Flip.getState(tiles());
    order.forEach((t) => grid.appendChild(t));
    selected?.classList.remove("is-picked");
    selected = null;
    solved = false;
    gsap.set(done, { opacity: 0, scale: 0.6 });
    if (!first) Flip.from(state, { duration: still ? 0 : 0.7, ease: "power3.inOut", stagger: 0.02 });
    render(!first);
  }

  // Tap or click two to swap. A mouse can also drag one onto another; touch never drags,
  // so a swipe over the grid always scrolls the page.
  let drag = null;
  let suppressClick = false;
  grid.addEventListener("pointerdown", (e) => {
    const tile = e.target.closest(".post");
    if (!tile || e.pointerType !== "mouse" || e.button !== 0) return;
    drag = { tile, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.tile.classList.add("is-dragging");
      grid.setPointerCapture?.(e.pointerId);
    }
    gsap.set(drag.tile, { x: dx, y: dy, rotate: dx * 0.04 });
    const under = document.elementsFromPoint(e.clientX, e.clientY).find((el) => el.classList?.contains("post") && el !== drag.tile);
    tiles().forEach((t) => t.classList.toggle("is-target", t === under));
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { tile, moved } = drag;
    drag = null;
    tile.classList.remove("is-dragging");
    const target = e.type === "pointercancel" ? null : grid.querySelector(".is-target");
    tiles().forEach((t) => t.classList.remove("is-target"));
    if (moved) {
      gsap.set(tile, { rotate: 0 });
      if (target) swap(tile, target, true);
      else gsap.to(tile, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
      // The click that follows this drag's pointerup is not a selection.
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);
    }
  };
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
  grid.addEventListener("click", (e) => {
    const tile = e.target.closest(".post");
    if (!tile) return;
    if (suppressClick) return;
    if (!selected) {
      selected = tile;
      tile.classList.add("is-picked");
    } else if (selected === tile) {
      tile.classList.remove("is-picked");
      selected = null;
    } else {
      const a = selected;
      a.classList.remove("is-picked");
      selected = null;
      swap(a, tile);
    }
  });
  grid.addEventListener("keydown", (e) => {
    const list = tiles();
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    const move = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key];
    if (move !== undefined) {
      const j = i + move;
      if (j >= 0 && j < 9 && !(Math.abs(move) === 1 && Math.floor(j / 3) !== Math.floor(i / 3))) list[j].focus();
      e.preventDefault();
    }
  });
  root.querySelector("[data-shuffle]").addEventListener("click", () => shuffle());

  shuffle(true);
  ScrollTrigger.create({
    trigger: root,
    start: "top 80%",
    once: true,
    onEnter: () => {
      if (still) return;
      gsap.from(tiles(), { scale: 0, rotate: () => gsap.utils.random(-40, 40), duration: 0.8, ease: "back.out(1.8)", stagger: { each: 0.05, grid: [3, 3], from: "start" } });
      gsap.from(root.querySelector(".feedphone"), { y: 80, rotate: 6, opacity: 0, duration: 1.2, ease: "expo.out" });
      gsap.from(root.querySelector(".curate__panel").children, { y: 30, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.07 });
    },
  });
}
