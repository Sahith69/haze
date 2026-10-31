import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const MiniPlayer = () => {
  const { currentTrack, isPlaying, position, duration, togglePlayPause, setActiveModal, isLoadingAudio, flacEnabled } = usePlayer();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      style={styles.container}
      onPress={() => setActiveModal('now_playing')}
    >
      {/* Frosted Glass Base Layer */}
      <View style={styles.glassBackground} />

      {/* 46px Album Artwork Thumbnail */}
      <View style={styles.artWrapper}>
        {currentTrack.cover ? (
          <Image source={{ uri: currentTrack.cover }} style={styles.albumArt} />
        ) : (
          <LinearGradient
            colors={currentTrack.gradient || ['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.albumArt}
          />
        )}
      </View>

      {/* Track Info & Quality Pill */}
      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <View style={[styles.qualityBadge, flacEnabled && styles.qualityBadgeFlac]}>
            <Text style={[styles.qualityBadgeText, flacEnabled && styles.qualityBadgeTextFlac]}>
              {flacEnabled ? 'FLAC' : '320k'}
            </Text>
          </View>
        </View>
        <Text style={styles.artist} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      {/* Play/Pause / Loading Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.playButton}
        onPress={(e) => {
          e.stopPropagation?.();
          togglePlayPause();
        }}
      >
        {isLoadingAudio ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : isPlaying ? (
          <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
        ) : (
          <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
        )}
      </TouchableOpacity>

      {/* Glowing Bottom Progress Bar */}
      <View style={styles.progressBarBg}>
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 92,
    height: 62,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 10,
    overflow: 'hidden',
    zIndex: 90,
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 26, 0.94)',
  },
  artWrapper: {
    width: 46,
    height: 46,
    borderRadius: 10,
    overflow: 'hidden',
  },
  albumArt: {
    width: 46,
    height: 46,
    borderRadius: 10,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  qualityBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  qualityBadgeFlac: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  qualityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#06B6D4',
    letterSpacing: 0.5,
  },
  qualityBadgeTextFlac: {
    color: '#F59E0B',
  },
  artist: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressBarFill: {
    height: 2.5,
  },
});
