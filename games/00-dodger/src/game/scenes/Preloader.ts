import { Scene } from 'phaser';

//  Nothing to load (asset list is none). Kept in the chain so the skeleton — and
//  the template that inherits it — has the slot ready for games that do load assets.
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
