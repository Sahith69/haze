import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, ActivityIndicator } from 'react-native';
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
  Mic2,
  ListMusic,
  Activity,
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

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
    isShuffle,
    isRepeat,
    shuffleQueue,
    setIsRepeat,
    setActiveModal,
    closeModal,
    flacEnabled,
  } = usePlayer();

  const [scrubberWidth, setScrubberWidth] = useState(width - 48);

  const handleSeek = (e) => {
    if (!duration || scrubberWidth <= 0) return;
    const clickX = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(clickX / scrubberWidth, 1));
    const targetSeconds = Math.round(ratio * duration);
    seekTo(targetSeconds);
  };

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const artSize = Math.min(width - 48, 330);

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.content}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={closeModal}>
            <ChevronDown size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerSuper}>PLAYING FROM</Text>
            <Text style={styles.headerTitle}>Trending Charts</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <MoreHorizontal size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Square Album Artwork */}
        <View style={styles.artContainer}>
          <View style={[styles.artWrapper, { width: artSize, height: artSize }]}>
            <Image
              source={{ uri: currentTrack.coverLarge || currentTrack.cover || 'https://via.placeholder.com/300' }}
              style={styles.albumArt}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Track Title, Artist & Like Heart */}
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
              size={24}
              color={currentTrack.isLiked ? '#EF4444' : '#666666'}
              fill={currentTrack.isLiked ? '#EF4444' : 'none'}
            />
          </TouchableOpacity>
        </View>

        {/* Monochrome Monospace Quality Badge */}
        <View style={styles.badgeRow}>
          <View style={styles.flacBadge}>
            <Text style={styles.flacBadgeText}>
              {flacEnabled ? 'FLAC' : 'HQ 320k'}
            </Text>
          </View>
          <Text style={styles.qualityLabel}>
            {flacEnabled ? '1,411 kbps · 24-bit Lossless' : '320 kbps Studio Audio'}
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
            <View style={[styles.scrubberFill, { width: `${progressPercent}%` }]} />
            <View style={[styles.scrubberThumb, { left: `${progressPercent}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </TouchableOpacity>

        {/* Playback Controls matching Monochrome NowPlayingBar */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={shuffleQueue}>
            <Shuffle
              size={20}
              color={isShuffle ? '#FFFFFF' : '#666666'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={previousTrack}>
            <SkipBack size={26} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.playPauseBtn}
            onPress={togglePlayPause}
          >
            {isLoadingAudio ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : isPlaying ? (
              <Pause size={28} color="#000000" fill="#000000" />
            ) : (
              <Play size={28} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={nextTrack}>
            <SkipForward size={26} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsRepeat(prev => !prev)}
          >
            <Repeat
              size={20}
              color={isRepeat ? '#FFFFFF' : '#666666'}
            />
          </TouchableOpacity>
        </View>

        {/* Quick Action Buttons matching Monochrome player */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveModal('lyrics')}
          >
            <Mic2 size={16} color="#A3A3A3" />
            <Text style={styles.actionText}>Lyrics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveModal('queue')}
          >
            <ListMusic size={16} color="#A3A3A3" />
            <Text style={styles.actionText}>Queue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveModal('equalizer')}
          >
            <Activity size={16} color="#A3A3A3" />
            <Text style={styles.actionText}>EQ</Text>
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
    backgroundColor: '#000000',
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
    height: 44,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSuper: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666666',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  headerTitle: {
    fontSize: 12,
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
    marginVertical: 10,
  },
  artWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222222',
    backgroundColor: '#121212',
  },
  albumArt: {
    width: '100%',
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  trackArtist: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  likeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  flacBadge: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#333333',
  },
  flacBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E5E5E5',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  qualityLabel: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'monospace',
  },
  scrubberContainer: {
    marginTop: 16,
  },
  scrubberTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E1E1E',
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
    fontSize: 11,
    color: '#666666',
    fontFamily: 'monospace',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  playPauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
});
