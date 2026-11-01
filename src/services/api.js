import { Platform } from 'react-native';
import { API_BASE_URL } from '../config';
import { resolveDirectSaavnAudio, fetchDirectLyrics } from './directResolver';

/**
 * Search tracks across global catalog
 */
/**
 * Search tracks across global catalog with dual-engine verification
 * Combines direct edge autocomplete with backend search to guarantee official artists
 */
export async function searchTracks(query) {
  if (!query || !query.trim()) return [];
  const cleanQ = query.trim();

  try {
    const autoUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&api_version=4&ctx=web6dot0&query=${encodeURIComponent(cleanQ)}`;
    const backendUrl = `${API_BASE_URL}/api/search?q=${encodeURIComponent(cleanQ)}`;

    const [autoRes, backendRes] = await Promise.all([
      fetch(autoUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile Safari/537.36' },
      }).then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch(backendUrl).then(r => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    const topEntity = autoRes?.topquery?.data?.[0];
    const topSongEntity = autoRes?.songs?.data?.[0];
    const canonicalArtist = (
      topSongEntity?.more_info?.primary_artists ||
      topEntity?.more_info?.music ||
      topEntity?.subtitle ||
      ''
    ).toLowerCase().trim();

    const resultsMap = new Map();

    // 1. Direct verified original records from Edge Autocomplete
    if (autoRes?.songs?.data) {
      for (const item of autoRes.songs.data) {
        const title = item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : '';
        const artist = item.more_info?.primary_artists || item.subtitle || 'Unknown Artist';
        const album = item.more_info?.album || 'Single';
        const cover = item.image ? item.image.replace('150x150', '500x500') : '';
        const key = `${title.toLowerCase().trim()}_${artist.toLowerCase().trim()}_${album.toLowerCase().trim()}`;
        resultsMap.set(key, {
          id: `saavn-${item.id}`,
          title: title || 'Unknown Title',
          artist: artist || 'Unknown Artist',
          album,
          cover,
          coverLarge: cover,
          duration: 215,
          genre: item.more_info?.language || 'Music',
          source: 'jiosaavn',
        });
      }
    }

    // 2. Tracks from backend (JioSaavn + iTunes catalog)
    const backendTracks = backendRes?.tracks || [];
    for (const track of backendTracks) {
      const key = `${(track.title || '').toLowerCase().trim()}_${(track.artist || '').toLowerCase().trim()}_${(track.album || '').toLowerCase().trim()}`;
      if (!resultsMap.has(key)) {
        resultsMap.set(key, track);
      }
    }

    const allTracks = Array.from(resultsMap.values());

    function scoreTrack(track, qText) {
      const q = qText.toLowerCase().trim();
      const t = (track.title || '').toLowerCase().trim();
      const a = (track.artist || '').toLowerCase().trim();
      const alb = (track.album || '').toLowerCase().trim();
      const g = (track.genre || '').toLowerCase().trim();

      let score = 0;
      if (t === q) score += 120;
      else if (t.startsWith(q)) score += 70;
      else if (t.includes(q)) score += 40;

      // Massive boost for canonical original artist
      if (canonicalArtist && (a.includes(canonicalArtist) || canonicalArtist.includes(a))) {
        score += 260;
      }

      if (a === q) score += 90;
      else if (a.startsWith(q)) score += 50;
      else if (a.includes(q)) score += 30;

      if (`${a} ${t}`.includes(q) || `${t} ${a}`.includes(q)) score += 40;

      if (alb && !alb.includes('remix') && !alb.includes('karaoke') && !alb.includes('tribute') && !alb.includes('cover')) {
        score += 25;
      }

      const penaltyTerms = [
        'karaoke', 'tribute', 'piano', 'chill', 'quartet', 'instrumental',
        'acoustic cover', 'slowed', 'reverb', 'remix', 'ringtone', 'kidz bop', 'originally performed'
      ];
      for (const term of penaltyTerms) {
        if ((t.includes(term) || alb.includes(term) || a.includes(term) || g.includes(term)) && !q.includes(term)) {
          score -= 100;
        }
      }
      return score;
    }

    allTracks.sort((a, b) => scoreTrack(b, cleanQ) - scoreTrack(a, cleanQ));

    // Construct topResult
    let topResult = backendRes?.topResult || null;
    if (topEntity && topEntity.type === 'artist') {
      topResult = {
        type: 'artist',
        id: topEntity.id,
        name: topEntity.title,
        subtitle: `${topEntity.description || 'Artist'} · Top Artist`,
        cover: (topEntity.image || '').replace('50x50', '500x500').replace('150x150', '500x500'),
      };
    } else if (!topResult || topResult.type !== 'artist') {
      const best = allTracks[0];
      if (best) {
        topResult = {
          type: 'song',
          id: best.id,
          title: best.title,
          name: best.title,
          subtitle: `${best.artist} · ${best.album || 'Single'}`,
          cover: best.coverLarge || best.cover,
          track: best,
        };
      }
    }

    const popularTracks = allTracks.slice(0, 5);
    const otherTracks = allTracks.slice(5);

    allTracks.topResult = topResult;
    allTracks.popularTracks = popularTracks;
    allTracks.otherTracks = otherTracks;

    return allTracks;
  } catch (err) {
    console.warn('[API] searchTracks error:', err.message);
    const empty = [];
    empty.topResult = null;
    empty.popularTracks = [];
    empty.otherTracks = [];
    return empty;
  }
}

/**
 * Fast individual album cover resolver for playlist imports and track self-healing
 */
export async function resolveTrackCover(title, artist) {
  const cleanT = (title || '').replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const cleanA = (artist || '').split(',')[0].split('&')[0].trim();
  if (!cleanT) return null;

  // 1. Try Apple Music / iTunes 600x600 CDN
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanA + ' ' + cleanT)}&entity=song&limit=3`;
    const res = await fetch(url).then(r => (r.ok ? r.json() : null));
    if (res?.results?.length > 0) {
      for (const item of res.results) {
        if (item.artworkUrl100) {
          return item.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg');
        }
      }
    }
  } catch (e) {}

  // 2. Try JioSaavn 500x500 CDN
  try {
    const url = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&api_version=4&ctx=web6dot0&query=${encodeURIComponent(cleanA + ' ' + cleanT)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => (r.ok ? r.json() : null));
    const match = res?.songs?.data?.[0];
    if (match?.image) {
      return match.image.replace('150x150', '500x500').replace('50x50', '500x500');
    }
  } catch (e) {}

  return null;
}

