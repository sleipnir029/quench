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

## Scope amendment — owner-approved 2026-06-29
The base game shipped (commit `8dce60f`). The owner deliberately expanded scope past
the original HARD cap to make game 1 read as a real game, not a template demo. Approved
additions, recorded so "scope is law" stays honest (the law is amended, not broken):
**(1)** one added mechanic — *locked-source rounds*; **(2)** *precision + streak* scoring;
**(3)** a visible *tolerance "pass-line" chip* + a *GameOver teaching beat* to make ΔE felt;
**(4)** a full juice/animation pass + optional haptics. Still ONE mechanic — no further
additions without a new amendment. Everything in "Explicitly OUT of scope" below stays cut.

## Scope cap
- 5 fixed source colours, 1 target, 1 current-mix swatch, 1 "pass-line" reference chip
- per-round **drop budget** (start 10; no undo — a drop is permanent)
- **locked-source rounds**: 0 sources locked rounds 1–2, then 1, then 2 (never below 3
  usable). Locked sources grey out and can't be tapped; the target is generated from the
  usable sources only, so it stays reachable.
- Lock anytime → scored. Within tolerance: next round. Outside tolerance: game over.
- endless rounds; ΔE tolerance shrinks each round (start ~25, −1.5/round, floor ~6)

## Input
Pointer/tap only: the 5 source buttons + a Lock button. Discrete taps (no axis,
no drag). Mobile-safe.

## Mixing model (gameplay simplification — keep it dumb)
- Mix = running average of all added drops in sRGB:
  `mix = (mix*n + source) / (n+1)`; first drop sets the mix.
- Reachable colours = the convex hull of the **usable** sources. Generate each target as
  a **random convex combination of the usable sources** so every target is genuinely
  reachable (skill, not luck, decides) even when some sources are locked. Drop budget
  bounds achievable precision → the shrinking tolerance eventually outpaces it → natural
  difficulty ramp and fail.

## Scoring (THIS is the lesson — do it right)
- Convert mix and target sRGB → linear → XYZ → **CIELAB**.
- Distance = **ΔE (CIE76 = Euclidean distance in CIELAB)**. Within `tolerance` ⇒ match.
- Do NOT score on raw sRGB Euclidean distance. That is the wrong answer the game exists
  to teach. (Optional upgrade if time remains: CIEDE2000 — not required to ship.)
- **Points (amended):** a cleared round scores `BASE·(1 + quality·1.5)·streakMult`, where
  `quality = (tolerance − ΔE)/tolerance` (closer = more) and `streakMult` grows with
  consecutive *precise* clears (quality ≥ 0.4), capped ~2×. Points reward understanding
  ΔE, not just survival. The high score is the points total.
- **Teaching surfaces (amended):** ΔE stays hidden in-play (judge by eye). It is taught by
  a *pass-line chip* — a colour exactly `tolerance` ΔE from the target, shrinking visibly
  each round (helper `colorAtDeltaE`, honesty asserted in `color.check`) — and a GameOver
  beat showing final mix vs target with the achieved/needed ΔE.

## Art (functional colour — a deliberate, SPEC'd deviation from Quench Core)
- Sources: Red, Yellow, Blue, White, Black (gives hue + tint/shade ⇒ a wide gamut).
- Target / mix / sources rendered as primitive rounded rects. UI chrome (bg, text,
  score, Lock button) stays Quench Core. No images.

## Audio (from feel/sfx)
- `pickup` on each drop (pitch rises as the budget drains), `pickup` (higher, two-note) on
  a successful round, `hit` on game over. Optional mobile haptics on drop/win/loss
  (`feel/haptic`, gated on support + reduce-motion; iOS Safari has no Vibration API).

## Win / lose
- Win: none — endless.
- Lose: Lock with ΔE > tolerance, or exhaust the drop budget and the forced lock is outside tolerance.
- Score: **points total** (precision + streak, above). Persist to `quench:01-mixer:hi`.
  Rounds cleared is also tracked and shown on game over.

## Juice (amended — full pass)
- Drops fly from the tapped button to the mix and splash on landing; the mix swatch lerps
  its colour toward the new average with a scale punch; first drop reveals the swatch.
- Budget dots react (turn `warn` when low, punch on spend); target + pass-line chip scale
  in each round; the ΔE verdict pops (count-up) on lock; background drifts toward the
  target hue. Round win: `burst` in the matched colour + `+N` score pop. Game over:
  `shake` + brief `hitstop` + mix-swatch scale-out.

## Explicitly OUT of scope (stays cut — amendment did NOT lift these)
- GPU blend modes / Phaser filter system (that is the future "Filters" game, NOT this one)
- palette editor, custom/unlockable sources, hint system, per-drop undo, Clear-and-retry,
  **timed/blitz mode** (would undermine the deliberate-choice identity), power-ups
  (peek/undo/extra-drops), multiple simultaneous targets, true subtractive (Kubelka-Munk)
  mixing, CIEDE2000 (optional only), music. A **second** added mechanic — one only.

## Definition of done (ship gate)
Runs from the itch page; 5 sources + target + live mix + Lock; scoring is done in CIELAB
(verify it is NOT sRGB distance); rounds advance with tightening tolerance; high score
persists; `/ponytail-review`, build, zip, upload, test live link, 5-line devlog.
The devlog's "one thing I learned" = perceptual colour distance.
