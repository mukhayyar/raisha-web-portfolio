import { gsap } from "gsap";

// The feed fills itself: nine cells, one per ~11%, while fonts and figures settle.
export function runLoader({ still }) {
  const el = document.querySelector(".loader");
  if (!el) return Promise.resolve();
  if (still) {
    el.remove();
    return Promise.resolve();
  }
  const count = el.querySelector("[data-count]");
  const cells = [...el.querySelectorAll(".loader__grid i")];
  // One word on screen at a time: the old one leaves completely before the next one enters.
  const WORDS = ["curating", "scheduling", "assisting", "ready"];
  const wordEl = el.querySelector("[data-word]");
  let swapTl = null;
  const showWord = (i) => {
    swapTl?.kill();
    swapTl = gsap
      .timeline()
      .to(wordEl, { yPercent: -110, opacity: 0, duration: 0.16, ease: "power2.in" })
      .add(() => (wordEl.textContent = WORDS[i]))
      .fromTo(wordEl, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.28, ease: "power3.out" });
  };
  const state = { v: 0 };
  const fonts = document.fonts?.ready ?? Promise.resolve();
  let lit = -1;
  let word = 0;

  return new Promise((resolve) => {
    const tl = gsap.timeline();
    tl.to(state, {
      v: 100,
      duration: 2.2,
      ease: "power2.inOut",
      onUpdate() {
        const v = Math.round(state.v);
        count.textContent = v;
        const on = Math.min(8, Math.floor(v / 11.2));
        while (lit < on) cells[++lit]?.classList.add("is-on");
        // Words follow elapsed time (not the eased count), so each gets an equal, readable share.
        const t = this.progress();
        const w = t < 0.3 ? 0 : t < 0.62 ? 1 : t < 0.94 ? 2 : 3;
        if (w !== word) {
          word = w;
          showWord(w);
        }
      },
    });
    // Pause at 100% only if the page isn't ready yet; if readiness already arrived (e.g. the
    // tab was in the background and frames were throttled), keep going instead of waiting forever.
    let ready = false;
    tl.add(() => {
      if (!ready) tl.pause();
    });
    tl.add("exit");
    tl.to(cells, { scale: 0, rotate: 90, duration: 0.5, ease: "back.in(2)", stagger: { each: 0.03, from: "center" } }, "exit");
    tl.to(".loader__count, .loader__top", { yPercent: -40, opacity: 0, duration: 0.5, ease: "power3.in" }, "exit");
    tl.to(el, { clipPath: "inset(0 0 100% 0)", duration: 1.0, ease: "expo.inOut", onStart: resolve }, "exit+=0.3");
    tl.add(() => el.remove());
    // Never hold the page hostage to slow fonts: at most ~3.4 s, whatever happens.
    const fontsOrTimeout = Promise.race([fonts, new Promise((r) => setTimeout(r, 3400))]);
    Promise.all([fontsOrTimeout, new Promise((r) => setTimeout(r, 2300))]).then(() => {
      ready = true;
      if (tl.paused()) tl.play();
    });
    // Last resort: whatever happened to the animation, never keep the page covered.
    setTimeout(() => {
      if (!el.isConnected) return;
      resolve();
      gsap.to(el, { opacity: 0, duration: 0.4, onComplete: () => el.remove() });
    }, 9000);
  });
}
