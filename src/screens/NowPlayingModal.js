import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
  ScrollView,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  ChevronUp,
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
    liveLyrics,
    promptAddToPlaylist,
  } = usePlayer();

  const [scrubberWidth, setScrubberWidth] = useState(width - 48);

  // Full synchronized lyrics list
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

  // Current active lyric line index
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

  // In-place animated slide-up sheet state
  const [isLyricsExpanded, setIsLyricsExpanded] = useState(false);
  const lyricsSheetAnim = useRef(new Animated.Value(height)).current;
  const lyricsScrollRef = useRef(null);

  const expandLyrics = () => {
    setIsLyricsExpanded(true);
    Animated.spring(lyricsSheetAnim, {
      toValue: 0,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const collapseLyrics = () => {
    Animated.timing(lyricsSheetAnim, {
      toValue: height,
      duration: 240,
      useNativeDriver: true,
    }).start(() => setIsLyricsExpanded(false));
  };

  // Auto-scroll expanded synchronized lyrics as playback progresses
  useEffect(() => {
    if (isLyricsExpanded && activeLineIndex >= 0 && lyricsScrollRef.current) {
      const estimatedY = activeLineIndex * 52;
      lyricsScrollRef.current.scrollTo({
        y: Math.max(0, estimatedY - 120),
        animated: true,
      });
    }
  }, [activeLineIndex, isLyricsExpanded]);

  // Android hardware back button inside NowPlayingModal
  useEffect(() => {
    const onBackPress = () => {
      if (isLyricsExpanded) {
        collapseLyrics();
        return true;
      }
      closeModal();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isLyricsExpanded]);

  // Live preview line for the compact card
  const currentLyricLine = useMemo(() => {
    if (lyricsList.length > 0) {
      const activeText = activeLineIndex >= 0 ? lyricsList[activeLineIndex]?.text : lyricsList[0]?.text;
      const nextText = activeLineIndex >= 0 && activeLineIndex + 1 < lyricsList.length ? lyricsList[activeLineIndex + 1]?.text : '';
      return { active: activeText || '', next: nextText || '' };
    }
    return { active: 'Tap to view live synchronized lyrics', next: '' };
  }, [lyricsList, activeLineIndex]);

  // Smooth tactile animations
  const artScale = useRef(new Animated.Value(isPlaying ? 1.0 : 0.88)).current;
  const playBtnScale = useRef(new Animated.Value(1)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const prevBtnScale = useRef(new Animated.Value(1)).current;
  const nextBtnScale = useRef(new Animated.Value(1)).current;
  const haloOpacity = useRef(new Animated.Value(0.35)).current;

  // Breathing ambient glow loop when audio is playing
  useEffect(() => {
    Animated.spring(artScale, {
      toValue: isPlaying ? 1.0 : 0.88,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start();

    let haloAnim;
    if (isPlaying) {
      haloAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(haloOpacity, { toValue: 0.8, duration: 1800, useNativeDriver: true }),
          Animated.timing(haloOpacity, { toValue: 0.35, duration: 1800, useNativeDriver: true }),
        ])
      );
      haloAnim.start();
    } else {
      haloOpacity.setValue(0.25);
    }

    return () => {
      if (haloAnim) haloAnim.stop();
    };
  }, [isPlaying]);

  const handleLikePress = () => {
    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1, friction: 3.5, tension: 80, useNativeDriver: true }),
    ]).start();
    toggleLike(currentTrack);
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
  const artSize = Math.min(width - 56, 275);

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
          <TouchableOpacity style={styles.iconBtn} onPress={() => promptAddToPlaylist(currentTrack)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MoreHorizontal size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Square Album Artwork with Spring Scaling & Ambient Breathing Glow */}
        <View style={styles.artContainer}>
          <Animated.View
            style={[
              styles.artHalo,
              {
                width: artSize + 24,
                height: artSize + 24,
                opacity: haloOpacity,
              },
            ]}
          />
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

        {/* Track Title, Artist & Like Heart with Animated Pop */}
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
            onPress={handleLikePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Heart
                size={24}
                color={isLiked ? '#EF4444' : '#666666'}
                fill={isLiked ? '#EF4444' : 'none'}
              />
            </Animated.View>
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
            onPress={handlePrevPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={{ transform: [{ scale: prevBtnScale }] }}>
              <SkipBack size={26} color="#FFFFFF" fill="#FFFFFF" />
            </Animated.View>
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
            onPress={handleNextPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={{ transform: [{ scale: nextBtnScale }] }}>
              <SkipForward size={26} color="#FFFFFF" fill="#FFFFFF" />
            </Animated.View>
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

        {/* Dedicated Live Synchronized Lyrics Column Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.lyricsCard}
          onPress={expandLyrics}
        >
          <View style={styles.lyricsCardHeader}>
            <View style={styles.lyricsCardTitleRow}>
              <Mic2 size={14} color="#F59E0B" />
              <Text style={styles.lyricsCardTitle}>LIVE LYRICS</Text>
            </View>
            <View style={styles.lyricsExpandPill}>
              <Text style={styles.lyricsExpandText}>Expand ↗</Text>
            </View>
          </View>
          <Text style={styles.lyricsActiveText} numberOfLines={2}>
            {currentLyricLine.active}
          </Text>
          {currentLyricLine.next ? (
            <Text style={styles.lyricsNextText} numberOfLines={1}>
              {currentLyricLine.next}
            </Text>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* IN-PLACE ANIMATED SLIDE-UP LYRICS SHEET (Spotify-Style) */}
      <Animated.View
        style={[
          styles.expandedLyricsSheet,
          {
            transform: [{ translateY: lyricsSheetAnim }],
          },
        ]}
        pointerEvents={isLyricsExpanded ? 'auto' : 'none'}
      >
        <LinearGradient
          colors={['#0C0C12', '#060609', '#000000']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Top Header Bar */}
        <View style={styles.expandedLyricsHeader}>
          <TouchableOpacity style={styles.collapsePillBtn} onPress={collapseLyrics}>
            <ChevronDown size={20} color="#FFFFFF" />
            <Text style={styles.collapsePillText}>Collapse ↙</Text>
          </TouchableOpacity>

          <View style={styles.expandedHeaderCenter}>
            <Text style={styles.expandedHeaderTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.expandedHeaderArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          <View style={styles.expandedQualityPill}>
            <Text style={styles.expandedQualityText}>
              {streamingQuality === '1411k' ? '⚡ FLAC' : '✨ 320k'}
            </Text>
          </View>
        </View>

        {/* Live Synchronized Lyrics List */}
        {lyricsList.length > 0 ? (
          <ScrollView
            ref={lyricsScrollRef}
            style={styles.expandedLyricsScroll}
            contentContainerStyle={styles.expandedLyricsContent}
            showsVerticalScrollIndicator={false}
          >
            {lyricsList.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              const isPast = activeLineIndex >= 0 && idx < activeLineIndex;
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  style={styles.expandedLyricRow}
                  onPress={() => seekTo(line.time)}
                >
                  <Text
                    style={[
                      styles.expandedLyricLine,
                      isActive && styles.expandedLyricLineActive,
                      isPast && styles.expandedLyricLinePast,
                    ]}
                  >
                    {line.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.expandedEmptyLyrics}>
            <Mic2 size={40} color="#444444" />
            <Text style={styles.expandedEmptyTitle}>Synchronizing Live Lyrics...</Text>
            <Text style={styles.expandedEmptySubtitle}>
              Matching millisecond timestamps from HAZE master stream.
            </Text>
          </View>
        )}

        {/* Bottom Playback Controls Bar */}
        <View style={styles.expandedBottomBar}>
          <TouchableOpacity style={styles.expandedScrubber} onPress={handleSeek}>
            <View style={styles.expandedScrubberBg}>
              <View style={[styles.expandedScrubberFill, { width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.expandedTimeRow}>
              <Text style={styles.expandedTimeText}>{formatTime(position)}</Text>
              <Text style={styles.expandedTimeText}>{formatTime(duration)}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.expandedControlsRow}>
            <TouchableOpacity onPress={handlePrevPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <SkipBack size={26} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.expandedPlayBtn} onPress={togglePlayPause}>
              {isPlaying ? (
                <Pause size={26} color="#000000" fill="#000000" />
              ) : (
                <Play size={26} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNextPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <SkipForward size={26} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
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
    position: 'relative',
  },
  artHalo: {
    position: 'absolute',
    borderRadius: 22,
    backgroundColor: 'rgba(124, 92, 255, 0.2)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 36,
    elevation: 12,
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
  lyricsCard: {
    marginTop: 12,
    backgroundColor: '#111116',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222228',
  },
  lyricsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  lyricsCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lyricsCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  lyricsExpandPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  lyricsExpandText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A3A3A3',
  },
  lyricsActiveText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  lyricsNextText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
    marginTop: 4,
  },
  expandedLyricsSheet: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
    backgroundColor: '#07070A',
    paddingTop: 48,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  expandedLyricsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  collapsePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  collapsePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  expandedHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  expandedHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  expandedHeaderArtist: {
    color: '#71717A',
    fontSize: 11,
    marginTop: 1,
  },
  expandedQualityPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  expandedQualityText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  expandedLyricsScroll: {
    flex: 1,
  },
  expandedLyricsContent: {
    paddingVertical: 36,
    paddingHorizontal: 10,
    gap: 24,
  },
  expandedLyricRow: {
    paddingVertical: 4,
  },
  expandedLyricLine: {
    fontSize: 22,
    fontWeight: '700',
    color: '#52525B',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  expandedLyricLineActive: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  expandedLyricLinePast: {
    color: '#3F3F46',
  },
  expandedEmptyLyrics: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  expandedEmptyTitle: {
    color: '#D4D4D8',
    fontSize: 16,
    fontWeight: '700',
  },
  expandedEmptySubtitle: {
    color: '#71717A',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  expandedBottomBar: {
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 10, 14, 0.95)',
  },
  expandedScrubber: {
    paddingVertical: 6,
  },
  expandedScrubberBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  expandedScrubberFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  expandedTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  expandedTimeText: {
    color: '#71717A',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  expandedControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    marginTop: 10,
  },
  expandedPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

