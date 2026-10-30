#!/usr/bin/env bash
# Copies every Metr0niks prototype and lab into public/metr0niks/, keeping the repo's
# folder layout so their relative paths (../simulations, ../../../art) still resolve.
# Run by deploy.sh; the staged copy is ignored by git.
set -euo pipefail
cd "$(dirname "$0")"
REPO="$(cd ../.. && pwd)"; OUT="public/metr0niks"
rm -rf "$OUT/games" "$OUT/art"
for p in games/metr0niks/prototypes games/metr0niks/simulations games/metr0niks/research/level-concepts \
         art/metr0niks/ink-proto art/metr0niks/themes art/metr0niks/characters/tim-o/items art/metr0niks/board; do
  mkdir -p "$OUT/$(dirname "$p")" && cp -r "$REPO/$p" "$OUT/$p"
done
cp play.html "$OUT/index.html"
echo "Staged $(find "$OUT" -type f | wc -l) files in $OUT"
