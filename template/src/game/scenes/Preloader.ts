import { Scene } from 'phaser';

//  Loads shared assets, then plays the studio splash before the title card.
//  Add game-specific `this.load.*` calls in preload() and a progress bar in init()
//  when a game ships real assets.
export class Preloader extends Scene
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

        const logo = this.add.image(w / 2, h / 2, 'zeezbit-logo').setAlpha(0);
        //  Uniform scale (not setDisplaySize) preserves the logo's aspect ratio.
        const s = (w * 0.7) / logo.width;
        logo.setScale(s * 0.9);

        //  Studio splash: gradual fade + settle in → hold → gradual fade + drift out.
        //  Slow Sine easing makes the transition smooth instead of sudden.
        this.tweens.chain({
            targets: logo,
            tweens: [
                { alpha: 1, scale: s, duration: 900, ease: 'Sine.Out' },   // fade + settle in
                { alpha: 1, duration: 700 },                               // hold
                { alpha: 0, scale: s * 1.06, duration: 900, ease: 'Sine.In' }, // fade + drift out
            ],
            onComplete: () => this.scene.start('MainMenu'),
        });
    }
}
