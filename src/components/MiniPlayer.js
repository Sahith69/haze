import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
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

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      style={styles.container}
      onPress={() => setActiveModal('now_playing')}
    >
      {/* 48px Album Artwork Thumbnail */}
      <View style={styles.artWrapper}>
        <Image
          source={{ uri: currentTrack.cover || 'https://via.placeholder.com/60' }}
          style={styles.albumArt}
        />
      </View>

      {/* Track Info & Monospace FLAC Badge */}
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <View style={styles.qualityBadge}>
            <Text style={styles.qualityBadgeText}>
              {flacEnabled ? 'FLAC' : 'HQ'}
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

      {/* Play/Pause Button - Pure Monochrome: White circle with black icon */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.playButton}
        onPress={(e) => {
          e.stopPropagation?.();
          togglePlayPause();
        }}
      >
        {isLoadingAudio ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : isPlaying ? (
          <Pause size={18} color="#000000" fill="#000000" />
        ) : (
          <Play size={18} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
        )}
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
  qualityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E5E5E5',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
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
