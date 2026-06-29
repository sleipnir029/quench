//  The studio palette — this IS the art direction. Recolour = pick a different
//  accent, never a new file. Colour = meaning across every game:
//  hot kills/costs, cool is wanted/safe, warn is feedback/score, mute is neutral.
export const PALETTE = {
    bg:   0x14131a,  // near-black base
    ink:  0xe8e6e3,  // text / UI
    hot:  0xff5d5d,  // danger / player accent
    cool: 0x4ec9b0,  // safe / target accent
    warn: 0xffd166,  // highlight / score pop
    mute: 0x6b6a78,  // inactive / hazard fill
} as const;

//  '#rrggbb' form for the few APIs (text colour, backgroundColor) that want a string.
export const css = (c: number) => '#' + c.toString(16).padStart(6, '0');

//  One display font for games 0–2: system monospace, zero assets.
export const FONT = 'ui-monospace, monospace';
