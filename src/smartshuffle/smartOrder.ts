import { nextTrack, Track } from './picker';
import { trackKeys } from './ids';
import type { StatsStore } from './statsStore';

export type OrderTrack = { id: string; title: string; artist: string; album?: string; duration?: number };

export function toPickerTrack(t: OrderTrack, stats?: StatsStore): Track {
  const k = trackKeys(t);
  const s = stats?.get(t.id);
  return {
    id: t.id,
    artist: k.artistKey,
    album: (t.album ?? '').trim().toLowerCase(),
    workKey: k.workKey,
    score: stats ? stats.score(t.id) : 0.5,
    plays: s?.plays ?? 0,
    lastPlayedAt: s?.lastPlayedAt ?? null,
  };
}

// Orders a fixed list: higher-scored and less-recently-played tracks tend to come
// earlier, same artist/album and duplicate versions are kept apart. Returns the
// same track objects. Duplicate ids are dropped. `first` (if given) stays first.
export function smartOrder<T extends OrderTrack>(
  tracks: T[],
  opts: { stats?: StatsStore; first?: T; rng?: () => number; now?: number } = {},
): T[] {
  const rng = opts.rng ?? Math.random;
  const now = opts.now ?? Date.now();

  const byId = new Map<string, T>();
  const all: Track[] = [];
  for (const t of tracks) {
    if (byId.has(t.id)) continue;
    byId.set(t.id, t);
    all.push(toPickerTrack(t, opts.stats));
  }

  const queue: Track[] = [];
  let remaining = all;
  if (opts.first && byId.has(opts.first.id)) {
    const f = all.find(p => p.id === opts.first!.id)!;
    queue.push(f);
    remaining = all.filter(p => p !== f);
  }

  const none = new Set<string>();   // recency is handled by the score weighting
  while (remaining.length) {
    const t = nextTrack(remaining, queue, none, undefined, { explore: 0, rng, now });
    if (!t) break;
    queue.push(t);
    remaining = remaining.filter(r => r !== t);
  }
  for (const r of remaining) queue.push(r);   // safety net: never lose a track

  return queue.map(q => byId.get(q.id as string)!);
}
