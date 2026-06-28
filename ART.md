# ART — the quench studio bible

The grounding document. Constraints live here so they're never relitigated per game,
and so every weekend's creativity goes into mechanics and feel, not into re-deciding
the look. Two layers: the **studio core** (live from game 0) and the **pixel era**
(decisions locked now, *craft* deferred to the week before game 3).

The rule that separates "ground it" from "over-build it":
**Lock every decision now. Practice no craft before a game needs it.**
Decisions are cheap and reusable. Craft practiced early is rehearsal for a script
you haven't written — and three shipped primitive games will make the pixel-era
choices sharper than guessing them cold today.

---

## LAYER 1 — Studio core (live from game 0, never changes without a real reason)

### Palette — "Quench Core" (locked)
Six colours. This is the studio's face. Recolour by reassigning roles, never by
adding a seventh colour.
```ts
bg   0x14131a   near-black base
ink  0xe8e6e3   text / UI
hot  0xff5d5d   danger / the player's stake
cool 0x4ec9b0   safe / target / success
warn 0xffd166   score pops / highlights
mute 0x6b6a78   inert / hazard fill / disabled
```
The pixel era extends this to ~16 shades (Layer 2), but the six roles above stay
the identity. Lives in `lib/palette.ts`.

### Shape grammar (primitives era — this is what makes shape-games look like one studio)
- Entities are rectangles and circles only. One corner radius everywhere: **6px** on
  rects (0 for hazards, to read as "sharp = dangerous"). One outline weight: **2px**,
  in `ink` at 35% alpha, or none — pick per game and keep it consistent within the game.
- **Colour = meaning, always:** `hot` = the thing that can kill/cost you, `cool` =
  the thing you want, `warn` = feedback/score, `mute` = neutral/background hazard.
  A player never has to learn a new colour language between games.
- One motion family: easing is **Quad/Cubic** (`Phaser.Math.Easing.Quadratic`),
  never linear for anything the player watches. Spawns scale in, deaths scale out.

### Type (locked)
- Games 0–2: system `ui-monospace`. Zero assets, ships instantly.
- Game 3+: one bundled CC0 pixel font, committed to the template once. Candidates:
  **m5x7** (Daniel Linssen), **Kenney Mini**, **PixelOperator**, **Press Start 2P**.
  Pick one at game 3. Never a second font.

### Motion / game-feel character (locked, lives in `feel/`)
Punchy but soft. Short shakes (80–140ms, low intensity), one particle burst per
impact (6–10 particles, not a fountain), a 40–80ms hitstop on death only. The studio
*feels* responsive and light, never screen-filling chaos. If juice is louder than the
mechanic, it's wrong.

### Audio character (locked)
- Tool: **jsfxr** (runtime synth, no asset files) for games 0–2.
- Character: **low-bit, soft attack, no harsh highs, short (<300ms).**
- Three core sounds, same character across every game: `start`, `hit`, `pickup`.
  Save the jsfxr seeds/config in `feel/sfx.ts` so they're reproducible, not redrawn.
- Music: optional, **never blocks a ship.** One 15–30s Bosca Ceoil Blue loop, only
  when a game has time to spare. Most games ship silent-but-for-SFX. That's fine.

### Wordmark / splash (locked)
- Games 0–2: a text wordmark — "zeezbit" in the type + `ink`, one `hot` pixel as the
  dot/accent — on the title and GameOver scenes. No image asset.
- Game 3+: one small pixel splash frame, reused on every title/GameOver, committed to
  the template once. Authored, not per-game.

---

## LAYER 2 — Pixel era (decisions LOCKED now; craft activates at game 3)

These are frozen so they never become a weekend debate. You do **not** practice or
build any of this until the week before the first art game.

| Decision | Locked choice |
|---|---|
| Authoring tool | Pixquare (iPad), **Indexed mode** |
| Source palette | "Quench Core" + ~10 shading shades = one named 16-colour Lospec palette imported into Pixquare. Candidates to pick from at game 3: **Sweetie 16**, **Endesga 32** (use a 16-subset), **Resurrect 64** (subset). Exact hex values come from lospec.com on import — don't transcribe them by hand. |
| Frame size — objects | **32×32** (commit one project-wide; 16×16 only for an explicitly ultra-fast game) |
| Frame size — tiles | **16×16** |
| Never | mix arbitrary frame sizes within one project |
| Animation | timeline + onion-skin, **2–4 frames max** per anim for a 2-day game |
| Export | sprite sheet **+ JSON** for animated objects; indexed **PNG** for static/tiles |
| Recolour | duplicate file → palette remap in Pixquare (shape stays, look changes); in-engine `sprite.setTint()` for cheap single-hue, palette-swap shader for full remaps. Author indexed so both stay possible. |
| UI | one **9-slice** panel, ~24×24 with defined corners, drawn once, stretched in-engine to every button/HUD/dialog |
| Phaser config | set `pixelArt: true` so nearest-neighbour scaling keeps pixels crisp (only when sprites are introduced — NOT for the shape games) |
| Painterly (Procreate) | blog headers and post-ship A/B upgrades **only** — never in the per-game pipeline |

Phaser 4 load pattern (for reference when the time comes — verify against the
phaser4 skill, not from memory):
```ts
this.load.spritesheet('player', 'player.png', { frameWidth: 32, frameHeight: 32 });
this.anims.create({ key: 'walk',
  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
  frameRate: 8, repeat: -1 });
```

---

## The ONLY thing deferred (and why it's not "skipping the important part")
Deferred: the **hours of Pixquare practice** and authoring real sprite sheets / the
9-slice. Reason: it's craft, and craft practiced before a game demands it (a) bills a
weekend against nothing shipping, and (b) bakes in guesses about frame size /
animation / UI density that three shipped primitive games would have answered for you.
The decisions above are locked today so they're grounded; the craft lands the week
before game 3 so it's grounded *too*.

## What not to do (studio guardrails)
- No second font, second palette, or per-game art direction. Ever.
- No sprite authored before a SPEC's asset list names it.
- Music and splash never block a ship — if they're not done, ship without them.
- No painterly art in the game pipeline (blog headers only).
- Don't open Pixquare for production before the week of game 3.
