import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import {
  ChevronDown,
  MoreVertical,
  Heart,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
  Mic2,
  ListMusic,
  Sparkles,
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 44;

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const NowPlayingModal = () => {
  const {
    activeModal,
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
    shuffleQueue,
    isRepeat,
    setIsRepeat,
    closeModal,
    setActiveModal,
    promptAddToPlaylist,
    streamingQuality,
    setShowQualityModal,
    setQualityModalMode,
  } = usePlayer();

  const [scrubberWidth, setScrubberWidth] = useState(width - 48);

  if (!currentTrack) return null;

  const liked = isTrackLiked(currentTrack.id);
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;

  const handleSeek = (e) => {
    if (duration <= 0 || scrubberWidth <= 0) return;
    const clickX = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, clickX / scrubberWidth));
    seekTo(ratio * duration);
  };

  return (
    <Modal
      visible={activeModal === 'now_playing'}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <View style={styles.fullscreenContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={closeModal}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronDown size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerSubtitle}>PLAYING FROM PLAYLIST</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentTrack.album || 'Spotube Music'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => promptAddToPlaylist && promptAddToPlaylist(currentTrack)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MoreVertical size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Album Artwork */}
      <View style={styles.artworkWrapper}>
        <Image
          source={{ uri: currentTrack.cover || 'https://via.placeholder.com/400' }}
          style={styles.artwork}
        />
      </View>

      {/* Title & Artist Row with Heart */}
      <View style={styles.metaRow}>
        <View style={styles.metaText}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleLike(currentTrack)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            size={26}
            color={liked ? colors.heartRed : colors.textSecondary}
            fill={liked ? colors.heartRed : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* Progress Bar Scrubber */}
      <View style={styles.progressSection}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.scrubberTouchable}
          onLayout={(e) => setScrubberWidth(e.nativeEvent.layout.width)}
          onPress={handleSeek}
        >
          <View style={styles.trackBarBg}>
            <View
              style={[
                styles.trackBarFill,
                { width: `${progressRatio * 100}%` },
              ]}
            />
          </View>
        </TouchableOpacity>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {/* Playback Controls Cluster (Exact Spotube 5 buttons) */}
      <View style={styles.controlsCluster}>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={shuffleQueue}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Shuffle
            size={22}
            color={isShuffle ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={previousTrack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <SkipBack size={30} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playPauseLargeBtn}
          activeOpacity={0.8}
          onPress={togglePlayPause}
        >
          {isPlaying ? (
            <Pause size={30} color="#000000" fill="#000000" />
          ) : (
            <Play size={30} color="#000000" fill="#000000" style={{ marginLeft: 3 }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={nextTrack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <SkipForward size={30} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => setIsRepeat(!isRepeat)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Repeat
            size={22}
            color={isRepeat ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Action Bar: Quality Pill, Lyrics, Queue */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.qualityPill}
          activeOpacity={0.7}
          onPress={() => {
            setQualityModalMode('stream');
            setShowQualityModal(true);
          }}
        >
          <Sparkles size={13} color={colors.primary} />
          <Text style={styles.qualityText}>
            {currentTrack.isFlac ? '1,411 kbps FLAC' : '320 kbps Studio'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomIcons}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => setActiveModal('lyrics')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Mic2 size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => setActiveModal('queue')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ListMusic size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  headerBtn: {
    padding: 6,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  artworkWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  artwork: {
    width: width - 56,
    height: width - 56,
    borderRadius: 12,
    backgroundColor: '#242424',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  metaText: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  progressSection: {
    width: '100%',
    marginVertical: 4,
  },
  scrubberTouchable: {
    height: 24,
    justifyContent: 'center',
  },
  trackBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
    width: '100%',
  },
  trackBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textDim,
  },
  controlsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  controlBtn: {
    padding: 10,
  },
  playPauseLargeBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  qualityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#242424',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#383838',
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconBtn: {
    padding: 6,
  },
});
