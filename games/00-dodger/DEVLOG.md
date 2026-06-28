# Devlog — 00-dodger

1. **Dodger** — slide a block along the bottom, dodge falling blocks, survive; difficulty ramps with time. One mechanic, one screen, endless.
2. Game 0 exists to harden the whole pipeline end-to-end (scenes → score → restart → scaling → build → itch), not to teach a new mechanic.
3. Shipped the reusable studio kit alongside it: `feel/` (shake, burst, hitstop, sfx) and `lib/` (palette, single-input, persistent high score, reduced-motion), now promoted into the template every future game copies.
4. Built on Phaser 4 (primitives only, zero game art), 1920×1080 render for crisp visuals, with a Zeezbit studio splash that blends with the logo's own colour and morphs into the game background.
5. Next: game 1 (01-mixer) inherits this template, so it starts at "build the mechanic" instead of "wire the machine."

## What's in it (visual/feel only — still one mechanic)
- **Game feel:** player squash/stretch + lean, a constant idle bob, an earned comic "breath" after movement+rest, hazard fade-in telegraph, punchy death (flash + burst + spin-out), score-milestone pop, motion trail behind the player.
- **Long-run life** (difficulty caps at 45s, so these carry it): a vignette whose colour drifts a full hue wheel ~every 40s, a "beat" pulse that gently quickens, falling blocks tinted to the *complement* of the vignette (always contrasting, never blending), a fall-speed wave (~±20% / ~9s) to ride, and small quirky lines at random intervals (shuffle-bag so they don't cluster).
- **Easter eggs:** Konami code on the menu (rainbow flourish), and a "DON'T PANIC" pop at 42s.

## Controls
- **Desktop:** mouse (block follows cursor x) or arrow keys / A,D. Hold **Shift** for fine, precise movement.
- **Mobile:** touch anywhere and **drag** (relative control, so your finger stays off the play area). Tap to start / retry. Best in landscape.

## Accessibility note (paste on the itch.io page)
> **Motion note:** This game uses screen shake and pulsing visual effects. If you're
> sensitive to motion, enable your OS **"Reduce Motion"** setting before playing — the
> game detects it and automatically softens the shake (into a flash) and tones down the
> squash/pulse/trail effects.

(macOS: System Settings → Accessibility → Display → Reduce Motion. Windows: Settings →
Accessibility → Visual effects → Animation effects off. iOS/Android have equivalents.)
