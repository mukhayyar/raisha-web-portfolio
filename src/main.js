import "./styles/main.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import Lenis from "lenis";
import { initCursor, initMagnetic } from "./js/cursor.js";
import { runLoader } from "./js/loader.js";
import { initCurate } from "./js/curate.js";
import { mountFigures } from "./js/figures/index.js";

gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin);

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ───────── Smooth scroll ───────── */
const lenis = new Lenis({ lerp: still ? 1 : 0.095, smoothWheel: !still, wheelMultiplier: 1 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const navOffset = () => -($("[data-nav]")?.offsetHeight ?? 70) + 2;
function scrollToHash(hash, opts = {}) {
  const target = hash === "#top" ? 0 : $(hash);
  if (target === null) return;
  lenis.scrollTo(target, { offset: hash === "#top" ? 0 : navOffset(), duration: still ? 0 : 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
}
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute("href").length < 2) return;
  e.preventDefault();
  if (menu.open) closeMenu(() => scrollToHash(a.getAttribute("href")));
  else scrollToHash(a.getAttribute("href"));
});

/* ───────── Clock (Surabaya, WIB) ───────── */
function initClock() {
  const short = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
  const long = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const tick = () => {
    const now = new Date();
    $$("[data-clock]").forEach((el) => (el.textContent = short.format(now)));
    $$("[data-clock-long]").forEach((el) => (el.textContent = long.format(now)));
  };
  tick();
  setInterval(tick, 1000);
}

/* ───────── Nav ───────── */
function initNav() {
  const nav = $("[data-nav]");
  let last = 0;
  lenis.on("scroll", ({ scroll }) => {
    nav.classList.toggle("is-scrolled", scroll > 40);
    const down = scroll > last && scroll > window.innerHeight * 0.6;
    if (!menu.open) nav.classList.toggle("is-hidden", down);
    last = scroll;
  });
  // Which colour world is under the cursor: ink sections flip it to paper.
  $$("[data-bg]").forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => self.isActive && (document.body.dataset.on = section.dataset.bg),
    });
  });
}

/* ───────── Menu ───────── */
const menu = { open: false, tl: null };
function initMenu() {
  const el = $("#menu");
  const toggle = $("[data-menu-toggle]");
  menu.tl = gsap
    .timeline({ paused: true })
    .set(el, { visibility: "visible" })
    .to($$(".menu__bg i", el), { scaleX: 1, duration: 0.8, ease: "expo.inOut", stagger: 0.09 })
    .to($$(".menu__links a", el), { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.05 }, "-=0.35")
    .to($(".menu__foot", el), { opacity: 1, duration: 0.5 }, "-=0.4");
  toggle.addEventListener("click", () => (menu.open ? closeMenu() : openMenu()));
  window.addEventListener("keydown", (e) => e.key === "Escape" && menu.open && closeMenu());
  function openMenu() {
    menu.open = true;
    document.body.classList.add("menu-open");
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    lenis.stop();
    menu.tl.timeScale(1).play();
  }
  menu.openMenu = openMenu;
}
function closeMenu(after) {
  const el = $("#menu");
  menu.open = false;
  document.body.classList.remove("menu-open");
  $("[data-menu-toggle]").setAttribute("aria-expanded", "false");
  el.setAttribute("aria-hidden", "true");
  lenis.start();
  menu.tl.timeScale(1.6).reverse();
  menu.tl.eventCallback("onReverseComplete", () => {
    el.classList.remove("is-open");
    after?.();
  });
}

