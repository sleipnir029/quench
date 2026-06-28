# Devlog — 00-dodger

1. **Dodger** — slide a block along the bottom, dodge falling blocks, survive; difficulty ramps with time. One mechanic, one screen, endless.
2. Game 0 exists to harden the whole pipeline end-to-end (scenes → score → restart → scaling → build → itch), not to teach a new mechanic.
3. Shipped the reusable studio kit alongside it: `feel/` (shake, burst, hitstop, sfx) and `lib/` (palette, single-input, persistent high score), now promoted into the template every future game copies.
4. Built on Phaser 4 (primitives only, zero game art), 1920×1080 render for crisp text/shapes, with a Zeezbit studio splash that blends with the logo's own colour and morphs into the game background.
5. Next: game 1 (01-mixer) inherits this template, so it starts at "build the mechanic" instead of "wire the machine."
