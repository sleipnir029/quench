# 01-mixer — SPEC

Game 1. First game of the curriculum proper. Moves you from the dodger's reflex +
survival-score to **deliberate discrete choice + a computed quality metric**. The
whole game is built on primitives and plain math — zero filter/blend/renderer code.

## Premise (1 sentence)
Combine fixed colour sources to match a target swatch as closely as you can; the
closer your mix, the more rounds you survive.

## Core fundamental
A real evaluation function. The gotcha that justifies the game: **naive RGB distance
is perceptually wrong** — equal RGB gaps are not equal perceived gaps. Scoring must
work in a perceptual space, not sRGB.

## The ONE mechanic
Tap colour sources to add "drops" to a running mix; lock it in to score against the target.

## Scope cap — HARD, do not exceed
- 5 fixed source colours, 1 target, 1 current-mix swatch
- per-round **drop budget** (start 10; no undo — a drop is permanent)
- Lock anytime → scored. Within tolerance: next round. Outside tolerance: game over.
- endless rounds; ΔE tolerance shrinks each round (start ~25, −1.5/round, floor ~6)

## Input
Pointer/tap only: the 5 source buttons + a Lock button. Discrete taps (no axis,
no drag). Mobile-safe.

## Mixing model (gameplay simplification — keep it dumb)
- Mix = running average of all added drops in sRGB:
  `mix = (mix*n + source) / (n+1)`; first drop sets the mix.
- Reachable colours = the convex hull of the 5 sources. Generate each target as a
  **random convex combination of the sources** so every target is genuinely reachable
  (skill, not luck, decides). Drop budget bounds achievable precision → the shrinking
  tolerance eventually outpaces it → natural difficulty ramp and fail.

## Scoring (THIS is the lesson — do it right)
- Convert mix and target sRGB → linear → XYZ → **CIELAB**.
- Distance = **ΔE (CIE76 = Euclidean distance in CIELAB)**. Within `tolerance` ⇒ match.
- Do NOT score on raw sRGB Euclidean distance. That is the wrong answer the game exists
  to teach. (Optional upgrade if time remains: CIEDE2000 — not required to ship.)

## Art (functional colour — a deliberate, SPEC'd deviation from Quench Core)
- Sources: Red, Yellow, Blue, White, Black (gives hue + tint/shade ⇒ a wide gamut).
- Target / mix / sources rendered as primitive rounded rects. UI chrome (bg, text,
  score, Lock button) stays Quench Core. No images.

## Audio (from feel/sfx)
- `pickup` on each drop, `pickup` (higher) on a successful round, `hit` on game over.

## Win / lose
- Win: none — endless.
- Lose: Lock with ΔE > tolerance, or exhaust the drop budget and the forced lock is outside tolerance.
- Score: rounds cleared. Persist to `quench:01-mixer:hi`.

## Juice
- Round win: `burst` at the mix swatch in the matched colour. Game over: `shake` + brief `hitstop`.

## Explicitly OUT of scope (stays cut)
- GPU blend modes / Phaser filter system (that is the future "Filters" game, NOT this one)
- palette editor, custom/unlockable sources, hint system, per-drop undo, Clear-and-retry,
  timed mode, multiple simultaneous targets, true subtractive (Kubelka-Munk) mixing,
  CIEDE2000 (optional only), music.

## Definition of done (ship gate)
Runs from the itch page; 5 sources + target + live mix + Lock; scoring is done in CIELAB
(verify it is NOT sRGB distance); rounds advance with tightening tolerance; high score
persists; `/ponytail-review`, build, zip, upload, test live link, 5-line devlog.
The devlog's "one thing I learned" = perceptual colour distance.
