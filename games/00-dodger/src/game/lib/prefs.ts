//  Accessibility: honour the OS "reduce motion" setting so motion-sensitive players
//  don't get nauseating shake/zoom/pulsing. Read live (cheap) so it reflects changes.
export function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
