import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Heart } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const MiniPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    isLoadingAudio,
    togglePlayPause,
    nextTrack,
    previousTrack,
    openModal,
    position,
    duration,
    toggleLike,
    isTrackLiked,
  } = usePlayer();

  if (!currentTrack) return null;

  const progress = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
  const liked = isTrackLiked && currentTrack?.id ? isTrackLiked(currentTrack.id) : false;

  const handleOpenNowPlaying = () => {
    if (openModal) openModal();
  };

  return (
    <View style={styles.wrapper}>
      {/* Top Thin Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.container}>
        {/* Left: Artwork + Title info -> Opens NowPlaying */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.trackInfoArea}
          onPress={handleOpenNowPlaying}
        >
          <Image
            source={{ uri: currentTrack.cover || 'https://via.placeholder.com/150' }}
            style={styles.artwork}
          />
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentTrack.title || 'Unknown Title'}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentTrack.artist || 'Unknown Artist'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right: Controls Cluster */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => toggleLike(currentTrack)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <Heart
              size={18}
              color={liked ? colors.heartRed : colors.textSecondary}
              fill={liked ? colors.heartRed : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={previousTrack}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <SkipBack size={19} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playPauseBtn}
            activeOpacity={0.8}
            onPress={togglePlayPause}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            {isPlaying ? (
              <Pause size={18} color="#000000" fill="#000000" />
            ) : (
              <Play size={18} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={nextTrack}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          >
            <SkipForward size={19} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 68,
    backgroundColor: '#242424',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 95,
  },
  progressBarBg: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 8,
  },
  trackInfoArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  artwork: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#333333',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  artist: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
});
