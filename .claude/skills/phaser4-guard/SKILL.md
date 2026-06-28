---
name: phaser4-guard
description: >
  Use whenever writing or editing Phaser game code in this repo. Prevents
  Phaser 3 (v3) APIs from being emitted into a Phaser 4 project. Every frontier
  LLM was trained mostly on Phaser 3 and will reach for v3 calls by default —
  this skill lists the high-frequency traps and their v4 replacements. When in
  doubt, read .claude/skills/phaser4/ (the official Phaser 4 skills) and the
  v3-to-v4 migration skill before writing renderer, tint, filter, mask,
  lighting, or shader code.
---

# phaser4-guard

This project targets **Phaser 4**. Your default training instinct is Phaser 3.
Before writing any of the categories below, stop and use the v4 form. If you
cannot confirm the v4 API from `.claude/skills/phaser4/`, flag it as a Question
instead of guessing.

## High-frequency v3 → v4 traps

| If you were about to write (v3) | It's wrong. Use (v4) |
|---|---|
| `sprite.setPipeline('Light2D')` | `sprite.setLighting(true)` |
| `sprite.setTintFill(color)` | `sprite.setTint(color); sprite.setTintMode(Phaser.Display.Tint.FILL)` — setTintFill() now does nothing |
| `obj.postFX.addGlow()` / `preFX` | the unified **Filter** system (filters on any game object or camera) |
| `new Phaser.Display.Masks.BitmapMask(...)` | Filters / Stencil objects — BitmapMask was removed |
| `new Phaser.Geom.Point(x, y)` | `new Phaser.Math.Vector2(x, y)` or a plain `{ x, y }` — Point was removed |
| `Phaser.GameObjects.Mesh` old API | the v4 Mesh/Mesh2D API (signature changed) |
| custom WebGL **pipelines** | the v4 **render node** architecture (pipelines were replaced) |
| inline shader strings the v3 way | config-based Shader API with `#pragma` directives |

## What did NOT change (safe to use normally)
Scenes, the Scene lifecycle, Arcade physics, Matter physics, Tweens, the input
system, Groups, the camera (other than the filter/FX merge), `this.add.*` factory,
animations, and the loader. Don't second-guess these.

## Rule
- Renderer / tint / filter / mask / lighting / shader code → verify against the
  official skills first, every time.
- Gameplay / scene / physics / tween / input code → proceed normally.
- Unsure → Question, don't guess. A silent v3 call costs a Saturday.