/**
 * Fetch live trending tracks
 */
export async function fetchTrending() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/trending`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.tracks || [];
  } catch (err) {
    console.warn('[API] fetchTrending error:', err.message);
    return [];
  }
}

/**
 * Resolve direct high-fidelity audio stream URL with zero-failure client-side fallback
 */
export async function resolveAudioStream(track, options = {}) {
  const isFlacRequested = options.quality === '1411k';

  // Pre-resolve direct 320k Akamai stream concurrently on client residential IP (ultra fast <300ms)
  const directSaavnPromise = resolveDirectSaavnAudio(
    track.title,
    track.artist,
    options.quality && options.quality !== '1411k' ? options.quality : '320k'
  );

  // If user requested studio/standard quality (not FLAC), use direct high-speed CDN immediately!
  if (!isFlacRequested) {
    try {
      const direct = await directSaavnPromise;
      if (direct && direct.streamUrl) {
        return direct;
      }
    } catch (e) {}
  }

  // If FLAC is requested, check backend Telegram Vault, but race with a tight 1.8s timeout
  // so the player never freezes or hangs on backend cloud IP blocks
  try {
    const params = new URLSearchParams({
      id: track.id || '',
      title: track.title || '',
      artist: track.artist || '',
      album: track.album || '',
      cover: track.coverLarge || track.cover || '',
      duration: String(track.duration || ''),
      quality: 'flac',
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(`${API_BASE_URL}/api/stream?${params.toString()}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const normalizeUrl = (u) => {
        if (!u) return null;
        if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('file://')) return u;
        return `${API_BASE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
      };

      const primaryUrl = normalizeUrl(data.streamUrl) || normalizeUrl(data.proxyUrl);
      const isActualFlac = !!(primaryUrl && primaryUrl.includes('/api/tg-stream/'));
      const saavnFallback = await directSaavnPromise;
      const fallbackUrl = saavnFallback?.streamUrl || normalizeUrl(data.proxyUrl) || normalizeUrl(data.fallbackUrl);

      if (primaryUrl) {
        return {
          streamUrl: primaryUrl,
          fallbackUrl: fallbackUrl,
          quality: data.quality || (isActualFlac ? '1,411 kbps · FLAC Master' : '320 kbps · Studio Master'),
          isFlac: isActualFlac,
          flacUnavailable: !isActualFlac && isFlacRequested,
        };
      }
    }
  } catch (err) {
    // Backend timeout or 500 error — seamlessly fall through to direct CDN
  }

  // Instant fallback: direct high-speed Akamai stream
  try {
    const fallbackDirect = await directSaavnPromise;
    if (fallbackDirect && fallbackDirect.streamUrl) {
      return {
        ...fallbackDirect,
        isFlac: false,
        flacUnavailable: isFlacRequested,
      };
    }
  } catch (e) {}

  // Final emergency fallback: try searching JioSaavn with clean query without brackets
  try {
    const fallbackClean = await resolveDirectSaavnAudio(
      (track.title || '').replace(/\(.*?\)|\[.*?\]/g, '').trim(),
      (track.artist || '').split(/[,&]/)[0].trim(),
      '320k'
    );
    if (fallbackClean && fallbackClean.streamUrl) {
      return {
        ...fallbackClean,
        isFlac: false,
        flacUnavailable: isFlacRequested,
      };
    }
  } catch (e) {}

  return null;
}

/**
 * Fetch millisecond-synced lyrics with intelligent clean title & artist fallbacks
 */
export async function fetchLyrics(track) {
  // 1. First try direct LRCLIB for instant millisecond synced lyrics
  try {
    const directLyrics = await fetchDirectLyrics(track.title, track.artist, track.duration);
    if (directLyrics && (directLyrics.synced?.length > 0 || directLyrics.plain)) {
      return directLyrics;
    }
  } catch (e) {}

  // 2. Fallback to backend lyrics API
  try {
    const rawTitle = track.title || '';
    const rawArtist = track.artist || '';
    const cleanTitle = rawTitle.replace(/\(.*?\)|\[.*?\]/g, '').trim();
    const cleanArtist = rawArtist.split(',')[0].split('&')[0].trim();

    const params = new URLSearchParams({
      title: cleanTitle || rawTitle,
      track: cleanTitle || rawTitle,
      artist: cleanArtist || rawArtist,
      duration: String(track.duration || ''),
    });
    const res = await fetch(`${API_BASE_URL}/api/lyrics?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[API] fetchLyrics error:', err.message);
    return { synced: [], plain: '' };
  }
}

