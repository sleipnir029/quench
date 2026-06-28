import { Scene } from 'phaser';

//  No assets in games 0–2 (primitives only), so Boot just forwards to Preloader.
export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
