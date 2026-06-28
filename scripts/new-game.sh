#!/usr/bin/env bash
# scripts/new-game.sh <game-folder>
# Merges the Phaser template/ scaffold INTO an existing game folder
# (which already holds SPEC.md + CLAUDE.md), then installs deps.
# Never clobbers SPEC.md/CLAUDE.md (the scaffold doesn't contain them).
# Usage:  bash scripts/new-game.sh games/00-dodger
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REL="${1:?usage: bash scripts/new-game.sh games/<NN-name>}"
DEST="$ROOT/$REL"

if [ ! -f "$ROOT/template/package.json" ]; then
  echo "ERROR: $ROOT/template/package.json not found."
  echo "Scaffold the template first, from the repo root:"
  echo "  npm create @phaserjs/game@latest    # name it 'template', pick Vite + TypeScript"
  echo "  rm -f template/log.js"
  exit 1
fi

mkdir -p "$DEST"
# copy CONTENTS of template/ into DEST; skip build artefacts; keep existing SPEC/CLAUDE
rsync -a --exclude node_modules --exclude dist "$ROOT/template/" "$DEST/"
( cd "$DEST" && npm install )

echo
echo "Ready ->  cd $REL && claude"
