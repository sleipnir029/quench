//  Self-check for the colour-space helper. No test framework — run directly:
//    npx tsx src/game/lib/color.check.ts
//  Proves the metric is perceptual CIELAB ΔE, not raw sRGB Euclidean distance.

import { deltaE76, srgbToLab, type RGB } from './color';
import { strict as assert } from 'node:assert';

const black: RGB = { r: 0, g: 0, b: 0 };
const white: RGB = { r: 255, g: 255, b: 255 };

//  Identical colours -> zero distance.
assert.equal(deltaE76(black, black), 0);

//  Black (L*=0) vs white (L*=100): ΔE is dominated by the lightness axis ≈ 100.
assert.ok(Math.abs(deltaE76(black, white) - 100) < 1, 'black/white ΔE ≈ 100');

//  Anchor: pure white really is L*≈100, a*≈0, b*≈0.
const [L] = srgbToLab(white);
assert.ok(Math.abs(L - 100) < 0.5, 'white L* ≈ 100');

//  THE LESSON: two pairs with the SAME sRGB Euclidean gap but very different
//  perceived gaps. From black, a step of +40 in GREEN and a step of +40 in BLUE
//  have identical sRGB distance (40), yet the green step is perceptually larger —
//  green carries ~0.72 of luminance, blue only ~0.07. So sRGB distance does NOT
//  determine perceived distance; only a perceptual metric (ΔE) does. If scoring
//  ever regresses to sRGB distance, these two ΔE values would be equal and this fails.
const sRGB = (a: RGB, b: RGB) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

const greenStep: RGB = { r: 0, g: 40, b: 0 };
const blueStep: RGB = { r: 0, g: 0, b: 40 };

assert.ok(Math.abs(sRGB(black, greenStep) - sRGB(black, blueStep)) < 1e-9, 'equal sRGB gaps');

const dGreen = deltaE76(black, greenStep);
const dBlue = deltaE76(black, blueStep);
assert.ok(dGreen > dBlue * 1.15, `green step should outweigh blue step (${dGreen.toFixed(1)} vs ${dBlue.toFixed(1)})`);

console.log('color.check OK  —  black/white ΔE=%s  greenΔE=%s  blueΔE=%s (equal sRGB gap)',
    deltaE76(black, white).toFixed(2), dGreen.toFixed(2), dBlue.toFixed(2));
