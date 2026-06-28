//  Camera shake. intensity is a fraction of viewport (0.01 ≈ subtle, 0.02 ≈ hard).
export function shake(scene: Phaser.Scene, ms = 200, intensity = 0.01): void {
    scene.cameras.main.shake(ms, intensity);
}
