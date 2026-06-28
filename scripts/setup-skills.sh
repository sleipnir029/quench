#!/usr/bin/env bash
# setup-skills.sh — install Claude Code skills PROJECT-LOCAL (no global leak).
# Run once from the repo root: bash scripts/setup-skills.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS="$ROOT/.claude/skills"
mkdir -p "$SKILLS"

echo "==> 1/3  Vendoring the official Phaser 4 skills into .claude/skills/phaser4/"
TMP="$(mktemp -d)"
git clone --depth 1 https://github.com/phaserjs/phaser "$TMP/phaser"
if [ -d "$TMP/phaser/skills" ]; then
  rm -rf "$SKILLS/phaser4"
  cp -R "$TMP/phaser/skills" "$SKILLS/phaser4"
  echo "    done: $(find "$SKILLS/phaser4" -name '*.md' | wc -l | tr -d ' ') skill files"
else
  echo "    WARN: skills/ not found in the phaser repo — check the repo layout and copy manually."
fi
rm -rf "$TMP"

echo "==> 2/3  ponytail (anti-over-engineering) — install from INSIDE Claude Code"
# The Phaser skills above are already project-local (committed under .claude/skills/).
# ponytail is a PLUGIN; install it interactively so the scope/syntax is whatever your
# current Claude Code version expects (don't trust a hardcoded CLI flag here).
echo "    Open Claude Code in this repo and run:"
echo "      /plugin marketplace add DietrichGebert/ponytail"
echo "      /plugin install ponytail@ponytail"
echo "    Then run /hooks and TRUST ponytail's hooks. Use /ponytail-review on Sundays."

echo "==> 3/3  Caveman 'grill-the-plan' sibling as a Friday spec gate"
# Vendored, NOT installed via caveman's global curl installer (which leaks to every agent).
echo "    To add it: git clone --depth 1 https://github.com/JuliusBrussee/skills /tmp/jb-skills"
echo "    then copy the planning/'grill' SKILL.md folder into $SKILLS/plan-gate/ and commit."
echo "    Skip if you'd rather just use Opus plan mode."

echo
echo "All project-local. Nothing was installed globally. Commit .claude/ to the repo."
echo "Restart Claude Code so it reloads the skills directory."
