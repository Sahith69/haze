import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Animated } from 'react-native';
import { Play, Pause, Heart, SkipBack, SkipForward } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const MiniPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setActiveModal,
    activeModal,
    isLoadingAudio,
    flacEnabled,
    toggleLike,
  } = usePlayer();

  // Animated Live Equalizer Bars
  const bar1 = useRef(new Animated.Value(4)).current;
  const bar2 = useRef(new Animated.Value(12)).current;
  const bar3 = useRef(new Animated.Value(7)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;
  const prevBtnScale = useRef(new Animated.Value(1)).current;
  const nextBtnScale = useRef(new Animated.Value(1)).current;

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

  const handlePrevPress = () => {
    Animated.sequence([
      Animated.timing(prevBtnScale, { toValue: 0.82, duration: 70, useNativeDriver: true }),
      Animated.spring(prevBtnScale, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
    ]).start();
    previousTrack();
  };

  const handleNextPress = () => {
    Animated.sequence([
      Animated.timing(nextBtnScale, { toValue: 0.82, duration: 70, useNativeDriver: true }),
      Animated.spring(nextBtnScale, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
    ]).start();
    nextTrack();
  };

  const isDetailView = activeModal === 'detail_view';

  return (
    <View style={[styles.container, isDetailView && styles.containerDetailView]}>
      {/* Top 2px Progress Bar */}
      <View style={styles.progressBarBg} pointerEvents="none">
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Main Track Info Pressable Area -> Seamlessly opens NowPlayingModal */}
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.trackInfoPressArea}
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

        {/* Track Title, FLAC badge, and Artist */}
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
      </TouchableOpacity>

      {/* Clean Non-nested Media Controls Group */}
      <View style={styles.controlsGroup}>
        {/* Like Heart Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.controlBtn}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          onPress={() => toggleLike(currentTrack)}
        >
          <Heart
            size={18}
            color={currentTrack.isLiked ? colors.heartRed : colors.textDim}
            fill={currentTrack.isLiked ? colors.heartRed : 'none'}
          />
        </TouchableOpacity>

        {/* Previous Track Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.controlBtn}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          onPress={handlePrevPress}
        >
          <Animated.View style={{ transform: [{ scale: prevBtnScale }] }}>
            <SkipBack size={18} color="#CCCCCC" fill="#CCCCCC" />
          </Animated.View>
        </TouchableOpacity>

        {/* Play/Pause Button - Pure HAZE Animated Spring Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handlePlayPress}
        >
          <Animated.View style={[styles.playButton, { transform: [{ scale: playBtnScale }] }]}>
            {isLoadingAudio ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : isPlaying ? (
              <Pause size={17} color="#000000" fill="#000000" />
            ) : (
              <Play size={17} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Next Track Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.controlBtn}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          onPress={handleNextPress}
        >
          <Animated.View style={{ transform: [{ scale: nextBtnScale }] }}>
            <SkipForward size={18} color="#CCCCCC" fill="#CCCCCC" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    height: 64,
    backgroundColor: '#0A0A0E',
    borderTopWidth: 1,
    borderTopColor: '#1F1F24',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 95,
  },
  containerDetailView: {
    bottom: 0,
    zIndex: 130,
    backgroundColor: '#07070A',
    borderTopColor: '#272730',
  },
  trackInfoPressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
    height: '100%',
  },
  artWrapper: {
    width: 44,
    height: 44,
    borderRadius: 7,
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
    marginLeft: 10,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  qualityBadge: {
    paddingHorizontal: 4,
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
    fontSize: 8,
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
  controlsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlBtn: {
    width: 32,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
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
