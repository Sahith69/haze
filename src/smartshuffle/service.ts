import { StatsStore, KV, StatsTrack } from './statsStore';
import { ListenTracker } from './listenTracker';
import { smartOrder, OrderTrack } from './smartOrder';
import type { Outcome } from './scoring';

export type ServiceOptions = {
  minListenSeconds: number;       // skips shorter than this are ignored (load failures, mis-taps)
  finishCompleteFraction: number; // a finish counts as complete if this much was really heard
  stats: Record<string, any>;     // passed to StatsStore (tests use it)
};

const DEFAULTS: ServiceOptions = { minListenSeconds: 1.5, finishCompleteFraction: 0.5, stats: {} };

export class SmartShuffleService {
  readonly stats: StatsStore;
  private tracker = new ListenTracker();
  private current: OrderTrack | null = null;
  private startAt = 0;
  private o: ServiceOptions;

  constructor(kv: KV, options: Partial<ServiceOptions> = {}) {
    this.o = { ...DEFAULTS, ...options };
    this.stats = new StatsStore(kv, this.o.stats);
  }

  async init(): Promise<void> {
    try { await this.stats.load(); } catch { /* start empty */ }
  }

  // Call when a track starts. Any track still open is closed as a skip first.
  startTrack(track: OrderTrack, startAtSeconds = 0): void {
    try {
      this.endTrack({ finished: false });
      this.current = track;
      this.startAt = Math.max(0, startAtSeconds || 0);
      this.tracker.start(track.id);
    } catch { /* never throw into the player */ }
  }

  onStatus(currentTime: number, playing: boolean): void {
    try { this.tracker.update(currentTime, playing); } catch { /* ignore */ }
  }

  // finished=true means the track ended by itself (or by the crossfade trigger).
  endTrack(opts: { finished: boolean }): Outcome | null {
    try {
      const cur = this.current;
      const r = this.tracker.stop();
      this.current = null;
      if (!cur || !r) return null;
      if (!opts.finished && r.seconds < this.o.minListenSeconds) return null;

      const dur = cur.duration ?? 0;
      let seconds = r.seconds;
      if (opts.finished && dur > 0 &&
          r.seconds + this.startAt >= dur * this.o.finishCompleteFraction) seconds = dur;
      return this.stats.recordPlay(cur, seconds);
    } catch { return null; }
  }

  setLiked(track: OrderTrack, liked: boolean): void {
    try { this.stats.setLiked(track, liked); } catch { /* ignore */ }
  }

  // Seed likes from the app's existing liked-songs list (only adds likes).
  syncLikes(tracks: OrderTrack[]): void {
    try {
      for (const t of tracks)
        if (t?.id && !this.stats.get(t.id)?.liked) this.stats.setLiked(t, true);
    } catch { /* ignore */ }
  }

  order<T extends OrderTrack>(tracks: T[], first?: T): T[] {
    try { return smartOrder(tracks, { stats: this.stats, first }); }
    catch { return tracks.slice(); }
  }

  flush(): Promise<void> { return this.stats.flush().catch(() => {}); }
}
