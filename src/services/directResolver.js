import CryptoJS from 'crypto-js';

const JIO_KEY = CryptoJS.enc.Utf8.parse('38346591');

/**
 * Direct JioSaavn 320kbps Akamai CDN stream resolver
 * Bypasses backend failures, cloud blocks, and 500 errors
 */
/**
 * Score how well a JioSaavn result matches the requested title + artist.
 * Higher = better match. Penalises covers, remixes, karaoke, etc.
 */
function scoreJioSaavnResult(result, rawTitle = '', rawArtist = '') {
  const PENALTY_TERMS = ['cover', 'karaoke', 'instrumental', 'tribute', 'originally performed', 'remix', 'ringtone', 'piano', 'slowed', 'sped up', 'nightcore', 'acoustic', 'live', 'lullaby'];
  const rRawTitle = (result.title || '').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
  const rTitle = rRawTitle.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const rArtist = [
    result.subtitle || '',
    result.more_info?.primary_artists || '',
    result.more_info?.singers || '',
    result.more_info?.music || '',
  ].join(' ').toLowerCase();
  const wTitle = rawTitle.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const wArtist = rawArtist.toLowerCase();

  let score = 0;

  // Title match
  if (rTitle === wTitle) score += 80;
  else if (rTitle.includes(wTitle) || wTitle.includes(rTitle)) score += 30;

  // Artist match — at least one name token must appear
  const wArtistTokens = wArtist.split(/[\s,&]+/).filter(t => t.length > 2);
  if (wArtistTokens.length > 0 && wArtistTokens.some(tok => rArtist.includes(tok))) {
    score += 50;
  }

  // Penalty for remix / cover / karaoke unless user specifically wanted it
  const wantedPenalty = PENALTY_TERMS.some(pt => wTitle.includes(pt) || wArtist.includes(pt));
  const resultHasPenalty = PENALTY_TERMS.some(pt => rRawTitle.toLowerCase().includes(pt));
  if (resultHasPenalty && !wantedPenalty) score -= 150;

  // Strict language match for multi-language regional songs
  const wLang = rawTitle.match(/\[(Tamil|Telugu|Hindi|Malayalam|Kannada|Punjabi|Bhojpuri|Bengali|Marathi|Gujarati|English)\]|\((Tamil|Telugu|Hindi|Malayalam|Kannada|Punjabi|Bhojpuri|Bengali|Marathi|Gujarati|English)\)/i);
  if (wLang) {
    const targetLang = (wLang[1] || wLang[2]).toLowerCase();
    const rRaw = (rRawTitle + ' ' + (result.subtitle || '') + ' ' + (result.more_info?.language || '')).toLowerCase();
    if (rRaw.includes(targetLang)) {
      score += 100;
    } else {
      score -= 100; // Penalty for wrong language version
    }
  }

  return score;
}

export async function resolveDirectSaavnAudio(title, artist, requestedQuality = '320k') {
  try {
    const rawTitle = title || '';
    const rawArtist = artist || '';

    const cleanTitle = rawTitle.replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const cleanArtist = rawArtist.split(',')[0].split('&')[0].trim();

    // Query with Clean Title + Clean Artist (Do NOT put language tags in query, JioSaavn index breaks)
    let q = encodeURIComponent(`${cleanTitle} ${cleanArtist}`.trim());
    let url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=8&p=1&q=${q}`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    };

    let res = await fetch(url, { headers });
    let data = res.ok ? await res.json() : null;
    let results = (data?.results || []).filter(r => r?.more_info?.encrypted_media_url);

    // Fallback: If 0 results with artist, query with cleanTitle alone
    if (results.length === 0 && cleanTitle) {
      q = encodeURIComponent(cleanTitle);
      url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=8&p=1&q=${q}`;
      res = await fetch(url, { headers });
      data = res.ok ? await res.json() : null;
      results = (data?.results || []).filter(r => r?.more_info?.encrypted_media_url);
    }

    if (results.length === 0) return null;

    // Pick best-scoring result passing rawTitle so language matching functions accurately
    const scored = results.map(r => ({ r, s: scoreJioSaavnResult(r, rawTitle, rawArtist) }));
    scored.sort((a, b) => b.s - a.s);

    const match = scored[0]?.r || results[0];
    if (!match?.more_info?.encrypted_media_url) return null;

    const enc = match.more_info.encrypted_media_url;
    const decrypted = CryptoJS.DES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(enc) }, JIO_KEY, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);

    if (!decrypted || !decrypted.startsWith('http')) return null;

    const suffix = requestedQuality === '128k' ? '_96.mp4' : requestedQuality === '256k' ? '_160.mp4' : '_320.mp4';
    const bitrate = requestedQuality === '128k' ? '128 kbps' : requestedQuality === '256k' ? '256 kbps' : '320 kbps';
    const qualityLabel = requestedQuality === '128k' ? '128 kbps · Data Saver' : requestedQuality === '256k' ? '256 kbps · HD' : '320 kbps · Studio Master';

    const streamUrl = decrypted.replace(/_[0-9]+\.mp4$/, suffix);
    return {
      streamUrl,
      quality: qualityLabel,
      bitrate,
      isStudioMaster: requestedQuality === '320k',
    };
  } catch (err) {
    console.warn('[DirectResolver] JioSaavn error:', err.message);
    return null;
  }
}

/**
 * Parse standard LRC format into sorted array of timestamped lines
 * Supports multiple timestamps per line, single-digit minutes, and musical pause markers
 */
export function parseLrc(lrcText) {
  if (!lrcText || typeof lrcText !== 'string') return [];
  const lines = lrcText.split('\n');
  const result = [];
  const timestampRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const matches = [...line.matchAll(timestampRegex)];
    if (matches.length > 0) {
      const text = line.replace(timestampRegex, '').trim();
      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const millisStr = match[3] || '0';
        const millis = parseInt(millisStr.padEnd(3, '0').slice(0, 3), 10);
        const totalSeconds = minutes * 60 + seconds + millis / 1000;
        result.push({ time: totalSeconds, text: text || '♪' });
      }
    }
  }

  result.sort((a, b) => a.time - b.time);
  return result;
}

/**
 * Fetch millisecond-synchronized lyrics directly from LRCLIB
 */
export async function fetchDirectLyrics(title, artist, duration) {
  try {
    const cleanTitle = (title || '').replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const cleanArtist = (artist || '').split(',')[0].split('&')[0].trim();

    // 1. Exact match
    let res = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist || artist)}&track_name=${encodeURIComponent(cleanTitle || title)}&duration=${duration || ''}`,
      { headers: { 'User-Agent': 'HazePlayer/1.0' } }
    );
    let data = res.ok ? await res.json() : null;

    // 2. Fuzzy search
    if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
      res = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTitle}`.trim() || title)}`,
        { headers: { 'User-Agent': 'HazePlayer/1.0' } }
      );
      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          data = results[0];
        }
      }
    }

    if (data && (data.syncedLyrics || data.plainLyrics)) {
      const synced = parseLrc(data.syncedLyrics);
      return {
        synced,
        plain: data.plainLyrics || '',
        hasSync: synced.length > 0,
      };
    }
  } catch (e) {
    console.warn('[DirectResolver] Lyrics error:', e.message);
  }
  return { synced: [], plain: '' };
}
