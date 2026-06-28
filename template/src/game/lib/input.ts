import * as Phaser from 'phaser';

//  The entire input surface for games 0–2. Two entry points, nothing more
//  elaborate ships in the template.

export interface AxisX {
    //  Current target x in 0..width. Read it every frame.
    readonly x: number;
}

//  Horizontal aim for dodgers/aimers. Pointer/finger x sets the target directly;
//  arrow keys and A,D are a secondary path that nudges it. Works on touch + mouse.
export function onAxisX(scene: Phaser.Scene): AxisX {
    const w = scene.scale.width;
    let target = w / 2;

    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => { target = p.x; });

    const keys = scene.input.keyboard?.addKeys('LEFT,RIGHT,A,D,SHIFT') as
        Record<'LEFT' | 'RIGHT' | 'A' | 'D' | 'SHIFT', Phaser.Input.Keyboard.Key> | undefined;
    const speed = w / 0.9; // keys cross the screen in ~0.9s — precise, not twitchy (mouse is direct, unaffected)
    const FINE = 0.35;     // hold Shift for fine, precise nudging

    //  Phaser's scene 'update' fires on scene.events. Scene restart is shutdown (not
    //  destroy), which does NOT clear these listeners — so remove it on shutdown or it
    //  accumulates one stale handler per retry. (input/keyboard listeners self-clean.)
    const onUpdate = (_t: number, dt: number) => {
        if (!keys) return;
        const dir = (keys.LEFT.isDown || keys.A.isDown ? -1 : 0) +
                    (keys.RIGHT.isDown || keys.D.isDown ? 1 : 0);
        const fine = keys.SHIFT.isDown ? FINE : 1;
        if (dir) target = Phaser.Math.Clamp(target + dir * speed * fine * (dt / 1000), 0, w);
    };
    scene.events.on('update', onUpdate);
    scene.events.once('shutdown', () => scene.events.off('update', onUpdate));

    return { get x() { return Phaser.Math.Clamp(target, 0, w); } };
}

//  "Go" for games that need only a single confirm: pointer/touch, Space, or Enter.
export function onAction(scene: Phaser.Scene, cb: () => void): void {
    scene.input.on('pointerdown', cb);
    scene.input.keyboard?.on('keydown-SPACE', cb);
    scene.input.keyboard?.on('keydown-ENTER', cb);
}
