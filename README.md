# curatedby.rai

Portfolio site for **Raisha Auwliya** — remote creative partner and digital assistant from Surabaya
(Creative Media · Social Media Management · Virtual Assistant).

Vite + vanilla JS, GSAP (ScrollTrigger, SplitText, Flip, Draggable, Inertia) and Lenis. The three service
illustrations are interactive isometric figures drawn with the
[Anatomy](https://github.com/wheresryan22/anatomy) kit (MIT, vendored in `figures/kit/`).

## Develop

```sh
npm install
npm run dev        # http://localhost:5173  (figures.html shows the three figures alone)
npm run build      # → dist/
npm run preview
```

## How the figures work

Each figure is a Node module in `figures/` (`plotter.mjs`, `projector.mjs`, `catalog.mjs`) that builds every
static SVG path once with the kit. A small Vite plugin (`vite.config.js`) renders them at build time into
`index.html` wherever a `<!--figure:name-->` marker sits. In the browser, `src/js/figures/*-live.js` imports the
same modules and only moves the parts that move.

| Fig | Machine | Service | What moves |
| --- | --- | --- | --- |
| 1 | Feed plotter | Creative media | Gantry + 4-pen head plot a 3×3 Instagram grid; hover a tile to plot it |
| 2 | Carousel projector | Social media management | 15-slide tray (10 reels + 5 carousels) advances and projects each post with this month's dates |
| 3 | Card catalog | Virtual assistant | Six labelled drawers slide out with their index cards; the bell rings when a task is done |

## Editing content

- Copy, links and the package price live in `index.html`.
- Colours are tokens at the top of `src/styles/main.css`; light/dark role tokens (`--page`, `--text`, …) sit
  right below them. Plate inks for each figure are in `src/styles/figures.css`.
- The footer mini-game ("Curate this feed") is `src/js/curate.js`.

## Adding portfolio work

The **Selected work** grid is built from `src/work/data.js` (one line per tile) and rendered into
`index.html` at build time. Media lives in `public/work/`.

1. Make web-sized files from the original (needs `ffmpeg`):
   ```sh
   scripts/work-media.sh video "IMG_1234.MOV" wedding-1234 2   # 2 = poster frame at 2 s
   scripts/work-media.sh cover "Reel Cover.png" brand-cover-1
   scripts/work-media.sh slide "Slide 1.png" brand-slide-1
   ```
2. Add an entry to `WORK` in `src/work/data.js` (type, category, file, title, client, duration).
   The first 10 tiles show by default; the rest open with **Show all** or a filter.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow by hand). The site appears at
   `https://<user>.github.io/<repo>/`.

Asset paths are relative (`base: "./"`), so the same build also works on a custom domain. Set `BASE_PATH`
when building if you need an absolute base instead.
