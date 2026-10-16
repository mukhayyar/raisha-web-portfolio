// One frame loop per figure: runs only while the figure is on screen and the tick asks for more.
export function onVisible(el, tick) {
  let frame = 0;
  let last = 0;
  let visible = false;
  const run = (now) => {
    const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
    last = now;
    const more = tick(dt);
    frame = visible && more ? requestAnimationFrame(run) : 0;
  };
  const kick = () => {
    if (!frame && visible) {
      last = 0;
      frame = requestAnimationFrame(run);
    }
  };
  new IntersectionObserver(
    (entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) kick();
    },
    { rootMargin: "120px 0px" },
  ).observe(el);
  return { kick };
}

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)");
