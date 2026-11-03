import { describe, it, expect } from 'vitest';
import { makeDb } from './testDb';
import { ShuffleEngine, computeCentroid, evictSimilar } from './engine';
import type { Track } from './picker';

function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedTracks(raw: any, n: number) {
  const ins = raw.prepare(
    `INSERT INTO tracks (uri,title,artist,album,duration_ms,work_key,artist_key,added_at)
     VALUES (?,?,?,?,200000,?,?,0)`);
  for (let i = 1; i <= n; i++)
    ins.run(`/m/${i}.mp3`, `T${i}`, `A${i}`, `Al${i}`, `t${i}_a${i}`, `a${i}`);
}

async function make(n: number, seed = 1) {
  const { raw, db } = makeDb();
  seedTracks(raw, n);
  const engine = new ShuffleEngine(db, {
    rng: seeded(seed), now: () => 1_700_000_000_000, pick: { explore: 0 },
  });
  await engine.init();
  return { raw, db, engine };
}

const mk = (id: number, vec?: number[]): Track => ({
  id, artist: `a${id}`, album: `al${id}`, workKey: `w${id}`, score: 0.5, plays: 0,
  lastPlayedAt: null, vec: vec ? new Float32Array(vec) : undefined,
});

describe('ShuffleEngine', () => {
  it('fills the queue with unique songs on init', async () => {
    const { engine } = await make(30);
    const up = engine.upcoming();
    expect(up).toHaveLength(10);
    expect(new Set(up.map(t => t.workKey)).size).toBe(10);
  });

  it('next() returns the first upcoming track, sets current, and refills', async () => {
    const { engine } = await make(30);
    const first = engine.upcoming()[0];
    const t = engine.next();
    expect(t!.id).toBe(first.id);
    expect(engine.current()!.id).toBe(first.id);
    expect(engine.upcoming()).toHaveLength(10);
    expect(engine.upcoming().some(u => u.id === first.id)).toBe(false);
  });

  it('records a completed play in memory and in the database', async () => {
    const { raw, engine } = await make(30);
    const t = engine.next()!;
    const out = await engine.reportPlayed({ trackId: t.id, secondsPlayed: 195 });
    expect(out).toBe('complete');
    expect(t.plays).toBe(1);
    expect(t.lastPlayedAt).toBe(1_700_000_000_000);
    expect(raw.prepare('SELECT plays FROM tracks WHERE id = ?').get(t.id).plays).toBe(1);
    expect(raw.prepare('SELECT COUNT(*) AS n FROM plays').get().n).toBe(1);
  });

  it('stores the previous track id for calibration', async () => {
    const { raw, engine } = await make(30);
    const a = engine.next()!;
    await engine.reportPlayed({ trackId: a.id, secondsPlayed: 195 });
    const b = engine.next()!;
    await engine.reportPlayed({ trackId: b.id, secondsPlayed: 195 });
    const rows = raw.prepare('SELECT track_id, prev_track_id FROM plays ORDER BY id').all();
    expect(rows[0].prev_track_id).toBeNull();
    expect(rows[1]).toEqual({ track_id: b.id, prev_track_id: a.id });
  });

  it('does not queue a just-played song again', async () => {
    const { engine } = await make(30);
    const t = engine.next()!;
    await engine.reportPlayed({ trackId: t.id, secondsPlayed: 195 });
    for (let i = 0; i < 20; i++) {
      const n = engine.next()!;
      expect(n.workKey).not.toBe(t.workKey);
    }
  });

  it('an early skip lowers the in-memory score', async () => {
    const { engine } = await make(30);
    const t = engine.next()!;
    expect(await engine.reportPlayed({ trackId: t.id, secondsPlayed: 5 })).toBe('skip_early');
    expect(t.score).toBeCloseTo(2 / 6.5, 10);
    expect(engine.upcoming()).toHaveLength(10);
  });

  it('returns null and does not throw for an unknown track id', async () => {
    const { engine } = await make(5);
    expect(await engine.reportPlayed({ trackId: 999, secondsPlayed: 50 })).toBeNull();
  });

  it('refreshLibrary drops tracks that went missing and refills', async () => {
    const { raw, engine } = await make(30);
    const gone = engine.upcoming()[0].id;
    raw.prepare('UPDATE tracks SET missing = 1 WHERE id = ?').run(gone);
    await engine.refreshLibrary();
    expect(engine.upcoming().some(t => t.id === gone)).toBe(false);
    expect(engine.upcoming()).toHaveLength(10);
  });

  it('handles an empty library', async () => {
    const { engine } = await make(0);
    expect(engine.next()).toBeNull();
    expect(engine.upcoming()).toEqual([]);
  });

  it('handles a tiny library without immediate repeats', async () => {
    const { engine } = await make(3);
    const up = engine.upcoming();
    expect(up).toHaveLength(10);
    for (let i = 1; i < up.length; i++) expect(up[i].id).not.toBe(up[i - 1].id);
  });
});

describe('evictSimilar', () => {
  it('removes close neighbors from the first k slots only', () => {
    const skipped = mk(0, [1, 0]);
    const up = [mk(1, [1, 0]), mk(2, [0, 1]), mk(3), mk(4, [1, 0]), mk(5, [1, 0])];
    const out = evictSimilar(up, skipped, 3, 0.85);
    expect(out.map(t => t.id)).toEqual([2, 3, 4, 5]);   // 1 evicted; 4 and 5 are outside k=3
  });
  it('does nothing when the skipped track has no embedding', () => {
    const up = [mk(1, [1, 0])];
    expect(evictSimilar(up, mk(0), 3, 0.85)).toBe(up);
  });
});

describe('computeCentroid', () => {
  it('returns a unit vector averaging the recent embeddings', () => {
    const c = computeCentroid([mk(1, [1, 0]), mk(2, [0, 1])], 10)!;
    expect(Math.hypot(c[0], c[1])).toBeCloseTo(1, 5);
    expect(c[0]).toBeCloseTo(c[1], 5);
  });
  it('only uses the last N tracks', () => {
    const c = computeCentroid([mk(1, [1, 0]), mk(2, [0, 1])], 1)!;
    expect(c[1]).toBeCloseTo(1, 5);
  });
  it('returns undefined without embeddings', () => {
    expect(computeCentroid([mk(1), mk(2)], 10)).toBeUndefined();
    expect(computeCentroid([], 10)).toBeUndefined();
  });
});
