import * as Phaser from 'phaser';
import { PALETTE, css, FONT } from '../lib/palette';
import { Score } from '../lib/score';
import { onAction } from '../lib/input';
import { sfx } from '../feel/sfx';
import { burst } from '../feel/burst';
import { shake } from '../feel/shake';

const GAME_ID = '00-dodger';

export class MainMenu extends Phaser.Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        const { width: w, height: h } = this.scale;

        this.add.text(w / 2, h * 0.38, 'DODGER', {
            fontFamily: FONT, fontSize: '144px', color: css(PALETTE.ink),
        }).setOrigin(0.5);

        //  A single hot block — the player — as the only "logo".
        const block = this.add.rectangle(w / 2, h * 0.55, 108, 108, PALETTE.hot).setStrokeStyle(4, PALETTE.ink, 0.35);

        this.add.text(w / 2, h * 0.72, 'tap or press space to start', {
            fontFamily: FONT, fontSize: '44px', color: css(PALETTE.mute),
        }).setOrigin(0.5);

        Score.start(GAME_ID);   // also sets the localStorage key id so high score reads correctly on fresh load
        const hi = Score.high;
        if (hi > 0) {
            this.add.text(w / 2, h * 0.85, `best  ${hi}s`, {
                fontFamily: FONT, fontSize: '40px', color: css(PALETTE.warn),
            }).setOrigin(0.5);
        }

        //  Easter egg: the Konami code triggers a visual-only flourish (no gameplay/audio).
        //  Manual sequence tracker on keydown (Phaser 4's createCombo didn't match reliably).
        const kb = this.input.keyboard;
        if (kb) {
            const K = Phaser.Input.Keyboard.KeyCodes;
            const seq = [K.UP, K.UP, K.DOWN, K.DOWN, K.LEFT, K.RIGHT, K.LEFT, K.RIGHT, K.B, K.A];
            let pos = 0;
            kb.on('keydown', (e: KeyboardEvent) => {
                pos = e.keyCode === seq[pos] ? pos + 1 : (e.keyCode === seq[0] ? 1 : 0);
                if (pos === seq.length) { pos = 0; this.partyTime(block); }
            });
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

    //  Konami flourish: burst + shake + the logo block rainbow-cycles, with a wink.
    private partyTime (block: Phaser.GameObjects.Rectangle)
    {
        const { width: w, height: h } = this.scale;
        burst(this, block.x, block.y, PALETTE.warn, 36);
        shake(this, 300, 0.012);

        const cycle = [PALETTE.cool, PALETTE.warn, PALETTE.ink, PALETTE.hot];
        let i = 0;
        this.time.addEvent({ delay: 90, repeat: 15, callback: () => block.setFillStyle(cycle[i++ % cycle.length]) });
        this.time.delayedCall(90 * 17, () => block.setFillStyle(PALETTE.hot));

        const msg = this.add.text(w / 2, h * 0.64, '✦ zeezbit ✦', {
            fontFamily: FONT, fontSize: '32px', color: css(PALETTE.cool),
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: msg, alpha: 1, duration: 220, yoyo: true, hold: 1200, onComplete: () => msg.destroy() });
    }
}
