---
title: "MIXER — RGB is the wrong way to measure colour"
date: 2026-06-30
studio: Zeezbit Studios
play: https://zeezbitstudios.itch.io/mixer
tags: [gamedev, phaser, devlog, quench, colour]
cover: ./images/cover.png
description: >
  Game one. Mix five fixed paints to match a target swatch — but "how close did
  you get?" turns out to be a real question with a wrong answer. The whole game is
  built to teach why naïve RGB distance lies to your eyes.
---

![MIXER — Zeezbit Studios](./images/cover.png)

# MIXER — RGB is the wrong way to measure colour

[DODGER](../00-dodger/) proved the machine: title → game → score → build → a real link
someone can click. Game zero taught nothing on purpose. Game one is where the curriculum
actually starts — and it starts with a question that sounds trivial and isn't:

*Given two colours, how far apart are they?*

This is that game.

**▶ Play it in your browser:** [zeezbitstudios.itch.io/mixer](https://zeezbitstudios.itch.io/mixer)

## What it is

Five fixed paints — Red, Yellow, Blue, White, Black. You tap them to drop pigment into a
running mix. A target swatch sits next to your mix. When you think you're close enough, you
hit **Lock**, and the game scores how well you matched it. Close enough → next round.
Not close enough → game over.

That's the whole thing. One mechanic, one screen, endless. But it's a real *decision* game,
not a reflex one — the dodger asked your hands to be fast; this asks your eyes to be right.
You get a budget of ten drops per round and **no undo** — a drop is permanent — so every tap
is a deliberate choice about where the mix should move next.

![The studio — five paint sources, your live mix, the target, and the pass-line chip](./images/shot-play1.png)

## The lesson: "close" is not what you think it is

Here's the gotcha the whole game exists to teach.

The obvious way to score a colour match is to treat each colour as a point — red, green,
blue — and measure the straight-line distance between your mix and the target. Three numbers,
Pythagoras, done. It feels right. It's also **wrong**, and wrong in a way you can see.

The problem: equal gaps in RGB are *not* equal gaps to your eye. Move a colour ten steps in
the green channel and ten steps in the blue channel, and your eye says the green shift moved
*much* further — human vision is far more sensitive to some regions of colour than others.
RGB is a storage format for screens, not a model of perception. Scoring a colour-matching
game in RGB would reward mixes that look obviously off and punish mixes that look identical.
The game would feel *broken*, and you wouldn't be able to say why.

So MIXER doesn't score in RGB. Every time you lock, the mix and the target both get
converted **sRGB → linear → XYZ → CIELAB** — a colour space deliberately built so that equal
distances *look* equal — and the score is the distance between them *there*. The metric has a
name, **ΔE** ("delta-E", CIE76), and a single rule: a small ΔE means two colours your eye
agrees are close. That's the entire reason the game is fair.

If you remember one thing from this devlog, that's it: **to measure how different two colours
look, you cannot use the numbers your screen stores them in.**

## How it's built

- **Phaser 4 + TypeScript + Vite**, same as DODGER. Strict types, fast bundler, builds to a
  folder I drag onto itch.
- **Primitives only. Zero art.** Every paint, the mix, the target, the buttons — all rounded
  rectangles drawn at runtime. The colour genuinely *is* the content here, which is the one
  game where "no sprites" isn't a constraint, it's the point.
- **No GPU tricks.** No blend modes, no shaders, no filter passes. The mix is plain
  arithmetic — a running average of the drops you've added — and the scoring is plain colour
  maths. Nothing about the mixing or the grading touches the renderer. (The pretty
  *subtractive* blend modes are a future game's problem, not this one's.)

Game zero's deliverable was two reusable folders. Game one adds two more primitives to that
same shared template, built generically so every future game inherits them:

- **`lib/color.ts`** — the colour-space plumbing: the full sRGB ⇄ CIELAB round-trip, the ΔE
  distance function, and a helper that runs it *backwards* — given a colour and a target ΔE,
  find a real colour exactly that far away (more on why below).
- **`feel/haptic.ts`** — light mobile vibration on drop, win, and loss, gated on device
  support and the OS reduce-motion setting. (iOS Safari has no vibration API, so it simply
  no-ops there — no crash, no pretending.)

## Making an invisible number felt

The hard design problem: ΔE is the soul of the game, and it's a number the player must never
see. Show "ΔE 14.2" on screen and you've turned a game about *looking* into a game about
reading a readout. But hide it completely and the player has no idea how close "close enough"
even is. How do you teach a threshold you refuse to print?

Two answers, both built in:

- **The pass-line chip.** Next to the target sits a second swatch that is *exactly* as far
  from the target as this round's tolerance allows — the literal edge of passing, rendered as
  a colour. If your mix looks at least that close, you clear. This is what the backwards ΔE
  helper is for: the chip is computed, not faked, and a self-check asserts it's honestly the
  right distance. Every round the tolerance shrinks, so you can *watch* the pass-line creep
  closer to the target and feel the game tighten around you.
- **Plain language, not a metric.** The verdict on lock reads as a **"% match"** that counts
  up, with a ✓ or ✗ — not a raw ΔE. The number you see is human; the number doing the work
  stays hidden. (This was a deliberate late reversal — see below.)

The difficulty ramp falls out of this naturally. Targets are always genuinely reachable —
each one is mixed from the *usable* paints, so skill decides, not luck — but your ten-drop
budget caps how precisely you can ever hit one. The tolerance starts forgiving (25 ΔE) and
shrinks ~1.5 each round down to a floor of 6. Eventually it shrinks past what ten drops can
achieve, and that's the game: it doesn't kill you, it out-precises you.

There's a second twist that arrived with the scope amendment (below): **locked sources**.
From round three, one paint greys out and can't be tapped; from round seven, two do. The
target is always built only from the paints you're *allowed* to use, so it stays reachable —
but you have to find a route to it through a smaller box of pigments.

<p align="center">
  <img src="./images/shot-play2.png" alt="A later round — tolerance tightened, one source locked out" width="48%" />
  <img src="./images/shot-over.png" alt="Game over — your mix vs the target, and the ΔE you hit vs needed" width="48%" />
</p>

## Things that changed, and why

A devlog that only lists features is lying. Here's what actually moved during the build:

- **I scored it in RGB first — and it felt unfair.** The earliest version graded on raw RGB
  distance because it was ten minutes of work. It was subtly, maddeningly wrong: mixes that
  looked spot-on failed, mixes that looked muddy passed. That bug *is* the lesson, so I kept
  the memory of it and rebuilt the scoring in CIELAB. The game only became fair once the
  maths matched the eye.
- **The painterly chips got deleted.** I had a "tactile paint studio" look — textured,
  painterly swatches with brushy edges. It was pretty and it was noise: it made it *harder*
  to judge two colours against each other, which is the entire task. I flattened everything
  back to clean dodger-style chips. Crispness beat personality, because here legibility *is*
  the gameplay.
- **The ΔE number became a "% match".** For a while the lock verdict showed the actual ΔE.
  Watching people play, the number pulled their eyes off the colours — they were doing
  arithmetic, not seeing. Swapped it for a plain "% match" count-up. The honest metric still
  runs underneath; the player just gets a human-shaped version of it.
- **The scope grew — on purpose, and on the record.** The original SPEC had a hard cap that
  would've shipped a template demo, not a game. I deliberately amended it (written into the
  SPEC, not smuggled in): one added mechanic (locked sources), precision + streak scoring,
  the pass-line chip, and a full juice pass. The rule in this project is "scope is law" — so
  when the law changes, you *amend it in writing* rather than quietly break it. Everything
  still cut (blitz mode, power-ups, a palette editor, true subtractive mixing) stayed cut.

