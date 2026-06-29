//  Tactile paint-studio rendering — all Phaser primitives, zero assets. Shared across
//  scenes so the worktop feels like one place. Light and depth are faked: a radial
//  spotlight texture, stacked-alpha soft shadows, and low-alpha sheen ellipses.
import { PALETTE } from './palette';

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

//  Soft drop shadow under a chip — stacked low-alpha rects fake a blur.
function softShadow(g: Phaser.GameObjects.Graphics, w: number, h: number, r: number): void {
    for (let i = 0; i < 3; i++) {
        const spread = i * 10, off = 16 + i * 7, a = 0.12 - i * 0.035;
        g.fillStyle(0x000000, a);
        g.fillRoundedRect(-(w + spread) / 2, -h / 2 + off, w + spread, h, r);
    }
}

//  Paint chip into a centred Graphics: soft shadow + colour, plus a wet sheen (the mix
//  pool) or a faint matte top edge (a dry reference chip).
export function paintChip(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number, wet: boolean): void {
    g.clear();
    const r = 24;
    softShadow(g, w, h, r);
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2, w, h, r);
    if (wet) {
        g.fillStyle(0xffffff, 0.12).fillEllipse(0, -h * 0.26, w * 0.72, h * 0.30);
        g.fillStyle(0xffffff, 0.07).fillEllipse(0, -h * 0.40, w * 0.46, h * 0.12);
    } else {
        g.fillStyle(0xffffff, 0.05).fillRoundedRect(-w / 2, -h / 2, w, h * 0.16, r);
    }
}

//  Empty mix well — a dark recess with a rim, "waiting for paint".
export function emptyWell(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    g.clear();
    const r = 24;
    softShadow(g, w, h, r);
    g.fillStyle(0x0d0c12, 1).fillRoundedRect(-w / 2, -h / 2, w, h, r);
    g.lineStyle(3, PALETTE.mute, 0.5).strokeRoundedRect(-w / 2, -h / 2, w, h, r);
    g.fillStyle(0xffffff, 0.03).fillEllipse(0, -h * 0.3, w * 0.6, h * 0.18);
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
