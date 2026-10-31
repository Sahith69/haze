import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import {
  fetchTrending,
  resolveAudioStream,
  fetchLyrics,
  fetchVaultList,
  saveTrackToVault,
} from '../services/api';

const PlayerContext = createContext();

export const INITIAL_TRACKS = [
  {
    id: 'init-1',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    cover: 'https://c.saavncdn.com/372/b7f9937fefd686876e90be4a96c9a6e9_500x500.jpg',
    duration: 230,
    isHiRes: true,
    qualityLabel: '1,411 kbps · FLAC Master',
    gradient: ['#7C5CFF', '#FF5C9E'],
    genre: 'Pop / R&B',
  },
  {
    id: 'init-2',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    cover: 'https://c.saavncdn.com/286/2929d11a5d44a3592ced0383fa6f1977_500x500.jpg',
    duration: 233,
    isHiRes: true,
    qualityLabel: '1,411 kbps · FLAC Master',
    gradient: ['#FF9A3C', '#FF3C6E'],
    genre: 'Pop',
  },
  {
    id: 'init-3',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    cover: 'https://c.saavncdn.com/820/Blinding-Lights-English-2020-20200912094411-500x500.jpg',
    duration: 200,
    isHiRes: true,
    qualityLabel: '1,411 kbps · FLAC Master',
    gradient: ['#18C8A8', '#2A6BFF'],
    genre: 'Synthwave / Pop',
  },
  {
    id: 'init-4',
    title: 'Thriller',
    artist: 'Michael Jackson',
    album: 'Thriller',
    cover: 'https://c.saavncdn.com/295/2742a0391b87aa58b7ba3eefaf57fcf0_500x500.jpg',
    duration: 357,
    isHiRes: true,
    qualityLabel: '1,411 kbps · FLAC Master',
    gradient: ['#F5B942', '#C2410C'],
    genre: 'Funk / Pop',
  },
  {
    id: 'init-5',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    album: 'Die With A Smile',
    cover: 'https://c.saavncdn.com/645/Die-With-A-Smile-English-2024-20240816043202-500x500.jpg',
    duration: 251,
    isHiRes: true,
    qualityLabel: '1,411 kbps · FLAC Master',
    gradient: ['#3B3B5C', '#8B7CFF'],
    genre: 'Ballad / Pop',
  },
];

export const USERS = {
  sahith: {
    id: 'sahith',
    name: 'Sahith',
    avatar: '⚡',
    badge: '⚡ FLAC Master',
    colors: ['#F5B942', '#7C5CFF'],
    defaultFlac: true,
    description: 'Always Lossless FLAC · 1,411 kbps Master',
  },
  kritika: {
    id: 'kritika',
    name: 'Kritika',
    avatar: '✨',
    badge: '✨ Hi-Fi Studio',
    colors: ['#FF5C9E', '#9B51E0'],
    defaultFlac: false,
    description: 'Hi-Fi Studio 320k · Tap badge anytime for FLAC',
  },
};

const OFFLINE_DIR = (FileSystem.documentDirectory || '') + 'haze_offline/';

