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

// ── the inverse direction (CIELAB -> sRGB) ──────────────────────────────────
//  Re-apply the sRGB transfer function: linear-light 0..1 -> gamma-encoded 0..1.
function delinearize(c: number): number {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

//  Inverse of f(): undo CIELAB's nonlinear compression.
function fInv(t: number): number {
    const t3 = t ** 3;
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
}

//  CIELAB -> sRGB(0..255), clamped to the displayable gamut. The exact inverse of
//  srgbToLab; together they round-trip to within ~1 ΔE (integer quantisation only —
//  see color.check). Needed to *show* a colour a chosen ΔE away from another.
export function labToRgb(L: number, a: number, b: number): RGB {
    const fy = (L + 16) / 116;
    const fx = fy + a / 500;
    const fz = fy - b / 200;
    const X = fInv(fx) * Xn, Y = fInv(fy) * Yn, Z = fInv(fz) * Zn;

    //  CIE XYZ -> linear sRGB (inverse of the D65 matrix used in srgbToLab).
    const r  = X *  3.2406 + Y * -1.5372 + Z * -0.4986;
    const g  = X * -0.9689 + Y *  1.8758 + Z *  0.0415;
    const bl = X *  0.0557 + Y * -0.2040 + Z *  1.0570;

    const to255 = (c: number) => Math.max(0, Math.min(255, Math.round(delinearize(c) * 255)));
    return { r: to255(r), g: to255(g), b: to255(bl) };
}

//  A colour exactly `dE` ΔE from `base`, kept inside the sRGB gamut. Powers the
//  mixer's "pass line" reference chip: the player SEES how different a colour the
//  current tolerance away really looks. Clamping to the gamut can shorten a LAB
//  step, so we try several directions and keep the one whose in-gamut result lands
//  closest to the requested ΔE — that keeps the chip honest (asserted in color.check).
export function colorAtDeltaE(base: RGB, dE: number): RGB {
    const [L, A, B] = srgbToLab(base);
    const dirs: [number, number, number][] = [
        [-1, 0, 0], [1, 0, 0],      // darker / lighter
        [0, 1, 0], [0, -1, 0],      // toward red / green
        [0, 0, 1], [0, 0, -1],      // toward yellow / blue
        [-0.6, 0.5, 0.6],           // a diagonal, for variety
    ];
    let best = base, bestErr = Infinity;
    for (const [dl, da, db] of dirs) {
        const cand = labToRgb(L + dl * dE, A + da * dE, B + db * dE);
        const err = Math.abs(deltaE76(base, cand) - dE);
        if (err < bestErr) { bestErr = err; best = cand; }
    }
    return best;
}
