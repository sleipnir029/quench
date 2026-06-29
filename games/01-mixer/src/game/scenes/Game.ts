import { Scene } from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { deltaE76, colorAtDeltaE, type RGB } from '../lib/color';
import { spotlight, paintChip, emptyWell, ripple, droplet } from '../lib/paint';
import { shake } from '../feel/shake';
import { burst } from '../feel/burst';
import { hitstop } from '../feel/hitstop';
import { sfx } from '../feel/sfx';
import { haptic } from '../feel/haptic';

//  The mechanic: tap colour sources to add permanent drops to a running mix, lock it in,
//  score against a reachable target by PERCEPTUAL distance (CIELAB ΔE, see lib/color).
//  Two owner-approved additions over the base SPEC: locked-source rounds (some sources
//  grey out) + precision/streak scoring. The lesson is unchanged: similarity is CIELAB ΔE.
const BUDGET = 10;        // drops per round, no undo
const TOL_START = 25;     // ΔE tolerance, round 1
const TOL_STEP = 1.5;     // shrinks per round...
const TOL_FLOOR = 6;      // ...down to this floor
const BASE = 100;         // points for a bare clear
const PRECISION_WEIGHT = 1.5;  // up to +150% for a perfect match
const PRECISE_Q = 0.4;    // quality at/above this keeps the streak alive

const SOURCES: { name: string; rgb: RGB }[] = [
    { name: 'R', rgb: { r: 209, g: 52, b: 56 } },
    { name: 'Y', rgb: { r: 242, g: 192, b: 20 } },
    { name: 'B', rgb: { r: 43, g: 93, b: 209 } },
    { name: 'W', rgb: { r: 240, g: 239, b: 235 } },
    { name: 'K', rgb: { r: 23, g: 21, b: 32 } },
];

const lockedCount = (round: number) => (round < 3 ? 0 : round < 7 ? 1 : 2);

const int = (c: RGB) => (Math.round(c.r) << 16) | (Math.round(c.g) << 8) | Math.round(c.b);
const rgbOf = (h: number): RGB => ({ r: (h >> 16) & 255, g: (h >> 8) & 255, b: h & 255 });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpRGB = (a: RGB, b: RGB, t: number): RGB =>
    ({ r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) });

export class Game extends Scene {
    private round = 0;
    private tolerance = TOL_START;
    private target: RGB = { r: 0, g: 0, b: 0 };
    private sum: RGB = { r: 0, g: 0, b: 0 };
    private n = 0;
    private dropsLeft = BUDGET;
    private locked = false;
    private score = 0;
    private streak = 0;
    private rounds = 0;
    private available: boolean[] = SOURCES.map(() => true);
    private forced?: Phaser.Time.TimerEvent;
    private mixColorTween?: Phaser.Tweens.Tween;

    private swW = 400; private swH = 300; private swY = 340;
    private targetX = 700; private mixX = 1220;
    private chipX = 700; private chipY = 590;
    private dotsX = 1220; private dotsY = 590;

    private mixDisplay: RGB | null = null;

    private bgRect!: Phaser.GameObjects.Rectangle;
    private targetG!: Phaser.GameObjects.Graphics;
    private mixG!: Phaser.GameObjects.Graphics;
    private chipG!: Phaser.GameObjects.Graphics;
    private dotsG!: Phaser.GameObjects.Graphics;
    private roundText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private streakText!: Phaser.GameObjects.Text;
    private chipCaption!: Phaser.GameObjects.Text;
    private resultBox!: Phaser.GameObjects.Container;
    private resultText!: Phaser.GameObjects.Text;
    private srcG: Phaser.GameObjects.Graphics[] = [];
    private srcLabel: Phaser.GameObjects.Text[] = [];
    private srcPos: { x: number; y: number }[] = [];

    constructor() { super('Game'); }

