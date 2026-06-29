import { prefersReducedMotion } from '../lib/prefs';

//  Mobile haptics — a quick buzz on a meaningful event (drop / win / loss). The
//  pattern is a duration in ms, or a [on, off, on, …] array per the Web Vibration API.
//  Gated on the OS "reduce motion" setting, since a buzz is a vestibular cue too.
//
//  ponytail: iOS Safari ignores navigator.vibrate entirely — this is Android/Chrome
//  only, and there is no alternative API to upgrade to (Apple has declined to ship
//  the Vibration API). Treat haptics as a pure progressive enhancement.
export function haptic(pattern: number | number[]): void {
    if (prefersReducedMotion()) return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    navigator.vibrate(pattern);
}