/* ───────── Hero ───────── */
function heroIntro() {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from("[data-hero-word]:not(.hero__grid)", { yPercent: 115, rotate: 4, duration: 1.4, stagger: 0.09 })
    .from(".hero__grid i", { scale: 0, rotate: -90, duration: 0.8, ease: "back.out(2.2)", stagger: { each: 0.05, from: "random" } }, "-=1.0")
    .from(".hero__meta > *", { y: 16, opacity: 0, duration: 0.8, stagger: 0.06 }, "-=1.1")
    .from("[data-hero-fade]", { y: 28, opacity: 0, duration: 1, stagger: 0.1 }, "-=0.9")
    .from(".sticker", { scale: 0, rotate: () => gsap.utils.random(-60, 60), duration: 1.1, ease: "back.out(1.8)", stagger: 0.08 }, "-=1.0")
    .from(".hero__scroll", { opacity: 0, duration: 0.6 }, "-=0.6")
    .from("[data-nav] > *", { y: -20, opacity: 0, duration: 0.8, stagger: 0.05 }, 0.1);
  return tl;
}

function initHero() {
  const hero = $(".hero");
  // Pointer parallax on the stickers' inner art; the sticker itself is draggable.
  const layers = $$(".sticker").map((s) => ({ el: s.firstElementChild, depth: Number(s.dataset.depth || 1) }));
  const movers = layers.map(({ el }) => ({ x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3" }), y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3" }) }));
  if (!still) {
    hero.addEventListener("pointermove", (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      layers.forEach(({ depth }, i) => {
        movers[i].x(nx * 38 * depth);
        movers[i].y(ny * 30 * depth);
      });
    });
  }
  $$(".sticker").forEach((sticker) => {
    Draggable.create(sticker, {
      type: "x,y",
      bounds: hero,
      inertia: true,
      zIndexBoost: false,
      onPress() {
        gsap.to(sticker, { scale: 1.08, duration: 0.3, ease: "power3" });
      },
      onRelease() {
        gsap.to(sticker, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.4)" });
      },
    });
  });
  // The giant word drifts up and the grid tumbles as you leave the hero.
  if (!still) {
    gsap.to(".hero__title", { yPercent: -18, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__grid i", { rotate: (i) => (i % 2 ? 90 : -90), ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".stickers", { yPercent: -30, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
  }
}

/* ───────── Tapes (velocity-aware marquee) ───────── */
function initTapes() {
  $$("[data-marquee]").forEach((track) => {
    const dir = Number(track.dataset.marquee);
    track.innerHTML += track.innerHTML + track.innerHTML;
    const width = () => track.scrollWidth / 3;
    let x = 0;
    let boost = 0;
    const set = gsap.quickSetter(track, "x", "px");
    gsap.ticker.add((_, dt) => {
      if (still) return;
      boost *= 0.92;
      x += (dir * (1.2 + boost) * dt) / 16;
      const w = width();
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      set(x);
    });
    ScrollTrigger.create({
      trigger: ".tapes",
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => (boost = Math.min(14, Math.abs(self.getVelocity()) / 220)),
    });
  });
}

/* ───────── Text reveals ───────── */
function initReveals() {
  $$("[data-split]").forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line-inner",
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          rotate: 2,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        });
      },
    });
  });

  const text = $("[data-words]");
  if (text) {
    const split = SplitText.create(text, { type: "words", wordsClass: "w" });
    if (!still) {
      gsap.to(split.words, {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: text, start: "top 78%", end: "bottom 45%", scrub: 0.6 },
      });
    } else gsap.set(split.words, { opacity: 1 });
    gsap.from(".inline-chip", { scale: 0, rotate: -30, ease: "back.out(2)", duration: 0.8, stagger: 0.2, scrollTrigger: { trigger: text, start: "top 70%", once: true } });
  }

  gsap.from(".manifesto__aside", { y: 40, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".manifesto__aside", start: "top 88%", once: true } });
  gsap.from(".hello", { y: 60, rotate: -8, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".hello", start: "top 90%", once: true } });
  gsap.from(".services__note", { y: 24, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".services__head", start: "top 70%", once: true } });
}

