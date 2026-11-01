import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import {
  fetchTrending,
  resolveAudioStream,
  fetchLyrics,
  fetchVaultList,
  searchTracks,
  saveTrackToVault,
} from '../services/api';
import { API_BASE_URL } from '../config';
import { resolveDirectSaavnAudio } from '../services/directResolver';

const PlayerContext = createContext();

export const INITIAL_TRACKS = [
  {
    id: 'init-1',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg',
    duration: 230,
    isHiRes: true,
    qualityLabel: '320 kbps · Studio Master',
    gradient: ['#7C5CFF', '#FF5C9E'],
    genre: 'Pop / R&B',
  },
  {
    id: 'init-2',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/600x600bb.jpg',
    duration: 233,
    isHiRes: true,
    qualityLabel: '320 kbps · Studio Master',
    gradient: ['#FF9A3C', '#FF3C6E'],
    genre: 'Pop',
  },
  {
    id: 'init-3',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/6f/bc/e6/6fbce6c4-c38c-72d8-4fd0-66cfff32f679/20UMGIM12176.rgb.jpg/600x600bb.jpg',
    duration: 200,
    isHiRes: true,
    qualityLabel: '320 kbps · Studio Master',
    gradient: ['#18C8A8', '#2A6BFF'],
    genre: 'Synthwave / Pop',
  },
  {
    id: 'init-4',
    title: 'Thriller',
    artist: 'Michael Jackson',
    album: 'Thriller',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/32/4f/fd/324ffda2-9e51-8f6a-0c2d-c6fd2b41ac55/074643811224.jpg/600x600bb.jpg',
    duration: 357,
    isHiRes: true,
    qualityLabel: '320 kbps · Studio Master',
    gradient: ['#F5B942', '#C2410C'],
    genre: 'Funk / Pop',
  },
  {
    id: 'init-5',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    album: 'Die With A Smile',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/600x600bb.jpg',
    duration: 251,
    isHiRes: true,
    qualityLabel: '320 kbps · Studio Master',
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
    defaultQuality: '1411k',
    defaultFlac: true,
    description: 'Lossless FLAC Master · 1,411 kbps',
  },
  kritika: {
    id: 'kritika',
    name: 'Kritika',
    avatar: '✨',
    badge: '✨ Hi-Fi Studio',
    colors: ['#FF5C9E', '#9B51E0'],
    defaultQuality: '320k',
    defaultFlac: false,
    description: 'Hi-Fi Studio 320k · Audiophile Quality',
  },
};

const getOfflineDir = () => {
  const base = FileSystem?.documentDirectory || FileSystem?.cacheDirectory || '';
  if (!base) return 'file:///data/user/0/com.monochrome.music/files/haze_offline/';
  return base.endsWith('/') ? `${base}haze_offline/` : `${base}/haze_offline/`;
};
const OFFLINE_DIR = getOfflineDir();

