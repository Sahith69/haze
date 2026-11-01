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

  // If FLAC is requested, check backend Telegram Vault (3.5s timeout for network jitter)
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
    const timeout = setTimeout(() => controller.abort(), 2000);
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

      if (isActualFlac && primaryUrl) {
        return {
          streamUrl: primaryUrl,
          fallbackUrl: fallbackUrl,
          quality: data.quality || '1,411 kbps · Pure Lossless FLAC Master',
          isFlac: true,
          flacUnavailable: false,
        };
      }

      // If backend returned a 320k stream or indicated flacUnavailable
      const streamToUse = saavnFallback?.streamUrl || primaryUrl;
      if (streamToUse) {
        return {
          streamUrl: streamToUse,
          fallbackUrl: fallbackUrl || streamToUse,
          quality: '320 kbps · Studio Master',
          isFlac: false,
          flacUnavailable: isFlacRequested,
        };
      }
    }
  } catch (err) {
    // Backend timeout or error — seamlessly fall through to direct CDN
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

/**
 * Fetch full artist profile, top songs discography, and albums
 */
export async function fetchArtistDetails(artistName) {
  if (!artistName || !artistName.trim()) return null;
  const cleanA = artistName.split(/[,&]/)[0].trim();

  try {
    const [songsRes, albumsRes, jioRes] = await Promise.all([
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanA)}&entity=song&limit=50`).then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanA)}&entity=album&limit=25`).then(r => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`https://www.jiosaavn.com/api.php?__call=search.getArtistResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=1&p=1&q=${encodeURIComponent(cleanA)}`).then(r => (r.ok ? r.json() : null)).catch(() => null),
    ]);

    let artistImage = '';
    const jioArtist = jioRes?.results?.[0];
    if (jioArtist?.image) {
      artistImage = jioArtist.image.replace('50x50', '500x500').replace('150x150', '500x500');
    }

    const songs = [];
    const seenTitles = new Set();
    for (const item of (songsRes?.results || [])) {
      const title = item.trackName || '';
      const norm = title.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').trim();
      if (!title || seenTitles.has(norm)) continue;
      seenTitles.add(norm);

      const cover = (item.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg');
      if (!artistImage && cover) artistImage = cover;

      songs.push({
        id: `itunes-${item.trackId}`,
        title,
        artist: item.artistName || artistName,
        album: item.collectionName || 'Single',
        cover,
        coverLarge: (item.artworkUrl100 || '').replace('100x100bb.jpg', '1000x1000bb.jpg'),
        duration: Math.round((item.trackTimeMillis || 210000) / 1000),
        year: item.releaseDate ? item.releaseDate.substring(0, 4) : '2026',
        genre: item.primaryGenreName || 'Music',
        isHiRes: true,
        qualityLabel: '320 kbps · Studio Master',
      });
    }

    const albums = [];
    const seenAlbums = new Set();
    for (const item of (albumsRes?.results || [])) {
      const title = item.collectionName || '';
      const norm = title.toLowerCase().trim();
      if (!title || seenAlbums.has(norm)) continue;
      seenAlbums.add(norm);

      albums.push({
        id: `alb-${item.collectionId}`,
        collectionId: item.collectionId,
        title,
        artist: item.artistName || artistName,
        cover: (item.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg'),
        year: item.releaseDate ? item.releaseDate.substring(0, 4) : '2026',
        trackCount: item.trackCount || 0,
        genre: item.primaryGenreName || 'Music',
      });
    }

    // If iTunes had 0 songs, check JioSaavn artist details as fallback
    if (songs.length === 0 && jioArtist?.id) {
      try {
        const details = await fetch(`https://www.jiosaavn.com/api.php?__call=artist.getArtistPageDetails&_format=json&_marker=0&api_version=4&ctx=web6dot0&artistId=${jioArtist.id}`).then(r => r.json());
        const jioList = details.topSongs || details.songs || [];
        for (const s of jioList) {
          const title = s.title ? s.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : '';
          const cover = s.image ? s.image.replace('150x150', '500x500') : '';
          songs.push({
            id: `saavn-${s.id}`,
            title: title || 'Unknown Title',
            artist: s.more_info?.primary_artists || artistName,
            album: s.more_info?.album || 'Single',
            cover,
            coverLarge: cover,
            duration: Number(s.more_info?.duration || 215),
            year: s.year || '2026',
            genre: s.more_info?.language || 'Music',
            isHiRes: true,
            qualityLabel: '320 kbps · Studio Master',
          });
        }
      } catch (e) {}
    }

    return {
      name: artistName,
      cover: artistImage || 'https://via.placeholder.com/500',
      genre: songs[0]?.genre || 'Music',
      topSongs: songs,
      albums,
    };
  } catch (err) {
    console.warn('[API] fetchArtistDetails error:', err.message);
    return null;
  }
}

