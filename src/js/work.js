// Selected work: filter chips, hover previews and the viewer. The grid itself is static HTML
// rendered from src/work/data.js at build time (the <!--figure:work--> marker); tiles carry their index into WORK.
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CATEGORIES, WORK } from "../work/data.js";

gsap.registerPlugin(Flip);

const FINE = "(hover: hover) and (pointer: fine)";
const url = (name, ext) => `work/${name}.${ext}`;

export function initWork({ lenis, still }) {
  const section = document.querySelector(".work");
  const grid = section?.querySelector("[data-work-grid]");
  if (!grid) return;
  const tiles = [...grid.children];
  const filters = [...section.querySelectorAll("[data-filter]")];
  const more = section.querySelector("[data-work-more]");

  /* Filters */
  let current = "all";
  function applyFilter(id) {
    if (id === current) return;
    current = id;
    const state = still ? null : Flip.getState(tiles);
    filters.forEach((b) => {
      const on = b.dataset.filter === id;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    section.classList.toggle("is-filtered", id !== "all");
    tiles.forEach((t) => (t.hidden = id !== "all" && t.dataset.cat !== id));
    stopPreviews();
    if (state) {
      Flip.from(state, {
        duration: 0.6,
        ease: "expo.out",
        absolute: true,
        stagger: 0.02,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, ease: "expo.out", stagger: 0.03 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.3 }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    } else ScrollTrigger.refresh();
  }
  filters.forEach((b) => b.addEventListener("click", () => applyFilter(b.dataset.filter)));

  more?.addEventListener("click", () => {
    const folded = tiles.filter((t) => t.classList.contains("is-fold"));
    section.classList.add("is-open");
    if (!still) gsap.from(folded, { y: 40, opacity: 0, duration: 0.8, ease: "expo.out", stagger: 0.04, clearProps: "transform,opacity" });
    folded[0]?.querySelector("button")?.focus({ preventScroll: true });
    ScrollTrigger.refresh();
  });

  /* Hover previews (mouse only): the muted clip plays over its poster. */
  const playing = new Set();
  function stopPreviews() {
    playing.forEach((t) => {
      const v = t.querySelector("video");
      v.pause();
      t.classList.remove("is-playing");
    });
    playing.clear();
  }
  if (matchMedia(FINE).matches && !still) {
    tiles.forEach((t) => {
      const v = t.querySelector("video");
      if (!v) return;
      const btn = t.querySelector(".wtile__open");
      btn.addEventListener("pointerenter", () => {
        if (!v.src) v.src = v.dataset.src;
        playing.add(t);
        v.play().then(() => playing.has(t) && t.classList.add("is-playing")).catch(() => {});
      });
      btn.addEventListener("pointerleave", () => {
        playing.delete(t);
        t.classList.remove("is-playing");
        v.pause();
      });
    });
  }

  /* Entrance */
  if (!still) {
    gsap.set(tiles, { y: 60, opacity: 0 });
    ScrollTrigger.batch(tiles, {
      start: "top 92%",
      once: true,
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 1, ease: "expo.out", stagger: 0.06, clearProps: "transform,opacity" }),
    });
    // Folded tiles are display:none, so the batch never sees them enter: show them as they unfold.
    gsap.set(tiles.filter((t) => t.classList.contains("is-fold")), { clearProps: "transform,opacity" });
  }

  initViewer({ section, tiles, lenis, still, stopPreviews });
}

function initViewer({ tiles, lenis, still, stopPreviews }) {
  const el = document.querySelector("[data-viewer]");
  const stage = el.querySelector("[data-viewer-stage]");
  const title = el.querySelector("[data-viewer-title]");
  const client = el.querySelector("[data-viewer-client]");
  const count = el.querySelector("[data-viewer-count]");
  const closeBtn = el.querySelector(".viewer__btn--close");
  let list = [];
  let pos = 0;
  let opener = null;

  // Prev / next walk through what is on screen now: the active filter, unfolded or not.
  const visible = () => tiles.filter((t) => t.getClientRects().length).map((t) => Number(t.querySelector("[data-work-open]").dataset.workOpen));

  function render() {
    const item = WORK[list[pos]];
    const cat = CATEGORIES.find((c) => c.id === item.cat);
    stage.style.setProperty("--vc", cat.colour);
    el.classList.toggle("is-carousel", item.type === "carousel");
    el.querySelector(".viewer__frame").style.setProperty("--vc", cat.colour);
    title.textContent = item.title;
    client.textContent = `${item.client} · ${cat.label}`;
    count.textContent = `${pos + 1} / ${list.length}`;
    stage.querySelector("video")?.pause();
    if (item.type === "video") {
      stage.innerHTML = `<video controls playsinline loop preload="auto" poster="${url(item.file, "webp")}" src="${url(item.file, "mp4")}"></video>`;
      const v = stage.querySelector("video");
      v.play().catch(() => {
        v.muted = true;
        v.play().catch(() => {});
      });
    } else if (item.type === "image") {
      stage.innerHTML = `<img src="${url(item.file, "webp")}" alt="${item.title}, reel cover for ${item.client}" />`;
    } else {
      stage.innerHTML = `<div class="viewer__slides" tabindex="0" aria-label="Carousel, swipe for more slides">${item.slides
        .map((s, i) => `<img src="${url(s, "webp")}" alt="Slide ${i + 1} of ${item.slides.length}, ${item.title}" />`)
        .join("")}</div><div class="viewer__dots" aria-hidden="true">${item.slides.map((_, i) => `<i${i ? "" : ' class="is-on"'}></i>`).join("")}</div>`;
      const rail = stage.querySelector(".viewer__slides");
      const dots = [...stage.querySelectorAll(".viewer__dots i")];
      rail.addEventListener("scroll", () => {
        const i = Math.round(rail.scrollLeft / rail.clientWidth);
        dots.forEach((d, j) => d.classList.toggle("is-on", i === j));
      });
    }
    if (!still) gsap.fromTo(stage, { scale: 0.96, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.45, ease: "expo.out" });
  }

  function open(index, from) {
    stopPreviews();
    opener = from;
    list = visible();
    pos = Math.max(0, list.indexOf(index));
    el.hidden = false;
    document.body.classList.add("viewer-open");
    lenis.stop();
    render();
    if (!still) gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    closeBtn.focus({ preventScroll: true });
  }
  function close() {
    if (el.hidden) return;
    stage.querySelector("video")?.pause();
    const done = () => {
      el.hidden = true;
      stage.innerHTML = "";
      document.body.classList.remove("viewer-open");
      lenis.start();
      opener?.focus({ preventScroll: true });
    };
    if (still) done();
    else gsap.to(el, { opacity: 0, duration: 0.25, onComplete: done });
  }
  const step = (d) => {
    pos = (pos + d + list.length) % list.length;
    render();
  };

  tiles.forEach((t) => {
    const btn = t.querySelector("[data-work-open]");
    btn.addEventListener("click", () => open(Number(btn.dataset.workOpen), btn));
  });
  el.querySelectorAll("[data-viewer-close]").forEach((b) => b.addEventListener("click", close));
  el.querySelector("[data-viewer-prev]").addEventListener("click", () => step(-1));
  el.querySelector("[data-viewer-next]").addEventListener("click", () => step(1));
  window.addEventListener("keydown", (e) => {
    if (el.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft" && !e.target.closest?.(".viewer__slides, video")) step(-1);
    else if (e.key === "ArrowRight" && !e.target.closest?.(".viewer__slides, video")) step(1);
    else if (e.key === "Tab") {
      // Keep focus inside the viewer.
      const f = [...el.querySelectorAll("button, video, [tabindex='0']")].filter((n) => n.getClientRects().length);
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) (e.preventDefault(), f.at(-1).focus());
      else if (!e.shiftKey && i === f.length - 1) (e.preventDefault(), f[0].focus());
    }
  });
}
