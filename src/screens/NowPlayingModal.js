import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
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
  ArrowDownToLine,
  CheckCircle2,
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
    isTrackLiked,
    isShuffle,
    isRepeat,
    shuffleQueue,
    setIsRepeat,
    setActiveModal,
    closeModal,
    flacEnabled,
    downloadTrack,
    isTrackDownloaded,
    downloadProgress,
    currentUser,
    streamingQuality,
    downloadQuality,
    setShowQualityModal,
    setQualityModalMode,
  } = usePlayer();

  const [scrubberWidth, setScrubberWidth] = useState(width - 48);

  // Smooth tactile animations
  const artScale = useRef(new Animated.Value(isPlaying ? 1.0 : 0.88)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(artScale, {
      toValue: isPlaying ? 1.0 : 0.88,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start();
  }, [isPlaying]);

  const handleSeek = (e) => {
    if (!duration || scrubberWidth <= 0) return;
    const clickX = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(clickX / scrubberWidth, 1));
    const targetSeconds = Math.round(ratio * duration);
    seekTo(targetSeconds);
  };

  if (!currentTrack) return null;

  const isLiked = isTrackLiked(currentTrack.id);
  const isDownloaded = isTrackDownloaded(currentTrack.id);
  const isDownloading = downloadProgress[currentTrack.id]?.status === 'downloading';
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const artSize = Math.min(width - 48, 330);

  const getQualityBadgeText = () => {
    if (isDownloaded) {
      return currentTrack.isFlac ? '⚡ FLAC OFFLINE' : '✨ 320k OFFLINE';
    }
    switch (streamingQuality) {
      case '1411k':
        return '⚡ FLAC MASTER';
      case '320k':
        return '✨ STUDIO 320k';
      case '256k':
        return 'HD 256k';
      case '128k':
        return 'SAVER 128k';
      default:
        return '⚡ FLAC MASTER';
    }
  };

  const getQualitySubtext = () => {
    if (isDownloaded) {
      return 'Saved to Local Device Storage';
    }
    switch (streamingQuality) {
      case '1411k':
        return '1,411 kbps · 16-bit / 44.1 kHz FLAC';
      case '320k':
        return '320 kbps Studio Master Audio';
      case '256k':
        return '256 kbps High Definition';
      case '128k':
        return '128 kbps Data Saver Audio';
      default:
        return '1,411 kbps · Bit-Perfect FLAC';
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.content}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={closeModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronDown size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerSuper}>PLAYING FROM</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentTrack.album || currentTrack.artist || 'HAZE Master Vault'}
            </Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setActiveModal('queue')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MoreHorizontal size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Square Album Artwork with Spring Scaling Animation */}
        <View style={styles.artContainer}>
          <Animated.View
            style={[
              styles.artWrapper,
              {
                width: artSize,
                height: artSize,
                transform: [{ scale: artScale }],
              },
            ]}
          >
            <Image
              source={{ uri: currentTrack.coverLarge || currentTrack.cover || 'https://via.placeholder.com/300' }}
              style={styles.albumArt}
              resizeMode="cover"
            />
          </Animated.View>
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
            activeOpacity={0.7}
            onPress={() => toggleLike(currentTrack)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart
              size={24}
              color={isLiked ? '#EF4444' : '#666666'}
              fill={isLiked ? '#EF4444' : 'none'}
            />
          </TouchableOpacity>
        </View>

        {/* HAZE Interactive Quality Badge */}
        <View style={styles.badgeRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.flacBadge,
              streamingQuality === '1411k' && styles.flacBadgeActive,
            ]}
            onPress={() => {
              setQualityModalMode('streaming');
              setShowQualityModal(true);
            }}
          >
            <Text
              style={[
                styles.flacBadgeText,
                streamingQuality === '1411k' && { color: colors.gold },
              ]}
            >
              {getQualityBadgeText()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setQualityModalMode('streaming');
              setShowQualityModal(true);
            }}
          >
            <Text style={styles.qualityLabel}>
              {getQualitySubtext()}
            </Text>
          </TouchableOpacity>
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

        {/* Playback Controls matching HAZE Player */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={shuffleQueue}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Shuffle
              size={20}
              color={isShuffle ? '#FFFFFF' : '#666666'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={previousTrack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SkipBack size={26} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPressIn={() => {
              Animated.spring(playBtnScale, { toValue: 0.92, useNativeDriver: true }).start();
            }}
            onPressOut={() => {
              Animated.spring(playBtnScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }).start();
            }}
            onPress={togglePlayPause}
          >
            <Animated.View
              style={[
                styles.playPauseBtn,
                { transform: [{ scale: playBtnScale }] },
              ]}
            >
              {isLoadingAudio ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : isPlaying ? (
                <Pause size={28} color="#000000" fill="#000000" />
              ) : (
                <Play size={28} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
              )}
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={nextTrack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SkipForward size={26} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => setIsRepeat(prev => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Repeat
              size={20}
              color={isRepeat ? '#FFFFFF' : '#666666'}
            />
          </TouchableOpacity>
        </View>

        {/* Quick Action Buttons matching HAZE player */}
        <View style={styles.actionsRow}>
          {/* Download Button - Tap to download, Long Press for Quality Picker */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.actionButton, isDownloaded && styles.actionButtonDownloaded]}
            onPress={() => downloadTrack(currentTrack)}
            onLongPress={() => {
              setQualityModalMode('download');
              setShowQualityModal(true);
            }}
            delayLongPress={400}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : isDownloaded ? (
              <CheckCircle2 size={16} color="#22C55E" />
            ) : (
              <ArrowDownToLine size={16} color="#A3A3A3" />
            )}
            <Text style={[styles.actionText, isDownloaded && { color: '#22C55E' }]}>
              {isDownloading ? 'Saving...' : isDownloaded ? 'Saved' : 'Download'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.actionButton}
            onPress={() => setActiveModal('lyrics')}
          >
            <Mic2 size={16} color="#A3A3A3" />
            <Text style={styles.actionText}>Lyrics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.actionButton}
            onPress={() => setActiveModal('queue')}
          >
            <ListMusic size={16} color="#A3A3A3" />
            <Text style={styles.actionText}>Queue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
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
    maxWidth: '70%',
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
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222222',
    backgroundColor: '#121212',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 16,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
  },
  flacBadgeActive: {
    borderColor: 'rgba(245, 185, 66, 0.4)',
    backgroundColor: 'rgba(245, 185, 66, 0.08)',
  },
  flacBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5E5E5',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  qualityLabel: {
    fontSize: 11,
    color: '#888888',
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
  actionButtonDownloaded: {
    borderColor: 'rgba(34, 197, 94, 0.3)',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCCCCC',
  },
});

