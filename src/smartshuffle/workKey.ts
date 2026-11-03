// Words that mark a different *version* of the same song. Bare "version" is
// deliberately absent: "(Taylor's Version)" is a different recording.
// "remix" is also absent; add it if you want remixes merged with originals.
const NOISE_WORDS = [
  'remaster(?:ed)?', 'live', 'acoustic', 'radio edit', 'single version',
  'album version', 'mono', 'stereo', 'deluxe(?: edition)?', 'bonus track',
  'explicit', 'clean(?: version)?', 'kar[ao]+ke', 'instrumental',
  'lyric(?: video)?', 'official (?:audio|video)',
  'slowed(?: \\+ reverb)?', 'reverb', 'lo-?fi', 'extended(?: version)?',
  'soundtrack', 'original soundtrack', 'ost',
  'original motion picture soundtrack',
  'telugu', 'tamil', 'hindi', 'kannada', 'malayalam', 'punjabi', 'bengali', 'marathi',
  'from\\s+["\'].*?["\']', 'from\\s+[^)\\]]+',
];
const NOISE_RE = new RegExp(`\\b(?:${NOISE_WORDS.join('|')})\\b`, 'i');
const FEAT_START_RE = /^\s*(?:feat|ft|featuring)\b\.?/i;
const FEAT_TAIL_RE = /\s+(?:feat|ft|featuring)\b\.?\s+.*$/i;
const YEAR_ONLY_RE = /^\s*(?:19|20)\d{2}\s*$/;
const COMBINING_RE = /[\u0300-\u036f]/g;
// ASCII + common Unicode punctuation. Letters of ANY script are kept, so
// Japanese/Korean/Cyrillic titles don't collapse into empty keys.
const PUNCT_RE = /[!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~\u2000-\u206f\u2e00-\u2e7f\u3000-\u303f]/g;
const ARTIST_TAIL_RE = /\s+(?:feat|ft|featuring)\b\.?\s+.*$|\s*;\s*.*$|\s+\/\s+.*$/i;

function fold(s: string): string {
  let t = s.toLowerCase();
  try { t = t.normalize('NFKD'); } catch { /* engine without normalize: keep as is */ }
  return t
    .replace(COMBINING_RE, '')
    .replace(/&/g, ' and ')
    .replace(PUNCT_RE, '')
    .replace(/\s+/g, '');
}

function stripVersionNoise(title: string): string {
  let t = title;

  // 1. bracketed groups: (Remastered 2011) [Live at X] (feat. Y) (2011)
  t = t.replace(/[(\[{]([^)\]}]*)[)\]}]/g, (m, inner: string) =>
    (NOISE_RE.test(inner) && !/\bremix\b/i.test(inner)) ||
    FEAT_START_RE.test(inner) || YEAR_ONLY_RE.test(inner) ? ' ' : m);

  // 2. dash suffixes: "Song - 2011 Remaster", "Song - Live at X"
  for (;;) {
    const i = Math.max(t.lastIndexOf(' - '), t.lastIndexOf(' – '), t.lastIndexOf(' — '));
    if (i < 0 || !NOISE_RE.test(t.slice(i + 3))) break;
    t = t.slice(0, i);
  }

  // 3. trailing "feat. X"
  return t.replace(FEAT_TAIL_RE, '');
}

export function titleKey(title: string): string {
  return fold(stripVersionNoise(title)) || fold(title) || title.trim().toLowerCase().replace(/_/g, '-');
}

export function artistKey(artist: string): string {
  // Conservative on purpose: don't split on "&" or ",", or "Simon & Garfunkel"
  // and "Tyler, The Creator" get mangled. A missed merge is better than a wrong one.
  let primary = artist.replace(ARTIST_TAIL_RE, '').trim();
  const noThe = primary.replace(/^the\s+/i, '');
  if (noThe) primary = noThe;
  return fold(primary) || primary.toLowerCase().replace(/_/g, '-') || 'unknown';
}

export function makeKey(title: string, artist: string) {
  const t = titleKey(title), a = artistKey(artist);
  return { titleKey: t, artistKey: a, key: `${t}_${a}` };   // neither part contains "_"
}

// ---- fuzzy matching (typos only; deliberately strict) ----
export function titleSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const m = a.length, n = b.length;
  if (!m || !n) return 0;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

const digits = (s: string) => s.replace(/\D/g, '');

export function fuzzySameTitle(a: string, b: string): boolean {
  if (a.length < 8 || b.length < 8) return false;        // short titles: exact match only
  if (digits(a) !== digits(b)) return false;             // "Part 1" vs "Part 2"
  return titleSimilarity(a, b) >= 0.92;                  // ~1 typo per 13+ chars
}
