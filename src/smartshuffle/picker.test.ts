import { describe, it, expect } from 'vitest';
import { nextTrack, blendTarget, sample, Track } from './picker';

function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const NOW = 1_700_000_000_000;
const mk = (id: number, over: Partial<Track> = {}): Track => ({
  id, artist: `a${id}`, album: `al${id}`, workKey: `w${id}`,
  score: 0.5, plays: 0, lastPlayedAt: null, ...over,
});
const o = (rng: () => number, extra = {}) => ({ rng, now: NOW, explore: 0, ...extra });
const tally = (n: number, pick: () => Track | null) => {
  const c: Record<number, number> = {};
  for (let i = 0; i < n; i++) { const t = pick()!; c[t.id] = (c[t.id] ?? 0) + 1; }
  return c;
};

describe('nextTrack: basics', () => {
  it('returns null for an empty library', () => {
    expect(nextTrack([], [], new Set(), undefined, o(seeded(1)))).toBeNull();
  });
  it('skips recently played works', () => {
    for (let s = 1; s <= 50; s++)
      expect(nextTrack([mk(1), mk(2)], [], new Set(['w1']), undefined, o(seeded(s)))!.id).toBe(2);
  });
  it('does not repeat a work that is already in the queue', () => {
    for (let s = 1; s <= 50; s++)
      expect(nextTrack([mk(1), mk(2)], [mk(1)], new Set(), undefined, o(seeded(s)))!.id).toBe(2);
  });
  it('still returns something for a one-track library', () => {
    expect(nextTrack([mk(1)], [mk(1)], new Set(), undefined, o(seeded(1)))!.id).toBe(1);
  });
});

describe('nextTrack: spacing and the relaxation ladder', () => {
  it('excludes a recently queued artist when alternatives exist', () => {
    const queue = [mk(99, { artist: 'X' })];
    for (let s = 1; s <= 50; s++) {
      const t = nextTrack([mk(1, { artist: 'X' }), mk(2, { artist: 'Y' })], queue, new Set(), undefined, o(seeded(s)));
      expect(t!.id).toBe(2);
    }
  });
  it('relaxes the rules instead of failing when every candidate is excluded', () => {
    const lib = [mk(1, { artist: 'X', album: 'A' }), mk(2, { artist: 'X', album: 'A' })];
    const queue = [mk(99, { artist: 'X', album: 'A' })];
    const t = nextTrack(lib, queue, new Set(), undefined, o(seeded(3)));
    expect([1, 2]).toContain(t!.id);
  });
});

describe('nextTrack: weighting', () => {
  it('prefers higher-scored tracks', () => {
    const rng = seeded(7);
    const lib = [mk(1, { score: 0.9 }), mk(2, { score: 0.1 })];
    const c = tally(2000, () => nextTrack(lib, [], new Set(), undefined, o(rng)));
    expect(c[1] / 2000).toBeGreaterThan(0.8);
  });
  it('prefers tracks not played recently', () => {
    const rng = seeded(8);
    const lib = [mk(1, { lastPlayedAt: NOW - 3.6e6 }), mk(2)];
    const c = tally(2000, () => nextTrack(lib, [], new Set(), undefined, o(rng)));
    expect(c[2]).toBeGreaterThan(1850);
  });
  it('exploration slots draw from the least-played tracks', () => {
    const rng = seeded(9);
    const lib = Array.from({ length: 100 }, (_, i) => mk(i + 1, { plays: i + 1 }));
    for (let i = 0; i < 200; i++)
      expect(nextTrack(lib, [], new Set(), undefined, o(rng, { explore: 1 }))!.id).toBeLessThanOrEqual(50);
  });
  it('samples large libraries and still returns a valid track', () => {
    const lib = Array.from({ length: 2000 }, (_, i) => mk(i + 1));
    const t = nextTrack(lib, [], new Set(), undefined, o(seeded(4)));
    expect(t).not.toBeNull();
  });
});

describe('nextTrack: flow', () => {
  const v = (...n: number[]) => new Float32Array(n);
  it('favours a moderately similar track over near-identical and unrelated ones', () => {
    const rng = seeded(11);
    const lib = [
      mk(1, { vec: v(1, 0) }),        // sim 1.0
      mk(2, { vec: v(0.6, 0.8) }),    // sim 0.6  <- target
      mk(3, { vec: v(0, 1) }),        // sim 0.0
    ];
    const queue = [mk(99, { artist: 'Z', album: 'Z', vec: v(1, 0) })];
    const c = tally(2000, () => nextTrack(lib, queue, new Set(), undefined, o(rng)));
    expect(c[2]).toBeGreaterThan(c[1]);
    expect(c[2]).toBeGreaterThan(c[3] ?? 0);
  });
  it('works when tracks have no embeddings', () => {
    const queue = [mk(99, { vec: new Float32Array([1, 0]) })];
    expect(nextTrack([mk(1), mk(2)], queue, new Set(), undefined, o(seeded(5)))).not.toBeNull();
  });
});

describe('helpers', () => {
  it('sample returns k unique items and does not mutate the input', () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const copy = src.slice();
    const out = sample(src, 4, seeded(2));
    expect(out).toHaveLength(4);
    expect(new Set(out).size).toBe(4);
    expect(src).toEqual(copy);
  });
  it('blendTarget returns a unit vector and passes through single inputs', () => {
    const t = blendTarget(new Float32Array([1, 0]), new Float32Array([0, 1]))!;
    expect(Math.hypot(t[0], t[1])).toBeCloseTo(1, 5);
    const a = new Float32Array([1, 0]);
    expect(blendTarget(a, undefined)).toBe(a);
    expect(blendTarget(undefined, undefined)).toBeUndefined();
  });
});
