// Renders the Selected work filters and tiles as static HTML. vite.config.js injects it at the
// <!--figure:work--> marker, so the grid is in the page before any script runs; src/js/work.js only adds
// behaviour (filtering, hover previews, the viewer). Media URLs are relative so the build works
// under any base path.
import { CATEGORIES, WORK } from "./data.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const media = (name, ext) => `work/${name}.${ext}`;
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const catOf = (id) => CATEGORIES.find((c) => c.id === id);

// Tiles past this index stay folded under "Show all" until a filter or the button opens them.
export const FOLD = 10;

function tile(item, i) {
  const cat = catOf(item.cat);
  if (!cat) throw new Error(`work: unknown category "${item.cat}" on "${item.title}"`);
  const label = { video: "Play", carousel: "Open carousel", image: "View" }[item.type];
  let art = "";
  let badge = "";
  if (item.type === "video") {
    art = `<img src="${media(item.file, "webp")}" alt="" width="480" height="854" loading="lazy" decoding="async" /><video muted loop playsinline preload="none" data-src="${media(item.file, "mp4")}" aria-hidden="true" tabindex="-1"></video>`;
    badge = `<span class="wtile__badge mono"><i class="wtile__play" aria-hidden="true"></i>${clock(item.dur)}</span>`;
  } else if (item.type === "carousel") {
    const [first, second, third] = item.slides;
    art = `<span class="wtile__deck" aria-hidden="true">${[third, second].filter(Boolean).map((s) => `<img src="${media(s, "webp")}" alt="" loading="lazy" decoding="async" />`).join("")}</span><img class="wtile__lead" src="${media(first, "webp")}" alt="" width="864" height="1080" loading="lazy" decoding="async" />`;
    badge = `<span class="wtile__badge mono">1/${item.slides.length}</span>`;
  } else {
    art = `<img src="${media(item.file, "webp")}" alt="" width="720" height="1280" loading="lazy" decoding="async" />`;
    badge = `<span class="wtile__badge mono">Cover</span>`;
  }
  const fold = i >= FOLD ? " is-fold" : "";
  return `<li class="wtile wtile--${item.type}${fold}" data-cat="${item.cat}" style="--c:${cat.colour}">
  <button class="wtile__open" type="button" data-work-open="${i}" aria-label="${label}: ${esc(item.title)}, ${esc(item.client)}">
    <span class="wtile__media">${art}</span>
    <span class="wtile__tag mono">${esc(cat.label)}</span>${badge}
  </button>
  <div class="wtile__meta"><h3>${esc(item.title)}</h3><span class="mono">${esc(item.client)}</span></div>
</li>`;
}

export function workHtml() {
  const count = (id) => WORK.filter((w) => w.cat === id).length;
  const filters = [`<button type="button" class="wfilter is-on" data-filter="all" aria-pressed="true">All <sup>${WORK.length}</sup></button>`]
    .concat(CATEGORIES.filter((c) => count(c.id)).map((c) => `<button type="button" class="wfilter" data-filter="${c.id}" aria-pressed="false" style="--c:${c.colour}">${esc(c.label)} <sup>${count(c.id)}</sup></button>`))
    .join("");
  const more = WORK.length > FOLD ? `<div class="work__more"><button class="btn btn--line" type="button" data-work-more><span>Show all ${WORK.length}</span><span class="btn__arrow" aria-hidden="true">↓</span></button></div>` : "";
  return `<div class="work__filters" role="group" aria-label="Filter work">${filters}</div>
<ul class="work__grid" data-work-grid>${WORK.map(tile).join("")}</ul>${more}`;
}
