#!/usr/bin/env bash
# Turns original portfolio files into web-sized media in public/work/ for the Selected work grid.
#
#   scripts/work-media.sh video  <source.mov|mp4>  <name> [poster-second]   → name.mp4 + name.webp poster
#   scripts/work-media.sh cover  <source.png|jpg>  <name>                   → name.webp (9:16, 720 wide)
#   scripts/work-media.sh slide  <source.png|jpg>  <name>                   → name.webp (4:5, 864 wide)
#
# Then add a line for it in src/work/data.js. Needs ffmpeg with libx264 and libwebp (set FFMPEG to
# use a specific binary). Videos become 720-wide H.264 at CRF 26 with 96 kbps AAC, which keeps a
# 20-second clip around 3 MB. iPhone HDR (HLG) clips convert fine as-is: HLG is made to look right
# when shown as SDR, and a tone-mapped version looked washed out by comparison.
set -euo pipefail
FFMPEG=${FFMPEG:-ffmpeg}
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/work"
mkdir -p "$OUT"
kind=${1:?kind: video|cover|slide}; src=${2:?source file}; name=${3:?output name}; t=${4:-1}
ff() { "$FFMPEG" -nostdin -v error -y "$@"; }
case $kind in
  video)
    ff -i "$src" -map 0:v:0 -map "0:a:0?" -vf "scale=720:-2:flags=lanczos,format=yuv420p" \
      -c:v libx264 -preset slow -crf 26 -profile:v high -pix_fmt yuv420p \
      -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
      -c:a aac -b:a 96k -ac 2 -movflags +faststart -map_metadata -1 "$OUT/$name.mp4"
    ff -ss "$t" -i "$OUT/$name.mp4" -frames:v 1 -vf "scale=480:-2" -c:v libwebp -quality 78 "$OUT/$name.webp" ;;
  cover) ff -i "$src" -vf "scale=720:-2:flags=lanczos" -c:v libwebp -quality 82 "$OUT/$name.webp" ;;
  slide) ff -i "$src" -vf "scale=864:-2:flags=lanczos" -c:v libwebp -quality 84 "$OUT/$name.webp" ;;
  *) echo "unknown kind: $kind" >&2; exit 1 ;;
esac
echo "wrote public/work/$name.*"