export const PlayerProvider = ({ children }) => {
  // Active User Profile
  const [currentUser, setCurrentUser] = useState(USERS.sahith);
  const [streamingQuality, setStreamingQualityState] = useState('1411k');
  const [downloadQuality, setDownloadQualityState] = useState('1411k');
  const [flacEnabled, setFlacEnabled] = useState(true);

  // Quality Modal State
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [qualityModalMode, setQualityModalMode] = useState('streaming'); // 'streaming' | 'download'

  // User-isolated persistent collections
  const [likedTracks, setLikedTracks] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [downloadedTracks, setDownloadedTracks] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [searchHistory, setSearchHistory] = useState([]);

  // In-app Toast message system
  const [toastMessage, setToastMessage] = useState(null);

  // Add to Playlist picker modal state
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null);

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

  // Critical Refs for race-condition & overlap prevention
  const soundRef = useRef(null);
  const playbackRequestIdRef = useRef(0);
  const recentHistoryRef = useRef([]);

  // Auto-dismiss toast after 3.5s
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Load user data whenever active user changes
  const loadUserData = useCallback(async (userId) => {
    try {
      const likesKey = `@haze_${userId}_likes`;
      const playlistsKey = `@haze_${userId}_playlists`;
      const downloadsKey = `@haze_${userId}_downloads`;
      const qualityKey = `@haze_${userId}_quality`;
      const dlQualityKey = `@haze_${userId}_dl_quality`;
      const searchKey = `@haze_${userId}_search_history`;

      const [
        storedLikes,
        storedPlaylists,
        storedDownloads,
        storedQuality,
        storedDlQuality,
        storedSearch,
      ] = await Promise.all([
        AsyncStorage.getItem(likesKey),
        AsyncStorage.getItem(playlistsKey),
        AsyncStorage.getItem(downloadsKey),
        AsyncStorage.getItem(qualityKey),
        AsyncStorage.getItem(dlQualityKey),
        AsyncStorage.getItem(searchKey),
      ]);

      setLikedTracks(storedLikes ? JSON.parse(storedLikes) : []);
      setUserPlaylists(storedPlaylists ? JSON.parse(storedPlaylists) : []);
      setDownloadedTracks(storedDownloads ? JSON.parse(storedDownloads) : []);
      setSearchHistory(storedSearch ? JSON.parse(storedSearch) : []);

      const fallbackQuality = USERS[userId]?.defaultQuality || '1411k';
      const activeQ = storedQuality || fallbackQuality;
      const activeDlQ = storedDlQuality || fallbackQuality;

      setStreamingQualityState(activeQ);
      setDownloadQualityState(activeDlQ);
      setFlacEnabled(activeQ === '1411k');
    } catch (e) {
      console.warn(`[PlayerContext] Error loading user data for ${userId}:`, e.message);
    }
  }, []);

  // Switch between Sahith and Kritika profiles
  const switchUser = async (userId) => {
    const user = USERS[userId] || USERS.sahith;
    setCurrentUser(user);
    try {
      await AsyncStorage.setItem('@haze_active_user', user.id);
    } catch (e) {}
    await loadUserData(user.id);
    setToastMessage({ type: 'info', text: `Switched profile to ${user.name}` });
  };

  // Change Streaming Quality
  const setStreamingQuality = async (qualityId) => {
    setStreamingQualityState(qualityId);
    setFlacEnabled(qualityId === '1411k');
    try {
      await AsyncStorage.setItem(`@haze_${currentUser.id}_quality`, qualityId);
    } catch (e) {}
    setToastMessage({ type: 'success', text: `Streaming quality set to ${qualityId === '1411k' ? 'FLAC Master' : qualityId.toUpperCase()}` });
  };

  // Change Download Quality
  const setDownloadQuality = async (qualityId) => {
    setDownloadQualityState(qualityId);
    try {
      await AsyncStorage.setItem(`@haze_${currentUser.id}_dl_quality`, qualityId);
    } catch (e) {}
    setToastMessage({ type: 'success', text: `Download quality set to ${qualityId === '1411k' ? 'FLAC Master' : qualityId.toUpperCase()}` });
  };

  const toggleFlac = () => {
    const nextQ = flacEnabled ? '320k' : '1411k';
    setStreamingQuality(nextQ);
  };

  // Search History Management (Isolated per user profile)
  const addSearchHistory = async (queryText) => {
    if (!queryText || !queryText.trim()) return;
    const clean = queryText.trim();
    const updated = [clean, ...searchHistory.filter(item => item.toLowerCase() !== clean.toLowerCase())].slice(0, 15);
    setSearchHistory(updated);
    try {
      await AsyncStorage.setItem(`@haze_${currentUser.id}_search_history`, JSON.stringify(updated));
    } catch (e) {}
  };

  const removeSearchHistory = async (queryText) => {
    const updated = searchHistory.filter(item => item !== queryText);
    setSearchHistory(updated);
    try {
      await AsyncStorage.setItem(`@haze_${currentUser.id}_search_history`, JSON.stringify(updated));
    } catch (e) {}
  };

  const clearSearchHistory = async () => {
    setSearchHistory([]);
    try {
      await AsyncStorage.removeItem(`@haze_${currentUser.id}_search_history`);
    } catch (e) {}
  };

  // Configure background audio mode and notification permissions on mount
  useEffect(() => {
    async function setupAudio() {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          try {
            await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
              {
                title: 'HAZE Music Playback Notification',
                message: 'HAZE needs notification access to show track controls on your lock screen and notification panel.',
                buttonPositive: 'Allow',
              }
            );
          } catch (e) {}
        }
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'duckOthers',
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
        const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
        }
      } catch (e) {}

      try {
        const savedUserId = await AsyncStorage.getItem('@haze_active_user');
        const activeId = savedUserId && USERS[savedUserId] ? savedUserId : 'sahith';
        const user = USERS[activeId];
        setCurrentUser(user);
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
          if (Array.isArray(vaultData.tracks)) setVaultTracks(vaultData.tracks);
          if (vaultData.storageUsed) setStorageUsed(vaultData.storageUsed);
          if (vaultData.storageTotal) setStorageTotal(vaultData.storageTotal);
          if (typeof vaultData.storagePercent === 'number') setStoragePercent(vaultData.storagePercent);
        }
      } catch (e) {}

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
          // Only initialize initial track if empty
          if (!currentTrack || currentTrack.id === INITIAL_TRACKS[0].id) {
            setCurrentTrack(mapped[0]);
          }
        }
      } catch (e) {}
    }
    loadInitialData();
  }, []);

  // Update Lock Screen & Notification metadata helper with async binding retries
  const updateLockScreenControls = useCallback((playerInstance, track, qualityLabel) => {
    if (!playerInstance) return;
    try {
      const displayTitle = track?.title || 'Unknown Title';
      const displayArtist = track?.artist || 'HAZE';
      const displayAlbum = track?.album || qualityLabel || 'HAZE Lossless Vault';
      const displayArtwork = track?.coverLarge || track?.cover || 'https://c.saavncdn.com/372/b7f9937fefd686876e90be4a96c9a6e9_500x500.jpg';

      const metadata = {
        title: displayTitle,
        artist: displayArtist,
        albumTitle: displayAlbum,
        artworkUrl: displayArtwork,
      };

      const options = {
        showNextTrack: true,
        showPreviousTrack: true,
        showSeekForward: true,
        showSeekBackward: true,
        seekForwardIntervalSeconds: 10,
        seekBackwardIntervalSeconds: 10,
      };

      // Call immediately
      playerInstance.setActiveForLockScreen(true, metadata, options);

      // Retry after service binds asynchronously
      setTimeout(() => {
        try {
          if (soundRef.current === playerInstance) {
            playerInstance.setActiveForLockScreen(true, metadata, options);
          }
        } catch (e) {}
      }, 600);

      setTimeout(() => {
        try {
          if (soundRef.current === playerInstance) {
            playerInstance.setActiveForLockScreen(true, metadata, options);
          }
        } catch (e) {}
      }, 1800);
    } catch (lockErr) {
      console.warn('[PlayerContext] setActiveForLockScreen warning:', lockErr.message);
    }
  }, []);

  // Play track with STRICT OVERLAP PREVENTION and context-aware queue
  const playTrack = async (track, contextQueue = null) => {
    if (!track) return;

    // Increment request ID to invalidate any prior in-flight audio resolutions
    const currentReqId = ++playbackRequestIdRef.current;

    // Immediately stop and destroy existing player
    if (soundRef.current) {
      try {
        soundRef.current.pause();
        soundRef.current.remove();
      } catch (e) {}
      soundRef.current = null;
    }

    // Set queue to the specific context if passed (e.g. from liked, search, album)
    if (contextQueue && Array.isArray(contextQueue) && contextQueue.length > 0) {
      setQueue(contextQueue);
    }

    const isDownloadedItem = downloadedTracks.find(d => d.id === track.id);
    const resolvedQuality = isDownloadedItem
      ? `${isDownloadedItem.qualityLabel} · Offline`
      : streamingQuality === '1411k'
      ? '1,411 kbps · Lossless FLAC'
      : `${streamingQuality.toUpperCase()} · Studio Master`;

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

    recentHistoryRef.current = [track.id, ...recentHistoryRef.current.filter(id => id !== track.id)].slice(0, 20);

    // Fetch synced lyrics concurrently
    fetchLyrics(track).then(setLiveLyrics);

    try {
      let audioUriToPlay = null;

      // 1. Offline local file
      if (isDownloadedItem && isDownloadedItem.localAudioUri) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(isDownloadedItem.localAudioUri);
          if (fileInfo.exists && fileInfo.size > 5000) {
            audioUriToPlay = isDownloadedItem.localAudioUri;
            console.log(`[PlayerContext] Playing offline local file: ${audioUriToPlay}`);
          }
        } catch (e) {}
      }

      // 2. Remote stream
      let fallbackUrl = null;
      let isActuallyFlac = false;
      if (!audioUriToPlay) {
        console.log(`[PlayerContext] Resolving audio stream for: "${track.title}" by ${track.artist} (${resolvedQuality})`);
        const streamResult = await resolveAudioStream(track, { quality: streamingQuality });
        audioUriToPlay = typeof streamResult === 'string' ? streamResult : streamResult?.streamUrl;
        fallbackUrl = typeof streamResult === 'object' ? streamResult?.fallbackUrl : null;
        isActuallyFlac = !!(audioUriToPlay && audioUriToPlay.includes('/api/tg-stream/'));

        // If user requested FLAC (1411k), but audio resolved to 320k Studio Master (not in Vault)
        if (streamingQuality === '1411k' && !isActuallyFlac && !isDownloadedItem) {
          console.log('[PlayerContext] FLAC not in Vault, playing 320k Studio Master');
          setToastMessage({ type: 'info', text: '⚡ FLAC not in Vault · Playing 320 kbps Studio Master' });
          setCurrentTrack(prev => ({
            ...prev,
            qualityLabel: '320 kbps · Studio Master',
            isFlac: false,
          }));
        } else if (isActuallyFlac) {
          setCurrentTrack(prev => ({
            ...prev,
            qualityLabel: '1,411 kbps · Pure Lossless FLAC Master',
            isFlac: true,
          }));
        }
      }

      // Check if a newer track was tapped while we were waiting on network!
      if (currentReqId !== playbackRequestIdRef.current) {
        console.log(`[PlayerContext] Aborted play request #${currentReqId} (newer request #${playbackRequestIdRef.current} active).`);
        return;
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

        // Double check request ID before attaching
        if (currentReqId !== playbackRequestIdRef.current) {
          try { player.remove(); } catch (e) {}
          return;
        }

        soundRef.current = player;
        updateLockScreenControls(player, track, resolvedQuality);

        player.addListener('playbackStatusUpdate', async (status) => {
          if (currentReqId !== playbackRequestIdRef.current) return;

          if (status.error) {
            console.warn('[PlayerContext] Audio status error:', status.error);
            // 1. Direct Saavn Akamai CDN instant recovery
            try {
              console.log('[PlayerContext] Direct Saavn recovery for:', track.title);
              const directSaavn = await resolveDirectSaavnAudio(track.title, track.artist);
              if (directSaavn && directSaavn.streamUrl) {
                player.replace({
                  uri: directSaavn.streamUrl,
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                  },
                });
                player.play();
                setIsPlaying(true);
                return;
              }
            } catch (e) {}

            // 2. Try pre-resolved fallbackUrl
            if (fallbackUrl && fallbackUrl !== audioUriToPlay) {
              try {
                console.log('[PlayerContext] Recovering audio with fallbackUrl:', fallbackUrl);
                player.replace({
                  uri: fallbackUrl,
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                  },
                });
                player.play();
                setIsPlaying(true);
                return;
              } catch (e) {}
            }
          }

          if (status.isLoaded) {
            setIsLoadingAudio(false);
          }

          if (status.isBuffering) {
            setIsLoadingAudio(true);
          } else {
            setIsLoadingAudio(false);
            if (status.playing !== undefined) {
              setIsPlaying(status.playing);
            }
          }

          if (typeof status.currentTime === 'number') {
            setPosition(Math.round(status.currentTime));
          }
          if (status.duration) {
            setDuration(Math.round(status.duration));
          }
          if (status.didJustFinish) {
            // Guard against premature finish triggers when stream fails to load
            if (status.currentTime > 5 || (status.duration && status.duration > 10)) {
              handleTrackFinish();
            } else {
              // Stream dropped or finished prematurely (< 5s), recover immediately with direct 320k Saavn stream!
              try {
                console.log('[PlayerContext] Premature finish detected (< 5s). Auto-recovering with direct Saavn stream...');
                resolveDirectSaavnAudio(track.title, track.artist).then((directRes) => {
                  const directUrl = directRes?.streamUrl;
                  if (directUrl && directUrl !== audioUriToPlay) {
                    player.replace({
                      uri: directUrl,
                      headers: {
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                      },
                    });
                    player.play();
                    setIsPlaying(true);
                  }
                });
              } catch (e) {}
            }
          }
        });

        player.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('[PlayerContext] Audio playback error:', err.message);
    } finally {
      if (currentReqId === playbackRequestIdRef.current) {
        setIsLoadingAudio(false);
      }
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
      playTrack(currentTrack);
    }
  };

  const seekTo = (seconds) => {
    if (soundRef.current) {
      try {
        soundRef.current.seekTo(seconds);
        setPosition(seconds);
      } catch (e) {
        console.warn('Seek error:', e.message);
      }
    }
  };

  /**
   * VIBE & CONTEXT-AWARE SMART RECOMMENDATION ALGORITHM
   * 1. Same artist / album context matching first.
   * 2. User liked library affinity.
   * 3. Background dynamic similar artist fetch when queue runs low (NEVER random top trends!).
   */
  const getSmartNextTrack = useCallback(async () => {
    if (!queue || queue.length === 0) return currentTrack;
    if (queue.length === 1) return queue[0];

    const currentArtist = (currentTrack?.artist || '').toLowerCase().trim();
    const currentAlbum = (currentTrack?.album || '').toLowerCase().trim();
    const recentSet = new Set(recentHistoryRef.current);
    const likedIds = new Set(likedTracks.map(t => t.id));

    // Candidates in current context (excluding recently played)
    let candidates = queue.filter(t => t.id !== currentTrack?.id && !recentSet.has(t.id));
    if (candidates.length === 0) {
      candidates = queue.filter(t => t.id !== currentTrack?.id);
    }

    if (candidates.length > 0) {
      const scored = candidates.map(t => {
        let score = 10;
        const tArtist = (t.artist || '').toLowerCase().trim();
        const tAlbum = (t.album || '').toLowerCase().trim();

        // Same artist heavy boost
        if (tArtist && currentArtist && (tArtist.includes(currentArtist) || currentArtist.includes(tArtist))) {
          score += 60;
        }
        // Same album boost
        if (tAlbum && currentAlbum && tAlbum === currentAlbum) {
          score += 40;
        }
        // User liked affinity
        if (likedIds.has(t.id)) {
          score += 25;
        }
        // Duration similarity (vibe pace)
        const diff = Math.abs((t.duration || 210) - (currentTrack?.duration || 210));
        if (diff < 40) score += 10;

        score += Math.random() * 8;
        return { track: t, score };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored[0]?.track;
    }

    // Dynamic similar music fallback from backend
    if (currentTrack?.artist) {
      try {
        const related = await searchTracks(currentTrack.artist);
        const validRelated = (related || []).filter(t => t.id !== currentTrack.id && !recentSet.has(t.id));
        if (validRelated.length > 0) {
          setQueue(prev => [...prev, ...validRelated.slice(0, 8)]);
          return validRelated[0];
        }
      } catch (e) {}
    }

    return currentTrack;
  }, [queue, currentTrack, likedTracks]);

  const nextTrack = async () => {
    if (isShuffle) {
      const smartNext = await getSmartNextTrack();
      if (smartNext) {
        playTrack(smartNext);
        return;
      }
    }

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex >= 0 && currentIndex + 1 < queue.length) {
      playTrack(queue[currentIndex + 1]);
    } else {
      // Find similar vibe rather than jumping to trend #0
      const smartNext = await getSmartNextTrack();
      if (smartNext) playTrack(smartNext);
    }
  };

  const previousTrack = () => {
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    } else if (position > 5) {
      seekTo(0);
    } else {
      playTrack(queue[queue.length - 1]);
    }
  };

  const handleTrackFinish = () => {
    if (isRepeat) {
      seekTo(0);
      if (soundRef.current) soundRef.current.play();
    } else {
      nextTrack();
    }
  };

  // Toggle Liked Song (Isolated per user profile, robust to track object or ID string)
  const toggleLike = async (trackOrId) => {
    let targetTrack = null;
    if (typeof trackOrId === 'string') {
      targetTrack = (currentTrack?.id === trackOrId ? currentTrack : null) ||
                    queue.find(t => t.id === trackOrId) ||
                    likedTracks.find(t => t.id === trackOrId) ||
                    INITIAL_TRACKS.find(t => t.id === trackOrId);
    } else if (trackOrId && typeof trackOrId === 'object') {
      targetTrack = trackOrId;
    } else {
      targetTrack = currentTrack;
    }
    if (!targetTrack || !targetTrack.id) return;

    const isCurrentlyLiked = likedTracks.some(t => t.id === targetTrack.id);
    let updatedLikes;
    if (isCurrentlyLiked) {
      updatedLikes = likedTracks.filter(t => t.id !== targetTrack.id);
      setToastMessage({ type: 'info', text: `Removed "${targetTrack.title}" from Liked Songs` });
    } else {
      const likedItem = {
        ...targetTrack,
        isLiked: true,
        likedAt: new Date().toISOString(),
      };
      updatedLikes = [likedItem, ...likedTracks];
      setToastMessage({ type: 'success', text: `Added "${targetTrack.title}" to Liked Songs` });
    }

    setLikedTracks(updatedLikes);
    const likesKey = `@haze_${currentUser.id}_likes`;
    try {
      await AsyncStorage.setItem(likesKey, JSON.stringify(updatedLikes));
    } catch (e) {}

    if (currentTrack?.id === targetTrack.id) {
      setCurrentTrack(prev => ({ ...prev, isLiked: !isCurrentlyLiked }));
    }
  };

  const promptAddToPlaylist = (track) => {
    setPlaylistModalTrack(track || currentTrack);
    setShowAddToPlaylistModal(true);
  };

  // Playlist Management (Isolated per user profile)
  const createPlaylist = async (name, description = '', initialTracks = []) => {
    if (!name || !name.trim()) return null;
    const tracksArray = Array.isArray(initialTracks) ? initialTracks : (initialTracks ? [initialTracks] : []);
    const firstCover = tracksArray.length > 0 && tracksArray[0].cover
      ? tracksArray[0].cover
      : 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3d/9d/d0/3d9dd0a3-e5e6-73d3-f938-e2182b810928/190295851286.jpg/600x600bb.jpg';

    const newPlaylist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      cover: firstCover,
      tracks: tracksArray,
    };

    const updated = [newPlaylist, ...userPlaylists];
    setUserPlaylists(updated);
    try {
      await AsyncStorage.setItem(`@haze_${currentUser.id}_playlists`, JSON.stringify(updated));
    } catch (e) {
      console.error('[Playlist] Save error:', e);
    }
    setToastMessage({ type: 'success', text: `Created playlist "${name}"` });
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
    if (!playlistId || !track) return;
    let targetName = 'Playlist';
    let alreadyExists = false;

    const updated = userPlaylists.map(pl => {
      if (pl.id === playlistId) {
        targetName = pl.name;
        if (pl.tracks && pl.tracks.some(t => t.id === track.id)) {
          alreadyExists = true;
          return pl;
        }
        const existingTracks = pl.tracks || [];
        return {
          ...pl,
          tracks: [track, ...existingTracks],
          cover: track.cover || pl.cover,
        };
      }
      return pl;
    });

    if (alreadyExists) {
      setToastMessage({ type: 'info', text: `Already in "${targetName}"` });
      return;
    }

    setUserPlaylists(updated);
    try {
      await AsyncStorage.setItem(`@haze_${currentUser.id}_playlists`, JSON.stringify(updated));
      setToastMessage({ type: 'success', text: `Added to "${targetName}"` });
    } catch (e) {
      console.error('[Playlist] Add track error:', e);
    }
  };

  const removeTrackFromPlaylist = async (playlistId, trackId) => {
    const updated = userPlaylists.map(pl => {
      if (pl.id === playlistId) {
        return {
          ...pl,
          tracks: pl.tracks.filter(t => t.id !== trackId),
        };
      }
      return pl;
    });

    setUserPlaylists(updated);
    try {
      await AsyncStorage.setItem(`@haze_${currentUser.id}_playlists`, JSON.stringify(updated));
    } catch (e) {}
  };

  const isTrackLiked = (trackId) => likedTracks.some(t => t.id === trackId);

  // ROBUST OFFLINE DOWNLOAD WITH DIRECT HEADERS & PROXY FALLBACK
  const downloadTrack = async (track) => {
    const target = track || currentTrack;
    if (!target) return;

    if (downloadedTracks.some(d => d.id === target.id)) {
      setToastMessage({ type: 'info', text: `"${target.title}" is already downloaded.` });
      return;
    }

    setDownloadProgress(prev => ({ ...prev, [target.id]: { status: 'downloading', percent: 0 } }));
    setToastMessage({ type: 'progress', text: `Downloading "${target.title}" (${downloadQuality === '1411k' ? 'FLAC Master' : 'Studio 320k'})...` });

    try {
      const dirInfo = await FileSystem.getInfoAsync(OFFLINE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(OFFLINE_DIR, { intermediates: true });
      }

      const isFlacDl = downloadQuality === '1411k';
      const fileExt = isFlacDl ? 'flac' : 'mp4';
      const qualityTag = isFlacDl ? '1,411 kbps · Lossless FLAC Master' : '320 kbps · Studio Master';

      console.log(`[Download] Resolving audio stream for download: "${target.title}" (${qualityTag})`);
      const streamRes = await resolveAudioStream(target, { quality: downloadQuality });
      let streamUrl = typeof streamRes === 'string' ? streamRes : streamRes?.streamUrl;

      if (!streamUrl) {
        throw new Error('Failed to obtain stream URL');
      }

      if (!streamUrl.startsWith('http')) {
        streamUrl = `${API_BASE_URL}${streamUrl.startsWith('/') ? '' : '/'}${streamUrl}`;
      }

      const safeId = String(target.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const localAudioPath = `${OFFLINE_DIR}${safeId}_${currentUser.id}.${fileExt}`;
      const localCoverPath = `${OFFLINE_DIR}${safeId}_cover.jpg`;

      const downloadHeaders = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': '*/*',
      };

      let downloadRes = null;
      try {
        downloadRes = await FileSystem.downloadAsync(streamUrl, localAudioPath, {
          headers: downloadHeaders,
        });
      } catch (primaryDlErr) {
        console.warn('[Download] Primary download attempt warning:', primaryDlErr.message);
      }

      // If direct CDN blocked with 403, retry through backend proxy
      if (downloadRes && downloadRes.status >= 400 && !streamUrl.includes('/api/')) {
        try {
          const proxyUrl = `${API_BASE_URL}/api/proxy-stream?url=${encodeURIComponent(streamUrl)}`;
          downloadRes = await FileSystem.downloadAsync(proxyUrl, localAudioPath, {
            headers: downloadHeaders,
          });
        } catch (proxyErr) {}
      }

      // If primary stream failed or returned HTTP 500, auto-recover instantly via direct Saavn CDN!
      if (!downloadRes || downloadRes.status >= 400) {
        console.log('[Download] Auto-recovering download via direct Saavn Akamai CDN...');
        try {
          const directSaavn = await resolveDirectSaavnAudio(target.title, target.artist);
          if (directSaavn && directSaavn.streamUrl) {
            downloadRes = await FileSystem.downloadAsync(directSaavn.streamUrl, localAudioPath, {
              headers: downloadHeaders,
            });
          }
        } catch (directErr) {
          console.warn('[Download] Direct fallback error:', directErr.message);
        }
      }

      if (!downloadRes || downloadRes.status >= 400) {
        throw new Error(`Download HTTP error ${downloadRes?.status || 500}`);
      }

      const fileInfo = await FileSystem.getInfoAsync(localAudioPath);
      if (!fileInfo.exists || (fileInfo.size || 0) < 1000) {
        throw new Error('Downloaded audio file is invalid');
      }

      // Download cover art
      let localCoverUri = target.cover || '';
      if (target.cover && target.cover.startsWith('http')) {
        try {
          const coverRes = await FileSystem.downloadAsync(target.cover, localCoverPath);
          localCoverUri = coverRes.uri;
        } catch (e) {}
      }

      const downloadRecord = {
        ...target,
        localAudioUri: downloadRes.uri,
        localCoverUri,
        qualityLabel: qualityTag,
        isFlac: isFlacDl,
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
      setToastMessage({ type: 'success', text: `✓ Saved "${target.title}" offline (${(fileInfo.size / (1024 * 1024)).toFixed(1)} MB)` });
    } catch (err) {
      console.error('[Download] Error downloading track:', err);
      setDownloadProgress(prev => ({ ...prev, [target.id]: { status: 'failed', error: err.message } }));
      setToastMessage({ type: 'error', text: `Download failed: ${err.message}` });
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
    setToastMessage({ type: 'info', text: 'Removed from offline downloads' });
  };

  const isTrackDownloaded = (trackId) => downloadedTracks.some(d => d.id === trackId);

  const saveToVault = async (track) => {
    const target = track || currentTrack;
    if (!target) return;
    try {
      setToastMessage({ type: 'progress', text: `Archiving "${target.title}" to Telegram Cloud...` });
      const res = await saveTrackToVault(target);
      if (res.success) {
        setToastMessage({ type: 'success', text: `✓ Archived to Telegram FLAC Vault!` });
        const updatedVault = await fetchVaultList();
        if (updatedVault?.tracks) setVaultTracks(updatedVault.tracks);
      }
    } catch (e) {
      setToastMessage({ type: 'error', text: 'Failed to archive track' });
    }
  };

  const clearQueue = () => setQueue([]);
  const shuffleQueue = () => setIsShuffle(prev => !prev);

  return (
    <PlayerContext.Provider
      value={{
        currentUser,
        switchUser,
        flacEnabled,
        toggleFlac,
        streamingQuality,
        downloadQuality,
        setStreamingQuality,
        setDownloadQuality,
        showQualityModal,
        setShowQualityModal,
        qualityModalMode,
        setQualityModalMode,
        searchHistory,
        addSearchHistory,
        removeSearchHistory,
        clearSearchHistory,
        toastMessage,
        setToastMessage,
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
        setLiveLyrics,
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
        showAddToPlaylistModal,
        setShowAddToPlaylistModal,
        playlistModalTrack,
        promptAddToPlaylist,
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