    create() {
        const { width: w, height: h } = this.scale;

        //  Mood: a full-screen base that drifts toward a desaturated version of each
        //  round's target — atmosphere without fighting the palette.
        this.bgRect = this.add.rectangle(w / 2, h / 2, w, h, PALETTE.bg).setDepth(-100);
        spotlight(this);   // soft warm studio light over the worktop

        this.add.text(this.targetX, this.swY - this.swH / 2 - 52, 'match this', {
            fontFamily: FONT, fontSize: '34px', color: css(PALETTE.mute),
        }).setOrigin(0.5);
        this.add.text(this.mixX, this.swY - this.swH / 2 - 52, 'your mix', {
            fontFamily: FONT, fontSize: '34px', color: css(PALETTE.mute),
        }).setOrigin(0.5);

        //  Centered-origin graphics so scale tweens punch/reveal from the middle.
        this.targetG = this.add.graphics({ x: this.targetX, y: this.swY });
        this.mixG = this.add.graphics({ x: this.mixX, y: this.swY });
        this.chipG = this.add.graphics({ x: this.chipX, y: this.chipY });
        this.dotsG = this.add.graphics({ x: this.dotsX, y: this.dotsY });

        this.chipCaption = this.add.text(this.chipX, this.chipY + 70, '', {
            fontFamily: FONT, fontSize: '28px', color: css(PALETTE.mute),
        }).setOrigin(0.5);

        //  Quiet, tucked-back HUD — the paint is the show, not the readouts.
        this.roundText = this.add.text(60, 52, '', {
            fontFamily: FONT, fontSize: '34px', color: css(PALETTE.mute),
        }).setOrigin(0, 0.5);
        this.scoreText = this.add.text(w - 60, 52, '', {
            fontFamily: FONT, fontSize: '38px', color: css(PALETTE.ink),
        }).setOrigin(1, 0.5);
        this.streakText = this.add.text(w - 60, 98, '', {
            fontFamily: FONT, fontSize: '28px', color: css(PALETTE.warn),
        }).setOrigin(1, 0.5);

        //  The verdict: ΔE pops in the centre AFTER you lock — teaches the metric without
        //  being an in-play hint (in-play ΔE is deliberately hidden).
        const backing = this.add.rectangle(0, 0, 380, 104, PALETTE.bg, 0.82)
            .setStrokeStyle(2, PALETTE.mute, 0.35);
        this.resultText = this.add.text(0, 0, '', {
            fontFamily: FONT, fontSize: '60px', color: css(PALETTE.warn),
        }).setOrigin(0.5);
        this.resultBox = this.add.container(w / 2, this.swY, [backing, this.resultText])
            .setDepth(60).setScale(0).setVisible(false);

        this.buildSources();
        this.buildLock();

        sfx.play('start');
        this.newRound();
    }

    private buildSources() {
        const btnW = 240, btnH = 176, y = 790;
        SOURCES.forEach((src, i) => {
            const x = 360 + i * 300;
            this.srcPos[i] = { x, y };
            this.srcG[i] = this.add.graphics({ x, y });   // centred so paintChip + punch pivot here
            this.srcLabel[i] = this.add.text(x, y + btnH / 2 + 34, src.name, {
                fontFamily: FONT, fontSize: '40px', color: css(PALETTE.ink),
            }).setOrigin(0.5);
            const hit = this.add.rectangle(x, y, btnW, btnH, 0x000000, 0).setInteractive();
            hit.on('pointerdown', () => this.addDrop(i));
        });
    }

    private buildLock() {
        const w = 440, h = 82, x = this.scale.width / 2, y = 998;
        const g = this.add.graphics();
        this.roundRect(g, x - w / 2, y - h / 2, w, h, 18, PALETTE.mute, 1);
        this.add.text(x, y, 'LOCK', {
            fontFamily: FONT, fontSize: '46px', color: css(PALETTE.ink),
        }).setOrigin(0.5);
        const hit = this.add.rectangle(x, y, w, h, 0x000000, 0).setInteractive();
        hit.on('pointerdown', () => this.lock());
    }

    private newRound() {
        this.forced?.remove();
        this.forced = undefined;
        this.round += 1;
        this.tolerance = Math.max(TOL_FLOOR, TOL_START - TOL_STEP * (this.round - 1));

        this.chooseLocked();
        this.target = this.randomTarget();

        this.sum = { r: 0, g: 0, b: 0 };
        this.n = 0;
        this.dropsLeft = BUDGET;
        this.locked = false;
        this.mixDisplay = null;

        this.refreshSources();
        this.drawTarget();
        this.drawMix();
        this.drawChip();
        this.drawDots();
        this.driftBackground();
        this.resultBox.setVisible(false).setScale(0);

        this.targetG.setScale(0); this.chipG.setScale(0);
        this.tweens.add({ targets: [this.targetG, this.chipG], scale: 1, ease: 'Back.easeOut', duration: 320 });

        this.roundText.setText(`ROUND ${this.round}   ·   match within ΔE ${this.tolerance.toFixed(0)}`);
        this.updateScoreText();
    }

    private chooseLocked() {
        const idx = SOURCES.map((_, i) => i);
        for (let i = idx.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [idx[i], idx[j]] = [idx[j], idx[i]];
        }
        const k = lockedCount(this.round);
        this.available = SOURCES.map(() => true);
        for (let i = 0; i < k; i++) this.available[idx[i]] = false;
    }

