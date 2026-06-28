import { Scene } from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { onAction } from '../lib/input';
import { sfx } from '../feel/sfx';

//  Rename per game; it keys the high score in localStorage (quench:<id>:hi).
const GAME_ID = 'template';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width: w, height: h } = this.scale;

        this.add.text(w / 2, h * 0.4, 'TITLE', {
            fontFamily: FONT, fontSize: '144px', color: css(PALETTE.ink),
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.7, 'tap or press space to start', {
            fontFamily: FONT, fontSize: '44px', color: css(PALETTE.mute),
        }).setOrigin(0.5);

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
