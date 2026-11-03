import { describe, it, expect } from 'vitest';
import { StatsStore, KV, STATS_KEY } from './statsStore';

class MemKV implements KV {
  data = new Map<string, string>();
  fail = 0;
  async getItem(k: string) { return this.data.get(k) ?? null; }
  async setItem(k: string, v: string) {
    if (this.fail > 0) { this.fail--; throw new Error('disk'); }
    this.data.set(k, v);
  }
}
const T = (id: string, over: Record<string, any> = {}) =>
  ({ id, title: `Song ${id}`, artist: `Artist ${id}`, duration: 200, ...over });
function make(o: Record<string, any> = {}, kv = new MemKV()) {
  let n = 1000;
  return { kv, s: new StatsStore(kv, { flushDelayMs: 0, now: () => ++n, ...o }) };
}

describe('StatsStore', () => {
  it('records a completion and scores it up', () => {
    const { s } = make();
    expect(s.recordPlay(T('a'), 195)).toBe('complete');
    expect(s.get('a')).toMatchObject({ plays: 1, completions: 1 });
    expect(s.score('a')).toBeCloseTo(3 / 5, 10);
  });

  it('records an early skip and scores it down', () => {
    const { s } = make();
    expect(s.recordPlay(T('a'), 5)).toBe('skip_early');
    expect(s.get('a')!.earlySkips).toBe(1);
    expect(s.score('a')).toBeCloseTo(2 / 6.5, 10);
  });

  it('records a late skip', () => {
    const { s } = make();
    expect(s.recordPlay(T('a'), 100)).toBe('skip_late');
    expect(s.get('a')!.lateSkips).toBe(1);
  });

  it('ignores plays with an unknown duration or invalid seconds', () => {
    const { s } = make();
    expect(s.recordPlay(T('a', { duration: 0 }), 50)).toBeNull();
    expect(s.recordPlay(T('b', { duration: undefined }), 50)).toBeNull();
    expect(s.recordPlay(T('c'), -1)).toBeNull();
    expect(s.size()).toBe(0);
  });

  it('scores unknown tracks as neutral', () => {
    expect(make().s.score('nope')).toBe(0.5);
  });

  it('applies the like bonus', () => {
    const { s } = make();
    s.setLiked(T('a'), true);
    expect(s.score('a')).toBeCloseTo(4 / 6, 10);
    s.setLiked(T('a'), false);
    expect(s.score('a')).toBeCloseTo(0.5, 10);
  });

  it('persists across load()', async () => {
    const { kv, s } = make();
    s.recordPlay(T('a'), 195);
    await s.flush();
    const s2 = new StatsStore(kv, { flushDelayMs: 0 });
    await s2.load();
    expect(s2.get('a')).toMatchObject({ plays: 1, completions: 1 });
    expect(s2.recentKeys().has('songa_artista')).toBe(true);
  });

  it('starts empty on corrupt or unexpected stored data', async () => {
    const kv = new MemKV();
    kv.data.set(STATS_KEY, '{not json');
    const s = new StatsStore(kv, { flushDelayMs: 0 });
    await expect(s.load()).resolves.toBeUndefined();
    expect(s.size()).toBe(0);
    kv.data.set(STATS_KEY, '{"v":2}');
    await s.load();
    expect(s.size()).toBe(0);
  });

  it('keeps the most recently played tracks when over the cap', () => {
    const { s } = make({ maxTracks: 3 });
    for (const id of ['t1', 't2', 't3', 't4', 't5']) s.recordPlay(T(id), 195);
    expect(s.size()).toBe(3);
    expect(s.get('t1')).toBeUndefined();
    expect(s.get('t5')).toBeDefined();
  });

  it('prunes unliked tracks before liked ones', () => {
    const { s } = make({ maxTracks: 2 });
    s.recordPlay(T('old'), 195);
    s.setLiked(T('old'), true);
    s.recordPlay(T('t2'), 195);
    s.recordPlay(T('t3'), 195);
    expect(s.get('old')).toBeDefined();
    expect(s.size()).toBe(2);
  });

  it('tracks recent songs, most recent first, within the limit', () => {
    const { s } = make({ recentLimit: 2 });
    s.recordPlay(T('t1'), 195); s.recordPlay(T('t2'), 195); s.recordPlay(T('t3'), 195);
    expect([...s.recentKeys()]).toEqual(['songt3_artistt3', 'songt2_artistt2']);
  });

  it('retries after a failed flush', async () => {
    const { kv, s } = make();
    s.recordPlay(T('a'), 195);
    kv.fail = 1;
    await expect(s.flush()).rejects.toThrow();
    await s.flush();
    expect(kv.data.has(STATS_KEY)).toBe(true);
  });
});
