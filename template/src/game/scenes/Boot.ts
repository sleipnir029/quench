import { Scene } from 'phaser';

//  No assets by default (primitives-first). Load Preloader-stage assets here if a
//  game needs them; otherwise Boot just forwards on.
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
