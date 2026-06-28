import * as Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { Game as MainGame } from './scenes/Game';
import { GameOver } from './scenes/GameOver';
import { PALETTE } from './lib/palette';

//  Design resolution 1920×1080, FIT + centered, per CONVENTIONS. See the studio bible.
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    backgroundColor: PALETTE.bg,
    roundPixels: false,   // false = sub-pixel motion; fast-moving objects render smooth, not stepped
    antialias: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
};

const StartGame = (parent: string) => {
    const game = new Phaser.Game({ ...config, parent });

    //  Pause the active game scene when tabbed away so difficulty doesn't ramp in
    //  the background (CONVENTIONS safety rule). Only 'Game' needs it.
    const get = () => game.scene.getScene('Game');
    window.addEventListener('blur', () => { const s = get(); if (s?.scene.isActive()) s.scene.pause(); });
    window.addEventListener('focus', () => { const s = get(); if (s?.scene.isPaused()) s.scene.resume(); });

    return game;
};

export default StartGame;
