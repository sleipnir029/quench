//  Freeze-frame on impact: pause the scene (renders the frozen frame), then resume.
//  Uses setTimeout because the scene's own clock is paused. `after` runs post-resume,
//  the natural place to fire the release juice (shake/burst) and the scene transition.
export function hitstop(scene: Phaser.Scene, ms = 80, after?: () => void): void {
    scene.scene.pause();
    setTimeout(() => {
        scene.scene.resume();
        after?.();
    }, ms);
}
