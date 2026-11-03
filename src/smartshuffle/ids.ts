import { makeKey } from './workKey';

// Streaming catalogs list "Main Artist, Guest, Guest". Use the first name so
// spacing and dedupe treat "A, B" and "A" as one artist.
export function primaryArtist(artist: string): string {
  const a = (artist ?? '').trim();
  return a.split(',')[0].trim() || a;
}

export function trackKeys(t: { title: string; artist: string }) {
  const k = makeKey(t.title ?? '', primaryArtist(t.artist ?? ''));
  return { workKey: k.key, artistKey: k.artistKey };
}
