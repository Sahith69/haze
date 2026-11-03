import { recencyFactor } from './scoring';

export type Track = {
  id: number;
  artist: string;          // pass artist_key here so "The Beatles"/"Beatles" match
  album: string;
  workKey: string;
  score: number;           // smoothed affinity, > 0
  plays: number;
  lastPlayedAt: number | null;
  vec?: Float32Array;      // L2-normalized; undefined until embedded
};

export type Rules = { artistGap: boolean; albumGap: boolean; flow: boolean };

// Strictest first. Rules are HARD exclusions (weight 0), so a rung only
// relaxes when it leaves no candidate. Work-key dedupe is handled separately.
export const LADDER: Rules[] = [
  { artistGap: true,  albumGap: true,  flow: true  },
  { artistGap: true,  albumGap: true,  flow: false },
  { artistGap: true,  albumGap: false, flow: false },
  { artistGap: false, albumGap: false, flow: false },
];

export type PickOptions = {
  explore: number; simCenter: number; simWidth: number;
  sampleSize: number; artistWindow: number; dedupeWindow: number;
  rng: () => number; now: number;
};

const DEFAULTS = {
  explore: 0.15, simCenter: 0.6, simWidth: 0.1,
  sampleSize: 300, artistWindow: 4, dedupeWindow: 15,
};

export function dot(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function blendTarget(last?: Float32Array, centroid?: Float32Array) {
  if (!last || !centroid) return last ?? centroid;
  const t = new Float32Array(last.length);
  let n = 0;
  for (let i = 0; i < t.length; i++) { t[i] = 0.5 * last[i] + 0.5 * centroid[i]; n += t[i] * t[i]; }
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < t.length; i++) { t[i] /= n; }
  return t;
}

// Partial Fisher-Yates: uniform sample of k items, input not mutated.
export function sample<T>(arr: T[], k: number, rng: () => number): T[] {
  const a = arr.slice();
  const n = Math.min(k, a.length);
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rng() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export function weigh(
  t: Track, queue: Track[], target: Float32Array | undefined, rules: Rules, o: PickOptions,
): number {
  const last = queue[queue.length - 1];
  if (rules.artistGap && queue.slice(-o.artistWindow).some(q => q.artist === t.artist)) return 0;
  if (rules.albumGap && last && t.album && last.album === t.album) return 0;

  let w = t.score * Math.max(recencyFactor(t.lastPlayedAt, o.now), 0.02);
  if (rules.flow && target && t.vec) {
    const d = dot(t.vec, target) - o.simCenter;
    w *= Math.max(Math.exp(-(d * d) / o.simWidth), 1e-3);
  }
  return w;
}

export function nextTrack(
  library: Track[], queue: Track[], recentKeys: Set<string>,
  centroid?: Float32Array, options: Partial<PickOptions> = {},
): Track | null {
  const o: PickOptions = { ...DEFAULTS, rng: Math.random, now: Date.now(), ...options };
  const lastId = queue[queue.length - 1]?.id;
  const queuedKeys = new Set(queue.slice(-o.dedupeWindow).map(q => q.workKey));

  let pool = library.filter(t => !recentKeys.has(t.workKey) && !queuedKeys.has(t.workKey));
  if (!pool.length) pool = library.filter(t => !queuedKeys.has(t.workKey));
  if (!pool.length) pool = library.filter(t => t.id !== lastId);   // tiny library
  if (!pool.length) pool = library.slice();
  if (!pool.length) return null;

  if (o.rng() < o.explore && pool.length > 1)
    pool = [...pool].sort((a, b) => a.plays - b.plays).slice(0, 50);
  if (pool.length > o.sampleSize) pool = sample(pool, o.sampleSize, o.rng);

  const target = blendTarget(queue[queue.length - 1]?.vec, centroid);

  for (const rules of LADDER) {
    const weights = pool.map(t => weigh(t, queue, target, rules, o));
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 1e-9) continue;
    let x = o.rng() * total;
    for (let i = 0; i < pool.length; i++) { x -= weights[i]; if (x <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }
  return pool[Math.floor(o.rng() * pool.length)];
}
