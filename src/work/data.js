// Selected work. One entry per tile; files live in public/work/ (made by scripts/work-media.sh).
//   video:    <file>.mp4 plus a <file>.webp poster
//   carousel: a list of 4:5 slides, shown as one tile that opens into a swipeable set
//   image:    a single 9:16 still (reel covers)
// `cat` must be one of CATEGORIES. Order here is the order on the page.

export const CATEGORIES = [
  { id: "wedding", label: "Wedding content", colour: "var(--lilac)" },
  { id: "creator", label: "Content creator", colour: "var(--pink)" },
  { id: "editing", label: "Video editing", colour: "var(--lime)" },
  { id: "carousel", label: "Carousels", colour: "var(--butter)" },
  { id: "cover", label: "Reel covers", colour: "var(--tangerine)" },
];

export const WORK = [
  { type: "video", cat: "creator", file: "ugc-lime-cushion", title: "Two cushions, one pick", client: "LIME", dur: 16 },
  { type: "video", cat: "wedding", file: "wedding-2669", title: "Nurul & Johan", client: "Say Moment", dur: 19 },
  { type: "video", cat: "editing", file: "edit-etalase-1", title: "Why small shops lose money", client: "e-Talase", dur: 54 },
  {
    type: "carousel",
    cat: "carousel",
    title: "Cushion carousel set",
    client: "LIME",
    slides: ["lime-slide-1", "lime-slide-2", "lime-slide-3", "lime-slide-4", "lime-slide-5", "lime-slide-6"],
  },
  { type: "image", cat: "cover", file: "etalase-cover-1", title: "Sering rugi", client: "e-Talase" },
  { type: "video", cat: "wedding", file: "wedding-2949", title: "Speeches & smiles", client: "Say Moment", dur: 23 },
  { type: "video", cat: "editing", file: "edit-lime-2", title: "Skin that looks filtered", client: "LIME", dur: 14 },
  { type: "video", cat: "editing", file: "edit-recap-ai-canva", title: "Workshop recap: AI & Canva", client: "Event", dur: 23 },
  { type: "video", cat: "wedding", file: "wedding-2671", title: "Signed & sealed", client: "Say Moment", dur: 20 },
  { type: "video", cat: "creator", file: "ugc-travel", title: "Out and about", client: "Personal", dur: 14 },
  { type: "video", cat: "editing", file: "edit-lime-1", title: "New launch teaser", client: "LIME", dur: 20 },
  { type: "image", cat: "cover", file: "etalase-cover-2", title: "3 hal ini", client: "e-Talase" },
  { type: "video", cat: "wedding", file: "wedding-2670", title: "Akad moments", client: "Say Moment", dur: 17 },
  { type: "video", cat: "editing", file: "edit-etalase-2", title: "3 things that cost you", client: "e-Talase", dur: 43 },
  { type: "image", cat: "cover", file: "etalase-cover-3", title: "Masih perlu toko?", client: "e-Talase" },
  { type: "video", cat: "wedding", file: "wedding-2944", title: "Reception highlights", client: "Say Moment", dur: 35 },
  { type: "video", cat: "wedding", file: "wedding-2673", title: "Bridal details", client: "Say Moment", dur: 15 },
  { type: "image", cat: "cover", file: "etalase-cover-4", title: "Jualan kayak gini?", client: "e-Talase" },
  { type: "video", cat: "wedding", file: "wedding-2672", title: "Family portrait", client: "Say Moment", dur: 14 },
  { type: "image", cat: "cover", file: "etalase-cover-5", title: "Manual vs. online", client: "e-Talase" },
  { type: "video", cat: "wedding", file: "wedding-2945", title: "Bride & bouquet", client: "Say Moment", dur: 11 },
  { type: "image", cat: "cover", file: "etalase-cover-6", title: "Bayar potongan terus", client: "e-Talase" },
  { type: "image", cat: "cover", file: "etalase-cover-7", title: "Dulu berantakan", client: "e-Talase" },
];
