import * as Phaser from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { onAxisX, type AxisX } from '../lib/input';
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

        this.axis = onAxisX(this);

        this.player = this.add.rectangle(w / 2, h - 80, 92, 56, PALETTE.hot)
            .setStrokeStyle(4, PALETTE.ink, 0.35);
        this.prevX = this.player.x;

        this.scoreText = this.add.text(32, 24, '0', {
            fontFamily: FONT, fontSize: '56px', color: css(PALETTE.warn),
        });
    }

    update (_time: number, dt: number)
    {
        if (this.dead) return;
        this.elapsed += dt;
        const sec = dt / 1000;

        //  Player tracks the aim axis with a touch of smoothing for feel.
        const target = Phaser.Math.Clamp(this.axis.x, Game.HALF_W, this.scale.width - Game.HALF_W);
        this.player.x = Phaser.Math.Linear(this.player.x, target, 0.25);

        //  Movement juice: lean toward motion and squash/stretch with speed, easing
        //  back to rest when still. Visual only — collision uses the fixed box below.
        const vx = this.player.x - this.prevX;
        this.prevX = this.player.x;
        const stretch = Phaser.Math.Clamp(Math.abs(vx) * 0.012, 0, 0.28);
        this.player.rotation = Phaser.Math.Linear(this.player.rotation, Phaser.Math.Clamp(vx * 0.012, -0.22, 0.22), 0.2);
        this.player.scaleX = Phaser.Math.Linear(this.player.scaleX, 1 + stretch, 0.25);
        this.player.scaleY = Phaser.Math.Linear(this.player.scaleY, 1 - stretch, 0.25);

        //  Difficulty: still the two numbers vs time, but on a quadratic ease-in curve
        //  so the early game is calm and tension builds as it ramps.
        const t = Math.min(this.elapsed / RAMP_MS, 1);
        const k = t * t;
        const spawnInterval = Phaser.Math.Linear(SPAWN_MS.easy, SPAWN_MS.hard, k);
        const fallSpeed = Phaser.Math.Linear(FALL_PX.easy, FALL_PX.hard, k);

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

            if (haz.y - haz.height > this.scale.height) {
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
    }

    private spawnHazard ()
    {
        const w = this.scale.width;
        const width = Phaser.Math.Between(56, 144);
        const x = Phaser.Math.Between(width, w - width);
        const haz = this.add.rectangle(x, -48, width, 48, PALETTE.mute); // sharp corners = dangerous
        //  Spawns scale in (CONVENTIONS easing rule).
        haz.setScale(1, 0.4);
        this.tweens.add({ targets: haz, scaleY: 1, duration: 140, ease: 'Quad.Out' });
        this.hazards.push(haz);
    }

    private die ()
    {
        this.dead = true;
        const prevHigh = Score.high;          // read before commit so a tie isn't "new best"
        const score = Score.commit();
        sfx.play('hit');

        //  Freeze-frame impact, then release with shake + burst and a beat to read it.
        hitstop(this, 80, () => {
            burst(this, this.player.x, this.player.y, PALETTE.hot, 18);
            shake(this, 220, 0.014);
            this.time.delayedCall(280, () =>
                this.scene.start('GameOver', { score, high: Score.high, isBest: score > prevHigh }));
        });
    }
}