    //  Random convex combination of the USABLE sources ⇒ always inside the reachable gamut.
    //  ponytail: squared-random weights; swap to Dirichlet if targets feel flat.
    private randomTarget(): RGB {
        const usable = SOURCES.filter((_, i) => this.available[i]);
        const wts = usable.map(() => Math.random() ** 2.5);
        const total = wts.reduce((a, b) => a + b, 0) || 1;
        const acc = { r: 0, g: 0, b: 0 };
        usable.forEach((s, i) => {
            const w = wts[i] / total;
            acc.r += s.rgb.r * w; acc.g += s.rgb.g * w; acc.b += s.rgb.b * w;
        });
        return { r: Math.round(acc.r), g: Math.round(acc.g), b: Math.round(acc.b) };
    }

    private addDrop(i: number) {
        if (this.locked || this.dropsLeft <= 0 || !this.available[i]) return;
        const s = SOURCES[i].rgb;
        this.sum.r += s.r; this.sum.g += s.g; this.sum.b += s.b;
        this.n += 1;
        this.dropsLeft -= 1;

        sfx.play('pickup', BUDGET - this.dropsLeft);
        haptic(8);
        this.flyDrop(this.srcPos[i], int(s));

        if (this.dropsLeft === 0) this.forced = this.time.delayedCall(520, () => this.lock());
    }

    private flyDrop(from: { x: number; y: number }, color: number) {
        const dot = this.add.circle(from.x, from.y, 18, color).setDepth(50);
        this.tweens.add({
            targets: dot, x: this.mixX, y: this.swY, scale: 0.4,
            ease: 'Quad.easeIn', duration: 200,
            onComplete: () => { dot.destroy(); this.landDrop(color); },
        });
    }

    private landDrop(color: number) {
        burst(this, this.mixX, this.swY, color, 6);
        ripple(this, this.mixX, this.swY, color);   // paint splashes into the pool
        this.drawDots();
        this.punch(this.dotsG, 1.18, 120);

        if (this.mixDisplay === null) {
            this.mixDisplay = this.mix();
            this.drawMix();
            this.mixG.setScale(0);
            this.tweens.add({ targets: this.mixG, scale: 1, ease: 'Back.easeOut', duration: 260 });
        } else {
            const fromC = { ...this.mixDisplay };
            const toC = this.mix();
            this.mixColorTween?.remove();
            const o = { t: 0 };
            this.mixColorTween = this.tweens.add({
                targets: o, t: 1, ease: 'Cubic.easeOut', duration: 160,
                onUpdate: () => { this.mixDisplay = lerpRGB(fromC, toC, o.t); this.drawMix(); },
            });
            this.punch(this.mixG, 1.06, 120);
        }
    }

    private punch(obj: Phaser.GameObjects.Components.Transform, to: number, ms: number) {
        this.tweens.add({ targets: obj, scale: to, duration: ms / 2, yoyo: true, ease: 'Quad.easeOut' });
    }

    private mix(): RGB {
        return { r: this.sum.r / this.n, g: this.sum.g / this.n, b: this.sum.b / this.n };
    }

    private lock() {
        if (this.locked || this.n === 0) return;
        this.locked = true;
        this.forced?.remove();

        const m = this.mix();
        const d = deltaE76(m, this.target);
        const win = d <= this.tolerance;

        this.showResult(d, win);

        if (win) {
            this.rounds += 1;
            const quality = Math.min(1, Math.max(0, (this.tolerance - d) / this.tolerance));
            if (quality >= PRECISE_Q) this.streak += 1; else this.streak = 0;
            const mult = 1 + Math.min(this.streak, 10) * 0.1;
            const pts = Math.round(BASE * (1 + quality * PRECISION_WEIGHT) * mult);
            this.score += pts;
            this.updateScoreText();
            this.popGain(pts);

            sfx.play('pickup', 7);
            this.time.delayedCall(110, () => sfx.play('pickup', 12));
            haptic([0, 30, 40, 30]);
            burst(this, this.mixX, this.swY, int(m), 18);
            this.time.delayedCall(760, () => {
                this.tweens.add({
                    targets: this.resultBox, scale: 0, duration: 160, ease: 'Quad.easeIn',
                    onComplete: () => this.newRound(),
                });
            });
        } else {
            this.streak = 0;
            sfx.play('hit');
            haptic([0, 90, 60, 140]);
            Score.commit(this.score);
            this.time.delayedCall(420, () => hitstop(this, 80, () => {
                shake(this, 220, 0.012);
                burst(this, this.mixX, this.swY, PALETTE.hot, 18);
                this.tweens.add({ targets: this.mixG, scale: 0, duration: 240, ease: 'Back.easeIn' });
                this.time.delayedCall(300, () => this.scene.start('GameOver', {
                    score: this.score, rounds: this.rounds, high: Score.high,
                    mix: m, target: this.target, deltaE: d, tolerance: this.tolerance,
                }));
            }));
        }
    }

