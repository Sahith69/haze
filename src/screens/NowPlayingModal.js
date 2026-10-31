import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronDown,
  MoreHorizontal,
  Heart,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export const NowPlayingModal = () => {
  const {
    currentTrack,
    isPlaying,
    isLoadingAudio,
    position,
    duration,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    toggleLike,
    saveToVault,
    isShuffle,
    isRepeat,
    shuffleQueue,
    setIsRepeat,
    setActiveModal,
    closeModal,
    currentUser,
    flacEnabled,
    toggleFlac,
  } = usePlayer();

  const [vaultFeedback, setVaultFeedback] = useState('');
  const [scrubberWidth, setScrubberWidth] = useState(width - 48);

  const handleSeek = (e) => {
    if (!duration || scrubberWidth <= 0) return;
    const clickX = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(clickX / scrubberWidth, 1));
    const targetSeconds = Math.round(ratio * duration);
    seekTo(targetSeconds);
  };

  const [visualizerHeights, setVisualizerHeights] = useState([
    10, 18, 28, 14, 32, 22, 12, 26, 18, 30, 14, 22, 8, 28, 18, 24, 12, 20
  ]);

  // Animate visualizer bars when playing
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setVisualizerHeights(prev =>
          prev.map(() => Math.floor(Math.random() * 26) + 6)
        );
      }, 140);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  if (!currentTrack) return null;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const artSize = Math.min(width - 56, 340);

  return (
    <View style={styles.modalOverlay}>
      {/* Background Dynamic Atmospheric Gradient */}
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.40)', 'rgba(236, 72, 153, 0.20)', '#08080C']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.75 }}
      />

      <View style={styles.content}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={closeModal}>
            <ChevronDown size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerSuper}>PLAYING FROM</Text>
            <Text style={styles.headerTitle}>Trending Masters</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <MoreHorizontal size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Centered Large Album Artwork */}
        <View style={styles.artContainer}>
          <View style={[styles.artWrapper, { width: artSize, height: artSize }]}>
            {currentTrack.coverLarge || currentTrack.cover ? (
              <Image
                source={{ uri: currentTrack.coverLarge || currentTrack.cover }}
                style={styles.albumArt}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={currentTrack.gradient || ['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.albumArt}
              />
            )}
          </View>
        </View>

        {/* Track Title, Artist & Like Button */}
        <View style={styles.metaRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => toggleLike(currentTrack.id)}
          >
            <Heart
              size={26}
              color={currentTrack.isLiked ? '#EC4899' : '#FFFFFF'}
              fill={currentTrack.isLiked ? '#EC4899' : 'none'}
            />
          </TouchableOpacity>
        </View>

        {/* Audiophile Status Badge */}
        <View style={styles.badgeRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.hiResBadge,
              flacEnabled && styles.hiResBadgeFlac,
            ]}
            onPress={() => {
              if (currentUser.id === 'kritika') {
                toggleFlac();
                setVaultFeedback(flacEnabled ? 'Switched to Studio Master' : '⚡ Lossless FLAC Enabled!');
                setTimeout(() => setVaultFeedback(''), 2500);
              } else {
                saveToVault(currentTrack);
                setVaultFeedback('Saved to Lossless FLAC Vault!');
                setTimeout(() => setVaultFeedback(''), 2500);
              }
            }}
          >
            <Text style={[styles.hiResText, flacEnabled && styles.hiResTextFlac]}>
              {flacEnabled ? '⚡ LOSSLESS FLAC MASTER' : '✨ STUDIO MASTER 320k'}
            </Text>
          </TouchableOpacity>

          {currentUser.id === 'kritika' && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.flacPill,
                flacEnabled ? styles.flacPillActive : styles.flacPillInactive,
              ]}
              onPress={() => {
                toggleFlac();
                setVaultFeedback(flacEnabled ? 'Switched to Studio Master' : '⚡ Lossless FLAC Enabled!');
                setTimeout(() => setVaultFeedback(''), 2500);
              }}
            >
              <Text style={[styles.flacPillText, flacEnabled && styles.flacPillTextActive]}>
                {flacEnabled ? 'FLAC ON' : 'Tap for FLAC ⚡'}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.qualityLabel} numberOfLines={1}>
            {vaultFeedback || (flacEnabled ? '1,411 kbps · 24-bit' : '320 kbps · 48 kHz')}
          </Text>
        </View>

        {/* Scrubber Progress Bar */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.scrubberContainer}
          onLayout={(e) => setScrubberWidth(e.nativeEvent.layout.width)}
          onPress={handleSeek}
        >
          <View style={styles.scrubberTrack}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.scrubberFill, { width: `${progressPercent}%` }]}
            />
            <View style={[styles.scrubberThumb, { left: `${progressPercent}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </TouchableOpacity>

        {/* Playback Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={shuffleQueue}
          >
            <Shuffle
              size={22}
              color={isShuffle ? '#EC4899' : 'rgba(255, 255, 255, 0.7)'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={previousTrack}>
            <SkipBack size={28} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.playPauseBtn}
            onPress={togglePlayPause}
          >
            {isLoadingAudio ? (
              <ActivityIndicator size="small" color="#08080C" />
            ) : isPlaying ? (
              <Pause size={30} color="#08080C" fill="#08080C" />
            ) : (
              <Play size={30} color="#08080C" fill="#08080C" style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={nextTrack}>
            <SkipForward size={28} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsRepeat(prev => !prev)}
          >
            <Repeat
              size={22}
              color={isRepeat ? '#EC4899' : 'rgba(255, 255, 255, 0.7)'}
            />
          </TouchableOpacity>
        </View>

        {/* 18-Bar Live Audio Visualizer */}
        <View style={styles.visualizerRow}>
          {visualizerHeights.map((h, idx) => (
            <View key={idx} style={[styles.visualizerBar, { height: h }]} />
          ))}
        </View>

        {/* Quick Modal Action Pills */}
        <View style={styles.actionPillsRow}>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => setActiveModal('lyrics')}
          >
            <Text style={styles.actionPillText}>Lyrics</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => setActiveModal('queue')}
          >
            <Text style={styles.actionPillText}>Queue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => setActiveModal('equalizer')}
          >
            <Text style={styles.actionPillText}>Equalizer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#08080C',
    zIndex: 100,
  },
  content: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 28,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSuper: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  artWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  albumArt: {
    width: '100%',
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  trackArtist: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 3,
  },
  likeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  hiResBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  hiResBadgeFlac: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  hiResText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#06B6D4',
    letterSpacing: 0.6,
  },
  hiResTextFlac: {
    color: '#F59E0B',
  },
  flacPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  flacPillActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
  },
  flacPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  flacPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  flacPillTextActive: {
    color: '#F59E0B',
  },
  qualityLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  scrubberContainer: {
    marginTop: 14,
  },
  scrubberTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
  },
  scrubberFill: {
    height: 4,
    borderRadius: 2,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginLeft: -6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: colors.textDim,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  playPauseBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    height: 32,
    marginVertical: 4,
  },
  visualizerBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  actionPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionPill: {
    height: 36,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
