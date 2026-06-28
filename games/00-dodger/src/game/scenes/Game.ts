import * as Phaser from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { onAxisX, type AxisX } from '../lib/input';
import { prefersReducedMotion } from '../lib/prefs';
import { sfx } from '../feel/sfx';
import { shake } from '../feel/shake';
import { burst } from '../feel/burst';
import { hitstop } from '../feel/hitstop';

//  Difficulty = two numbers ramping with elapsed time, nothing more (scope cap).
//  Both reach their hardest at RAMP_MS, then hold.
//  Spatial values authored for the 1920×1080 design resolution (see CONVENTIONS).
const RAMP_MS = 45000;
const SPAWN_MS = { easy: 900, hard: 300 };    // ms between hazards (time — resolution-independent)
const FALL_PX  = { easy: 440, hard: 1120 };   // px / second

export class Game extends Phaser.Scene
{
    private axis!: AxisX;
    private player!: Phaser.GameObjects.Rectangle;
    private hazards: Phaser.GameObjects.Rectangle[] = [];
    private scoreText!: Phaser.GameObjects.Text;
    private elapsed = 0;       // accumulated from dt — does not advance while tab is blurred
    private spawnTimer = 0;
    private dead = false;
    private prevX = 0;         // for velocity-based squash/stretch + lean
    private lastMilestone = 0; // last 10s score pop fired
    private vignette!: Phaser.GameObjects.Image;
    private baseY = 0;         // player rest y, for the constant idle bob
    private egg42 = false;     // easter egg: fires once at 42s
    private reduced = false;   // OS "reduce motion" — tones down shake/zoom/pulse/squash
    private glow = new Phaser.Display.Color();   // reused for the vignette's drifting hue
    private breathing = false; // a rest "breath" animation is currently playing
    private moveAccum = 0;     // recent movement — the breath must be earned by activity
    private stillTime = 0;     // ms spent stationary since the last real movement
    private beatPhase = 0;     // accumulated phase for the quickening vignette beat
    private hazTint = new Phaser.Display.Color();   // current block colour (contrasts the vignette)
    private trailTimer = 0;    // throttles player afterimage spawns
    private quipBag: number[] = [];   // shuffle bag — every line shows once before any repeats

    //  Short, quirky lines shown at random intervals for long-run flavour. Small, not loud.
    private static readonly QUIPS = [
        'keep going', 'still here?', 'smooth', 'in the zone', 'the void blinks',
        "don't look back", 'how long?', 'unbothered', 'flow state', 'one more',
        'blocks fear you', 'respect', 'no thoughts', 'locked in', 'too easy?',
        'breathe', 'eyes up', 'you got this', 'slippery', 'untouchable',
        'dialed in', 'feel the rhythm', 'stay loose', 'nice one', 'clean',
        'survivor', 'the grind', 'zen mode', 'whoa', 'keep weaving',
        'cracked', 'on a roll', 'silky', 'no notes', 'menace',
    ];

    //  Base half-size of the player. Collision uses this fixed box, NOT the visually
    //  squashed/leaned sprite, so deaths stay fair regardless of the movement juice.
    private static readonly HALF_W = 46;
    private static readonly HALF_H = 28;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        const { width: w, height: h } = this.scale;

        //  Fresh state every time the scene (re)starts.
        this.hazards = [];
        this.elapsed = 0;
        this.spawnTimer = 0;
        this.dead = false;
        this.lastMilestone = 0;
        this.egg42 = false;
        this.reduced = prefersReducedMotion();
        this.breathing = false;
        this.moveAccum = 0;
        this.stillTime = 0;
        this.beatPhase = 0;
        this.trailTimer = 0;
        this.quipBag = [];

        this.axis = onAxisX(this);

        this.player = this.add.rectangle(w / 2, h - 80, 92, 56, PALETTE.hot)
            .setStrokeStyle(4, PALETTE.ink, 0.35);
        this.prevX = this.player.x;
        this.baseY = this.player.y;

