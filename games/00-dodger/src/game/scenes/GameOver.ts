import { Scene } from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { onAction } from '../lib/input';
import { sfx } from '../feel/sfx';

const GAME_ID = '00-dodger';

interface GameOverData { score: number; high: number; isBest: boolean; }

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create (data: GameOverData)
    {
        const { width: w, height: h } = this.scale;
        const score = data.score ?? 0;
        const high = data.high ?? 0;
        const isBest = data.isBest ?? false;

        this.add.text(w / 2, h * 0.32, 'GAME OVER', {
            fontFamily: FONT, fontSize: '112px', color: css(PALETTE.hot),
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.52, `${score}s`, {
            fontFamily: FONT, fontSize: '80px', color: css(PALETTE.ink),
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.63, isBest ? 'new best!' : `best  ${high}s`, {
            fontFamily: FONT, fontSize: '44px', color: css(isBest ? PALETTE.warn : PALETTE.mute),
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.8, 'tap or press space to retry', {
            fontFamily: FONT, fontSize: '40px', color: css(PALETTE.mute),
        }).setOrigin(0.5);

        let restarting = false;
        onAction(this, () => {
            if (restarting) return;
            restarting = true;
            sfx.play('start');
            Score.start(GAME_ID);   // restart loops straight into a fresh run
            this.scene.start('Game');
        });
    }
}