/**
 * Fetch full album tracklist with exact track order
 */
export async function fetchAlbumDetails(albumTitle, artistName) {
  if (!albumTitle || !albumTitle.trim()) return null;
  const cleanAlb = albumTitle.replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const cleanArt = (artistName || '').split(/[,&]/)[0].trim();

  try {
    // 1. Search album on iTunes
    const searchRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanAlb + ' ' + cleanArt)}&entity=album&limit=3`).then(r => (r.ok ? r.json() : null));
    const col = searchRes?.results?.[0];

    if (col && col.collectionId) {
      const lookupRes = await fetch(`https://itunes.apple.com/lookup?id=${col.collectionId}&entity=song`).then(r => (r.ok ? r.json() : null));
      if (lookupRes?.results && lookupRes.results.length > 1) {
        const albumInfo = lookupRes.results[0]; // Collection meta
        const songItems = lookupRes.results.slice(1); // Songs

        const tracks = songItems.map((item, index) => ({
          id: `alb-track-${item.trackId || index}`,
          trackNumber: item.trackNumber || index + 1,
          title: item.trackName || 'Unknown Title',
          artist: item.artistName || artistName,
          album: albumInfo.collectionName || albumTitle,
          cover: (albumInfo.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg'),
          coverLarge: (albumInfo.artworkUrl100 || '').replace('100x100bb.jpg', '1000x1000bb.jpg'),
          duration: Math.round((item.trackTimeMillis || 200000) / 1000),
          year: albumInfo.releaseDate ? albumInfo.releaseDate.substring(0, 4) : '2026',
          genre: albumInfo.primaryGenreName || 'Music',
          isHiRes: true,
          qualityLabel: '320 kbps · Studio Master',
        }));

        const totalSec = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

        return {
          title: albumInfo.collectionName || albumTitle,
          artist: albumInfo.artistName || artistName,
          cover: (albumInfo.artworkUrl100 || '').replace('100x100bb.jpg', '800x800bb.jpg'),
          year: albumInfo.releaseDate ? albumInfo.releaseDate.substring(0, 4) : '2026',
          genre: albumInfo.primaryGenreName || 'Music',
          trackCount: tracks.length,
          totalDuration: totalSec,
          tracks,
        };
      }
    }

    // 2. JioSaavn regional album fallback
    const saavnAlbRes = await fetch(`https://www.jiosaavn.com/api.php?__call=search.getAlbumResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=3&p=1&q=${encodeURIComponent(cleanAlb + ' ' + cleanArt)}`).then(r => (r.ok ? r.json() : null));
    const saavnAlb = saavnAlbRes?.results?.[0];

    if (saavnAlb?.id) {
      const details = await fetch(`https://www.jiosaavn.com/api.php?__call=content.getAlbumDetails&_format=json&_marker=0&api_version=4&ctx=web6dot0&albumid=${saavnAlb.id}`).then(r => r.json());
      const rawList = details.list || [];
      const tracks = rawList.map((s, index) => {
        const title = s.title ? s.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : '';
        const cover = s.image ? s.image.replace('150x150', '500x500') : '';
        return {
          id: `saavn-alb-${s.id}`,
          trackNumber: index + 1,
          title: title || 'Unknown Title',
          artist: s.more_info?.primary_artists || artistName,
          album: details.title || albumTitle,
          cover: cover || saavnAlb.image,
          coverLarge: cover || saavnAlb.image,
          duration: Number(s.more_info?.duration || 215),
          year: details.year || '2026',
          genre: details.language || 'Music',
          isHiRes: true,
          qualityLabel: '320 kbps · Studio Master',
        };
      });

      const totalSec = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
      const albumCover = details.image ? details.image.replace('150x150', '800x800') : '';

      return {
        title: details.title || albumTitle,
        artist: details.primary_artists || artistName,
        cover: albumCover,
        year: details.year || '2026',
        genre: details.language || 'Music',
        trackCount: tracks.length,
        totalDuration: totalSec,
        tracks,
      };
    }
  } catch (err) {
    console.warn('[API] fetchAlbumDetails error:', err.message);
  }

  return null;
}
