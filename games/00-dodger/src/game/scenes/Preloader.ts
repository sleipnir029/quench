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
        const fit = Math.min(w, h) * 0.6;
        logo.setDisplaySize(fit, fit);

        //  Studio splash: fade in → hold → fade out → title card. One tween (yoyo+hold).
        this.tweens.add({
            targets: logo,
            alpha: 1,
            duration: 300,
            ease: 'Quad.Out',
            yoyo: true,
            hold: 450,
            onComplete: () => this.scene.start('MainMenu'),
        });
    }
}
