# 00-dodger — SPEC

Game 0 exists to harden the pipeline and hand you a real shipped link. It teaches
**nothing new mechanically** on purpose — that's the point. Its job is to make the
whole machine (scenes → score → restart → scaling → build → itch upload) work once,
and to produce `feel/` and `lib/` for the template to inherit.

## Premise (1 sentence)
A block slides left and right along the bottom of the screen, dodging blocks that
fall from the top; survive as long as you can.

## Core fundamental
The full pipeline end-to-end. No new game concept.

## The ONE mechanic
Move horizontally to avoid falling hazards. Difficulty ramps over time (spawn rate
and fall speed increase). That's it.

## Scope cap — HARD, do not exceed
- one player block, one hazard type (rectangles), one screen
- difficulty = two numbers that scale with elapsed time (spawnInterval, fallSpeed)
- title card → game → game over → restart. Nothing else.

## Input
`onAxisX` — the player block's x follows the pointer / finger x (works on touch and
mouse). Arrow keys / A,D as a secondary path. No other input.

## Art
- primitives only. Player = `hot` rectangle; hazards = `mute` rectangles; bg = `bg`.
- Asset list (exhaustive): none.

## Audio (from feel/sfx)
- `start` blip on launch, `hit` blip on death. Nothing else.

## Win / lose
- Win: none — endless.
- Lose: any hazard overlaps the player.
- Score: whole seconds survived. High score persists to `quench:00-dodger:hi`.

## Juice (build it here, promote to template/feel)
- `shake` on death, one `burst` at the player's position on death, brief `hitstop`
  before the GameOver scene. Build these as `feel/` modules, not inline.

## Explicitly OUT of scope (stays cut)
- powerups, multiple hazard shapes/types, lives, levels, difficulty menu, pause menu,
  particles beyond the single death burst, background music, sprites/images, leaderboards,
  combos, near-miss scoring. If you want any of these, they go in game 1+, not here.

## Allowed extras (deliberate, added after v1)
- A couple of **visual-only easter eggs** (e.g. a Konami-code flourish on the menu, a
  hidden nod at a rare score). They must not touch gameplay, fairness, scoring, or audio
  (audio stays start+hit only). Anything that affects play still goes to game 1+.

## Definition of done (ship gate)
Runs from the itch page in a browser, has a title and a restart, score + high score
work, dies correctly, and `feel/` + `lib/` have been promoted into `template/`.
Then: `/ponytail-review`, build, zip, upload, test live link, write the 5-line devlog.
