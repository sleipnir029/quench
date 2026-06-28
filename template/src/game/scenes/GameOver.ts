import { Scene } from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { onAction } from '../lib/input';
import { sfx } from '../feel/sfx';

const GAME_ID = 'template';

interface GameOverData { score: number; high: number; }

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

        this.add.text(w / 2, h * 0.36, 'GAME OVER', {
            fontFamily: FONT, fontSize: '56px', color: css(PALETTE.hot),
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.54, `${score}`, {
            fontFamily: FONT, fontSize: '40px', color: css(PALETTE.ink),
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.64, `best  ${high}`, {
            fontFamily: FONT, fontSize: '22px', color: css(PALETTE.mute),
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.8, 'tap or press space to retry', {
            fontFamily: FONT, fontSize: '20px', color: css(PALETTE.mute),
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
}