## Built with an AI workflow (and kept honest by it)

Same as game zero: I build this with Claude Code run as a disciplined pipeline, not "AI, make
me a game." Three separated roles — a **planner** that designs before any code, an
**implementer** that follows the approved plan, and a **reviewer** that critiques work it
didn't write. You don't approve your own code.

That last role earned its keep here. This devlog's every claim — the tolerance numbers, the
points formula, the fact that scoring is *actually* CIELAB and not sRGB — was checked against
the source by an independent reviewer pass before it shipped, and it caught two small
overclaims I'd written. On a solo project, the reviewer that argues with you is the one thing
keeping the writing honest about the code.

## Accessibility note

> **Motion + haptics:** Locking a mix triggers a brief screen shake and a particle burst, and
> on supported devices a light vibration on drop / win / loss. Enable your OS **"Reduce
> Motion"** setting to soften the shake and disable the vibration.
>
> **Colour:** matching colours *is* the game, so it's best played without a system colour
> filter and in reasonable lighting. There's no colour-blind mode in this one — an honest
> limitation of a game whose whole mechanic is hue.

## What's next

Game zero proved the machine. Game one proved the machine can carry a *real idea* — a genuine
evaluation function, done correctly, hidden inside something that plays like a toy. The
curriculum continues: each game takes one fundamental and builds the smallest complete thing
that teaches it.

The one thing I learned shipping MIXER: **perceptual colour distance is a real problem with a
wrong answer, and the wrong answer is the one that looks obvious.**

---

**Play MIXER** → [zeezbitstudios.itch.io/mixer](https://zeezbitstudios.itch.io/mixer)
· **Studio** → [zeezbitstudios.itch.io](https://zeezbitstudios.itch.io)
· **Me** → [rzaman.site](https://rzaman.site/)
