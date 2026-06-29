//  Tactile paint-studio rendering — all Phaser primitives, zero assets. Shared across
//  scenes so the worktop feels like one place. Light and depth are faked: a radial
//  spotlight texture, stacked-alpha soft shadows, and low-alpha sheen ellipses.
import { PALETTE } from './palette';

//  Warm, friendly title face for the paint studio — system rounded, zero assets.
export const TITLE_FONT = 'ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic Pro", system-ui, sans-serif';

//  Lighten/darken a colour toward white/black — used to shade paint in its OWN hue
//  (light pools at the top, the pigment darkens at the bottom) so chips read as volume.
const chans = (c: number): [number, number, number] => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
function tint(color: number, t: number, toward: number): number {
    const [r, g, b] = chans(color), [tr, tg, tb] = chans(toward);
    const L = (a: number, z: number) => Math.round(a + (z - a) * t);
    return (L(r, tr) << 16) | (L(g, tg) << 8) | L(b, tb);
}
const lighten = (c: number, t: number) => tint(c, t, 0xffffff);
const darken = (c: number, t: number) => tint(c, t, 0x000000);

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

//  Soft drop shadow under a chip — stacked low-alpha rounded rects fake a blur. Kept
//  faint and sunk so it reads as a chip resting on the worktop, not a hard slab.
const R = 26;
function softShadow(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    for (let i = 0; i < 3; i++) {
        const s = i * 8;
        g.fillStyle(0x000000, 0.085 - i * 0.022);
        g.fillRoundedRect(-(w + s) / 2, -h / 2 + 18 + i * 5, w + s, h, R);
    }
}

//  A paint chip into a centred Graphics. The form is shaded in the colour's OWN hue —
//  light pooled at the top, the pigment darkening at the bottom — so it looks like wet
//  paint with volume rather than a flat fill with a pasted-on white oval. A wet chip
//  adds a small, soft sheen; a dry (matte) chip gets gentler light and no sheen.
export function paintChip(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number, wet: boolean): void {
    g.clear();
    softShadow(g, w, h);
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2, w, h, R);
    //  Volume, shaded in the colour's OWN hue. Each "band" is several faint stacked
    //  ellipses so it falls off softly — no hard oval, no seam — like wet pigment.
    const dark = darken(color, 0.5);
    for (let i = 0; i < 4; i++) g.fillStyle(dark, 0.045).fillEllipse(0, h * 0.30, w * (0.55 + i * 0.14), h * (0.22 + i * 0.07));
    const lite = lighten(color, wet ? 0.5 : 0.28);
    for (let i = 0; i < 4; i++) g.fillStyle(lite, wet ? 0.055 : 0.04).fillEllipse(0, -h * 0.24, w * (0.42 + i * 0.14), h * (0.20 + i * 0.07));
    //  A small, soft wet sheen — stacked faint so it glows rather than reads as a decal.
    if (wet) for (let i = 0; i < 3; i++) g.fillStyle(0xffffff, 0.05).fillEllipse(-w * 0.08, -h * 0.30, w * (0.12 + i * 0.09), h * (0.06 + i * 0.045));
}

//  Empty mix well — a dark recess with a rim, "waiting for paint".
export function emptyWell(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
    g.clear();
    softShadow(g, w, h);
    g.fillStyle(0x0d0c12, 1).fillRoundedRect(-w / 2, -h / 2, w, h, R);
    g.fillStyle(0x000000, 0.4).fillEllipse(0, h * 0.18, w * 0.86, h * 0.5);
    g.lineStyle(3, PALETTE.mute, 0.45).strokeRoundedRect(-w / 2, -h / 2, w, h, R);
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
