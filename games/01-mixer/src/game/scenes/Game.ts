import { Scene } from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { deltaE76, type RGB } from '../lib/color';
import { shake } from '../feel/shake';
import { burst } from '../feel/burst';
import { hitstop } from '../feel/hitstop';
import { sfx } from '../feel/sfx';

//  The ONE mechanic: tap colour sources to add permanent drops to a running mix,
//  lock it in, score against a reachable target by PERCEPTUAL distance (CIELAB ΔE,
//  see lib/color). Mixing is a dumb sRGB running average; the lesson is the scoring.
//  (Score id is set by MainMenu/GameOver via Score.start('01-mixer').)
const BUDGET = 10;        // drops per round, no undo
const TOL_START = 25;     // ΔE tolerance, round 1
const TOL_STEP = 1.5;     // shrinks per round...
const TOL_FLOOR = 6;      // ...down to this floor

//  5 fixed sources: Red, Yellow, Blue, White, Black — hue + tint/shade ⇒ wide gamut.
const SOURCES: { name: string; rgb: RGB }[] = [
    { name: 'R', rgb: { r: 209, g: 52, b: 56 } },
    { name: 'Y', rgb: { r: 242, g: 192, b: 20 } },
    { name: 'B', rgb: { r: 43, g: 93, b: 209 } },
    { name: 'W', rgb: { r: 240, g: 239, b: 235 } },
    { name: 'K', rgb: { r: 23, g: 21, b: 32 } },
];

const int = (c: RGB) => (Math.round(c.r) << 16) | (Math.round(c.g) << 8) | Math.round(c.b);

export class Game extends Scene {
    private round = 0;
    private tolerance = TOL_START;
    private target: RGB = { r: 0, g: 0, b: 0 };
    private sum: RGB = { r: 0, g: 0, b: 0 };
    private n = 0;
    private dropsLeft = BUDGET;
    private rounds = 0;       // rounds cleared = score
    private locked = false;
    private forced?: Phaser.Time.TimerEvent;

    //  Redrawn surfaces.
    private targetG!: Phaser.GameObjects.Graphics;
    private mixG!: Phaser.GameObjects.Graphics;
    private dotsG!: Phaser.GameObjects.Graphics;
    private roundText!: Phaser.GameObjects.Text;
    private resultText!: Phaser.GameObjects.Text;

    //  Swatch geometry (1920×1080 design space), cached for redraws + burst origin.
    private swW = 420; private swH = 340; private swY = 330;
    private targetX = 710; private mixX = 1210;

    constructor() { super('Game'); }

    create() {
        const { width: w } = this.scale;

        this.add.text(this.targetX, this.swY - this.swH / 2 - 46, 'TARGET', {
            fontFamily: FONT, fontSize: '40px', color: css(PALETTE.mute),
        }).setOrigin(0.5);
        this.add.text(this.mixX, this.swY - this.swH / 2 - 46, 'MIX', {
            fontFamily: FONT, fontSize: '40px', color: css(PALETTE.mute),
        }).setOrigin(0.5);

        this.targetG = this.add.graphics();
        this.mixG = this.add.graphics();

        this.roundText = this.add.text(w / 2, 70, '', {
            fontFamily: FONT, fontSize: '52px', color: css(PALETTE.ink),
        }).setOrigin(0.5);

        //  Post-lock feedback: the achieved ΔE. Appears AFTER the decision, so it
        //  teaches the metric without being an in-play hint (those are out of scope).
        this.resultText = this.add.text(this.mixX, this.swY + this.swH / 2 + 44, '', {
            fontFamily: FONT, fontSize: '40px', color: css(PALETTE.warn),
        }).setOrigin(0.5);

        this.dotsG = this.add.graphics();

        this.buildSources();
        this.buildLock();

        this.newRound();
    }

    //  Source buttons: rounded-rect Graphics for the look, a transparent interactive
    //  rectangle on top for taps (Rectangle hit-testing is reliable; Graphics stay visual).
    private buildSources() {
        const btnW = 240, btnH = 200, y = 720;
        SOURCES.forEach((src, i) => {
            const x = 400 + i * 280;
            const g = this.add.graphics();
            this.roundRect(g, x - btnW / 2, y - btnH / 2, btnW, btnH, 18, int(src.rgb), 1);
            //  Label below in ink so it reads on both the white and black swatches.
            this.add.text(x, y + btnH / 2 + 34, src.name, {
                fontFamily: FONT, fontSize: '40px', color: css(PALETTE.ink),
            }).setOrigin(0.5);

            const hit = this.add.rectangle(x, y, btnW, btnH, 0x000000, 0).setInteractive();
            hit.on('pointerdown', () => this.addDrop(i));
        });
    }

    private buildLock() {
        const w = 360, h = 110, x = this.scale.width / 2, y = 960;
        const g = this.add.graphics();
        this.roundRect(g, x - w / 2, y - h / 2, w, h, 18, PALETTE.mute, 1);
        this.add.text(x, y, 'LOCK', {
            fontFamily: FONT, fontSize: '48px', color: css(PALETTE.ink),
        }).setOrigin(0.5);
        const hit = this.add.rectangle(x, y, w, h, 0x000000, 0).setInteractive();
        hit.on('pointerdown', () => this.lock());
    }