export const PlayerProvider = ({ children }) => {
  // 2-User Profiles: Sahith (FLAC by default) & Kritika (Studio / FLAC on demand)
  const [currentUser, setCurrentUser] = useState(USERS.sahith);
  const [flacEnabled, setFlacEnabled] = useState(true);

  // User-isolated persistent collections
  const [likedTracks, setLikedTracks] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [downloadedTracks, setDownloadedTracks] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState({}); // { [trackId]: { status, percent } }

  // Player state
  const [currentTrack, setCurrentTrack] = useState(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(216);
  const [queue, setQueue] = useState(INITIAL_TRACKS);
  const [vaultTracks, setVaultTracks] = useState([]);
  const [storageUsed, setStorageUsed] = useState('0 MB');
  const [storageTotal, setStorageTotal] = useState('10 GB');
  const [storagePercent, setStoragePercent] = useState(0);
  const [activeTab, setActiveTab] = useState('home');
  const [activeModal, setActiveModal] = useState(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [liveLyrics, setLiveLyrics] = useState({ synced: [], plain: '' });
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Equalizer state
  const [eqPreset, setEqPreset] = useState('Bass boost');
  const [eqBands, setEqBands] = useState({
    '31': 70,
    '62': 50,
    '125': 80,
    '250': 110,
    '500': 100,
    '1k': 90,
    '2k': 70,
    '4k': 60,
    '8k': 50,
    '16k': 40,
  });
  const [volumeLeveling, setVolumeLeveling] = useState(true);

  const soundRef = useRef(null);
  const recentHistoryRef = useRef([]); // Spotify smart shuffle history ring buffer

  // Load user data whenever active user changes
  const loadUserData = useCallback(async (userId) => {
    try {
      const likesKey = `@haze_${userId}_likes`;
      const playlistsKey = `@haze_${userId}_playlists`;
      const downloadsKey = `@haze_${userId}_downloads`;

      const [storedLikes, storedPlaylists, storedDownloads] = await Promise.all([
        AsyncStorage.getItem(likesKey),
        AsyncStorage.getItem(playlistsKey),
        AsyncStorage.getItem(downloadsKey),
      ]);

      setLikedTracks(storedLikes ? JSON.parse(storedLikes) : []);
      setUserPlaylists(storedPlaylists ? JSON.parse(storedPlaylists) : []);
      setDownloadedTracks(storedDownloads ? JSON.parse(storedDownloads) : []);
    } catch (e) {
      console.warn(`[PlayerContext] Error loading user data for ${userId}:`, e.message);
    }
  }, []);

  // Switch between Sahith and Kritika profiles
  const switchUser = async (userId) => {
    const user = USERS[userId] || USERS.sahith;
    setCurrentUser(user);
    setFlacEnabled(user.defaultFlac);
    try {
      await AsyncStorage.setItem('@haze_active_user', user.id);
    } catch (e) {}
    await loadUserData(user.id);
  };

  const toggleFlac = () => {
    setFlacEnabled(prev => !prev);
  };

  // Configure background audio mode and notification permissions on mount
  useEffect(() => {
    async function setupAudio() {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
              {
                title: 'HAZE Music Playback Notification',
                message: 'HAZE needs notification access to show track controls on your lock screen and notification panel.',
                buttonPositive: 'Allow',
              }
            );
            console.log('[PlayerContext] Notification permission status:', granted);
          } catch (e) {
            console.warn('[PlayerContext] Notification permission request error:', e);
          }
        }
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'doNotMix',
          shouldPlayInBackground: true,
          shouldRouteThroughEarpiece: false,
        });
      } catch (e) {
        console.warn('[PlayerContext] Audio mode setup error:', e);
      }
    }

    async function initApp() {
      await setupAudio();
      try {
        // Ensure offline download directory exists
        const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
        }
      } catch (e) {}

      // Load active user profile and collections
      try {
        const savedUserId = await AsyncStorage.getItem('@haze_active_user');
        const activeId = savedUserId && USERS[savedUserId] ? savedUserId : 'sahith';
        const user = USERS[activeId];
        setCurrentUser(user);
        setFlacEnabled(user.defaultFlac);
        await loadUserData(user.id);
      } catch (e) {
        await loadUserData('sahith');
      }
    }

    initApp();
  }, [loadUserData]);

  // Fetch initial Vault and live Trending data from backend
  useEffect(() => {
    async function loadInitialData() {
      try {
        const vaultData = await fetchVaultList();
        if (vaultData) {
          if (Array.isArray(vaultData.tracks)) {
            setVaultTracks(vaultData.tracks);
          }
          if (vaultData.storageUsed) setStorageUsed(vaultData.storageUsed);
          if (vaultData.storageTotal) setStorageTotal(vaultData.storageTotal);
          if (typeof vaultData.storagePercent === 'number') setStoragePercent(vaultData.storagePercent);
        }
      } catch (e) {
        console.warn('Error loading vault list:', e.message);
      }

      try {
        const trending = await fetchTrending();
        if (trending && trending.length > 0) {
          const mapped = trending.map((t, idx) => ({
            ...t,
            gradient: [
              ['#7C5CFF', '#FF5C9E'],
              ['#FF9A3C', '#FF3C6E'],
              ['#18C8A8', '#2A6BFF'],
              ['#F5B942', '#C2410C'],
              ['#3B3B5C', '#8B7CFF'],
            ][idx % 5],
          }));
          setQueue(mapped);
          if (!currentTrack || currentTrack.id === INITIAL_TRACKS[0].id) {
            setCurrentTrack(mapped[0]);
          }
        }
      } catch (e) {
        console.warn('Error loading trending:', e.message);
      }
    }
    loadInitialData();
  }, []);

  // Update Lock Screen & Notification metadata helper
  const updateLockScreenControls = (playerInstance, track, isFlac) => {
    if (!playerInstance) return;
    try {
      const displayTitle = track?.title || 'Unknown Title';
      const displayArtist = track?.artist || 'HAZE';
      const displayAlbum = track?.album || (isFlac ? 'Lossless FLAC Master' : 'Studio Master 320k');
      const displayArtwork = track?.coverLarge || track?.cover || undefined;

      playerInstance.setActiveForLockScreen(
        true,
        {
          title: displayTitle,
          artist: displayArtist,
          albumTitle: displayAlbum,
          artworkUrl: displayArtwork,
        },
        {
          showNextTrack: true,
          showPreviousTrack: true,
          showSeekForward: true,
          showSeekBackward: true,
          seekForwardIntervalSeconds: 10,
          seekBackwardIntervalSeconds: 10,
        }
      );
    } catch (lockErr) {
      console.warn('[PlayerContext] setActiveForLockScreen warning:', lockErr.message);
    }
  };

  // Play track (offline local file if available, or cloud stream)
  const playTrack = async (track) => {
    if (!track) return;
    const isDownloadedItem = downloadedTracks.find(d => d.id === track.id);
    const resolvedQuality = isDownloadedItem
      ? `${isDownloadedItem.qualityLabel} · Offline`
      : flacEnabled
      ? '1,411 kbps · Lossless FLAC'
      : '320 kbps · Studio Master';

    const enrichedTrack = {
      ...track,
      qualityLabel: resolvedQuality,
      isHiRes: true,
      isLiked: likedTracks.some(t => t.id === track.id),
      isDownloaded: !!isDownloadedItem,
    };

    setCurrentTrack(enrichedTrack);
    setIsPlaying(true);
    setPosition(0);
    setDuration(track.duration || 216);
    setIsLoadingAudio(true);

    // Track in smart shuffle history ring buffer
    recentHistoryRef.current = [track.id, ...recentHistoryRef.current.filter(id => id !== track.id)].slice(0, 20);

    // Fetch synced lyrics concurrently
    fetchLyrics(track).then(setLiveLyrics);

    try {
      if (soundRef.current) {
        try {
          soundRef.current.pause();
          soundRef.current.remove();
        } catch (e) {}
        soundRef.current = null;
      }

      let audioUriToPlay = null;

      // 1. Check if available offline locally on device
      if (isDownloadedItem && isDownloadedItem.localAudioUri) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(isDownloadedItem.localAudioUri);
          if (fileInfo.exists) {
            audioUriToPlay = isDownloadedItem.localAudioUri;
            console.log(`[PlayerContext] Playing offline local file: ${audioUriToPlay}`);
          }
        } catch (e) {}
      }

      // 2. Otherwise resolve remote stream from HAZE server
      let fallbackUrl = null;
      if (!audioUriToPlay) {
        console.log(`[PlayerContext] Resolving audio stream for: "${track.title}" by ${track.artist} (${resolvedQuality})`);
        const streamResult = await resolveAudioStream(track, { flac: flacEnabled });
        audioUriToPlay = typeof streamResult === 'string' ? streamResult : streamResult?.streamUrl;
        fallbackUrl = typeof streamResult === 'object' ? streamResult?.fallbackUrl : null;
        console.log(`[PlayerContext] Resolved stream URL:`, audioUriToPlay);
      }

      if (audioUriToPlay) {
        const sourceConfig = {
          uri: audioUriToPlay,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          },
          name: track.title,
        };

        const player = createAudioPlayer(sourceConfig, {
          updateInterval: 250,
          keepAudioSessionActive: true,
        });
        soundRef.current = player;

        // Native Android Lock Screen & Notification media controls
        updateLockScreenControls(player, track, flacEnabled);

        player.addListener('playbackStatusUpdate', (status) => {
          if (status.error) {
            console.warn('[PlayerContext] Audio status error:', status.error);
            if (fallbackUrl && fallbackUrl !== audioUriToPlay) {
              try {
                player.replace({
                  uri: fallbackUrl,
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                  },
                });
                player.play();
              } catch (e) {}
            }
          }
          if (status.isLoaded) {
            setIsLoadingAudio(false);
          }
          if (status.playing !== undefined) {
            setIsPlaying(status.playing);
          }
          if (typeof status.currentTime === 'number') {
            setPosition(Math.round(status.currentTime));
          }
          if (status.duration) {
            setDuration(Math.round(status.duration));
          }
          if (status.didJustFinish) {
            handleTrackFinish();
          }
        });

        player.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('[PlayerContext] Audio playback error:', err.message);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const togglePlayPause = async () => {
    if (soundRef.current) {
      try {
        if (soundRef.current.playing) {
          soundRef.current.pause();
          setIsPlaying(false);
        } else {
          soundRef.current.play();
          setIsPlaying(true);
        }
        return;
      } catch (e) {
        console.warn('Playback toggle error:', e.message);
      }
    } else if (currentTrack) {
      await playTrack(currentTrack);
      return;
    }
    setIsPlaying(prev => !prev);
  };

  const seekTo = (seconds) => {
    setPosition(seconds);
    if (soundRef.current) {
      try {
        soundRef.current.seekTo(seconds);
      } catch (e) {}
    }
  };

  /**
   * Spotify-style Smart Shuffle algorithm:
   * 1. Excludes tracks in the recent history ring buffer (no immediate repeats).
   * 2. Avoids consecutive tracks by the exact same artist.
   * 3. Harmony matching: boosts tracks sharing genre, mood or tempo.
   * 4. User affinity: boosts tracks the current user has liked (+20 weight).
   * 5. Weighted random selection so every session feels fresh yet delightfully curated.
   */
  const getSpotifySmartNextTrack = useCallback(() => {
    if (!queue || queue.length === 0) return currentTrack;
    if (queue.length === 1) return queue[0];

    const currentArtist = (currentTrack?.artist || '').toLowerCase();
    const currentGenre = (currentTrack?.genre || '').toLowerCase();
    const likedIds = new Set(likedTracks.map(t => t.id));
    const recentSet = new Set(recentHistoryRef.current);

    // Candidates that haven't been played in recent turns
    let candidates = queue.filter(t => t.id !== currentTrack?.id && !recentSet.has(t.id));
    if (candidates.length === 0) {
      // If exhausted, filter only by current track
      candidates = queue.filter(t => t.id !== currentTrack?.id);
    }
    if (candidates.length === 0) candidates = queue;

    // Score candidates based on Spotify smart shuffle heuristics
    const scored = candidates.map(t => {
      let score = 10;
      const tArtist = (t.artist || '').toLowerCase();
      const tGenre = (t.genre || '').toLowerCase();

      // Avoid same artist back-to-back
      if (tArtist && currentArtist && tArtist !== currentArtist) {
        score += 15;
      }

      // Genre continuity
      if (tGenre && currentGenre && (tGenre.includes(currentGenre) || currentGenre.includes(tGenre))) {
        score += 20;
      }

      // User affinity bonus
      if (likedIds.has(t.id)) {
        score += 18;
      }

      // Proximity in duration (energy flow)
      const diff = Math.abs((t.duration || 210) - (currentTrack?.duration || 210));
      if (diff < 40) score += 8;

      // Random jitter for organic exploration
      score += Math.random() * 12;

      return { track: t, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.track || candidates[0];
  }, [queue, currentTrack, likedTracks]);

  const nextTrack = () => {
    if (isShuffle) {
      const smartNext = getSpotifySmartNextTrack();
      if (smartNext) {
        playTrack(smartNext);
        return;
      }
    }
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % queue.length;
    playTrack(queue[nextIndex]);
  };

  const previousTrack = () => {
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    playTrack(queue[prevIndex]);
  };

  const handleTrackFinish = () => {
    if (isRepeat) {
      seekTo(0);
      if (soundRef.current) soundRef.current.play();
    } else {
      nextTrack();
    }
  };

  // Toggle Liked Song (Isolated per user profile in persistent AsyncStorage)
  const toggleLike = async (track) => {
    const targetTrack = track || currentTrack;
    if (!targetTrack || !targetTrack.id) return;

    const isCurrentlyLiked = likedTracks.some(t => t.id === targetTrack.id);
    let updatedLikes;
    if (isCurrentlyLiked) {
      updatedLikes = likedTracks.filter(t => t.id !== targetTrack.id);
    } else {
      const likedItem = {
        ...targetTrack,
        isLiked: true,
        likedAt: new Date().toISOString(),
      };
      updatedLikes = [likedItem, ...likedTracks];
    }

    setLikedTracks(updatedLikes);
    const likesKey = `@haze_${currentUser.id}_likes`;
    try {
      await AsyncStorage.setItem(likesKey, JSON.stringify(updatedLikes));
    } catch (e) {
      console.warn('Error saving likes to AsyncStorage:', e.message);
    }

    // Update isLiked in currentTrack
    if (currentTrack?.id === targetTrack.id) {
      setCurrentTrack(prev => ({ ...prev, isLiked: !isCurrentlyLiked }));
    }
  };

  // Playlist Management (Isolated per user profile in persistent AsyncStorage)
  const createPlaylist = async (name, description = '') => {
    if (!name || !name.trim()) return;
    const newPlaylist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      cover: 'https://c.saavncdn.com/372/b7f9937fefd686876e90be4a96c9a6e9_500x500.jpg',
      tracks: [],
    };

    const updated = [newPlaylist, ...userPlaylists];
    setUserPlaylists(updated);
    try {
      await AsyncStorage.setItem(`@haze_${currentUser.id}_playlists`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error creating playlist:', e.message);
    }
    return newPlaylist;
  };

  const deletePlaylist = async (playlistId) => {
    const updated = userPlaylists.filter(p => p.id !== playlistId);
    setUserPlaylists(updated);
    try {
      await AsyncStorage.setItem(`@haze_${currentUser.id}_playlists`, JSON.stringify(updated));
    } catch (e) {}
  };

  const addTrackToPlaylist = async (playlistId, track) => {
    const updated = userPlaylists.map(pl => {
      if (pl.id !== playlistId) return pl;
      if (pl.tracks.some(t => t.id === track.id)) return pl;
      return {
        ...pl,
        cover: track.cover || pl.cover,
        tracks: [track, ...pl.tracks],
      };
    });
    setUserPlaylists(updated);
    try {
      await AsyncStorage.setItem(`@haze_${currentUser.id}_playlists`, JSON.stringify(updated));
    } catch (e) {}
  };

  const removeTrackFromPlaylist = async (playlistId, trackId) => {
    const updated = userPlaylists.map(pl => {
      if (pl.id !== playlistId) return pl;
      return {
        ...pl,
        tracks: pl.tracks.filter(t => t.id !== trackId),
      };
    });
    setUserPlaylists(updated);
    try {
      await AsyncStorage.setItem(`@haze_${currentUser.id}_playlists`, JSON.stringify(updated));
    } catch (e) {}
  };

  // Local Offline Music Download (Isolated per user, with desired quality)
  const downloadTrack = async (track) => {
    const target = track || currentTrack;
    if (!target || !target.id) return;

    if (downloadedTracks.some(d => d.id === target.id)) {
      console.log(`[Download] "${target.title}" is already downloaded.`);
      return;
    }

    setDownloadProgress(prev => ({ ...prev, [target.id]: { status: 'downloading', percent: 0 } }));

    try {
      // Ensure download dir exists
      const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
      }

      // Sahith gets FLAC Master; Kritika gets 320 kbps (or FLAC if toggled)
      const downloadFlac = flacEnabled;
      const qualityTag = downloadFlac ? '1,411 kbps · Lossless FLAC Master' : '320 kbps · Studio Master';
      const fileExt = downloadFlac ? 'flac' : 'mp4';

      console.log(`[Download] Resolving audio stream for download: "${target.title}" (${qualityTag})`);
      const streamRes = await resolveAudioStream(target, { flac: downloadFlac });
      const streamUrl = typeof streamRes === 'string' ? streamRes : streamRes?.streamUrl;

      if (!streamUrl) {
        throw new Error('Failed to obtain stream URL for offline download');
      }

      const safeId = String(target.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const localAudioPath = `${OFFLINE_DIR}${safeId}_${currentUser.id}.${fileExt}`;
      const localCoverPath = `${OFFLINE_DIR}${safeId}_cover.jpg`;

      // Download audio file
      console.log(`[Download] Downloading audio to: ${localAudioPath}`);
      const downloadRes = await FileSystem.downloadAsync(streamUrl, localAudioPath);

      // Download cover art if available
      let localCoverUri = target.cover || '';
      if (target.cover && target.cover.startsWith('http')) {
        try {
          const coverRes = await FileSystem.downloadAsync(target.cover, localCoverPath);
          localCoverUri = coverRes.uri;
        } catch (e) {
          console.warn('[Download] Cover download fallback:', e.message);
        }
      }

      const fileInfo = await FileSystem.getInfoAsync(downloadRes.uri);
      const downloadRecord = {
        ...target,
        localAudioUri: downloadRes.uri,
        localCoverUri,
        qualityLabel: qualityTag,
        isFlac: downloadFlac,
        fileSize: fileInfo.size || 0,
        downloadedAt: new Date().toISOString(),
        downloadedBy: currentUser.id,
      };

      const updatedDownloads = [downloadRecord, ...downloadedTracks];
      setDownloadedTracks(updatedDownloads);
      await AsyncStorage.setItem(`@haze_${currentUser.id}_downloads`, JSON.stringify(updatedDownloads));

      if (currentTrack?.id === target.id) {
        setCurrentTrack(prev => ({ ...prev, isDownloaded: true, qualityLabel: `${qualityTag} · Offline` }));
      }

      setDownloadProgress(prev => ({ ...prev, [target.id]: { status: 'completed', percent: 100 } }));
      console.log(`[Download] Successfully saved "${target.title}" locally for ${currentUser.name}`);
    } catch (err) {
      console.error('[Download] Download error:', err);
      setDownloadProgress(prev => ({ ...prev, [target.id]: { status: 'failed', error: err.message } }));
    }
  };

  const removeDownload = async (trackId) => {
    const item = downloadedTracks.find(d => d.id === trackId);
    if (item && item.localAudioUri) {
      try {
        await FileSystem.deleteAsync(item.localAudioUri, { idempotent: true });
        if (item.localCoverUri && item.localCoverUri.startsWith('file://')) {
          await FileSystem.deleteAsync(item.localCoverUri, { idempotent: true });
        }
      } catch (e) {}
    }

    const updated = downloadedTracks.filter(d => d.id !== trackId);
    setDownloadedTracks(updated);
    try {
      await AsyncStorage.setItem(`@haze_${currentUser.id}_downloads`, JSON.stringify(updated));
    } catch (e) {}

    if (currentTrack?.id === trackId) {
      setCurrentTrack(prev => ({ ...prev, isDownloaded: false }));
    }
  };

  const isTrackDownloaded = (trackId) => {
    return downloadedTracks.some(d => d.id === trackId);
  };

  const isTrackLiked = (trackId) => {
    return likedTracks.some(t => t.id === trackId);
  };

  // One-click upgrade to Cloud Vault (Cloudflare R2)
  const saveToVault = async (track) => {
    const updated = {
      ...track,
      inVault: true,
      isHiRes: true,
      qualityLabel: '48 kHz · Cloud Vault',
    };

    setVaultTracks(prev => {
      if (prev.find(t => t.id === track.id)) return prev;
      return [updated, ...prev];
    });

    if (currentTrack?.id === track.id) {
      setCurrentTrack(updated);
    }

    saveTrackToVault(track).then((res) => {
      if (res && res.success) {
        console.log('[PlayerContext] Successfully saved to R2 Cloud Vault');
      }
    });
  };

  const clearQueue = () => {
    setQueue([currentTrack]);
  };

  const shuffleQueue = () => {
    setIsShuffle(prev => !prev);
    if (!isShuffle) {
      // Activating Smart Shuffle
      const nextSong = getSpotifySmartNextTrack();
      console.log('[Smart Shuffle] Activated Spotify-style smart queue. Up next:', nextSong?.title);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentUser,
        flacEnabled,
        switchUser,
        toggleFlac,
        USERS,
        currentTrack,
        isPlaying,
        isLoadingAudio,
        position,
        duration,
        queue,
        vaultTracks,
        storageUsed,
        storageTotal,
        storagePercent,
        activeTab,
        activeModal,
        isShuffle,
        isRepeat,
        liveLyrics,
        eqPreset,
        eqBands,
        volumeLeveling,
        likedTracks,
        userPlaylists,
        downloadedTracks,
        downloadProgress,
        setActiveTab,
        setActiveModal,
        closeModal: () => setActiveModal(null),
        playTrack,
        togglePlayPause,
        nextTrack,
        previousTrack,
        seekTo,
        toggleLike,
        isTrackLiked,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        downloadTrack,
        removeDownload,
        isTrackDownloaded,
        saveToVault,
        clearQueue,
        shuffleQueue,
        setIsRepeat,
        setEqPreset,
        setEqBand: (band, val) => setEqBands(prev => ({ ...prev, [band]: val })),
        setVolumeLeveling,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
