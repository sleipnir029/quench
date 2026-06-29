//  Perceptual colour distance. The whole point: equal sRGB gaps are NOT equal
//  perceived gaps, so similarity must be measured in a perceptual space (CIELAB),
//  never as raw sRGB Euclidean distance.
//
//  Pipeline: sRGB(0..255) -> linear -> XYZ (D65) -> CIELAB. Distance = ΔE (CIE76 =
//  Euclidean distance in CIELAB). Pure math, no Phaser — reusable across games.

export type RGB = { r: number; g: number; b: number };   // channels 0..255

//  Undo the sRGB transfer function: gamma-encoded 0..255 -> linear-light 0..1.
function linearize(c: number): number {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

//  D65 reference white (the sRGB white point), used to normalise XYZ before CIELAB.
const Xn = 0.95047, Yn = 1.0, Zn = 1.08883;

//  CIELAB's nonlinear compression of the normalised tristimulus values.
function f(t: number): number {
    return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}

export function srgbToLab(c: RGB): [number, number, number] {
    const r = linearize(c.r), g = linearize(c.g), b = linearize(c.b);

    //  Linear sRGB -> CIE XYZ (standard D65 matrix).
    const X = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const Z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    const fx = f(X / Xn), fy = f(Y / Yn), fz = f(Z / Zn);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

//  ΔE CIE76 — Euclidean distance between two colours in CIELAB. This is the metric
//  the game scores on. Scoring on sRGB distance instead is the wrong answer the
//  game exists to teach.
export function deltaE76(a: RGB, b: RGB): number {
    const [l1, a1, b1] = srgbToLab(a);
    const [l2, a2, b2] = srgbToLab(b);
    return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}
