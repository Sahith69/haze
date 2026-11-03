import { describe, it, expect } from 'vitest';
import { SmartShuffleService } from './service';
import type { KV } from './statsStore';

class MemKV implements KV {
  data = new Map<string, string>();
  async getItem(k: string) { return this.data.get(k) ?? null; }
  async setItem(k: string, v: string) { this.data.set(k, v); }
}
const T = (id: string, over: Record<string, any> = {}) =>
  ({ id, title: `Song ${id}`, artist: `Artist ${id}`, album: `Album ${id}`, duration: 200, ...over });
const make = () => {
  let n = 1000;
  return new SmartShuffleService(new MemKV(), { stats: { flushDelayMs: 0, now: () => ++n } });
};
const play = (s: SmartShuffleService, from: number, to: number) => {
  for (let x = from; x <= to; x += 1) s.onStatus(x, true);
};

describe('SmartShuffleService', () => {
  it('records a fully listened track as complete', () => {
    const s = make(); s.startTrack(T('a')); play(s, 0, 195);
    expect(s.endTrack({ finished: false })).toBe('complete');
    expect(s.stats.get('a')).toMatchObject({ plays: 1, completions: 1 });
  });

  it('records an early skip when the next track starts', () => {
    const s = make(); s.startTrack(T('a')); play(s, 0, 10);
    s.startTrack(T('b'));
    expect(s.stats.get('a')).toMatchObject({ plays: 1, earlySkips: 1 });
  });

  it('records a late skip', () => {
    const s = make(); s.startTrack(T('a')); play(s, 0, 100);
    expect(s.endTrack({ finished: false })).toBe('skip_late');
  });

  it('ignores plays shorter than the minimum listen time', () => {
    const s = make(); s.startTrack(T('a')); play(s, 0, 1);
    expect(s.endTrack({ finished: false })).toBeNull();
    expect(s.stats.size()).toBe(0);
  });

  it('a scrub to near the end then a skip is NOT a completion', () => {
    const s = make(); s.startTrack(T('a')); play(s, 0, 4); play(s, 195, 199);
    expect(s.endTrack({ finished: false })).toBe('skip_early');
  });

  it('a finish after a crossfade (10s early) counts as complete', () => {
    const s = make(); s.startTrack(T('a')); play(s, 0, 190);
    expect(s.endTrack({ finished: true })).toBe('complete');
  });

  it('a finish after scrubbing to the very end is not a completion', () => {
    const s = make(); s.startTrack(T('a')); play(s, 0, 5); play(s, 198, 200);
    expect(s.endTrack({ finished: true })).not.toBe('complete');
  });

  it('a resumed track that finishes counts as complete', () => {
    const s = make(); s.startTrack(T('a'), 150); play(s, 150, 200);
    expect(s.endTrack({ finished: true })).toBe('complete');
  });

  it('records nothing for a track without a duration', () => {
    const s = make(); s.startTrack(T('a', { duration: undefined })); play(s, 0, 50);
    expect(s.endTrack({ finished: false })).toBeNull();
  });

  it('endTrack without startTrack is a safe no-op', () => {
    expect(make().endTrack({ finished: true })).toBeNull();
  });

  it('never throws on garbage input', () => {
    const s = make();
    expect(() => { s.onStatus(NaN, true); s.startTrack(null as any); s.syncLikes(null as any); })
      .not.toThrow();
  });

  it('syncLikes marks tracks as liked and boosts their score', () => {
    const s = make(); s.syncLikes([T('a'), T('b')]);
    expect(s.stats.get('a')!.liked).toBe(true);
    expect(s.stats.score('a')).toBeGreaterThan(0.5);
    s.setLiked(T('a'), false);
    expect(s.stats.score('a')).toBeCloseTo(0.5, 10);
  });

  it('order() returns every track once', () => {
    const s = make();
    const lib = Array.from({ length: 20 }, (_, i) => T(`t${i}`, { artist: `A${i % 5}` }));
    const out = s.order(lib, lib[3]);
    expect(out).toHaveLength(20);
    expect(out[0].id).toBe('t3');
    expect(new Set(out.map(t => t.id)).size).toBe(20);
  });

  it('order() falls back to the original list on error', () => {
    const s = make();
    const bad: any = [{ id: 'a' }, null];
    expect(s.order(bad)).toHaveLength(2);
  });
});
