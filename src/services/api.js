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
    const params = new URLSearchParams({
      id: track.id || '',
      title: track.title || '',
      artist: track.artist || '',
      album: track.album || '',
      cover: track.coverLarge || track.cover || '',
      duration: String(track.duration || ''),
      quality: options.flac ? 'flac' : 'studio',
    });
    const res = await fetch(`${API_BASE_URL}/api/stream?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    // On native mobile (Android/iOS), connect directly to CDN streamUrl for fastest latency
    if (Platform.OS !== 'web' && data.streamUrl) {
      return data.streamUrl;
    }
    // On Web, use CORS-supported proxy if available
    if (data.proxyUrl) {
      return `${API_BASE_URL}${data.proxyUrl}`;
    }
    return data.streamUrl || null;
  } catch (err) {
    console.warn('[API] resolveAudioStream error:', err.message);
    return null;
  }
}


/**
 * Fetch millisecond-synced lyrics
 */
export async function fetchLyrics(track) {
  try {
    const params = new URLSearchParams({
      track: track.title || '',
      artist: track.artist || '',
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
