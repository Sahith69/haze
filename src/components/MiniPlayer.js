import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const MiniPlayer = () => {
  const { currentTrack, isPlaying, position, duration, togglePlayPause, setActiveModal } = usePlayer();

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.container}
      onPress={() => setActiveModal('now_playing')}
    >
      {/* 42px Album Artwork Thumbnail */}
      {currentTrack.cover ? (
        <Image source={{ uri: currentTrack.cover }} style={styles.albumArt} />
      ) : (
        <LinearGradient
          colors={currentTrack.gradient || ['#7C5CFF', '#FF5C9E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.albumArt}
        />
      )}

      {/* Track Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      {/* Play/Pause Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.playButton}
        onPress={(e) => {
          e.stopPropagation?.();
          togglePlayPause();
        }}
      >
        {isPlaying ? (
          <Pause size={22} color="#FFFFFF" fill="#FFFFFF" />
        ) : (
          <Play size={22} color="#FFFFFF" fill="#FFFFFF" />
        )}
      </TouchableOpacity>

      {/* Bottom 2px Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
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
    height: 58,
    borderRadius: 14,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 12,
    overflow: 'hidden',
    zIndex: 90,
  },
  albumArt: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  artist: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  playButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarFill: {
    height: 2,
    backgroundColor: '#FFFFFF',
  },
});
