import { describe, it, expect } from 'vitest';
import { smartOrder } from './smartOrder';
import { StatsStore, KV } from './statsStore';

function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const mkT = (id: string, artist: string, extra: Record<string, any> = {}) =>
  ({ id, title: `Title ${id}`, artist, album: `Album ${id}`, duration: 200, ...extra });
const lib30 = () => Array.from({ length: 30 }, (_, i) => mkT(`t${i}`, `Artist ${i % 10}`));
const memKV: KV = { getItem: async () => null, setItem: async () => {} };

describe('smartOrder', () => {
  it('returns every track exactly once', () => {
    const lib = lib30();
    const out = smartOrder(lib, { rng: seeded(1) });
    expect(out).toHaveLength(30);
    expect(out.map(t => t.id).sort()).toEqual(lib.map(t => t.id).sort());
  });

  it('does not mutate the input array', () => {
    const lib = lib30(); const copy = lib.slice();
    smartOrder(lib, { rng: seeded(2) });
    expect(lib).toEqual(copy);
  });

  it('handles empty and single-track input', () => {
    expect(smartOrder([])).toEqual([]);
    const one = [mkT('a', 'X')];
    expect(smartOrder(one)).toEqual(one);
  });

  it('keeps the requested first track first', () => {
    const lib = lib30();
    for (let s = 1; s <= 20; s++)
      expect(smartOrder(lib, { first: lib[7], rng: seeded(s) })[0].id).toBe('t7');
  });

  it('drops duplicate ids', () => {
    const a = mkT('a', 'X');
    expect(smartOrder([a, a, mkT('b', 'Y')])).toHaveLength(2);
  });

  it('works for two tracks by the same artist', () => {
    expect(smartOrder([mkT('a', 'X'), mkT('b', 'X')], { rng: seeded(3) })).toHaveLength(2);
  });

  it('copes with missing album', () => {
    const t = [mkT('a', 'X', { album: undefined }), mkT('b', 'Y', { album: undefined })];
    expect(smartOrder(t, { rng: seeded(4) })).toHaveLength(2);
  });

  it('keeps the same artist apart far better than a random shuffle', () => {
    const adjacent = (a: { artist: string }[]) =>
      a.slice(1).filter((t, i) => t.artist === a[i].artist).length;
    let total = 0;
    for (let s = 1; s <= 30; s++) total += adjacent(smartOrder(lib30(), { rng: seeded(s) }));
    expect(total / 30).toBeLessThan(1);   // random shuffle averages 2 for this library
  });

  it('treats "A, B" and "A" as the same artist', () => {
    const lib = [
      mkT('a', 'Arijit Singh, Pritam'), mkT('b', 'Arijit Singh'),
      ...Array.from({ length: 12 }, (_, i) => mkT(`o${i}`, `Other ${i}`)),
    ];
    for (let s = 1; s <= 20; s++) {
      const ids = smartOrder(lib, { rng: seeded(s) }).map(t => t.id);
      expect(Math.abs(ids.indexOf('a') - ids.indexOf('b'))).toBeGreaterThan(1);
    }
  });

  it('keeps two versions of one song apart', () => {
    const lib = [
      mkT('v1', 'Artist X', { title: 'Song X' }),
      mkT('v2', 'Artist X', { title: 'Song X (Live)' }),
      ...Array.from({ length: 28 }, (_, i) => mkT(`o${i}`, `Other ${i}`)),
    ];
    for (let s = 1; s <= 20; s++) {
      const ids = smartOrder(lib, { rng: seeded(s) }).map(t => t.id);
      expect(Math.abs(ids.indexOf('v1') - ids.indexOf('v2'))).toBeGreaterThan(1);
    }
  });

  it('puts well-liked tracks earlier on average than skipped ones', () => {
    const lib = lib30();
    let n = 1000;
    const stats = new StatsStore(memKV, { flushDelayMs: 0, now: () => ++n });
    lib.forEach((t, i) => {
      if (i < 15) for (let k = 0; k < 5; k++) stats.recordPlay(t, 195);   // good
      else for (let k = 0; k < 2; k++) stats.recordPlay(t, 5);            // skipped
    });
    let good = 0, bad = 0;
    for (let s = 1; s <= 30; s++) {
      smartOrder(lib, { stats, rng: seeded(s) }).forEach((t, pos) => {
        if (Number(t.id.slice(1)) < 15) good += pos; else bad += pos;
      });
    }
    expect(good).toBeLessThan(bad);
  });
});
