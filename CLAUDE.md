# quench — global build rules (root)

These rules apply to every game in `games/`. Each game folder adds its own
`CLAUDE.md` that includes its `SPEC.md`. Obey the active game's SPEC over anything
general here, but never override a safety/scope rule below.

## Scope is law
- Build ONLY what the active `SPEC.md` lists. If a request, idea, or "nice touch"
  exceeds the Scope Cap, STOP and surface it as a **Question** — do not implement it.
- No second mechanic. No settings menu. No level editor. No ECS. No save system
  beyond the high-score localStorage in `lib/`. No tutorial beyond one line.
- Apply YAGNI / ponytail: prefer the dumbest thing that works. Fewer lines win.
  Mark any deliberate shortcut with a `ponytail:` comment naming its upgrade path.

## Engine: Phaser 4 ONLY — never Phaser 3
- Target Phaser **4** (the installed version, ≥4.1.0). Use `import Phaser from 'phaser'`.
- Before writing renderer, tint, filter/FX, mask, lighting, or shader code, consult
  `.claude/skills/phaser4/` and obey `.claude/skills/phaser4-guard/`.
- You were trained mostly on Phaser 3. Assume your first instinct is v3 and check.
  Common v3 traps and their v4 replacements are in the phaser4-guard skill.

## Art: primitives first
- Default to shapes (`this.add.rectangle`, `.circle`, `Graphics`) + the studio
  palette in `CONVENTIONS.md`. Color and motion ARE the art direction.
- Load an image/sprite ONLY if the active SPEC's asset list names it explicitly.
  If it's not in the list, it doesn't get built. Games 0–2: zero external art.

## Reuse the template — don't rewrite it
- `template/` (and each game's copy) provides:
  - `src/scenes/` : Boot → Preload → Game → GameOver skeleton
  - `src/feel/`   : screen shake, particle burst, hitstop, impact-sound hook
  - `src/lib/`    : single-input abstraction (`onAction`), score + high score
- Use these. Do not re-implement them per game. If `feel/` or `lib/` is missing a
  primitive a game genuinely needs, add it to the template generically, then use it.

## Conventions
- Design resolution 960×540, `Phaser.AUTO`, `Scale.FIT`, centered. See `CONVENTIONS.md`.
- TypeScript strict. No `any` unless justified in a comment. No new npm dependency
  without flagging it as a Question first (a dep is an over-build until proven).

## Workflow + reporting
- Planning happens in plan mode (Opus). Implementation is incremental (Sonnet).
- Report every step in this exact format:
  - **Phase** / **Step** / **Plan** / **Blocker** / **Question**
- Keep `CLAUDE.md` files short. Detail lives in `SPEC.md` and `CONVENTIONS.md`.

@CONVENTIONS.md
