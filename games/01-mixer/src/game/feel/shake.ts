import { prefersReducedMotion } from '../lib/prefs';

//  Camera shake. intensity is a fraction of viewport (0.01 ≈ subtle, 0.02 ≈ hard).
//  Under "reduce motion", swap the translation for a soft flash — feedback without
//  the vestibular trigger that causes motion sickness.
export function shake(scene: Phaser.Scene, ms = 200, intensity = 0.01): void {
    if (prefersReducedMotion()) {
        scene.cameras.main.flash(140, 50, 16, 16);
        return;
    }
    scene.cameras.main.shake(ms, intensity);
}