    private newRound() {
        this.forced?.remove();
        this.forced = undefined;
        this.round += 1;
        this.tolerance = Math.max(TOL_FLOOR, TOL_START - TOL_STEP * (this.round - 1));
        this.target = this.randomTarget();
        this.sum = { r: 0, g: 0, b: 0 };
        this.n = 0;
        this.dropsLeft = BUDGET;
        this.locked = false;
        this.resultText.setText('');

        this.drawTarget();
        this.drawMix();
        this.drawDots();
        this.roundText.setText(`ROUND ${this.round}   ·   match within ΔE ${this.tolerance.toFixed(0)}`);
    }

    //  Random convex combination of the sources ⇒ always inside the reachable gamut
    //  (skill, not luck, decides). Squaring the weights biases toward a few dominant
    //  sources so targets aren't all muddy grey.
    //  ponytail: squared-random weights; swap to Dirichlet if targets feel flat.
    private randomTarget(): RGB {
        const wts = SOURCES.map(() => Math.random() ** 2.5);
        const total = wts.reduce((a, b) => a + b, 0) || 1;
        const acc = { r: 0, g: 0, b: 0 };
        SOURCES.forEach((s, i) => {
            const k = wts[i] / total;
            acc.r += s.rgb.r * k; acc.g += s.rgb.g * k; acc.b += s.rgb.b * k;
        });
        return { r: Math.round(acc.r), g: Math.round(acc.g), b: Math.round(acc.b) };
    }

    private addDrop(i: number) {
        if (this.locked || this.dropsLeft <= 0) return;
        const s = SOURCES[i].rgb;
        this.sum.r += s.r; this.sum.g += s.g; this.sum.b += s.b;
        this.n += 1;
        this.dropsLeft -= 1;
        sfx.play('pickup');
        this.drawMix();
        this.drawDots();
        //  Budget spent: force the lock so the round always resolves.
        if (this.dropsLeft === 0) this.forced = this.time.delayedCall(260, () => this.lock());
    }

    private mix(): RGB {
        return { r: this.sum.r / this.n, g: this.sum.g / this.n, b: this.sum.b / this.n };
    }

    private lock() {
        if (this.locked || this.n === 0) return;   // nothing to score on an empty mix
        this.locked = true;
        this.forced?.remove();

        const m = this.mix();
        const d = deltaE76(m, this.target);
        const win = d <= this.tolerance;
        this.resultText.setColor(css(win ? PALETTE.cool : PALETTE.hot));
        this.resultText.setText(`ΔE ${d.toFixed(1)} ${win ? '✓' : '✗'}`);

        if (win) {
            this.rounds += 1;
            //  Rising two-note pickup (a fifth, then an octave) = the "higher" success cue.
            sfx.play('pickup', 7);
            this.time.delayedCall(110, () => sfx.play('pickup', 12));
            burst(this, this.mixX, this.swY, int(m), 18);
            this.time.delayedCall(620, () => this.newRound());
        } else {
            sfx.play('hit');
            Score.commit(this.rounds);
            hitstop(this, 70, () => {
                shake(this, 220, 0.012);
                burst(this, this.mixX, this.swY, PALETTE.hot, 18);
                this.time.delayedCall(260, () =>
                    this.scene.start('GameOver', { score: this.rounds, high: Score.high }));
            });
        }
    }

    // ── drawing ──────────────────────────────────────────────────────────────
    private roundRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, color: number, alpha: number) {
        g.fillStyle(color, alpha);
        g.fillRoundedRect(x, y, w, h, r);
    }

    private drawTarget() {
        const g = this.targetG; g.clear();
        this.roundRect(g, this.targetX - this.swW / 2, this.swY - this.swH / 2, this.swW, this.swH, 18, int(this.target), 1);
    }

    private drawMix() {
        const g = this.mixG; g.clear();
        const x = this.mixX - this.swW / 2, y = this.swY - this.swH / 2;
        if (this.n === 0) {
            //  Empty mix: bg fill + mute outline so it reads as "not yet poured".
            this.roundRect(g, x, y, this.swW, this.swH, 18, PALETTE.bg, 1);
            g.lineStyle(3, PALETTE.mute, 0.8);
            g.strokeRoundedRect(x, y, this.swW, this.swH, 18);
        } else {
            this.roundRect(g, x, y, this.swW, this.swH, 18, int(this.mix()), 1);
        }
    }

    //  Drop budget as a row of dots under the swatches: filled = available, hollow = spent.
    private drawDots() {
        const g = this.dotsG; g.clear();
        const r = 12, gap = 40, y = this.swY + this.swH / 2 + 50;
        const startX = this.targetX - ((BUDGET - 1) * gap) / 2;
        for (let i = 0; i < BUDGET; i++) {
            const x = startX + i * gap;
            if (i < this.dropsLeft) { g.fillStyle(PALETTE.cool, 1); g.fillCircle(x, y, r); }
            else { g.lineStyle(2, PALETTE.mute, 0.9); g.strokeCircle(x, y, r); }
        }
    }
}
