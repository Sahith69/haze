import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
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
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

export const NowPlayingModal = () => {
  const {
    currentTrack,
    isPlaying,
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
    12, 22, 30, 18, 34, 26, 14, 28, 20, 32, 16, 24, 10, 30, 22,
  ]);

  // Animate visualizer bars when playing
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setVisualizerHeights(prev =>
          prev.map(() => Math.floor(Math.random() * 26) + 8)
        );
      }, 150);
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

  return (
    <View style={styles.modalOverlay}>
      {/* Background Atmosphere Radial Gradient */}
      <LinearGradient
        colors={['rgba(255, 92, 158, 0.40)', 'rgba(124, 92, 255, 0.20)', 'rgba(11, 11, 15, 0.95)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0.15 }}
        end={{ x: 0.5, y: 0.85 }}
      />

      <View style={styles.content}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={closeModal}>
            <ChevronDown size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Playing from Trending</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <MoreHorizontal size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 342px Glowing Artwork */}
        <View style={styles.artShadowContainer}>
          {currentTrack.coverLarge || currentTrack.cover ? (
            <Image
              source={{ uri: currentTrack.coverLarge || currentTrack.cover }}
              style={styles.albumArt}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={currentTrack.gradient || ['#7C5CFF', '#FF5C9E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.albumArt}
            />
          )}
        </View>

        {/* Track Title, Artist & Like Button */}
        <View style={styles.metaRow}>
          <View style={{ flex: 1 }}>
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
              size={28}
              color={currentTrack.isLiked ? colors.accentPink : '#FFFFFF'}
              fill={currentTrack.isLiked ? colors.accentPink : 'none'}
            />
          </TouchableOpacity>
        </View>

        {/* HI-RES Golden Badge & Specs (Interactive Cloud Vault Tap) */}
        <View style={styles.badgeRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.hiResBadge}
            onPress={() => {
              saveToVault(currentTrack);
              setVaultFeedback('Saved to Cloud Vault!');
              setTimeout(() => setVaultFeedback(''), 2500);
            }}
          >
            <Text style={styles.hiResText}>⚡ HI-RES</Text>
          </TouchableOpacity>
          <Text style={styles.qualityLabel}>
            {vaultFeedback || currentTrack.qualityLabel}
          </Text>
        </View>

        {/* Scrubber Progress Bar with Tap-to-Seek */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.scrubberContainer}
          onLayout={(e) => setScrubberWidth(e.nativeEvent.layout.width)}
          onPress={handleSeek}
        >
          <View style={styles.scrubberTrack}>
            <View style={[styles.scrubberFill, { width: `${progressPercent}%` }]} />
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
              color={isShuffle ? colors.accentPink : '#FFFFFF'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={previousTrack}>
            <SkipBack size={28} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.playPauseBtn}
            onPress={togglePlayPause}
          >
            {isPlaying ? (
              <Pause size={30} color={colors.bg} fill={colors.bg} />
            ) : (
              <Play size={30} color={colors.bg} fill={colors.bg} />
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
              color={isRepeat ? colors.accentPink : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* 15-Bar Live Audio Visualizer */}
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
            <Text style={styles.actionPillText}>EQ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => {
              setVisualizerHeights(prev => prev.map(v => (v > 20 ? 10 : 34)));
            }}
          >
            <Text style={styles.actionPillText}>Visual</Text>
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
    backgroundColor: colors.bg,
    zIndex: 100,
  },
  content: {
    flex: 1,
    paddingTop: 52,
    paddingHorizontal: 24,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSub,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artShadowContainer: {
    alignItems: 'center',
    marginTop: 14,
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.55,
    shadowRadius: 35,
    elevation: 25,
  },
  albumArt: {
    width: width > 400 ? 342 : width - 48,
    height: width > 400 ? 342 : width - 48,
    borderRadius: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.text,
  },
  trackArtist: {
    fontSize: 16,
    color: colors.textSub,
    marginTop: 2,
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
    backgroundColor: colors.gold,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hiResText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.goldDark,
    letterSpacing: 0.6,
  },
  qualityLabel: {
    fontSize: 12,
    color: colors.textSub,
  },
  scrubberContainer: {
    marginTop: 20,
  },
  scrubberTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    position: 'relative',
  },
  scrubberFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
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
    color: colors.textSub,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  playPauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
    height: 34,
    marginTop: 14,
  },
  visualizerBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  actionPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  actionPill: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.glassBgActive,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
