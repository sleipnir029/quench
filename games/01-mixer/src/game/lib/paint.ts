//  Tactile paint-studio rendering — all Phaser primitives, zero assets. Shared across
//  scenes so the worktop feels like one place. Light and depth are faked: a radial
//  spotlight texture, stacked-alpha soft shadows, and low-alpha sheen ellipses.
import { PALETTE } from './palette';

//  Warm, friendly title face for the paint studio — system rounded, zero assets.
export const TITLE_FONT = 'ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic Pro", system-ui, sans-serif';

//  Soft warm studio spotlight behind everything — a radial-gradient texture made once.
export function spotlight(scene: Phaser.Scene): void {
    const w = scene.scale.width, h = scene.scale.height;
    const key = 'paint-spotlight';
    if (!scene.textures.exists(key)) {
        const tex = scene.textures.createCanvas(key, w, h);
        if (!tex) return;
        const ctx = tex.getContext();
        const cx = w / 2, cy = h * 0.42;
        const grad = ctx.createRadialGradient(cx, cy, 60, cx, cy, Math.max(w, h) * 0.75);
        grad.addColorStop(0, 'rgba(82,66,52,0.55)');     // warm light core
        grad.addColorStop(0.45, 'rgba(40,34,40,0.26)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        tex.refresh();
    }
    scene.add.image(w / 2, h / 2, key).setDepth(-90);
}

//  Studio-flat chip: a solid colour with one thin ink outline — handmade and graphic,
//  matching the dodger look. No gloss, no gradient, no drop shadow; the colour IS the art.
//  Life comes from motion (reveal punch, ripples), not from rendered 3D volume.
const R = 12;
export function paintChip(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number, _wet: boolean): void {
    g.clear();
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2, w, h, R);
    g.lineStyle(4, PALETTE.ink, 0.35).strokeRoundedRect(-w / 2, -h / 2, w, h, R);
}

//  Empty mix well — a flat dark slot with a soft rim, "waiting for paint".
export function emptyWell(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    g.clear();
    g.fillStyle(0x100f16, 1).fillRoundedRect(-w / 2, -h / 2, w, h, R);
    g.lineStyle(4, PALETTE.mute, 0.4).strokeRoundedRect(-w / 2, -h / 2, w, h, R);
}

//  The pool curdles to muddy sludge on a failed lock — every pigment at once = brown.
export const MUD: number = 0x4b3d30;

//  Jagged hairline cracks across the failed pool, then they fade.
export function crack(scene: Phaser.Scene, x: number, y: number, w: number, h: number): void {
    const g = scene.add.graphics({ x, y }).setDepth(58);
    g.lineStyle(3, 0x140f0a, 0.85);
    for (let i = 0; i < 3; i++) {
        const sx = -w / 2 + (w / 4) * (i + 1);
        g.beginPath();
        g.moveTo(sx, -h / 2);
        g.lineTo(sx + (i - 1) * 34, h * 0.05);
        g.lineTo(sx + (i - 1) * 12, h / 2);
        g.strokePath();
    }
    scene.tweens.add({ targets: g, alpha: 0, duration: 600, delay: 220, onComplete: () => g.destroy() });
}

//  A ripple ring expanding on the wet pool when a drop lands.
export function ripple(scene: Phaser.Scene, x: number, y: number, color: number): void {
    const g = scene.add.graphics({ x, y }).setDepth(55);
    g.lineStyle(5, color, 0.7).strokeCircle(0, 0, 26);
    scene.tweens.add({
        targets: g, scale: 3.2, alpha: 0, duration: 520, ease: 'Cubic.easeOut',
        onComplete: () => g.destroy(),
    });
}

//  A little paint droplet (teardrop): filled = remaining, hollow = spent.
export function droplet(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, color: number, filled: boolean): void {
    if (filled) {
        g.fillStyle(color, 1);
        g.fillCircle(x, y + r * 0.35, r);
        g.fillTriangle(x, y - r * 1.25, x - r * 0.82, y + r * 0.15, x + r * 0.82, y + r * 0.15);
    } else {
        g.lineStyle(2, PALETTE.mute, 0.8);
        g.strokeCircle(x, y + r * 0.35, r);
    }
}
