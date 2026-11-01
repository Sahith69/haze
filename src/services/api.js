import { Platform } from 'react-native';
import { API_BASE_URL } from '../config';

/**
 * Search tracks across global catalog
 */
export async function searchTracks(query) {
  if (!query || !query.trim()) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.tracks || [];
  } catch (err) {
    console.warn('[API] searchTracks error:', err.message);
    return [];
  }
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
 * Resolve direct high-fidelity audio stream URL
 */
export async function resolveAudioStream(track, options = {}) {
  try {
    const qualityParam = options.quality === '1411k' ? 'flac' : options.quality === '320k' ? 'studio' : options.flac ? 'flac' : 'studio';
    const params = new URLSearchParams({
      id: track.id || '',
      title: track.title || '',
      artist: track.artist || '',
      album: track.album || '',
      cover: track.coverLarge || track.cover || '',
      duration: String(track.duration || ''),
      quality: qualityParam,
    });
    const res = await fetch(`${API_BASE_URL}/api/stream?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    const normalizeUrl = (u) => {
      if (!u) return null;
      if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('file://')) return u;
      return `${API_BASE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
    };

    const primaryUrl = normalizeUrl(data.streamUrl) || normalizeUrl(data.proxyUrl);
    const fallbackUrl = normalizeUrl(data.proxyUrl) || normalizeUrl(data.streamUrl);

    return {
      streamUrl: primaryUrl,
      fallbackUrl: fallbackUrl,
      quality: data.quality || (options.flac ? '1,411 kbps · FLAC Master' : '320 kbps · Studio Master'),
    };
  } catch (err) {
    console.warn('[API] resolveAudioStream error:', err.message);
    return null;
  }
}


/**
 * Fetch millisecond-synced lyrics with intelligent clean title & artist fallbacks
 */
export async function fetchLyrics(track) {
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
