const DOT = 'feel-dot';

//  Particles need a texture; games 0–2 ship zero assets, so generate a 6px white
//  dot once and tint it per call. ponytail: bump size/shape only if a game needs it.
function ensureDot(scene: Phaser.Scene): void {
    if (scene.textures.exists(DOT)) return;
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 6, 6);
    g.generateTexture(DOT, 6, 6);
    g.destroy();
}

//  One-shot particle pop at (x, y). Self-destroys after the particles die.
export function burst(scene: Phaser.Scene, x: number, y: number, color: number, n = 14): void {
    ensureDot(scene);
    const emitter = scene.add.particles(x, y, DOT, {
        speed: { min: 60, max: 240 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        lifespan: { min: 250, max: 550 },
        tint: color,
        emitting: false,
    });
    emitter.explode(n, x, y);
    scene.time.delayedCall(650, () => emitter.destroy());
}
