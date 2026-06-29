import { Scene } from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { onAction } from '../lib/input';
import { sfx } from '../feel/sfx';
import { spotlight, paintChip } from '../lib/paint';

//  Keys the high score in localStorage (quench:<id>:hi).
const GAME_ID = '01-mixer';
const PAINTS = [0xd13438, 0xf2c014, 0x2b5dd1, 0xf0efeb, 0x171520];

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width: w, height: h } = this.scale;

        spotlight(this);

        this.add.text(w / 2, h * 0.34, 'MIXER', {
            fontFamily: FONT, fontSize: '152px', color: css(PALETTE.ink),
        }).setOrigin(0.5);

        this.add.text(w / 2, h * 0.50, 'match the target colour — your eye decides, not the maths', {
            fontFamily: FONT, fontSize: '40px', color: css(PALETTE.mute),
        }).setOrigin(0.5);

        //  A row of glossy paint pots — the five sources, previewing the game's identity.
        const gap = 210, startX = w / 2 - ((PAINTS.length - 1) * gap) / 2, y = h * 0.66;
        PAINTS.forEach((c, i) => paintChip(this.add.graphics({ x: startX + i * gap, y }), 150, 150, c, true));

        this.add.text(w / 2, h * 0.84, 'tap to start', {
            fontFamily: FONT, fontSize: '44px', color: css(PALETTE.ink),
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
