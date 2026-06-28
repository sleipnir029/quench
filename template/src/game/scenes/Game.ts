import { Scene } from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { onAction } from '../lib/input';

//  The ONE mechanic lives here — this is the only file you reopen per game.
//  Reach for lib/input (onAxisX / onAction), lib/score, and feel/ (shake, burst,
//  hitstop, sfx). Keep it to a single mechanic; everything else stays cut.
export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        const { width: w, height: h } = this.scale;

        this.add.text(w / 2, h / 2, 'build your mechanic here', {
            fontFamily: FONT, fontSize: '28px', color: css(PALETTE.cool),
        }).setOrigin(0.5);

        //  Placeholder flow so the skeleton runs end-to-end out of the box.
        onAction(this, () => this.scene.start('GameOver', { score: Score.value, high: Score.high }));
    }
}
