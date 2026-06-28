# CONVENTIONS — the frozen template

Set once. Inherited by every game. A game overrides something here only with a
deliberate reason written into its SPEC.

## Folder layout (inside each game / the template)
```
src/
  main.ts            # boots the Phaser.Game with the config below
  scenes/
    Boot.ts          # set scale/input, then -> Preload
    Preload.ts       # load nothing for primitive games; -> Game
    Game.ts          # the ONE mechanic lives here. This is the only file you reopen.
    GameOver.ts      # score + high score + restart
  feel/              # reusable game-feel (built during game 0, never rewritten)
    shake.ts  burst.ts  hitstop.ts  sfx.ts
  lib/
    input.ts         # onAction() single-input abstraction
    score.ts         # score + persistent high score
    palette.ts       # the studio palette (below)
public/              # only if a SPEC names real assets (Kenney CC0)
```

## Game config (src/main.ts)
```ts
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960, height: 540,
  backgroundColor: PALETTE.bg,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Preload, Game, GameOver],
  // pixelArt: true ONLY when a SPEC introduces pixel sprites (games 3+).
};
```

## Studio palette (lib/palette.ts) — this IS the art direction
A fixed 6-colour set. Recolour = pick a different accent, never a new file.
```ts
export const PALETTE = {
  bg:   0x14131a,  // near-black base
  ink:  0xe8e6e3,  // text / UI
  hot:  0xff5d5d,  // danger / player accent
  cool: 0x4ec9b0,  // safe / target accent
  warn: 0xffd166,  // highlight / score pop
  mute: 0x6b6a78,  // inactive / hazard fill
} as const;
```
One display font only: system `ui-monospace` for games 0–2 (zero assets). Bundle a
single CC0 pixel font from game 3 if you want, and commit it to the template once.

### Shape grammar (games 0–2 — makes shape-games look like one studio)
- Rects use a 6px corner radius; hazards use 0 (sharp = dangerous). One outline
  weight (2px `ink` @ 35% alpha) or none — consistent within a game.
- Colour = meaning, every game: `hot` kills/costs, `cool` is wanted/safe,
  `warn` is feedback/score, `mute` is neutral. Never reassign per game.
- One easing family: Quadratic/Cubic, never linear for anything the player watches.
  Spawns scale in, deaths scale out.
- Full studio bible (and the pixel-era pipeline, which activates at game 3): `ART.md`.

## Single-input abstraction (lib/input.ts)
One entry point. Works on pointer, touch, and keyboard so every game is mobile-safe.
```ts
// onAction(scene, cb)  -> fires cb() on pointerdown / touch / Space / Enter
// onAxisX(scene)       -> returns a 0..width target x (pointer/finger x), for dodgers/aimers
```
Games that need only "go" use `onAction`. Games that need horizontal aim use `onAxisX`.
Nothing more elaborate than these two ships in the template.

## Score + high score (lib/score.ts)
- localStorage key: `quench:<game-id>:hi` (e.g. `quench:00-dodger:hi`).
- `Score.start()`, `Score.value`, `Score.commit()` (writes high score if beaten).

## feel/ API (built in game 0, reused forever)
```ts
shake(scene, ms, intensity)          // camera shake
burst(scene, x, y, color, n)         // one-shot particle pop
hitstop(scene, ms)                   // freeze-frame on impact
sfx.play('hit' | 'pickup' | 'start') // WebAudio blips, no asset files
```
Juice is applied from here, never hand-rolled per game. This file is the entire
deliverable of the old "Juice Lab" idea — it is a module, not a game.

## Scaling + safety
- Everything positions relative to `scale.width/height`, never hardcoded screen px.
- `roundPixels: true`. Pause the scene on blur so a tabbed-away game doesn't ramp
  difficulty in the background.
