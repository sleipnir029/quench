const DOT = 'feel-dot';

//  Particles need a texture; games 0–2 ship zero assets, so generate a 12px white
//  dot once and tint it per call (sized for the 1920×1080 design resolution).
function ensureDot(scene: Phaser.Scene): void {
    if (scene.textures.exists(DOT)) return;
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 12, 12);
    g.generateTexture(DOT, 12, 12);
    g.destroy();
}

//  One-shot particle pop at (x, y). Self-destroys after the particles die.
export function burst(scene: Phaser.Scene, x: number, y: number, color: number, n = 14): void {
    ensureDot(scene);
    const emitter = scene.add.particles(x, y, DOT, {
        speed: { min: 120, max: 480 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        lifespan: { min: 250, max: 550 },
        tint: color,
        emitting: false,
    });
    emitter.explode(n, x, y);
    scene.time.delayedCall(650, () => emitter.destroy());
}
