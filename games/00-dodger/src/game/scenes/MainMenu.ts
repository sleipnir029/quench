import { Scene } from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { onAction } from '../lib/input';
import { sfx } from '../feel/sfx';

const GAME_ID = '00-dodger';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width: w, height: h } = this.scale;

        this.add.text(w / 2, h * 0.38, 'DODGER', {
            fontFamily: FONT, fontSize: '72px', color: css(PALETTE.ink),
        }).setOrigin(0.5);

        //  A single hot block — the player — as the only "logo".
        this.add.rectangle(w / 2, h * 0.55, 54, 54, PALETTE.hot).setStrokeStyle(2, PALETTE.ink, 0.35);

        this.add.text(w / 2, h * 0.72, 'tap or press space to start', {
            fontFamily: FONT, fontSize: '22px', color: css(PALETTE.mute),
        }).setOrigin(0.5);

        Score.start(GAME_ID);   // also sets the localStorage key id so high score reads correctly on fresh load
        const hi = Score.high;
        if (hi > 0) {
            this.add.text(w / 2, h * 0.85, `best  ${hi}s`, {
                fontFamily: FONT, fontSize: '20px', color: css(PALETTE.warn),
            }).setOrigin(0.5);
        }

        let started = false;
        onAction(this, () => {
            if (started) return;
            started = true;
            sfx.play('start');
            Score.start(GAME_ID);
            this.scene.start('Game');
        });
    }
}
