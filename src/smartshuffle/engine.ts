import type { DbLike } from './db';
import { nextTrack, dot, Track, PickOptions } from './picker';
import { recordPlay, loadLibrary, getRecentWorkKeys } from './store';
import type { Outcome } from './scoring';

export type EngineOptions = {
  queueSize: number;        // upcoming tracks to keep ready
  historyLimit: number;     // played tracks kept as spacing context
  recentLimit: number;      // distinct songs remembered for no-repeat
  centroidWindow: number;   // last N played tracks that form the taste centroid
  evictCount: number;       // upcoming slots checked after an early skip
  evictThreshold: number;   // cosine above which a neighbor is evicted
  rng: () => number;
  now: () => number;
  pick: Partial<PickOptions>;
};

const DEFAULTS: EngineOptions = {
  queueSize: 10, historyLimit: 30, recentLimit: 200,
  centroidWindow: 10, evictCount: 3, evictThreshold: 0.85,
  rng: Math.random, now: () => Date.now(), pick: {},
};

export function computeCentroid(tracks: Track[], window: number): Float32Array | undefined {
  const vs = tracks.slice(-window).map(t => t.vec).filter((v): v is Float32Array => !!v);
  if (!vs.length) return undefined;
  const dim = vs[0].length;
  const c = new Float32Array(dim);
  for (const v of vs) {
    if (v.length !== dim) continue;
    for (let i = 0; i < dim; i++) c[i] += v[i];
  }
  let n = 0;
  for (let i = 0; i < dim; i++) n += c[i] * c[i];
  n = Math.sqrt(n);
  if (!n) return undefined;
  for (let i = 0; i < dim; i++) c[i] /= n;
  return c;
}

// Removes near-neighbors of a skipped track from the first k upcoming slots.
export function evictSimilar(
  upcoming: Track[], skipped: Track, k: number, threshold: number,
): Track[] {
  const sv = skipped.vec;
  if (!sv) return upcoming;
  const head = upcoming.slice(0, k).filter(
    u => !(u.vec && u.vec.length === sv.length && dot(u.vec, sv) > threshold));
  return [...head, ...upcoming.slice(k)];
}

export class ShuffleEngine {
  private o: EngineOptions;
  private library: Track[] = [];
  private byId = new Map<number, Track>();
  private history: Track[] = [];
  private upcomingList: Track[] = [];
  private recent: string[] = [];            // work keys, most recent first
  private recentSet = new Set<string>();

  constructor(private db: DbLike, options: Partial<EngineOptions> = {}) {
    this.o = { ...DEFAULTS, ...options };
  }

  async init(): Promise<void> {
    await this.loadLib();
    this.recent = [...(await getRecentWorkKeys(this.db, this.o.recentLimit))];
    this.recentSet = new Set(this.recent);
    this.ensureQueue();
  }

  async refreshLibrary(): Promise<void> {
    await this.loadLib();
    this.upcomingList = this.upcomingList
      .map(t => this.byId.get(t.id))
      .filter((t): t is Track => !!t);
    this.ensureQueue();
  }

  current(): Track | null { return this.history[this.history.length - 1] ?? null; }
  upcoming(): Track[] { return this.upcomingList.slice(); }

  next(): Track | null {
    this.ensureQueue();
    const t = this.upcomingList.shift() ?? null;
    if (t) {
      this.history.push(t);
      const cap = this.o.historyLimit * 2;
      if (this.history.length > cap) this.history.splice(0, this.history.length - cap);
    }
    this.ensureQueue();
    return t;
  }

  async reportPlayed(
    p: { trackId: number; secondsPlayed: number; source?: string },
  ): Promise<Outcome | null> {
    let idx = -1;
    for (let i = this.history.length - 1; i >= 0; i--)
      if (this.history[i].id === p.trackId) { idx = i; break; }
    const prevTrackId = idx > 0 ? this.history[idx - 1].id : undefined;

    const outcome = await recordPlay(this.db, {
      trackId: p.trackId, secondsPlayed: p.secondsPlayed,
      prevTrackId, source: p.source ?? 'shuffle', now: this.o.now(),
    });
    if (!outcome) return null;

    const t = this.byId.get(p.trackId);
    const row = await this.db.getFirstAsync<any>(
      'SELECT score, plays, last_played_at FROM tracks WHERE id = ?', p.trackId);
    if (t && row) { t.score = row.score; t.plays = row.plays; t.lastPlayedAt = row.last_played_at; }
    if (t) this.pushRecent(t.workKey);

    if (outcome === 'skip_early' && t)
      this.upcomingList = evictSimilar(this.upcomingList, t, this.o.evictCount, this.o.evictThreshold);

    this.ensureQueue();
    return outcome;
  }

  // ---- internals ----

  private async loadLib() {
    this.library = await loadLibrary(this.db);
    this.byId = new Map(this.library.map(t => [t.id, t]));
  }

  private pushRecent(key: string) {
    const i = this.recent.indexOf(key);
    if (i >= 0) this.recent.splice(i, 1);
    this.recent.unshift(key);
    if (this.recent.length > this.o.recentLimit) this.recent.length = this.o.recentLimit;
    this.recentSet = new Set(this.recent);
  }

  private ensureQueue() {
    if (!this.library.length) return;
    const centroid = computeCentroid(this.history, this.o.centroidWindow);
    while (this.upcomingList.length < this.o.queueSize) {
      const context = [...this.history.slice(-this.o.historyLimit), ...this.upcomingList];
      const t = nextTrack(this.library, context, this.recentSet, centroid,
        { ...this.o.pick, rng: this.o.rng, now: this.o.now() });
      if (!t) break;
      this.upcomingList.push(t);
    }
  }
}
