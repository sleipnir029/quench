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
const RAMP_MS = 45000;
const SPAWN_MS = { easy: 900, hard: 300 };   // ms between hazards
const FALL_PX  = { easy: 220, hard: 560 };   // px / second

export class Game extends Phaser.Scene
{
    private axis!: AxisX;
    private player!: Phaser.GameObjects.Rectangle;
    private hazards: Phaser.GameObjects.Rectangle[] = [];
    private scoreText!: Phaser.GameObjects.Text;
    private elapsed = 0;       // accumulated from dt — does not advance while tab is blurred
    private spawnTimer = 0;
    private dead = false;

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

        this.axis = onAxisX(this);

        this.player = this.add.rectangle(w / 2, h - 40, 46, 28, PALETTE.hot)
            .setStrokeStyle(2, PALETTE.ink, 0.35);

        this.scoreText = this.add.text(16, 12, '0', {
            fontFamily: FONT, fontSize: '28px', color: css(PALETTE.warn),
        });
    }

    update (_time: number, dt: number)
    {
        if (this.dead) return;
        this.elapsed += dt;
        const sec = dt / 1000;

        //  Player tracks the aim axis with a touch of smoothing for feel.
        const halfW = this.player.width / 2;
        const target = Phaser.Math.Clamp(this.axis.x, halfW, this.scale.width - halfW);
        this.player.x = Phaser.Math.Linear(this.player.x, target, 0.25);

        //  Ramp the two difficulty numbers from easy→hard over RAMP_MS.
        const t = Math.min(this.elapsed / RAMP_MS, 1);
        const spawnInterval = Phaser.Math.Linear(SPAWN_MS.easy, SPAWN_MS.hard, t);
        const fallSpeed = Phaser.Math.Linear(FALL_PX.easy, FALL_PX.hard, t);

        this.spawnTimer += dt;
        if (this.spawnTimer >= spawnInterval) {
            this.spawnTimer = 0;
            this.spawnHazard();
        }

        const playerBounds = this.player.getBounds();
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const haz = this.hazards[i];
            haz.y += fallSpeed * sec;

            if (haz.y - haz.height > this.scale.height) {
                haz.destroy();
                this.hazards.splice(i, 1);
                continue;
            }
            //  ponytail: Phaser's AABB intersect instead of a physics body — a handful
            //  of rects don't need Arcade. Swap to Arcade if hazards ever need velocity/overlap groups.
            if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, haz.getBounds())) {
                this.die();
                return;
            }
        }

        this.scoreText.setText(`${Score.value}`);
    }

    private spawnHazard ()
    {
        const w = this.scale.width;
        const width = Phaser.Math.Between(28, 72);
        const x = Phaser.Math.Between(width, w - width);
        const haz = this.add.rectangle(x, -24, width, 24, PALETTE.mute); // sharp corners = dangerous
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
