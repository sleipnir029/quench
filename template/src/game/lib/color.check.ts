//  Self-check for the colour-space helper. No test framework — run directly:
//    npx tsx src/game/lib/color.check.ts
//  Proves the metric is perceptual CIELAB ΔE, not raw sRGB Euclidean distance.

import { deltaE76, srgbToLab, labToRgb, colorAtDeltaE, type RGB } from './color';
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

//  labToRgb is the inverse of srgbToLab — a colour survives the round trip to the
//  eye. (Tolerance ~1 ΔE is integer 0..255 quantisation, not a maths error.)
const samples: RGB[] = [black, white,
    { r: 209, g: 52, b: 56 }, { r: 43, g: 93, b: 209 }, { r: 242, g: 192, b: 20 }];
for (const c of samples) {
    const [L, A, B] = srgbToLab(c);
    const back = labToRgb(L, A, B);
    assert.ok(deltaE76(c, back) < 1.0, `round-trip ΔE < 1 for ${JSON.stringify(c)}`);
}

//  The "pass line" chip must be HONEST: a colour reported as `t` ΔE away really is
//  ~t away — otherwise the lesson it teaches is a lie. Checked across the tolerance
//  range (6 floor … 25 start) and a few base colours incl. a near-grey blend.
for (const t of [6, 12, 25]) {
    for (const c of samples.concat([{ r: 120, g: 140, b: 90 }])) {
        const edge = colorAtDeltaE(c, t);
        assert.ok(Math.abs(deltaE76(c, edge) - t) < 2.0,
            `pass-line chip honest: ${t} ΔE from ${JSON.stringify(c)} (got ${deltaE76(c, edge).toFixed(1)})`);
    }
}

console.log('color.check OK  —  black/white ΔE=%s  greenΔE=%s  blueΔE=%s (equal sRGB gap)  +round-trip +pass-line',
    deltaE76(black, white).toFixed(2), dGreen.toFixed(2), dBlue.toFixed(2));
