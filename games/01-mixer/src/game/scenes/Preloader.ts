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

        const HOLD = 800;   // pause at full opacity before the fade-out

        //  Studio splash, sequenced so steps never overlap:
        //  fade + settle in → hold → fade + drift out (logo FULLY gone) → THEN morph
        //  the backdrop to the game bg → title card. The morph runs only in the
        //  fade-out's onComplete, so the logo's (black) border can never show against
        //  the shifting background.
        this.tweens.chain({
            targets: logo,
            tweens: [
                { alpha: 1, scale: s, duration: 1000, ease: 'Sine.Out' },              // fade + settle in
                { alpha: 0, scale: s * 1.06, duration: 1000, ease: 'Sine.In', delay: HOLD }, // hold, then fade + drift out
            ],
            onComplete: () => this.morphToMenu(splashColor, gameColor),
        });
    }

    //  Logo is fully faded by now, so the backdrop can morph cleanly to the menu bg.
    private morphToMenu (from: Phaser.Display.Color, to: Phaser.Display.Color)
    {
        const morph = { t: 0 };
        this.tweens.add({
            targets: morph,
            t: 1,
            delay: 250,        // a small beat on the splash colour before it shifts
            duration: 1000,    // slow, subtle morph
            ease: 'Sine.InOut',
            onUpdate: () => {
                const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, morph.t * 100);
                this.cameras.main.setBackgroundColor(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
            },
            onComplete: () => this.scene.start('MainMenu'),
        });
    }
}