    private showResult(d: number, win: boolean) {
        this.resultText.setColor(css(win ? PALETTE.cool : PALETTE.hot));
        this.resultText.setText(`ΔE 0.0 ${win ? '✓' : '✗'}`);
        this.resultBox.setVisible(true).setScale(0);
        this.tweens.add({ targets: this.resultBox, scale: 1, ease: 'Back.easeOut', duration: 240 });
        const o = { v: 0 };
        this.tweens.add({
            targets: o, v: d, duration: 320, ease: 'Cubic.easeOut',
            onUpdate: () => this.resultText.setText(`ΔE ${o.v.toFixed(1)} ${win ? '✓' : '✗'}`),
        });
    }

    //  Points float up off the matched swatch (the cramped top-right HUD corner would clip
    //  them). Reads as "this match scored that".
    private popGain(pts: number) {
        const t = this.add.text(this.mixX, this.swY - 30, `+${pts}`, {
            fontFamily: FONT, fontSize: '52px', color: css(PALETTE.warn),
        }).setOrigin(0.5).setDepth(70);
        this.tweens.add({
            targets: t, y: t.y - 90, alpha: { from: 1, to: 0 }, duration: 760, ease: 'Quad.easeOut',
            onComplete: () => t.destroy(),
        });
    }

    private updateScoreText() {
        this.scoreText.setText(`SCORE ${this.score}`);
        this.streakText.setText(this.streak >= 2 ? `streak ×${this.streak}` : '');
    }

    private driftBackground() {
        const from = rgbOf(this.bgRect.fillColor >>> 0);
        const to = lerpRGB(rgbOf(PALETTE.bg), this.target, 0.06);
        const o = { t: 0 };
        this.tweens.add({
            targets: o, t: 1, duration: 600, ease: 'Sine.easeInOut',
            onUpdate: () => this.bgRect.setFillStyle(int(lerpRGB(from, to, o.t)), 1),
        });
    }

    // ── drawing (each graphics positioned at its centre; draw from -w/2,-h/2) ──
    private roundRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, color: number, alpha: number) {
        g.fillStyle(color, alpha);
        g.fillRoundedRect(x, y, w, h, r);
    }

    private drawTarget() {
        paintChip(this.targetG, this.swW, this.swH, int(this.target), false);   // dry reference chip
    }

    private drawMix() {
        if (this.mixDisplay === null) emptyWell(this.mixG, this.swW, this.swH);
        else paintChip(this.mixG, this.swW, this.swH, int(this.mixDisplay), true);   // wet pool
    }

    //  The pass-line chip: a colour exactly `tolerance` ΔE from the target — the player
    //  SEES how different a colour is still allowed, and watches it tighten each round.
    private drawChip() {
        paintChip(this.chipG, 160, 100, int(colorAtDeltaE(this.target, this.tolerance)), false);
        this.chipCaption.setText(`pass line · ΔE ${this.tolerance.toFixed(0)}`);
    }

    //  Drop budget as little paint droplets (relative to dotsG's centre so it can punch).
    private drawDots() {
        const g = this.dotsG; g.clear();
        const r = 11, gap = 42;
        const startX = -((BUDGET - 1) * gap) / 2;
        const low = this.dropsLeft <= 3;
        for (let i = 0; i < BUDGET; i++) {
            droplet(g, startX + i * gap, 0, r, low ? PALETTE.warn : PALETTE.cool, i < this.dropsLeft);
        }
    }

    private refreshSources() {
        const btnW = 240, btnH = 176;
        SOURCES.forEach((src, i) => {
            const g = this.srcG[i];
            const on = this.available[i];
            if (on) {
                paintChip(g, btnW, btnH, int(src.rgb), true);   // a glossy bottle of paint
            } else {
                g.clear();
                g.fillStyle(PALETTE.mute, 0.22).fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 24);
                g.lineStyle(2, PALETTE.mute, 0.3).strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 24);
            }
            this.srcLabel[i].setAlpha(on ? 1 : 0.35);
        });
    }
}
