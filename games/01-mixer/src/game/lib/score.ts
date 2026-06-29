//  Score = whole seconds survived. Derived from elapsed time, not a counter.
//  High score persists to localStorage key `quench:<game-id>:hi`.

let gameId = '';
let startMs = 0;

const key = () => `quench:${gameId}:hi`;
const currentValue = () => Math.floor((performance.now() - startMs) / 1000);

//  localStorage throws in private mode / disabled storage — a failed high score
//  must never crash the game, so reads fall back to 0 and writes are best-effort.
function readHi(): number {
    try { return Number(localStorage.getItem(key())) || 0; } catch { return 0; }
}

export const Score = {
    start(id: string) { gameId = id; startMs = performance.now(); },

    get value(): number { return currentValue(); },

    get high(): number { return readHi(); },

    //  Persist if beaten; returns the run's score. Snapshots value at call time so
    //  the clock can't tick past the death frame during hitstop/transition.
    commit(snapshot = currentValue()): number {
        if (snapshot > readHi()) {
            try { localStorage.setItem(key(), String(snapshot)); } catch { /* storage off */ }
        }
        return snapshot;
    },
};
