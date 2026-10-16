import { mountPlotter } from "./plotter-live.js";
import { mountProjector } from "./projector-live.js";
import { mountCatalog } from "./catalog-live.js";

// Each plate is mounted once its markup exists; the figures run only while visible.
const MOUNTS = {
  plotter: mountPlotter,
  projector: mountProjector,
  catalog: mountCatalog,
};

export function mountFigures() {
  document.querySelectorAll("[data-figure]").forEach((root) => {
    const mount = MOUNTS[root.dataset.figure];
    if (mount && root.querySelector(".iso-stage")) mount(root);
  });
}