        //  Rising-tension vignette: a radial glow (white texture, tinted live) whose
        //  alpha grows with difficulty and whose COLOUR drifts over time so long runs
        //  keep evolving instead of freezing after the difficulty caps.
        this.vignette = this.add.image(w / 2, h / 2, this.vignetteTexture(w, h))
            .setAlpha(0).setDepth(5).setTint(PALETTE.hot);

        this.scoreText = this.add.text(32, 24, '0', {
            fontFamily: FONT, fontSize: '56px', color: css(PALETTE.warn),
        }).setDepth(10);   // above the vignette so the score stays readable at the edge

        this.scheduleQuip();
    }

    //  Show a small quirky line, then schedule the next at a RANDOM interval (never a
    //  fixed cadence). Small and occasional — flavour, not noise.
    private scheduleQuip ()
    {
        this.time.delayedCall(Phaser.Math.Between(13000, 22000), () => {
            if (this.dead) return;
            //  Shuffle bag: refill + shuffle when empty, then draw one. Guarantees every
            //  line appears once before any repeats — no clustering from plain random.
            if (this.quipBag.length === 0) {
                this.quipBag = Phaser.Utils.Array.Shuffle(Game.QUIPS.map((_, idx) => idx));
            }
            const i = this.quipBag.pop()!;
            const m = this.add.text(this.scale.width / 2, this.scale.height * 0.14, Game.QUIPS[i], {
                fontFamily: FONT, fontSize: '30px', color: css(PALETTE.mute),
            }).setOrigin(0.5).setAlpha(0).setDepth(9);
            this.tweens.add({ targets: m, alpha: 0.85, duration: 360, yoyo: true, hold: 1400, ease: 'Sine.InOut', onComplete: () => m.destroy() });
            this.scheduleQuip();
        });
    }

    //  Procedural radial vignette — WHITE so it can be tinted to any colour at runtime.
    //  Transparent centre (play area stays clear) → opaque at the corners. A black
    //  vignette on the near-black bg was invisible; tinting a white one keeps it visible
    //  and lets the colour evolve. Cached.
    private vignetteTexture (w: number, h: number): string
    {
        const key = 'vignette';
        if (this.textures.exists(key)) return key;
        const tex = this.textures.createCanvas(key, w, h);
        const ctx = tex!.getContext();
        const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.6, 'rgba(255,255,255,0)');   // keep the play area clear
        g.addColorStop(1, 'rgba(255,255,255,1)');      // glow concentrated at the edges
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        tex!.refresh();
        return key;
    }

    update (_time: number, dt: number)
    {
        if (this.dead) return;
        this.elapsed += dt;
        const sec = dt / 1000;

        //  Player tracks the aim axis with a touch of smoothing for feel.
        const target = Phaser.Math.Clamp(this.axis.x, Game.HALF_W, this.scale.width - Game.HALF_W);
        this.player.x = Phaser.Math.Linear(this.player.x, target, 0.25);

        //  Movement juice: lean + squash/stretch with speed. Amplitudes toned down under
        //  reduce-motion. Visual only — collision uses the fixed box below.
        const sMax = this.reduced ? 0.10 : 0.28;
        const leanMax = this.reduced ? 0.07 : 0.22;
        const vx = this.player.x - this.prevX;
        this.prevX = this.player.x;
        const speed = Math.abs(vx);

        //  Moving again interrupts a rest breath instantly — keeps the block responsive.
        if (this.breathing && speed > 8) {
            this.tweens.killTweensOf(this.player);
            this.breathing = false;
        }

        this.player.rotation = Phaser.Math.Linear(this.player.rotation, Phaser.Math.Clamp(vx * 0.012, -leanMax, leanMax), 0.2);
        if (!this.breathing) {   // while a breath tween owns the scale, don't fight it
            const stretch = Phaser.Math.Clamp(speed * 0.012, 0, sMax);
            this.player.scaleX = Phaser.Math.Linear(this.player.scaleX, 1 + stretch, 0.25);
            this.player.scaleY = Phaser.Math.Linear(this.player.scaleY, 1 - stretch, 0.25);
        }

        //  Constant gentle up/down bob — gives the block life; eases out as you move,
        //  off under reduce-motion. (The squash "breath" below layers on top of this.)
        const idle = 1 - Phaser.Math.Clamp(speed * 0.05, 0, 1);
        this.player.y = this.baseY + Math.sin(this.elapsed / 320) * (this.reduced ? 0 : 5) * idle;

        //  Motion trail: fading afterimages of the block while it moves fast. Throttled,
        //  and off under reduce-motion (motion smearing).
        this.trailTimer += dt;
        if (!this.reduced && speed > 6 && this.trailTimer > 32) {
            this.trailTimer = 0;
            this.spawnTrail();
        }

        //  Dynamic rest: only AFTER a real bout of movement and THEN holding still a beat
        //  does the block take a comic "breath out" — earned and relatable, not constant.
        if (speed > 3) { this.moveAccum = Math.min(this.moveAccum + speed, 5000); this.stillTime = 0; }
        else { this.stillTime += dt; }
        if (!this.reduced && !this.breathing && this.moveAccum > 1400 && this.stillTime > 1100) {
            this.moveAccum = 0;
            this.breatheOut();
        }

        //  Difficulty: still the two numbers vs time, but on a quadratic ease-in curve
        //  so the early game is calm and tension builds as it ramps.
        const t = Math.min(this.elapsed / RAMP_MS, 1);
        const k = t * t;
        const spawnInterval = Phaser.Math.Linear(SPAWN_MS.easy, SPAWN_MS.hard, k);
        //  Wave the fall speed (~±20% over ~9s): surge → ease back → surge, so the player
        //  rides a rhythm and can lock in. Still just fallSpeed vs time — no new mechanic.
        const wave = 1 + 0.2 * Math.sin(this.elapsed / 1400);
        const fallSpeed = Phaser.Math.Linear(FALL_PX.easy, FALL_PX.hard, k) * wave;

        //  Danger glow: a "beat" pulse whose TEMPO quickens over a long run (difficulty is
        //  capped, so this carries the escalation), plus a hue that drifts a full wheel
        //  ~every 40s — so it keeps evolving instead of freezing. Phase-accumulated so the
        //  changing tempo stays smooth. Pulse off under reduce-motion.
        const beatMs = Phaser.Math.Linear(820, 360, Math.min(this.elapsed / 120000, 1));
        this.beatPhase += (dt / beatMs) * Math.PI * 2;
        const pulse = this.reduced ? 0 : (Math.sin(this.beatPhase) * 0.5 + 0.5) * 0.14;
        this.vignette.setAlpha((0.55 + pulse) * t);
        const hue = (this.elapsed / 40000) % 1;
        this.glow.setFromHSV(hue, 0.7, 1);
        this.vignette.setTint(this.glow.color);
        //  Falling blocks take the COMPLEMENT of the vignette hue (muted) so they always
        //  contrast the glow and never blend into it / strain the eyes.
        this.hazTint.setFromHSV((hue + 0.5) % 1, 0.4, 0.82);

        this.spawnTimer += dt;
        if (this.spawnTimer >= spawnInterval) {
            this.spawnTimer = 0;
            this.spawnHazard();
        }

        //  Fixed AABB hitbox (independent of the squash/lean) so deaths stay fair.
        //  ponytail: plain rect-intersect, no Arcade body — a handful of rects don't need it.
        const hitbox = new Phaser.Geom.Rectangle(
            this.player.x - Game.HALF_W, this.player.y - Game.HALF_H, Game.HALF_W * 2, Game.HALF_H * 2);
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const haz = this.hazards[i];
            haz.y += fallSpeed * sec;
            haz.setFillStyle(this.hazTint.color);   // shifts to contrast the vignette

            //  Destroy as soon as the block fully clears the bottom edge (top past it).
            if (haz.y - haz.height / 2 > this.scale.height) {
                haz.destroy();
                this.hazards.splice(i, 1);
                continue;
            }
            if (Phaser.Geom.Intersects.RectangleToRectangle(hitbox, haz.getBounds())) {
                this.die();
                return;
            }
        }

        //  Score + a milestone pop every 10s for a sense of progress.
        const score = Score.value;
        this.scoreText.setText(`${score}`);
        if (score > 0 && score % 10 === 0 && score !== this.lastMilestone) {
            this.lastMilestone = score;
            this.scoreText.setScale(1);
            this.tweens.add({ targets: this.scoreText, scale: 1.5, duration: 130, yoyo: true, ease: 'Quad.Out' });
        }

        //  Easter egg: a nod for the rare run that reaches 42s. Visual only — make it POP.
        if (!this.egg42 && score >= 42) {
            this.egg42 = true;
            this.scoreText.setColor(css(PALETTE.cool));
            const m = this.add.text(this.scale.width / 2, this.scale.height * 0.2, "DON'T PANIC", {
                fontFamily: FONT, fontSize: '88px', color: css(PALETTE.cool),
                stroke: css(PALETTE.bg), strokeThickness: 12,
            }).setOrigin(0.5).setScale(0).setDepth(11);
            if (!this.reduced) burst(this, m.x, m.y, PALETTE.cool, 28);
            //  Bounce in, hold, then scale up and fade away.
            this.tweens.add({ targets: m, scale: 1, duration: 440, ease: 'Back.Out' });
            this.tweens.add({ targets: m, scale: 1.12, alpha: 0, delay: 1700, duration: 420, ease: 'Quad.In', onComplete: () => m.destroy() });
        }
    }

    private spawnHazard ()
    {
        const w = this.scale.width;
        const width = Phaser.Math.Between(56, 144);
        const x = Phaser.Math.Between(width, w - width);
        const haz = this.add.rectangle(x, -48, width, 48, PALETTE.mute).setAlpha(0); // sharp corners = dangerous
        //  Telegraph: fade + scale in as it spawns, so fast hazards read a beat earlier.
        haz.setScale(1, 0.4);
        this.tweens.add({ targets: haz, scaleY: 1, alpha: 1, duration: 160, ease: 'Quad.Out' });
        this.hazards.push(haz);
    }

    //  One fading afterimage of the block, behind it, matching its current squash/lean.
    private spawnTrail ()
    {
        const p = this.player;
        const ghost = this.add.rectangle(p.x, p.y, 92, 56, PALETTE.hot)
            .setScale(p.scaleX, p.scaleY).setRotation(p.rotation)
            .setAlpha(0.45).setDepth(-1);
        this.tweens.add({
            targets: ghost, alpha: 0, scaleX: p.scaleX * 0.6, scaleY: p.scaleY * 0.6,
            duration: 340, ease: 'Quad.Out', onComplete: () => ghost.destroy(),
        });
    }

    //  Comic exhale: the block inhales tall, sighs out wide like a deflating blob, then
    //  relaxes — with a little breath-cloud drifting up on the sigh.
    private breatheOut ()
    {
        this.breathing = true;
        this.tweens.chain({
            targets: this.player,
            tweens: [
                { scaleX: 0.84, scaleY: 1.22, duration: 300, ease: 'Sine.Out' },              // inhale (tall, narrow)
                { scaleX: 1.26, scaleY: 0.76, duration: 380, ease: 'Sine.InOut', delay: 140 }, // exhale (wide sigh)
                { scaleX: 1, scaleY: 1, duration: 380, ease: 'Back.Out' },                     // relax
            ],
            onComplete: () => { this.breathing = false; },
        });
    }

    private die ()
    {
        this.dead = true;
        const prevHigh = Score.high;          // read before commit so a tie isn't "new best"
        const score = Score.commit();
        sfx.play('hit');
        this.tweens.killTweensOf(this.player);   // cancel any breath / juice tween

        //  Impact freeze, then: flash the block, blow it apart, shake, and scale it OUT
        //  with a spin (deaths scale out — CONVENTIONS) before handing off to GameOver.
        hitstop(this, 70, () => {
            const p = this.player;
            p.setFillStyle(PALETTE.ink);
            burst(this, p.x, p.y, PALETTE.hot, 26);
            shake(this, 240, 0.016);
            this.tweens.add({ targets: p, scaleX: 0, scaleY: 0, angle: 220, alpha: 0, duration: 300, ease: 'Back.In' });
            this.time.delayedCall(340, () =>
                this.scene.start('GameOver', { score, high: Score.high, isBest: score > prevHigh }));
        });
    }
}
