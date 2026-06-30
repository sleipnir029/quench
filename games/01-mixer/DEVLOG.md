# Devlog — 01-mixer

1. **Mixer** — tap 5 fixed paints (Red, Yellow, Blue, White, Black) to add drops to a
   running mix, then Lock to match a target swatch. Endless rounds, one screen, deliberate
   discrete choice — the curriculum's step up from the dodger's reflex.
2. **One thing I learned: perceptual colour distance.** Naïve RGB Euclidean distance is the
   *wrong* answer — equal RGB gaps don't look equally far apart. The whole game is built to
   make that felt: scoring converts mix + target sRGB → linear → XYZ → **CIELAB** and grades
   on **ΔE (CIE76)**, never sRGB distance.
3. **Skill, not luck.** Every target is a random convex combination of the *usable* sources,
   so it's always reachable — the 10-drop budget bounds your precision, and the tolerance
   shrinks each round (25 ΔE, −1.5/round, floor 6) until it outpaces you. Locked sources
   (rounds 3–6: one greyed out; 7+: two) keep it changing without ever dropping below three.
4. **Making ΔE felt without showing a number.** ΔE stays hidden in-play — you judge by eye —
   taught instead by a **pass-line chip** sitting exactly `tolerance` ΔE from the target
   (`colorAtDeltaE`, asserted honest in `color.check`) that visibly tightens each round, plus
   a GameOver beat showing your mix vs target and the ΔE you hit vs needed.
5. **Built on the template, zero new art.** Phaser 4 primitives only; reused `feel/`
   (shake, burst, hitstop, sfx) and `lib/` (score, palette; `input` drives the menus) from
   game 0; added a generic CIELAB colour helper to the template. Points reward understanding ΔE — precision
   `1 + quality·1.5` × a streak multiplier — not just survival, and persist to
   `quench:01-mixer:hi`.

## Controls
- **Tap only** (pointer / touch): 5 source buttons + Lock. No drag, no axis. Mobile-safe.
- A drop is permanent — no undo. Spend all 10 and it auto-locks.

## Accessibility note (paste on the itch.io page)
> **Motion + haptics:** Brief screen shake / particle effects on lock, and light vibration
> on drop/win/loss where supported (not iOS Safari). Enable your OS **"Reduce Motion"**
> setting to soften the shake and disable the vibration. **Colour:** matching is the game — best played without a
> colour filter, in decent lighting.
