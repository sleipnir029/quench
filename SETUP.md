# quench — operating manual

A GitHub monorepo. One frozen `template/`, one folder per game under `games/`,
project-local Claude Code skills under `.claude/`. macOS. Manual itch deploy
until game 2, then automate.

**The only success test:** game 0 ships to itch by Sunday 7pm. Not the elegance
of this system. If the system is pretty and the dodger doesn't ship, the system failed.

---

## Quickstart — one-time setup (~20 min)

You unzipped this into a `quench/` folder. It already contains everything EXCEPT the
Phaser project itself (`template/`), which you scaffold in step 2.

```bash
# 0. Node 20+ (nvm recommended on macOS)
node --version            # must be >= 20

# 1. Go into the unzipped folder and init git
cd quench
git init && git branch -M main

# 2. Scaffold the Phaser project ONCE into a NEW subfolder named `template`
npm create @phaserjs/game@latest
#   project name : template     <- type exactly this
#   web bundler  : Vite
#   language     : TypeScript
rm -f template/log.js                          # kill the telemetry pinger it ships
( cd template && npm install && npm run dev )  # confirm it runs in the browser, then Ctrl-C

# 3. Install the project-local skills (Phaser 4 skills + ponytail)
bash scripts/setup-skills.sh

# 4. First commit (push is optional)
git add -A && git commit -m "quench: scaffold + system"
gh repo create quench --private --source=. --push   # or make the repo on github.com
```

Note: `template/` (singular) is the Phaser project you just made. There is no
`templates/` folder. The per-game contract template is `SPEC.template.md` at the root,
used only when you invent a new game (3+). That's the whole setup — you never re-run it.

---

## The weekend loop (every game)

A new game = a copy of `template/`. For game 0 only, you work in a copy of the
raw scaffold and *promote* the reusable parts (scenes skeleton, `feel/`, `lib/`)
back into `template/` when you ship — so the template grows from real shipped
code, never from speculation.

Start at game 0 (it hardens the template and produces `feel/`+`lib/`). The game
folders already hold their `SPEC.md` + `CLAUDE.md`; the helper merges the Phaser
scaffold into them and installs deps:

```bash
# from the repo root
bash scripts/new-game.sh games/00-dodger     # merges template/ in + npm install
cd games/00-dodger && claude                  # picks up root CLAUDE.md + folder CLAUDE.md + SPEC.md
```

Doing it by hand instead? The trailing `/.` is load-bearing — it copies template's
*contents*, not the folder. `cp -R template games/00-dodger` (no `/.`) nests it and
breaks `npm install`:

```bash
cp -R template/. games/00-dodger/     # correct: note the /.   (or just use new-game.sh)
cd games/00-dodger && npm install
```

**Fri night (1–2h)** — Opus, plan mode. Fill `SPEC.md`. Run the plan-gate skill to
pressure-test scope. One sentence, one mechanic, one win/lose. Stop. No code.

**Sat** — Sonnet. Implement the single mechanic, primitives only. Playable by evening.
No second mechanic. If you reach for one, it goes in the OUT-OF-SCOPE list, not the code.

**Sun AM** — difficulty tuning + one juice pass (shake/burst/hitstop from `feel/`) + one death sound.

**Sun PM** — `/ponytail-review` the diff (delete bloat), `npm run build`, zip `dist/`,
upload to itch, test the live link, write the 5-line devlog. Published by 7pm.

### Per-game `CLAUDE.md` (6 lines — drop in each game folder)
```md
# <game> — build rules
Build ONLY what is in @SPEC.md. Anything beyond the Scope Cap → STOP, flag as Question.
Inherit all global rules from the root CLAUDE.md (Phaser 4 only, primitives-first, reuse template/).
Reuse from ../../template: scenes skeleton, feel/, lib/ (input, score). Do not rewrite them.
Status every step: Phase / Step / Plan / Blocker / Question.
@SPEC.md
```

---

## Deploy (manual, locked until after game 2)

```bash
npm run build                          # -> dist/
( cd dist && zip -r ../game.zip . )    # index.html MUST be at the zip root
```
itch.io → New project → Kind: **HTML** → upload `game.zip` → tick
**"This file will be played in the browser"** → set viewport to your design
resolution (960×540) → enable the fullscreen button → cover image → publish →
paste URL into the tracker. After game 2, swap this for `butler push` (one command).

---

## Locked decisions (and what was rejected, and why)

| Area | Locked | Rejected | Why |
|---|---|---|---|
| Engine | Phaser **4** (pin ≥4.1.0; latest 4.2.0) + TS + Vite | Phaser 3; Godot | 4.0.0 ESM build was broken (no default export); 4.1.0 fixed it. Godot loses to Phaser for browser-native 2-day ships. |
| Renderer drift | `phaser4-guard` skill blocks v3 APIs | trusting the LLM | Every model was trained mostly on Phaser 3; it WILL emit v3 (`setPipeline('Light2D')`, `setTintFill`, `postFX`). |
| Art | **Primitives only** (shapes + palette). Kenney CC0 fallback only if a SPEC names it. No art games 0–2. | Pixquare/Procreate pixel pipeline | That whole apparatus is Phase-3 work. Deferred, not deleted. |
| Repo | One GitHub monorepo, folder per game, project-local `.claude/` | repo-per-game; global skills | One place; skills can't leak to other repos. |
| Skills | Phaser official + phaser4-guard + ponytail (+ optional plan-gate) | generic TS / Vite / CSS / UI skills | Those are config set once, not always-on context. More skills = more drift. |
| Deploy | Manual now → butler after game 2 | CI/CD now | Don't automate a process you've run twice. |
| Models | Opus = plan (Fri), Sonnet = build (Sat/Sun) | Opus everywhere | Cost; planning is where Opus pays off. |

## Build order (LOCKED for 0–2; everything after is reviewed once 2 ships)
`0 dodger` — pipeline, real-time loop, ships nothing new (also absorbs Echo's "bare loop" lesson, safely).
`1 mixer` (math) — discrete choice + perceptual colour-distance scoring; zero filter/renderer code.
`2 bloom` (Conway's Life survival) — double-buffered grid sim + emergence.

Then, after the post-2-games review (decide updates + game 3 from what actually worked):
conductor → echo (audio feedback, now your finishing muscle is trained) → undo →
tilt (standalone or pointer-reframed — it **cannot** run embedded on itch) →
a dedicated Filters game (the Mixer-GPU/blend-mode version) → redacted (Ren'Py reset).

Juice Lab is **not a game** — it's the `feel/` module, built during game 0 and reused forever.
Why the reorder vs the source docs: Tilt can't embed on itch (verified), Mixer's GPU lesson is
the v3→v4 renderer minefield, and Echo's audio UX can't be timeboxed for a first ship.

**Hard rule:** if any of games 0–2 isn't live by Sunday 7pm, you may not start a
game with a new fundamental until it is.
