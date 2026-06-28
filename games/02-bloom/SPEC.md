# 02-bloom — SPEC

Game 2. Moves you from "you drive the loop every frame" (dodger, mixer) to **you
author the starting conditions and the system runs itself**. The fundamental is the
double-buffered grid simulation; the realization is Conway's Game of Life so there is
zero rule-balancing to sink the weekend into.

## Premise (1 sentence)
Seed a grid of cells, press start, and keep the Life simulation alive and changing as
long as you can with a small budget of nudges.

## Core fundamental
Double-buffered grid simulation: read grid A → compute → write grid B → swap. Emergence
from fixed local rules. Simulation decoupled from per-frame player control.

## The ONE mechanic
Place live cells (seed before start; limited nudges during the run) to sustain the population.

## Rules (FIXED — do not invent or tune)
Conway's Game of Life, **B3/S23**: a dead cell with exactly 3 live neighbours is born;
a live cell with 2 or 3 live neighbours survives; otherwise it dies. Moore neighbourhood,
non-wrapping edges. These rules are famous and fixed — there is nothing to balance.

## Scope cap — HARD, do not exceed
- one grid (~48×27 cells, ~20px each, fits 960×540), one fixed ruleset, fixed tick rate (~6/s)
- seed phase: place up to ~60 live cells, then Start
- run phase: nudge budget ~10 taps (toggle a cell alive) to revive a fading board
- pause/resume allowed; nothing else
- endless; score = ticks survived before collapse

## Input
Pointer/tap: toggle cells (seed + nudge), Start button, Pause button, restart. Mobile-safe.

## Loop / scoring
- Seed → Start → the sim ticks at a fixed rate; the tick counter is the score.
- Render each tick: live = `cool`, dead = `bg`, cells born this tick flash `warn` for one tick.
- Collapse (game over) = ANY of:
  - population < 8 live cells, or
  - board fully dead, or
  - **stagnation**: the grid is identical for 2 consecutive ticks (still life / empty),
    detected by comparing buffers — a static board scores no more, so it ends.
- Score = ticks before collapse. Persist to `quench:02-bloom:hi`.

## Art
- Primitive square cells only. Quench Core palette (`cool`/`bg`/`warn`). No images, no grid lines
  heavier than 1px `mute` at low alpha. `pixelArt` stays false (these are rects, not sprites).

## Audio (from feel/sfx)
- `pickup` on a nudge, `hit` on collapse. NO per-tick sound (it would be grating).

## Win / lose
- Win: none — endless survival.
- Lose: collapse as defined above.
- Score: ticks survived.

## Juice
- Collapse: `shake` + `burst` at the centroid of the last live cluster + brief `hitstop` → GameOver.

## Explicitly OUT of scope (stays cut)
- the 3-species predator/prey/plant ecosystem (the balance-tuning trap — a future variant only)
- rule editor, adjustable rules, speed slider (one fixed rate + pause is all)
- zoom / pan / scrolling / infinite board, pattern preset library, save/load, music
- the cyclic-CA spiral variant, multiple cell types/colours beyond born-flash

## Definition of done (ship gate)
Runs from the itch page; seed → Start → ticking sim with a visible score; double buffering
is real (verify you swap buffers, not mutate in place); collapse + stagnation end the run;
high score persists; `/ponytail-review`, build, zip, upload, test live link, 5-line devlog.
The devlog's "one thing I learned" = double-buffered grid updates / why you can't mutate in place.
