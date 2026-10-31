import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
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
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

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
    closeModal,
    liveLyrics,
    streamingQuality,
    setShowQualityModal,
  } = usePlayer();

  const scrollViewRef = useRef(null);

  // Normalize lyrics into timestamped array
  const lyricsList = React.useMemo(() => {
    if (liveLyrics?.synced && Array.isArray(liveLyrics.synced) && liveLyrics.synced.length > 0) {
      return liveLyrics.synced;
    }
    if (liveLyrics?.plain && typeof liveLyrics.plain === 'string') {
      const lines = liveLyrics.plain.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const step = Math.max(3, Math.floor((duration || 200) / lines.length));
        return lines.map((text, idx) => ({
          time: idx * step,
          text,
        }));
      }
    }
    return [];
  }, [liveLyrics, duration]);

  // Determine active lyric line based on current playback position
  const activeLineIndex = React.useMemo(() => {
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

  // Smoothly auto-scroll so active line rests at ~35% of the screen height
  useEffect(() => {
    if (activeLineIndex >= 0 && scrollViewRef.current) {
      const estimatedY = activeLineIndex * 62;
      scrollViewRef.current.scrollTo({
        y: Math.max(0, estimatedY - 140),
        animated: true,
      });
    }
  }, [activeLineIndex]);

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;
  const isFlac = streamingQuality === '1411k';

  return (
    <View style={styles.modalOverlay}>
      {/* Immersive Dark Glass Gradient */}
      <LinearGradient
        colors={['#09090D', '#040407', '#000000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.content}>
        {/* Top Header Bar */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={closeModal}>
            <ChevronDown size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {currentTrack.cover ? (
            <Image source={{ uri: currentTrack.cover }} style={styles.trackArt} />
          ) : (
            <LinearGradient
              colors={currentTrack.gradient || ['#8B5CF6', '#EC4899']}
              style={styles.trackArt}
            />
          )}

          <View style={styles.trackMeta}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.hiResBadge, isFlac && styles.hiResBadgeFlac]}
            onPress={() => setShowQualityModal(true)}
          >
            <Text style={[styles.hiResText, isFlac && styles.hiResTextFlac]}>
              {isFlac ? '⚡ FLAC' : '✨ 320k'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Synchronized Lyrics Container */}
        {lyricsList.length > 0 ? (
          <ScrollView
            ref={scrollViewRef}
            style={styles.lyricsScroll}
            contentContainerStyle={styles.lyricsContent}
            showsVerticalScrollIndicator={false}
          >
            {lyricsList.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              const isPast = activeLineIndex >= 0 && idx < activeLineIndex;

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.6}
                  style={styles.lyricRow}
                  onPress={() => seekTo(line.time)}
                >
                  <Text
                    style={[
                      styles.lyricLine,
                      isActive && styles.lyricLineActive,
                      isPast && styles.lyricLinePast,
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
            <Music2 size={44} color="#3F3F46" />
            <Text style={styles.emptyTitle}>Synchronizing Lyrics...</Text>
            <Text style={styles.emptySubtitle}>
              Matching millisecond timestamps from HAZE master stream.
            </Text>
          </View>
        )}

        {/* Bottom Control Bar */}
        <View style={styles.bottomControls}>
          {/* Scrubber progress line */}
          <View style={styles.scrubberBg}>
            <View style={[styles.scrubberFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>

          {/* Transport buttons */}
          <View style={styles.transportRow}>
            <TouchableOpacity style={styles.sideBtn} onPress={previousTrack}>
              <SkipBack size={26} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlayPause}>
              {isPlaying ? (
                <Pause size={28} color="#000000" fill="#000000" />
              ) : (
                <Play size={28} color="#000000" fill="#000000" style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideBtn} onPress={nextTrack}>
              <SkipForward size={26} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    backgroundColor: '#040407',
  },
  content: {
    flex: 1,
    paddingTop: 50,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackArt: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  trackMeta: {
    flex: 1,
  },
  trackTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  trackArtist: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  hiResBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  hiResBadgeFlac: {
    backgroundColor: 'rgba(245, 185, 66, 0.15)',
    borderColor: 'rgba(245, 185, 66, 0.3)',
  },
  hiResText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  hiResTextFlac: {
    color: colors.gold,
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 180,
    gap: 22,
  },
  lyricRow: {
    paddingVertical: 4,
  },
  lyricLine: {
    fontSize: 24,
    fontWeight: '700',
    color: '#71717A',
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  lyricLineActive: {
    fontSize: 27,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  lyricLinePast: {
    color: '#52525B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#E4E4E7',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#71717A',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: 'rgba(9, 9, 13, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  scrubberBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    marginBottom: 12,
  },
  timeText: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '600',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  sideBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