/* ───────── Services: plates stack and step back ───────── */
function initServices() {
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px) and (prefers-reduced-motion: no-preference)", () => {
    const cards = $$(".service");
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      gsap.to(card, {
        scale: 0.9,
        rotate: i % 2 ? 1.2 : -1.2,
        "--dim": 0.28,
        ease: "none",
        scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=90", scrub: true },
      });
    });
  });
  $$(".service").forEach((card) => {
    gsap.from(card.querySelectorAll(".service__top, .service__title, .service__stat, .service__copy, .chips li"), {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.05,
      scrollTrigger: { trigger: card, start: "top 70%", once: true },
    });
  });
}

/* ───────── Formats: pinned horizontal rail ───────── */
function initFormats() {
  const mm = gsap.matchMedia();
  const pin = $(".formats__pin");
  const track = $(".formats__track");
  mm.add("(min-width: 901px)", () => {
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: { trigger: pin, start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    // Each card leans with the rail's speed.
    const cards = $$(".fcard", track);
    const skew = cards.map((c) => gsap.quickTo(c, "skewX", { duration: 0.6, ease: "power3" }));
    const onTick = () => {
      const v = still ? 0 : gsap.utils.clamp(-6, 6, -lenis.velocity * 0.35);
      skew.forEach((q) => q(v));
    };
    gsap.ticker.add(onTick);
    // Dragging the rail scrolls the page.
    const rail = $(".formats__rail");
    let drag = null;
    const down = (e) => {
      if (e.pointerType !== "mouse") return;
      drag = { x: e.clientX, start: lenis.scroll };
      rail.setPointerCapture(e.pointerId);
    };
    const move = (e) => drag && lenis.scrollTo(drag.start - (e.clientX - drag.x) * 1.6, { immediate: true });
    const up = () => (drag = null);
    rail.addEventListener("pointerdown", down);
    rail.addEventListener("pointermove", move);
    rail.addEventListener("pointerup", up);
    rail.addEventListener("pointercancel", up);
    return () => {
      gsap.ticker.remove(onTick);
      rail.removeEventListener("pointerdown", down);
      rail.removeEventListener("pointermove", move);
      rail.removeEventListener("pointerup", up);
      rail.removeEventListener("pointercancel", up);
    };
  });
  gsap.from(".fcard", { y: 80, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".formats", start: "top 60%", once: true } });
}

/* ───────── Package: ticket ───────── */
function initPackage() {
  const ticket = $("[data-tilt]");
  const price = $("[data-price]");
  const target = Number(price.dataset.price);
  const fmt = new Intl.NumberFormat("id-ID");
  const counter = { v: 0 };
  ScrollTrigger.create({
    trigger: ticket,
    start: "top 75%",
    once: true,
    onEnter: () => {
      gsap.to(counter, { v: target, duration: still ? 0 : 2, ease: "expo.out", onUpdate: () => (price.textContent = fmt.format(Math.round(counter.v / 1000) * 1000)) });
      gsap.fromTo(".stamp", { scale: 2.6, opacity: 0, rotate: 10 }, { scale: 1, opacity: 1, rotate: -14, duration: 0.7, delay: 0.9, ease: "back.out(2.4)" });
      gsap.from(".ticket__list li", { x: -20, opacity: 0, stagger: 0.07, duration: 0.8, ease: "expo.out", delay: 0.2 });
    },
  });
  gsap.from(ticket, { y: 120, rotate: -4, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ticket, start: "top 92%", once: true } });
  if (still) return;
  const rx = gsap.quickTo(ticket, "rotationX", { duration: 0.8, ease: "power3" });
  const ry = gsap.quickTo(ticket, "rotationY", { duration: 0.8, ease: "power3" });
  gsap.set(ticket, { transformPerspective: 1400 });
  ticket.addEventListener("pointermove", (e) => {
    const r = ticket.getBoundingClientRect();
    ry(((e.clientX - r.left) / r.width - 0.5) * 10);
    rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
  });
  ticket.addEventListener("pointerleave", () => {
    rx(0);
    ry(0);
  });
}

