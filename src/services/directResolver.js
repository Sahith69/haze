import CryptoJS from 'crypto-js';

const JIO_KEY = CryptoJS.enc.Utf8.parse('38346591');

/**
 * Direct JioSaavn 320kbps Akamai CDN stream resolver
 * Bypasses backend failures, cloud blocks, and 500 errors
 */
export async function resolveDirectSaavnAudio(title, artist) {
  try {
    const cleanTitle = (title || '').replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const cleanArtist = (artist || '').split(',')[0].split('&')[0].trim();
    const q = encodeURIComponent(`${cleanArtist} ${cleanTitle}`.trim() || title);
    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=5&p=1&q=${q}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const match = (data.results || [])[0];
    if (!match?.more_info?.encrypted_media_url) return null;

    const enc = match.more_info.encrypted_media_url;
    const decrypted = CryptoJS.DES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(enc) }, JIO_KEY, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);

    if (!decrypted || !decrypted.startsWith('http')) return null;

    const stream320 = decrypted.replace(/_[0-9]+\.mp4$/, '_320.mp4');
    return {
      streamUrl: stream320,
      quality: '320 kbps · Studio Master',
      bitrate: '320 kbps',
      isStudioMaster: true,
    };
  } catch (err) {
    console.warn('[DirectResolver] JioSaavn error:', err.message);
    return null;
  }
}

/**
 * Parse standard LRC format into sorted array of timestamped lines
 */
export function parseLrc(lrcText) {
  if (!lrcText || typeof lrcText !== 'string') return [];
  const lines = lrcText.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\](.*)/;

  for (const line of lines) {
    const match = timeRegex.exec(line.trim());
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millis = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const totalSeconds = minutes * 60 + seconds + millis / 1000;
      const text = match[4].trim();
      if (text) {
        result.push({ time: totalSeconds, text });
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
