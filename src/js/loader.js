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
  const words = [...el.querySelectorAll(".loader__words span")];
  const state = { v: 0 };
  const fonts = document.fonts?.ready ?? Promise.resolve();
  let lit = -1;
  let word = -1;

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
        const w = Math.min(words.length - 1, Math.floor((v / 100) * (words.length - 1) + 0.0001));
        if (w !== word) {
          if (words[word]) gsap.to(words[word], { yPercent: -110, duration: 0.4, ease: "power3.in" });
          gsap.fromTo(words[w], { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: "expo.out" });
          word = w;
        }
      },
    });
    tl.add(() => tl.pause());
    tl.add("exit");
    tl.to(cells, { scale: 0, rotate: 90, duration: 0.5, ease: "back.in(2)", stagger: { each: 0.03, from: "center" } }, "exit");
    tl.to(".loader__count, .loader__top", { yPercent: -40, opacity: 0, duration: 0.5, ease: "power3.in" }, "exit");
    tl.to(el, { clipPath: "inset(0 0 100% 0)", duration: 1.0, ease: "expo.inOut", onStart: resolve }, "exit+=0.3");
    tl.add(() => el.remove());
    Promise.all([fonts, new Promise((r) => setTimeout(r, 2300))]).then(() => tl.play());
  });
}
