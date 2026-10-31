import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
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
    id: 'track-1',
    title: 'Midnight Drive',
    artist: 'Nova Lane',
    album: 'Neon Horizon',
    duration: 216,
    isHiRes: true,
    qualityLabel: '48 kHz · Cloud Vault',
    gradient: ['#7C5CFF', '#FF5C9E'],
    isLiked: true,
    inVault: true,
  },
  {
    id: 'track-2',
    title: 'Glass Hours',
    artist: 'Kite & Ember',
    album: 'Reflections',
    duration: 194,
    isHiRes: true,
    qualityLabel: '48 kHz · Cloud Vault',
    gradient: ['#FF9A3C', '#FF3C6E'],
    isLiked: false,
    inVault: true,
  },
  {
    id: 'track-3',
    title: 'Low Tide',
    artist: 'Sora Vale',
    album: 'Deep Water',
    duration: 242,
    isHiRes: true,
    qualityLabel: '48 kHz · Cloud Vault',
    gradient: ['#18C8A8', '#2A6BFF'],
    isLiked: true,
    inVault: true,
  },
  {
    id: 'track-4',
    title: 'Golden Static',
    artist: 'The Hollows',
    album: 'Signal Lost',
    duration: 188,
    isHiRes: true,
    qualityLabel: '48 kHz · Cloud Vault',
    gradient: ['#F5B942', '#C2410C'],
    isLiked: false,
    inVault: true,
  },
  {
    id: 'track-5',
    title: 'Paper Planes',
    artist: 'Iris Moon',
    album: 'Skylines',
    duration: 205,
    isHiRes: true,
    qualityLabel: '48 kHz · Cloud Vault',
    gradient: ['#3B3B5C', '#8B7CFF'],
    isLiked: false,
    inVault: true,
  },
];

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(216);
  const [queue, setQueue] = useState(INITIAL_TRACKS);
  const [vaultTracks, setVaultTracks] = useState(INITIAL_TRACKS);
  const [storageUsed, setStorageUsed] = useState('1.4 GB');
  const [storageTotal, setStorageTotal] = useState('10 GB');
  const [activeTab, setActiveTab] = useState('home');
  const [activeModal, setActiveModal] = useState(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [liveLyrics, setLiveLyrics] = useState({ synced: [], plain: '' });
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Equalizer state matching 08_Equalizer
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

  // Configure background audio mode
  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn('Audio mode setup:', e);
      }
    }
    setupAudio();
  }, []);

  // Fetch initial Vault and Trending data from backend
  useEffect(() => {
    async function loadInitialData() {
      const vaultData = await fetchVaultList();
      if (vaultData.tracks && vaultData.tracks.length > 0) {
        setVaultTracks(vaultData.tracks);
        setStorageUsed(vaultData.storageUsed || '1.4 GB');
      }

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
      }
    }
    loadInitialData();
  }, []);

  // Play a track and resolve actual audio stream
  const playTrack = async (track) => {
    if (!track) return;
    setCurrentTrack(track);
    setIsPlaying(true);
    setPosition(0);
    setDuration(track.duration || 216);
    setIsLoadingAudio(true);

    // Fetch lyrics concurrently
    fetchLyrics(track).then(setLiveLyrics);

    try {
      if (soundRef.current) {
        try {
          await soundRef.current.unloadAsync();
        } catch (e) {}
        soundRef.current = null;
      }

      console.log(`[Player] Resolving audio stream for: "${track.title}" by ${track.artist}`);
      const streamUrl = await resolveAudioStream(track);
      console.log(`[Player] Resolved stream URL:`, streamUrl);

      if (streamUrl) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true, progressUpdateIntervalMillis: 500 },
          onPlaybackStatusUpdate
        );
        soundRef.current = sound;
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('[Player] Audio playback error:', err.message);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) return;
    setIsPlaying(status.isPlaying);
    setPosition(Math.round(status.positionMillis / 1000));
    if (status.durationMillis) {
      setDuration(Math.round(status.durationMillis / 1000));
    }
    if (status.didJustFinish) {
      nextTrack();
    }
  };

  const togglePlayPause = async () => {
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
          return;
        }
      } catch (e) {
        console.warn('Playback toggle error:', e.message);
      }
    } else if (currentTrack) {
      await playTrack(currentTrack);
      return;
    }
    setIsPlaying(prev => !prev);
  };


  const seekTo = async (seconds) => {
    setPosition(seconds);
    if (soundRef.current) {
      try {
        await soundRef.current.setPositionAsync(seconds * 1000);
      } catch (e) {}
    }
  };

  const nextTrack = () => {
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % queue.length;
    playTrack(queue[nextIndex]);
  };

  const previousTrack = () => {
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    playTrack(queue[prevIndex]);
  };

  const toggleLike = (trackId) => {
    const update = t => (t.id === trackId ? { ...t, isLiked: !t.isLiked } : t);
    setQueue(prev => prev.map(update));
    setVaultTracks(prev => prev.map(update));
    if (currentTrack?.id === trackId) {
      setCurrentTrack(prev => ({ ...prev, isLiked: !prev.isLiked }));
    }
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

    // Call backend API to save to Cloudflare R2
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
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoadingAudio,
        position,
        duration,
        queue,
        vaultTracks,
        storageUsed,
        storageTotal,
        activeTab,
        activeModal,
        isShuffle,
        isRepeat,
        liveLyrics,
        eqPreset,
        eqBands,
        volumeLeveling,
        setActiveTab,
        setActiveModal,
        closeModal: () => setActiveModal(null),
        playTrack,
        togglePlayPause,
        nextTrack,
        previousTrack,
        seekTo,
        toggleLike,
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