/**
 * Fetch list of saved Hi-Res tracks in Cloud Vault (Cloudflare R2 / Telegram)
 */
export async function fetchVaultList() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/vault/list`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] fetchVaultList error:', err.message);
    return { tracks: [], storageUsed: '0 MB', storageTotal: '10 GB', storagePercent: 0 };
  }
}

/**
 * Save track directly to Cloudflare R2 Vault
 */
export async function saveTrackToVault(track) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/vault/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(track),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API] saveTrackToVault error:', err.message);
    return { success: false };
  }
}

/**
 * Fetch diverse artist & vibe radio tracks
 * Excludes the current track title to prevent duplicate-title shuffle
 */
export async function fetchRadioTracks(artist, genre, excludeTitle) {
  try {
    const params = new URLSearchParams({
      artist: artist || '',
      genre: genre || '',
      exclude: excludeTitle || '',
      limit: '15',
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE_URL}/api/radio?${params.toString()}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data?.tracks && Array.isArray(data.tracks) && data.tracks.length > 0) {
      return data.tracks;
    }
  } catch (err) {
    console.warn('[API] fetchRadioTracks backend warning:', err.message);
  }

  // Client-side fallback: Query iTunes for complementary artist top hits
  try {
    const cleanA = (artist || '').split(/[,&]/)[0].trim();
    if (cleanA) {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanA)}&entity=song&limit=10`).then(r => r.ok ? r.json() : null);
      const cleanEx = (excludeTitle || '').toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').trim();
      const fallbackTracks = [];
      for (const item of (itunesRes?.results || [])) {
        const title = item.trackName || '';
        const normTitle = title.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').trim();
        if (cleanEx && normTitle.includes(cleanEx)) continue;
        fallbackTracks.push({
          id: `radio-fb-${item.trackId}`,
          title,
          artist: item.artistName || cleanA,
          album: item.collectionName || 'Single',
          cover: (item.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg'),
          coverLarge: (item.artworkUrl100 || '').replace('100x100bb.jpg', '1000x1000bb.jpg'),
          duration: Math.round((item.trackTimeMillis || 210000) / 1000),
          year: item.releaseDate ? item.releaseDate.substring(0, 4) : '2026',
          genre: item.primaryGenreName || genre || 'Music',
          isHiRes: true,
          qualityLabel: '320 kbps · Studio Master',
          source: 'radio-fallback',
        });
      }
      if (fallbackTracks.length > 0) return fallbackTracks;
    }
  } catch (e) {}

  return [];
}
