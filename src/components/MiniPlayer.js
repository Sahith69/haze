import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Animated } from 'react-native';
import { Play, Pause, Heart } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const MiniPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    setActiveModal,
    isLoadingAudio,
    flacEnabled,
    toggleLike,
  } = usePlayer();

  // Animated Live Equalizer Bars
  const bar1 = useRef(new Animated.Value(4)).current;
  const bar2 = useRef(new Animated.Value(12)).current;
  const bar3 = useRef(new Animated.Value(7)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlaying) {
      const createLoop = (val, min, max, duration) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: max, duration, useNativeDriver: false }),
            Animated.timing(val, { toValue: min, duration, useNativeDriver: false }),
          ])
        );
      };
      const anim1 = createLoop(bar1, 3, 16, 290);
      const anim2 = createLoop(bar2, 4, 18, 220);
      const anim3 = createLoop(bar3, 3, 14, 260);
      anim1.start();
      anim2.start();
      anim3.start();
      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    } else {
      bar1.setValue(4);
      bar2.setValue(6);
      bar3.setValue(4);
    }
  }, [isPlaying]);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const handlePlayPress = () => {
    Animated.sequence([
      Animated.timing(playBtnScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(playBtnScale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }),
    ]).start();
    togglePlayPause();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={styles.container}
      onPress={() => setActiveModal('now_playing')}
    >
      {/* 44px Album Artwork Thumbnail with Overlay Visualizer */}
      <View style={styles.artWrapper}>
        <Image
          source={{ uri: currentTrack.cover || 'https://via.placeholder.com/60' }}
          style={styles.albumArt}
        />
        {isPlaying && (
          <View style={styles.artOverlayVisualizer}>
            <Animated.View style={[styles.visualizerBar, { height: bar1 }]} />
            <Animated.View style={[styles.visualizerBar, { height: bar2 }]} />
            <Animated.View style={[styles.visualizerBar, { height: bar3 }]} />
          </View>
        )}
      </View>

      {/* Track Info & Monospace FLAC Badge */}
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <View style={[styles.qualityBadge, flacEnabled && styles.qualityBadgeFlac]}>
            <Text style={[styles.qualityBadgeText, flacEnabled && styles.qualityBadgeTextFlac]}>
              {flacEnabled ? '⚡ FLAC' : 'HQ'}
            </Text>
          </View>
        </View>
        <Text style={styles.artist} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      {/* Like Heart Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.heartButton}
        onPress={(e) => {
          e.stopPropagation?.();
          toggleLike(currentTrack.id);
        }}
      >
        <Heart
          size={18}
          color={currentTrack.isLiked ? colors.heartRed : colors.textDim}
          fill={currentTrack.isLiked ? colors.heartRed : 'none'}
        />
      </TouchableOpacity>

      {/* Play/Pause Button - Pure HAZE Animated Spring Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={(e) => {
          e.stopPropagation?.();
          handlePlayPress();
        }}
      >
        <Animated.View style={[styles.playButton, { transform: [{ scale: playBtnScale }] }]}>
          {isLoadingAudio ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : isPlaying ? (
            <Pause size={18} color="#000000" fill="#000000" />
          ) : (
            <Play size={18} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Top 2px Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    height: 64,
    backgroundColor: '#080808',
    borderTopWidth: 1,
    borderTopColor: '#1F1F1F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 90,
  },
  artWrapper: {
    width: 44,
    height: 44,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#222222',
  },
  albumArt: {
    width: '100%',
    height: '100%',
  },
  artOverlayVisualizer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    paddingBottom: 6,
  },
  visualizerBar: {
    width: 3.5,
    backgroundColor: '#38BDF8',
    borderRadius: 2,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  qualityBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    backgroundColor: '#1E1E1E',
    borderWidth: 0.5,
    borderColor: '#333333',
  },
  qualityBadgeFlac: {
    backgroundColor: '#2E2207',
    borderColor: '#E5A93C',
  },
  qualityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E5E5E5',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  qualityBadgeTextFlac: {
    color: '#F5C451',
  },
  artist: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  heartButton: {
    padding: 8,
    marginRight: 4,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    backgroundColor: '#1A1A1A',
  },
  progressBarFill: {
    height: 2,
    backgroundColor: '#FFFFFF',
  },
});
