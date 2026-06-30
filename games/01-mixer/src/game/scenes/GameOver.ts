import { Scene } from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { onAction } from '../lib/input';
import { sfx } from '../feel/sfx';
import { spotlight, paintChip, TITLE_FONT } from '../lib/paint';
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

        spotlight(this);
        const matchPct = Math.max(0, Math.round(100 - (data.deltaE ?? 0)));
        const needPct = Math.round(100 - (data.tolerance ?? 0));

        this.add.text(w / 2, 150, 'GAME OVER', {
            fontFamily: TITLE_FONT, fontSize: '112px', color: css(PALETTE.hot),
        }).setOrigin(0.5).setLetterSpacing(2);

        //  The teaching beat: your final mix beside the target. They look close — yet
        //  your eye saw a bigger gap than the RGB numbers. That gap IS the lesson.
        if (data.target && data.mix) {
            const sw = 300, sh = 230, y = 412, tx = w / 2 - 230, mx = w / 2 + 230;
            this.swatch(tx, y, sw, sh, int(data.target), 'TARGET', false);
            this.swatch(mx, y, sw, sh, int(data.mix), 'YOUR MIX', true);

            this.add.text(w / 2, 600, `${matchPct}% MATCH`, {
                fontFamily: FONT, fontSize: '58px', color: css(PALETTE.warn),
            }).setOrigin(0.5).setLetterSpacing(2);
            this.add.text(w / 2, 660, `you needed ${needPct}% to pass`, {
                fontFamily: FONT, fontSize: '34px', color: css(PALETTE.mute),
            }).setOrigin(0.5);

            this.add.text(w / 2, 728, 'RGB said these were close — your eyes said no.', {
                fontFamily: FONT, fontSize: '30px', color: css(PALETTE.mute),
            }).setOrigin(0.5);
            this.add.text(w / 2, 770, 'that perceptual gap is the whole game.', {
                fontFamily: FONT, fontSize: '30px', color: css(PALETTE.mute),
            }).setOrigin(0.5);
        }

        this.add.text(w / 2, 880, `SCORE  ${score}`, {
            fontFamily: FONT, fontSize: '70px', color: css(PALETTE.ink),
        }).setOrigin(0.5).setLetterSpacing(2);
        this.add.text(w / 2, 946, `rounds ${rounds}      best ${high}`, {
            fontFamily: FONT, fontSize: '38px', color: css(PALETTE.mute),
        }).setOrigin(0.5);

        this.add.text(w / 2, 1024, 'tap to retry', {
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

    private swatch(x: number, y: number, w: number, h: number, color: number, label: string, wet: boolean) {
        paintChip(this.add.graphics({ x, y }), w, h, color, wet);
        this.add.text(x, y - h / 2 - 40, label, {
            fontFamily: FONT, fontSize: '34px', color: css(PALETTE.mute),
        }).setOrigin(0.5);
    }
}
