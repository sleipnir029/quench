//  WebAudio blips — no asset files. One oscillator + gain envelope per hit.
//  Colour = meaning has no audio analogue here; tones are just feedback.

type Name = 'start' | 'hit' | 'pickup';

interface Tone { type: OscillatorType; f0: number; f1: number; dur: number; }

const tones: Record<Name, Tone> = {
    start:  { type: 'triangle', f0: 440, f1: 660, dur: 0.12 },
    hit:    { type: 'square',   f0: 220, f1: 70,  dur: 0.22 },
    pickup: { type: 'sine',     f0: 660, f1: 990, dur: 0.10 },
};

let ctx: AudioContext | null = null;

function audio(): AudioContext {
    //  Created lazily on first play, which happens inside a user gesture (start tap),
    //  so the browser autoplay policy is satisfied.
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

export const sfx = {
    //  `semitones` transposes the blip (12 = up an octave) so the same tone can
    //  signal "better" — e.g. a higher pickup on a successful round.
    play(name: Name, semitones = 0): void {
        const c = audio();
        const t = tones[name];
        const mul = 2 ** (semitones / 12);
        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = t.type;
        osc.frequency.setValueAtTime(t.f0 * mul, now);
        osc.frequency.exponentialRampToValueAtTime(t.f1 * mul, now + t.dur);
        //  exponentialRamp can't reach 0 — floor at 0.0001 for a clean fade.
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t.dur);
        osc.connect(gain).connect(c.destination);
        osc.start(now);
        osc.stop(now + t.dur + 0.02);
    },
};
