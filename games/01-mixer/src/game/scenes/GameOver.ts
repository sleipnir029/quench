import { Scene } from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { onAction } from '../lib/input';
import { sfx } from '../feel/sfx';
import type { RGB } from '../lib/color';

const GAME_ID = '01-mixer';

interface GameOverData {
    score: number; rounds: number; high: number;
    mix: RGB; target: RGB; deltaE: number; tolerance: number;
}

const int = (c: RGB) => (Math.round(c.r) << 16) | (Math.round(c.g) << 8) | Math.round(c.b);

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create (data: GameOverData)
    {
        const { width: w } = this.scale;
        const score = data.score ?? 0;
        const rounds = data.rounds ?? 0;
        const high = data.high ?? 0;

        this.add.text(w / 2, 130, 'GAME OVER', {
            fontFamily: FONT, fontSize: '100px', color: css(PALETTE.hot),
        }).setOrigin(0.5);

        //  The teaching beat: your final mix beside the target. They look close — yet
        //  the perceptual metric says you missed. That gap IS the lesson.
        if (data.target && data.mix) {
            const sw = 300, sh = 230, y = 400, tx = w / 2 - 230, mx = w / 2 + 230;
            this.swatch(tx, y, sw, sh, int(data.target), 'TARGET');
            this.swatch(mx, y, sw, sh, int(data.mix), 'YOUR MIX');

            this.add.text(w / 2, y + sh / 2 + 70,
                `ΔE ${data.deltaE.toFixed(1)}  ·  needed ${data.tolerance.toFixed(0)}`, {
                fontFamily: FONT, fontSize: '52px', color: css(PALETTE.warn),
            }).setOrigin(0.5);

            this.add.text(w / 2, y + sh / 2 + 140,
                'in raw RGB these read as close — your eye (and CIELAB) disagree.', {
                fontFamily: FONT, fontSize: '30px', color: css(PALETTE.mute),
            }).setOrigin(0.5);
            this.add.text(w / 2, y + sh / 2 + 180, "that perceptual gap is the whole game.", {
                fontFamily: FONT, fontSize: '30px', color: css(PALETTE.mute),
            }).setOrigin(0.5);
        }

        this.add.text(w / 2, 840, `SCORE  ${score}`, {
            fontFamily: FONT, fontSize: '72px', color: css(PALETTE.ink),
        }).setOrigin(0.5);
        this.add.text(w / 2, 910, `rounds  ${rounds}     best  ${high}`, {
            fontFamily: FONT, fontSize: '40px', color: css(PALETTE.mute),
        }).setOrigin(0.5);

        this.add.text(w / 2, 1010, 'tap to retry', {
            fontFamily: FONT, fontSize: '40px', color: css(PALETTE.mute),
        }).setOrigin(0.5);

        let restarting = false;
        onAction(this, () => {
            if (restarting) return;
            restarting = true;
            sfx.play('start');
            Score.start(GAME_ID);
            this.scene.start('Game');
        });
    }

    private swatch(x: number, y: number, w: number, h: number, color: number, label: string) {
        const g = this.add.graphics();
        g.fillStyle(color, 1).fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
        g.lineStyle(2, PALETTE.ink, 0.35).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 18);
        this.add.text(x, y - h / 2 - 40, label, {
            fontFamily: FONT, fontSize: '34px', color: css(PALETTE.mute),
        }).setOrigin(0.5);
    }
}
