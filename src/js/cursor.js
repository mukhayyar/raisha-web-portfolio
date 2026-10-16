import { gsap } from "gsap";

const fine = () => matchMedia("(hover: hover) and (pointer: fine)").matches;

export function initCursor() {
  const cursor = document.querySelector(".cursor");
  if (!cursor || !fine()) return;
  const ring = cursor.querySelector(".cursor__ring");
  const dot = cursor.querySelector(".cursor__dot");
  const label = cursor.querySelector(".cursor__label");
  const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
  const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
  const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2" });
  const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2" });
  window.addEventListener("pointermove", (e) => {
    ringX(e.clientX);
    ringY(e.clientY);
    dotX(e.clientX);
    dotY(e.clientY);
    const labelled = e.target.closest?.("[data-cursor]");
    const link = e.target.closest?.("a, button, [data-magnetic], .sticker, .body, .iso-stage");
    const text = labelled && !e.target.closest(".iso-stage, a, button") ? labelled.dataset.cursor : "";
    cursor.classList.toggle("is-label", Boolean(text));
    if (text && label.textContent !== text) label.textContent = text;
    cursor.classList.toggle("is-link", Boolean(link) && !text);
  });
  document.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
  document.addEventListener("pointerenter", () => cursor.classList.remove("is-hidden"));
}

// Buttons lean toward the pointer and spring back.
export function initMagnetic() {
  if (!fine() || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.3);
      y((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.35)" });
    });
  });
}
