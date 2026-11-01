import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronDown,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Music2,
  Sparkles,
  Shuffle,
  Repeat,
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';
import { fetchLyrics } from '../services/api';

const { width, height } = Dimensions.get('window');

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const SyncedLyricsModal = () => {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    setActiveModal,
    liveLyrics,
    setLiveLyrics,
    streamingQuality,
    setShowQualityModal,
    isShuffle,
    shuffleQueue,
    isRepeat,
    setIsRepeat,
  } = usePlayer();

  const scrollViewRef = useRef(null);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  // Normalize lyrics into timestamped array
  const lyricsList = useMemo(() => {
    if (liveLyrics?.synced && Array.isArray(liveLyrics.synced) && liveLyrics.synced.length > 0) {
      return liveLyrics.synced;
    }
    if (liveLyrics?.plain && typeof liveLyrics.plain === 'string') {
      const trimmed = liveLyrics.plain.trim();
      if (!trimmed.toLowerCase().startsWith('no lyrics') && !trimmed.toLowerCase().startsWith('lyrics not found')) {
        const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          const step = Math.max(3, Math.floor((duration || 200) / lines.length));
          return lines.map((text, idx) => ({
            time: idx * step,
            text,
          }));
        }
      }
    }
    return [];
  }, [liveLyrics, duration]);

  // Determine active lyric line index based on current playback position
  const activeLineIndex = useMemo(() => {
    if (lyricsList.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lyricsList.length; i++) {
      if (position >= lyricsList[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyricsList, position]);

  // Apple Music Style Auto-Scroll: Keeps current sung line centered in view
  useEffect(() => {
    if (activeLineIndex >= 0 && scrollViewRef.current && !userIsScrolling) {
      const estimatedY = activeLineIndex * 78;
      scrollViewRef.current.scrollTo({
        y: Math.max(0, estimatedY - height * 0.35),
        animated: true,
      });
    }
  }, [activeLineIndex, userIsScrolling]);

  const handleScrollBegin = () => {
    setUserIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    // Resume auto-scroll after 3.5 seconds of user inactivity
    scrollTimeoutRef.current = setTimeout(() => {
      setUserIsScrolling(false);
    }, 3500);
  };

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const isFlac = streamingQuality === '1411k' && currentTrack.isFlac;

  const handleDismiss = () => {
    setActiveModal('now_playing');
  };

  return (
    <View style={styles.modalOverlay}>
      {/* 1. Dynamic Ambient Blurred Artwork Backdrop (Apple Music Signature Glow) */}
      {currentTrack.cover ? (
        <Image
          source={{ uri: currentTrack.cover }}
          style={StyleSheet.absoluteFillObject}
          blurRadius={Platform.OS === 'android' ? 25 : 45}
        />
      ) : null}

      <LinearGradient
        colors={[
          'rgba(6, 6, 10, 0.72)',
          'rgba(4, 4, 8, 0.90)',
          'rgba(2, 2, 4, 0.98)',
        ]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* 2. Apple Music Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.dismissCircleBtn}
          activeOpacity={0.75}
          onPress={handleDismiss}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronDown size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTrackInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.headerArtist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.qualityPill, isFlac && styles.qualityPillFlac]}
          activeOpacity={0.7}
          onPress={() => setShowQualityModal(true)}
        >
          <Text style={[styles.qualityPillText, isFlac && styles.qualityPillTextFlac]}>
            {isFlac ? '⚡ 1,411k FLAC' : '✨ 320k Master'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Entire Page Scrollable Synchronized Lyrics */}
      {lyricsList.length > 0 ? (
        <ScrollView
          ref={scrollViewRef}
          style={styles.fullPageScroll}
          contentContainerStyle={styles.fullPageContent}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={handleScrollBegin}
        >
          {lyricsList.map((line, idx) => {
            const isActive = idx === activeLineIndex;
            const isPast = activeLineIndex >= 0 && idx < activeLineIndex;

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.65}
                style={styles.lyricTouchRow}
                onPress={() => seekTo(line.time)}
              >
                <Text
                  style={[
                    styles.lyricText,
                    isActive && styles.lyricTextActive,
                    isPast && styles.lyricTextPast,
                  ]}
                >
                  {line.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Music2 size={38} color="#71717A" />
          </View>
          <Text style={styles.emptyTitle}>Synchronizing Live Lyrics...</Text>
          <Text style={styles.emptySubtitle}>
            Matching millisecond timestamps from HAZE master stream.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.retryBtn}
            onPress={() => {
              if (currentTrack) {
                fetchLyrics(currentTrack).then(setLiveLyrics);
              }
            }}
          >
            <Sparkles size={16} color="#000000" />
            <Text style={styles.retryBtnText}>Sync Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. Floating Frosted Playback Capsule (Apple Music Style) */}
      <View style={styles.floatingPlaybackCapsule}>
        {/* Scrubber Progress Bar */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.scrubberTouch}
          onPress={(e) => {
            const { locationX } = e.nativeEvent;
            const barWidth = width - 80;
            const targetRatio = Math.max(0, Math.min(1, locationX / barWidth));
            seekTo(Math.round(targetRatio * (duration || 200)));
          }}
        >
          <View style={styles.scrubberBg}>
            <View style={[styles.scrubberFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </TouchableOpacity>

        {/* Transport Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.capsuleBtn}
            activeOpacity={0.7}
            onPress={shuffleQueue}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Shuffle size={18} color={isShuffle ? '#22C55E' : '#71717A'} />
              {isShuffle && <View style={styles.smartShuffleDot} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.capsuleBtn}
            activeOpacity={0.7}
            onPress={previousTrack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SkipBack size={24} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playPauseBtn}
            activeOpacity={0.85}
            onPress={togglePlayPause}
          >
            {isPlaying ? (
              <Pause size={24} color="#000000" fill="#000000" />
            ) : (
              <Play size={24} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.capsuleBtn}
            activeOpacity={0.7}
            onPress={nextTrack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SkipForward size={24} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.capsuleBtn}
            activeOpacity={0.7}
            onPress={() => setIsRepeat(prev => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Repeat size={18} color={isRepeat ? '#22C55E' : '#71717A'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1200,
    backgroundColor: '#020204',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dismissCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTrackInfo: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerArtist: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  qualityPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  qualityPillFlac: {
    backgroundColor: 'rgba(245, 185, 66, 0.15)',
    borderColor: 'rgba(245, 185, 66, 0.35)',
  },
  qualityPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  qualityPillTextFlac: {
    color: colors.gold,
  },
  fullPageScroll: {
    flex: 1,
  },
  fullPageContent: {
    paddingTop: 120,
    paddingBottom: 210,
    paddingHorizontal: 28,
    gap: 32,
  },
  lyricTouchRow: {
    paddingVertical: 6,
  },
  lyricText: {
    fontSize: 28,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.38)',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  lyricTextActive: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 46,
    textShadowColor: 'rgba(255, 255, 255, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  lyricTextPast: {
    color: 'rgba(255, 255, 255, 0.22)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 14,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  retryBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  floatingPlaybackCapsule: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(18, 18, 24, 0.90)',
    borderRadius: 28,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  scrubberTouch: {
    paddingVertical: 4,
  },
  scrubberBg: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  capsuleBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartShuffleDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22C55E',
  },
});
