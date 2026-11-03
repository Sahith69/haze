import { classify, betaScore, Outcome } from './scoring';
import { trackKeys } from './ids';

// AsyncStorage satisfies this interface.
export interface KV {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export type PlayStats = {
  plays: number; completions: number; earlySkips: number; lateSkips: number;
  liked: boolean; lastPlayedAt: number | null; workKey: string;
};

export type StatsTrack = { id: string; title: string; artist: string; duration?: number }; // seconds

export const STATS_KEY = 'smartshuffle:stats:v1';

type Options = { maxTracks: number; recentLimit: number; flushDelayMs: number; now: () => number };
const DEFAULTS: Options = { maxTracks: 5000, recentLimit: 200, flushDelayMs: 2000, now: () => Date.now() };

export class StatsStore {
  private o: Options;
  private stats = new Map<string, PlayStats>();
  private recent: string[] = [];          // work keys, most recent first
  private dirty = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private kv: KV, options: Partial<Options> = {}) {
    this.o = { ...DEFAULTS, ...options };
  }

  async load(): Promise<void> {
    this.stats.clear(); this.recent = [];
    try {
      const raw = await this.kv.getItem(STATS_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d || d.v !== 1 || !Array.isArray(d.stats)) return;
      for (const e of d.stats) {
        if (!Array.isArray(e) || typeof e[0] !== 'string' || !e[1]) continue;
        const s = e[1];
        this.stats.set(e[0], {
          plays: +s.plays || 0, completions: +s.completions || 0,
          earlySkips: +s.earlySkips || 0, lateSkips: +s.lateSkips || 0,
          liked: !!s.liked,
          lastPlayedAt: typeof s.lastPlayedAt === 'number' ? s.lastPlayedAt : null,
          workKey: typeof s.workKey === 'string' ? s.workKey : '',
        });
      }
      if (Array.isArray(d.recent))
        this.recent = d.recent.filter((k: unknown) => typeof k === 'string').slice(0, this.o.recentLimit);
    } catch {
      this.stats.clear(); this.recent = [];       // corrupt data: start fresh
    }
  }

  get(id: string): PlayStats | undefined { return this.stats.get(id); }
  size(): number { return this.stats.size; }
  recentKeys(): Set<string> { return new Set(this.recent); }

  score(id: string): number {
    const s = this.stats.get(id);
    if (!s) return 0.5;
    return betaScore({
      completions: s.completions, early_skips: s.earlySkips,
      late_skips: s.lateSkips, liked: s.liked ? 1 : 0,
    });
  }

  // secondsPlayed must be time actually listened, not the seek position.
  recordPlay(t: StatsTrack, secondsPlayed: number): Outcome | null {
    if (!(t.duration && t.duration > 0) || !(secondsPlayed >= 0)) return null;
    const outcome = classify(secondsPlayed, t.duration * 1000);
    const s = this.entry(t);
    s.plays++;
    if (outcome === 'complete') s.completions++;
    else if (outcome === 'skip_early') s.earlySkips++;
    else s.lateSkips++;
    s.lastPlayedAt = this.o.now();
    this.pushRecent(s.workKey);
    this.prune();
    this.markDirty();
    return outcome;
  }

  setLiked(t: StatsTrack, liked: boolean): void {
    this.entry(t).liked = liked;
    this.prune();
    this.markDirty();
  }

  // Rejects on storage failure and stays dirty, so a later flush retries.
  async flush(): Promise<void> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (!this.dirty) return;
    this.dirty = false;
    try {
      await this.kv.setItem(STATS_KEY,
        JSON.stringify({ v: 1, stats: [...this.stats.entries()], recent: this.recent }));
    } catch (e) {
      this.dirty = true;
      throw e;
    }
  }

  private entry(t: StatsTrack): PlayStats {
    let s = this.stats.get(t.id);
    if (!s) {
      s = { plays: 0, completions: 0, earlySkips: 0, lateSkips: 0, liked: false,
            lastPlayedAt: null, workKey: trackKeys(t).workKey };
      this.stats.set(t.id, s);
    }
    return s;
  }

  private pushRecent(key: string) {
    const i = this.recent.indexOf(key);
    if (i >= 0) this.recent.splice(i, 1);
    this.recent.unshift(key);
    if (this.recent.length > this.o.recentLimit) this.recent.length = this.o.recentLimit;
  }

  // Drop the least valuable entries: unliked first, then oldest.
  private prune() {
    const extra = this.stats.size - this.o.maxTracks;
    if (extra <= 0) return;
    const order = [...this.stats.entries()].sort((a, b) =>
      (a[1].liked ? 1 : 0) - (b[1].liked ? 1 : 0) ||
      (a[1].lastPlayedAt ?? 0) - (b[1].lastPlayedAt ?? 0));
    for (let i = 0; i < extra; i++) this.stats.delete(order[i][0]);
  }

  private markDirty() {
    this.dirty = true;
    if (this.o.flushDelayMs > 0 && !this.timer) {
      this.timer = setTimeout(() => { this.timer = null; this.flush().catch(() => {}); },
        this.o.flushDelayMs);
    }
  }
}
