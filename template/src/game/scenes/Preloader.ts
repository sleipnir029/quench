import * as Phaser from 'phaser';
import { PALETTE } from '../lib/palette';

//  Loads shared assets, then plays the studio splash before the title card.
//  Add game-specific `this.load.*` calls in preload() and a progress bar in init()
//  when a game ships real assets.
export class Preloader extends Phaser.Scene
{
    constructor ()
    {
        super('Preloader');
    }

    preload ()
    {
        this.load.image('zeezbit-logo', 'assets/logo.png');
    }

    create ()
    {
        const { width: w, height: h } = this.scale;

        //  Deterministically read the logo's own background colour from its corner
        //  pixel, so the splash backdrop blends with the logo (no block-in-block) and
        //  always matches whatever logo.png ships — no hardcoded colour to drift.
        const corner = this.textures.getPixel(4, 4, 'zeezbit-logo');
        const splashColor = corner ?? Phaser.Display.Color.IntegerToColor(PALETTE.bg);
        const gameColor = Phaser.Display.Color.IntegerToColor(PALETTE.bg);
        this.cameras.main.setBackgroundColor(splashColor.color);

        const logo = this.add.image(w / 2, h / 2, 'zeezbit-logo').setAlpha(0);
        //  Uniform scale (not setDisplaySize) preserves the logo's aspect ratio.
        const s = (w * 0.7) / logo.width;
        logo.setScale(s * 0.9);

        const HOLD = 700;   // pause at full opacity before the fade-out

        //  Studio splash: gradual fade + settle in → hold → gradual fade + drift out.
        //  The hold is a `delay` on the fade-out (a no-op tween would collapse to 0).
        this.tweens.chain({
            targets: logo,
            tweens: [
                { alpha: 1, scale: s, duration: 900, ease: 'Sine.Out' },              // fade + settle in
                { alpha: 0, scale: s * 1.06, duration: 900, ease: 'Sine.In', delay: HOLD }, // hold, then fade + drift out
            ],
            onComplete: () => this.scene.start('MainMenu'),
        });

        //  Morph the backdrop from the logo colour to the game bg during the fade-out,
        //  so it lands exactly on the menu's background — a seamless, deterministic handoff.
        const morph = { t: 0 };
        this.tweens.add({
            targets: morph,
            t: 1,
            delay: 900 + HOLD,   // start as the logo begins fading out
            duration: 900,       // matches the fade-out
            ease: 'Sine.InOut',
            onUpdate: () => {
                const c = Phaser.Display.Color.Interpolate.ColorWithColor(splashColor, gameColor, 100, morph.t * 100);
                this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
            },
        });
    }
}