/* ───────── Process ───────── */
function initProcess() {
  const path = $(".process__path path");
  path.setAttribute("pathLength", "1");
  gsap.to(path, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".process__steps", start: "top 80%", end: "bottom 60%", scrub: 0.6 } });
  gsap.from(".step", { y: 60, opacity: 0, rotate: (i) => (i % 2 ? 3 : -3), duration: 1.1, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: ".process__steps", start: "top 80%", once: true } });
  gsap.from(".step__num", { scale: 0, duration: 0.8, ease: "back.out(2.4)", stagger: 0.12, scrollTrigger: { trigger: ".process__steps", start: "top 75%", once: true } });
}

/* ───────── Footer ───────── */
function initFooter() {
  gsap.from("[data-foot-line] > *, [data-foot-line]", { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".footer__title", start: "top 85%", once: true } });
  gsap.from(".footer__lede, .footer__ctas", { y: 30, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".footer__intro", start: "top 70%", once: true } });

  // Wordmark: every letter is its own sticker; hover recolours and bounces it.
  const mark = $("[data-wordmark]");
  const colours = ["var(--pink)", "var(--lime)", "var(--butter)", "var(--lilac)", "var(--tangerine)", "var(--cobalt)"];
  mark.innerHTML = [...mark.textContent].map((ch) => `<span class="ch" aria-hidden="true">${ch}</span>`).join("");
  const chars = $$(".ch", mark);
  const box = mark.parentElement;
  const fit = () => {
    box.style.fontSize = "100px";
    const w = mark.getBoundingClientRect().width;
    box.style.fontSize = `${Math.floor((box.clientWidth / w) * 100 * 0.97)}px`;
  };
  fit();
  document.fonts?.ready.then(fit);
  window.addEventListener("resize", fit);
  gsap.from(chars, { yPercent: 100, opacity: 0, rotate: () => gsap.utils.random(-20, 20), duration: 1.2, ease: "expo.out", stagger: 0.035, scrollTrigger: { trigger: mark, start: "top 95%", once: true } });
  chars.forEach((ch, i) => {
    ch.addEventListener("pointerenter", () => {
      ch.style.color = colours[(i + Math.floor(Math.random() * colours.length)) % colours.length];
      gsap.fromTo(ch, { y: 0 }, { y: -40, rotate: gsap.utils.random(-12, 12), duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1 });
    });
  });

  $("[data-to-top]").addEventListener("click", () => {
    gsap.fromTo("[data-to-top] span", { rotate: 0 }, { rotate: 360, duration: 0.8, ease: "expo.out" });
    lenis.scrollTo(0, { duration: still ? 0 : 2.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
  });
}

/* ───────── Light / dark ───────── */
function initTheme() {
  const btn = $("[data-theme-toggle]");
  const meta = $('meta[name="theme-color"]');
  const root = document.documentElement;
  const stored = () => {
    try {
      return localStorage.getItem("theme");
    } catch {
      return null;
    }
  };
  const set = (t) => {
    root.dataset.theme = t;
    btn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
    btn.setAttribute("aria-pressed", String(t === "dark"));
    meta?.setAttribute("content", t === "dark" ? "#121016" : "#f5efe3");
  };
  set(root.dataset.theme || "light");
  btn.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("theme", next);
    } catch {}
    if (!document.startViewTransition || still) return set(next);
    // The new theme grows out of the switch as a circle.
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(() => set(next));
    t.ready.then(() =>
      root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] }, { duration: 750, easing: "cubic-bezier(.65,0,.35,1)", pseudoElement: "::view-transition-new(root)" }),
    );
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!stored()) set(e.matches ? "dark" : "light");
  });
}

/* ───────── Boot ───────── */
initClock();
initMenu();
initNav();
initCursor();
initMagnetic();
initHero();
initTapes();
initReveals();
initServices();
initFormats();
initPackage();
initProcess();
initFooter();
initCurate($("[data-curate]"));
initTheme();
mountFigures();

lenis.stop();
runLoader({ still }).then(() => {
  lenis.start();
  heroIntro();
  ScrollTrigger.refresh();
});
window.addEventListener("load", () => ScrollTrigger.refresh());
