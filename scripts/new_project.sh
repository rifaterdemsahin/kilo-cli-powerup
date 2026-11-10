#!/usr/bin/env bash
# Scaffold a new Short project from this one (engine + templates, no project content).
# Usage: scripts/new_project.sh ~/projects/my-next-short "My Next Short"
set -euo pipefail
DEST="${1:?destination dir}"; TITLE="${2:-My Short}"
SRC="$(cd "$(dirname "$0")/.." && pwd)"
if [ -d "$DEST" ] && [ -n "$(ls -A "$DEST" 2>/dev/null)" ]; then echo "refusing: $DEST is not empty" >&2; exit 1; fi

mkdir -p "$DEST"/{scripts,docs,assets/{audio,images,transcript},build,remotion/{src,public}}
# engine (single copy lives here, so improvements flow into new projects)
cp "$SRC"/scripts/{run.sh,transcribe.sh,generate.py,prep_remotion.py,assemble.py} "$DEST/scripts/"
cp "$SRC"/remotion/{package.json,package-lock.json,tsconfig.json,remotion.config.ts} "$DEST/remotion/"
cp "$SRC"/remotion/src/{index.ts,Root.tsx,Short.tsx,data.ts,Thumb.tsx,JevSketch.tsx} "$DEST/remotion/src/"
cp "$SRC/.gitignore" "$DEST/"
cp "$SRC/template/index.template.html" "$DEST/index.html"
cp "$SRC/docs/PLAYBOOK.md" "$DEST/docs/"
# templates -> real files
cp "$SRC/template/storyboard.template.json" "$DEST/storyboard.json"
for f in PROJECT_README:README SANITY_CHECK:SANITY_CHECK DECISIONS:DECISIONS; do
  sed "s/{{TITLE}}/$TITLE/g" "$SRC/template/${f%%:*}.template.md" > "$DEST/${f##*:}.md"
done
# stub so `tsc`/studio work before the first prep run
cat > "$DEST/remotion/public/data.json" <<'JSON'
{"duration":10,"voice":null,"music":null,"words":[],"shots":[],"callouts":[],"hook":null,"formula":null,"banner":null,"jev":null,"thumbnail":null}
JSON
chmod +x "$DEST"/scripts/*.sh "$DEST"/scripts/*.py
(cd "$DEST" && git init -q && echo "initialised git repo")
echo "Created $DEST. Next: cd $DEST && edit storyboard.json, then follow README.md"
