#!/usr/bin/env bash
# Builds the new Metr0niks repo from kr0-game-studio.
# Usage: handoff/metr0niks/assemble.sh /path/to/new-metr0niks-repo
# Copies files only; never deletes anything in the studio repo.
set -euo pipefail
KIT="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "$KIT/../.." && pwd)"
DEST="${1:?usage: assemble.sh DEST}"
G="$SRC/games/metr0niks"; A="$SRC/art/metr0niks"
mkdir -p "$DEST"/{docs/superseded,decisions,feedback/human,feedback/synthetic,research,level-concepts,tuning-runs,characters,art,game,tests,.claude/skills}

# Rules, board, tuning summary
cp "$KIT/CLAUDE.md" "$KIT/BOARD.md" "$DEST/"
cp "$KIT/tuning-runs/README.md" "$DEST/tuning-runs/"
cp "$KIT/package.json" "$DEST/"
mkdir -p "$DEST/.githooks" && cp "$KIT/pre-push" "$DEST/.githooks/pre-push" && chmod +x "$DEST/.githooks/pre-push"

# Docs
cp "$G/gdd.md" "$G/tdd.md" "$G/proposals.md" "$G/open-questions.md" "$G/level-design.md" "$DEST/docs/"
cp "$SRC/studio/gdd-template.md" "$DEST/docs/"
cp "$G"/superseded/*.md "$DEST/docs/superseded/"
cp "$G/level-design-ink.md" "$DEST/docs/superseded/"
cp "$G/artifacts/handoff-gdd-prompt.md" "$DEST/docs/superseded/"
cp "$G/tuning-history.md" "$DEST/docs/superseded/tuning-history-2026-10-29.md"

# Decision logs: keep the 10 newest rows, archive the rest
trim() { # $1 source log, $2 kept file, $3 archive file, $4 title
  awk -v keep="$2" -v arch="$3" -v title="$4" '
    BEGIN { n = 0; hdr = "" }
    /^\| [GT]DD-D[0-9]+ / { n++; if (n <= 10) print > keep; else { if (!a++) printf "%s", hdr2 > arch; print > arch }; next }
    { if (n == 0) { print > keep; if ($0 ~ /^\|/) hdr2 = hdr2 $0 "\n" } else print > keep }
    END { if (a) { close(arch) } }' "$1"
  if [ -f "$3" ]; then
    { printf '# %s, archived 2026-10-30\n\nRows trimmed from the live log. Newest first.\n\n' "$4"; cat "$3"; } > "$3.tmp" && mv "$3.tmp" "$3"
  fi
}
trim "$G/gdd-decisions.md" "$DEST/docs/gdd-decisions.md" "$DEST/docs/superseded/gdd-decisions-archive-2026-10-30.md" "Metr0niks GDD decisions"
trim "$G/tdd-decisions.md" "$DEST/docs/tdd-decisions.md" "$DEST/docs/superseded/tdd-decisions-archive-2026-10-30.md" "Metr0niks TDD decisions"
for f in "$DEST/docs/gdd-decisions.md" "$DEST/docs/tdd-decisions.md"; do
  printf '\nOlder rows: [archive](superseded/%s).\n' "$(basename "${f%.md}")-archive-2026-10-30.md" >> "$f"
done

# Point doc links at the new layout
for f in "$DEST"/docs/*.md; do
  sed -i -e 's#](feedback/#](../feedback/#g' -e 's#](decisions/#](../decisions/#g' \
         -e 's#](research/#](../research/#g' -e 's#](tuning-history.md#](../tuning-runs/README.md#g' \
         -e 's#`tuning-history.md`#`tuning-runs/README.md`#g' "$f"
done

# Decisions, feedback, research (level concepts are redone), tuning runs
cp -r "$G"/decisions/*.md "$DEST/decisions/"
cp -r "$G"/feedback/human/. "$DEST/feedback/human/"
cp -r "$G"/feedback/synthetic/. "$DEST/feedback/synthetic/"
find "$G/research" -maxdepth 1 -type f -exec cp {} "$DEST/research/" \;
cp "$G"/tuning-runs/*.jsonl "$DEST/tuning-runs/"

# Reference sim (the old prototype's rules engine)
mkdir -p "$DEST/tests/reference-sim" && cp "$G"/simulations/*.js "$DEST/tests/reference-sim/"

# Art: characters get their own folder, review pages move next to them
cp -r "$A/characters/." "$DEST/characters/"
mkdir -p "$DEST/characters/tim-o/reviews"
cp -r "$G/artifacts/guided-run-review" "$G/artifacts/puppet-rigging-lab" "$DEST/characters/tim-o/reviews/"
for d in "$A"/*; do [ "$(basename "$d")" = characters ] || cp -r "$d" "$DEST/art/"; done

# Skill
cp -r "$SRC/studio/skills/gdd-designer" "$DEST/.claude/skills/"

# INDEX.md: one row per document
{
  printf '# Metr0niks index\n\nEvery document in the repo. Regenerate or add a row when one is added or retired.\n\n| Path | Title |\n| --- | --- |\n'
  cd "$DEST"
  find . -name '*.md' -not -path './.git/*' -not -path './art/*' -not -path './characters/*/sprites/*' | sort | while read -r p; do
    t="$(grep -m1 '^# ' "$p" | sed 's/^# //')"; printf '| [%s](%s) | %s |\n' "${p#./}" "${p#./}" "${t:-}"
  done
} > "$DEST/INDEX.md.tmp" && mv "$DEST/INDEX.md.tmp" "$DEST/INDEX.md"

touch "$DEST/game/.gitkeep" "$DEST/level-concepts/.gitkeep"
echo "Assembled into $DEST. Next: cd $DEST && git config core.hooksPath .githooks && npm test"
