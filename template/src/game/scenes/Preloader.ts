import { Scene } from 'phaser';

//  Asset-loading slot. Empty by default — add `this.load.*` calls in preload() and a
//  progress bar in init() when a game ships real assets.
export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    create ()
    {
        this.scene.start('MainMenu');
    }
}
