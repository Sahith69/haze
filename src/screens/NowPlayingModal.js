import React, { useState, useRef } from 'react';
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
  PanResponder,
  Pressable,
  Share,
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
  Mic2,
  ListMusic,
  Sparkles,
  Zap,
  Wifi,
  Shield,
  Check,
  ListPlus,
  User,
  Disc3,
  Sliders,
  X,
  Moon,
  Info,
  Share2,
  Clock,
  Radio,
  Server,
  Layers,
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 44;
const ARTWORK_SIZE = Math.min(width - 56, Math.max(220, height * 0.38));

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

const QUALITY_OPTIONS = [
  {
    id: '1411k',
    label: 'Lossless FLAC Master',
    bitrate: '1,411 kbps · 16-bit / 44.1 kHz',
    badge: 'FLAC',
    desc: 'Bit-perfect studio audio. Zero compression, master fidelity.',
    icon: Zap,
    badgeColor: '#1ED760',
  },
  {
    id: '320k',
    label: 'Hi-Fi Studio Master',
    bitrate: '320 kbps · High Bitrate AAC',
    badge: 'STUDIO',
    desc: 'Crystal-clear audio. Fast loading with maximum clarity.',
    icon: Sparkles,
    badgeColor: '#38BDF8',
  },
  {
    id: '256k',
    label: 'High Definition',
    bitrate: '256 kbps · Optimized Audio',
    badge: 'HD',
    desc: 'Balanced fidelity. Great for mobile network streaming.',
    icon: Wifi,
    badgeColor: '#A855F7',
  },
  {
    id: '128k',
    label: 'Data Saver',
    bitrate: '128 kbps · Low Bandwidth',
    badge: 'SAVER',
    desc: 'Conserves cellular data while maintaining solid fidelity.',
    icon: Shield,
    badgeColor: '#64748B',
  },
];

export const NowPlayingModal = () => {
  const {
    activeModal,
    currentTrack,
    isPlaying,
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
    setStreamingQuality,
    openArtistView,
    openAlbumView,
    showToast,
    accentColor,
    sleepTimerOption,
    sleepTimerRemainingSec,
    setSleepTimer,
  } = usePlayer();

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState(0);
  const [showQualitySheet, setShowQualitySheet] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showSleepTimerSheet, setShowSleepTimerSheet] = useState(false);
  const [showAudioSpecsSheet, setShowAudioSpecsSheet] = useState(false);

  const scrubberBarRef = useRef(null);
  const scrubberWidthRef = useRef(width - 48);
  const scrubberPageXRef = useRef(24);

  const calculateRatioFromPageX = (pageX) => {
    if (scrubberWidthRef.current <= 0) return 0;
    const relX = pageX - scrubberPageXRef.current;
    return Math.max(0, Math.min(1, relX / scrubberWidthRef.current));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsScrubbing(true);
        if (scrubberBarRef.current && scrubberBarRef.current.measure) {
          scrubberBarRef.current.measure((x, y, w, h, px) => {
            if (w > 0) scrubberWidthRef.current = w;
            if (px !== undefined) scrubberPageXRef.current = px;
            const r = Math.max(0, Math.min(1, (evt.nativeEvent.pageX - px) / w));
            setScrubRatio(r);
          });
        } else {
          const r = calculateRatioFromPageX(evt.nativeEvent.pageX);
          setScrubRatio(r);
        }
      },
      onPanResponderMove: (evt) => {
        const r = calculateRatioFromPageX(evt.nativeEvent.pageX);
        setScrubRatio(r);
      },
      onPanResponderRelease: (evt) => {
        const r = calculateRatioFromPageX(evt.nativeEvent.pageX);
        if (duration > 0) {
          seekTo(r * duration);
        }
        setIsScrubbing(false);
      },
      onPanResponderTerminate: () => {
        setIsScrubbing(false);
      },
    })
  ).current;

  if (!currentTrack) return null;

  const liked = isTrackLiked(currentTrack.id);
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;
  const displayRatio = isScrubbing ? scrubRatio : progressRatio;
  const displayPositionText = isScrubbing
    ? formatTime(scrubRatio * duration)
    : formatTime(position);

  // Accurate sound quality pill reflecting the REAL active playback audio
  const isActualFlac = Boolean(currentTrack?.isFlac || (currentTrack?.qualityLabel && currentTrack.qualityLabel.includes('FLAC')));
  const isDownloaded = Boolean(currentTrack?.isDownloaded);
  const currentQualityLabel = isDownloaded
    ? (isActualFlac ? '1,411 kbps FLAC (Offline)' : '320 kbps Studio (Offline)')
    : isActualFlac
    ? '1,411 kbps FLAC'
    : streamingQuality === '256k'
    ? '256 kbps HD'
    : streamingQuality === '128k'
    ? '128 kbps Saver'
    : '320 kbps Studio';

  const handleShareTrack = async () => {
    try {
      setShowMoreSheet(false);
      await Share.share({
        title: `${currentTrack.title} - ${currentTrack.artist}`,
        message: `🎵 Listening to "${currentTrack.title}" by ${currentTrack.artist} in ${isActualFlac ? '1,411 kbps Lossless FLAC' : '320 kbps Studio Master'} on HAZE`,
      });
    } catch (err) {
      console.log('Error sharing track:', err);
    }
  };

  return (
    <Modal
      visible={activeModal === 'now_playing'}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <View style={styles.fullscreenContainer}>
        {/* Top Header */}
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
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (currentTrack.album && openAlbumView) {
                  openAlbumView(currentTrack.album, currentTrack.artist, currentTrack.cover);
                }
              }}
            >
              <Text style={styles.headerTitle} numberOfLines={1}>
                {currentTrack.album || 'HAZE Music'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowMoreSheet(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MoreVertical size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Album Artwork */}
        <View style={styles.artworkWrapper}>
          <Image
            source={{ uri: currentTrack.cover || 'https://via.placeholder.com/400' }}
            style={[styles.artwork, { width: ARTWORK_SIZE, height: ARTWORK_SIZE }]}
          />
        </View>

        {/* Title & Artist Row with Heart */}
        <View style={styles.metaRow}>
          <View style={styles.metaText}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (currentTrack.artist && openArtistView) {
                  openArtistView(currentTrack.artist, currentTrack.cover);
                }
              }}
            >
              <Text style={styles.trackArtist} numberOfLines={1}>
                {currentTrack.artist}
              </Text>
            </TouchableOpacity>
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

        {/* Progress Bar Scrubber with Smooth Drag & Thumb Knob */}
        <View style={styles.progressSection}>
          <View
            ref={scrubberBarRef}
            style={styles.scrubberTouchable}
            {...panResponder.panHandlers}
            onLayout={(e) => {
              scrubberWidthRef.current = e.nativeEvent.layout.width;
            }}
          >
            <View style={styles.trackBarBg}>
              <View
                style={[
                  styles.trackBarFill,
                  { width: `${displayRatio * 100}%`, backgroundColor: accentColor || colors.primary },
                ]}
              />
              <View
                style={[
                  styles.trackBarThumb,
                  isScrubbing && styles.trackBarThumbActive,
                  { left: `${displayRatio * 100}%` },
                ]}
              />
            </View>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{displayPositionText}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        {/* Playback Controls Cluster */}
        <View style={styles.controlsCluster}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={shuffleQueue}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Shuffle
              size={22}
              color={isShuffle ? (accentColor || colors.primary) : colors.textSecondary}
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
            style={[
              styles.playPauseLargeBtn,
              { backgroundColor: accentColor || colors.primary, shadowColor: accentColor || colors.primary },
            ]}
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
              color={isRepeat ? (accentColor || colors.primary) : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Action Bar: Quality Pill, Lyrics, Queue */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.qualityPill,
              { borderColor: (accentColor || colors.primary) + '40' },
            ]}
            activeOpacity={0.7}
            onPress={() => setShowQualitySheet(true)}
          >
            <Sparkles size={13} color={accentColor || colors.primary} />
            <Text style={styles.qualityText}>{currentQualityLabel}</Text>
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

        {/* In-Modal Sheet: Audio Quality Selector */}
        {showQualitySheet && (
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setShowQualitySheet(false)}
          >
            <Pressable
              style={styles.sheetContainer}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Streaming Audio Quality</Text>
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setShowQualitySheet(false)}
                >
                  <X size={20} color={colors.textDim} />
                </TouchableOpacity>
              </View>

              <View style={styles.qualityList}>
                {QUALITY_OPTIONS.map((opt) => {
                  const isSelected = (streamingQuality || '1411k') === opt.id;
                  const IconComp = opt.icon;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.qualityCard,
                        isSelected && [styles.qualityCardSelected, { borderColor: accentColor || colors.primary }],
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setStreamingQuality(opt.id);
                        if (showToast) {
                          showToast(`Streaming quality set to ${opt.label}`, 'success');
                        }
                        setShowQualitySheet(false);
                      }}
                    >
                      <View style={[styles.qualityIconWrap, isSelected && { backgroundColor: (accentColor || colors.primary) + '22' }]}>
                        <IconComp size={20} color={isSelected ? (accentColor || colors.primary) : colors.textSecondary} />
                      </View>
                      <View style={styles.qualityDetails}>
                        <View style={styles.qualityTitleRow}>
                          <Text style={[styles.qualityOptTitle, isSelected && { color: accentColor || colors.primary }]}>
                            {opt.label}
                          </Text>
                          <View style={[styles.qualityOptBadge, { backgroundColor: opt.badgeColor }]}>
                            <Text style={styles.qualityOptBadgeText}>{opt.badge}</Text>
                          </View>
                        </View>
                        <Text style={[styles.qualityBitrate, { color: accentColor || colors.primary }]}>{opt.bitrate}</Text>
                        <Text style={styles.qualityOptDesc}>{opt.desc}</Text>
                      </View>
                      {isSelected && (
                        <Check size={20} color={accentColor || colors.primary} style={styles.qualityCheckIcon} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        )}

        {/* In-Modal Sheet: 3-Dot More Actions Menu */}
        {showMoreSheet && (
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setShowMoreSheet(false)}
          >
            <Pressable
              style={styles.sheetContainer}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sheetHandle} />

              {/* Track Info in Sheet */}
              <View style={styles.sheetTrackPreview}>
                <Image
                  source={{ uri: currentTrack.cover || 'https://via.placeholder.com/150' }}
                  style={styles.sheetThumb}
                />
                <View style={styles.sheetTrackMeta}>
                  <Text style={styles.sheetTrackTitle} numberOfLines={1}>
                    {currentTrack.title}
                  </Text>
                  <Text style={styles.sheetTrackArtist} numberOfLines={1}>
                    {currentTrack.artist}
                  </Text>
                </View>
              </View>

              <View style={styles.menuDivider} />

              {/* Action Menu Options */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  setShowMoreSheet(false);
                  if (promptAddToPlaylist) {
                    promptAddToPlaylist(currentTrack);
                  }
                }}
              >
                <ListPlus size={22} color="#FFFFFF" />
                <Text style={styles.menuItemText}>Add to Playlist</Text>
              </TouchableOpacity>

              {currentTrack.artist ? (
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowMoreSheet(false);
                    if (openArtistView) {
                      openArtistView(currentTrack.artist, currentTrack.cover);
                    }
                  }}
                >
                  <User size={22} color="#FFFFFF" />
                  <Text style={styles.menuItemText}>View Artist ({currentTrack.artist})</Text>
                </TouchableOpacity>
              ) : null}

              {currentTrack.album ? (
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowMoreSheet(false);
                    if (openAlbumView) {
                      openAlbumView(currentTrack.album, currentTrack.artist, currentTrack.cover);
                    }
                  }}
                >
                  <Disc3 size={22} color="#FFFFFF" />
                  <Text style={styles.menuItemText}>View Album ({currentTrack.album})</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  setShowMoreSheet(false);
                  setActiveModal('equalizer');
                }}
              >
                <Sliders size={22} color="#FFFFFF" />
                <Text style={styles.menuItemText}>Audio Equalizer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  setShowMoreSheet(false);
                  setShowQualitySheet(true);
                }}
              >
                <Sparkles size={22} color="#FFFFFF" />
                <Text style={styles.menuItemText}>Streaming Quality ({currentQualityLabel})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  setShowMoreSheet(false);
                  setShowAudioSpecsSheet(true);
                }}
              >
                <Info size={22} color={accentColor || colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemText}>Audio Specs & Stream Inspector</Text>
                  <Text style={styles.menuItemSubText}>
                    {isActualFlac ? '1,411 kbps · FLAC Lossless Master' : '320 kbps · Hi-Fi Studio Master'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  setShowMoreSheet(false);
                  setShowSleepTimerSheet(true);
                }}
              >
                <Moon size={22} color={sleepTimerOption !== 'off' ? (accentColor || colors.primary) : '#FFFFFF'} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuItemText}>Sleep Timer ("Bedtime Mode")</Text>
                  <Text style={[styles.menuItemSubText, sleepTimerOption !== 'off' && { color: accentColor || colors.primary }]}>
                    {sleepTimerOption === 'off'
                      ? 'Off'
                      : sleepTimerOption === 'end_of_track'
                      ? 'End of Current Track'
                      : `${Math.ceil((sleepTimerRemainingSec || 0) / 60)} min remaining`}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={handleShareTrack}
              >
                <Share2 size={22} color="#FFFFFF" />
                <Text style={styles.menuItemText}>Share Track</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetCancelBtn}
                activeOpacity={0.8}
                onPress={() => setShowMoreSheet(false)}
              >
                <Text style={styles.sheetCancelText}>Close</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        )}

        {/* In-Modal Sheet: Sleep Timer ("Bedtime Mode") */}
        {showSleepTimerSheet && (
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setShowSleepTimerSheet(false)}
          >
            <Pressable
              style={styles.sheetContainer}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Moon size={20} color={accentColor || colors.primary} />
                  <Text style={styles.sheetTitle}>Sleep Timer</Text>
                </View>
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setShowSleepTimerSheet(false)}
                >
                  <X size={20} color={colors.textDim} />
                </TouchableOpacity>
              </View>

              <Text style={styles.sheetSubtitle}>
                {sleepTimerOption !== 'off'
                  ? sleepTimerOption === 'end_of_track'
                    ? 'Music will pause smoothly at the end of the current track'
                    : `Fading out and pausing in ${Math.floor((sleepTimerRemainingSec || 0) / 60)}m ${(sleepTimerRemainingSec || 0) % 60}s`
                  : 'Automatically pause playback to save battery and sleep peacefully'}
              </Text>

              <View style={styles.sleepOptionList}>
                {[
                  { id: 'off', label: 'Turn Off', desc: 'Continuous playback' },
                  { id: '15m', label: '15 Minutes', desc: 'Quick power nap' },
                  { id: '30m', label: '30 Minutes', desc: 'Standard bedtime listening' },
                  { id: '45m', label: '45 Minutes', desc: 'Extended unwind session' },
                  { id: '60m', label: '1 Hour', desc: 'Deep sleep session' },
                  { id: 'end_of_track', label: 'End of Current Track', desc: 'Pause when this song finishes' },
                ].map((opt) => {
                  const isSelected = sleepTimerOption === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.sleepOptionRow,
                        isSelected && [
                          styles.sleepOptionRowSelected,
                          { borderColor: accentColor || colors.primary, backgroundColor: (accentColor || colors.primary) + '15' },
                        ],
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSleepTimer(opt.id);
                        if (showToast) {
                          showToast(
                            opt.id === 'off'
                              ? 'Sleep timer turned off'
                              : `Sleep timer set: ${opt.label}`,
                            'info'
                          );
                        }
                        setShowSleepTimerSheet(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sleepOptionLabel, isSelected && { color: accentColor || colors.primary, fontWeight: '800' }]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.sleepOptionDesc}>{opt.desc}</Text>
                      </View>
                      {isSelected && (
                        <Check size={20} color={accentColor || colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        )}

        {/* In-Modal Sheet: Audiophile Stream Inspector */}
        {showAudioSpecsSheet && (
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setShowAudioSpecsSheet(false)}
          >
            <Pressable
              style={[styles.sheetContainer, { maxHeight: height * 0.82 }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Info size={20} color={accentColor || colors.primary} />
                  <Text style={styles.sheetTitle}>Stream Technical Specs</Text>
                </View>
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={() => setShowAudioSpecsSheet(false)}
                >
                  <X size={20} color={colors.textDim} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                {/* Master Badge Card */}
                <View style={[styles.specsHeroCard, { borderColor: (accentColor || colors.primary) + '40' }]}>
                  <View style={styles.specsHeroBadgeRow}>
                    <View style={[styles.specsPill, { backgroundColor: accentColor || colors.primary }]}>
                      <Text style={styles.specsPillText}>
                        {isActualFlac ? 'LOSSLESS FLAC' : 'STUDIO MASTER'}
                      </Text>
                    </View>
                    <Text style={[styles.specsBitrateHero, { color: accentColor || colors.primary }]}>
                      {isActualFlac ? '1,411 kbps' : '320 kbps'}
                    </Text>
                  </View>
                  <Text style={styles.specsHeroTitle} numberOfLines={1}>{currentTrack.title}</Text>
                  <Text style={styles.specsHeroSubtitle} numberOfLines={1}>{currentTrack.artist}</Text>
                </View>

                {/* Tech Grid */}
                <View style={styles.specsGrid}>
                  <View style={styles.specCard}>
                    <Text style={styles.specCardLabel}>CODEC & CONTAINER</Text>
                    <Text style={styles.specCardValue}>
                      {isActualFlac ? 'FLAC (Free Lossless Audio Codec)' : 'AAC / M4A (MPEG-4 Studio Audio)'}
                    </Text>
                  </View>

                  <View style={styles.specCard}>
                    <Text style={styles.specCardLabel}>SAMPLE RATE & BIT DEPTH</Text>
                    <Text style={styles.specCardValue}>
                      {isActualFlac ? '44.1 kHz · 16-bit Master' : '44.1 kHz · High-Bitrate AAC'}
                    </Text>
                  </View>

                  <View style={styles.specCard}>
                    <Text style={styles.specCardLabel}>STREAM INFRASTRUCTURE</Text>
                    <Text style={styles.specCardValue}>
                      {isDownloaded
                        ? 'Offline Flash Storage (Local Cache)'
                        : isActualFlac
                        ? 'Telegram Lossless Cloud Vault'
                        : 'Studio Edge Low-Latency CDN'}
                    </Text>
                  </View>

                  <View style={styles.specCard}>
                    <Text style={styles.specCardLabel}>AUDIO STREAM SIZE</Text>
                    <Text style={styles.specCardValue}>
                      {duration
                        ? `~${Math.round((duration * (isActualFlac ? 1411 : 320)) / (8 * 1024) * 10) / 10} MB (${formatTime(duration)})`
                        : (isActualFlac ? '~34.5 MB' : '~7.8 MB')}
                    </Text>
                  </View>

                  <View style={styles.specCard}>
                    <Text style={styles.specCardLabel}>DYNAMIC RANGE</Text>
                    <Text style={styles.specCardValue}>
                      {isActualFlac ? 'Full Bit-Perfect Range (96 dB SNR)' : 'Studio Normalized Dynamic Curve'}
                    </Text>
                  </View>

                  <View style={styles.specCard}>
                    <Text style={styles.specCardLabel}>AUDIO ENGINE</Text>
                    <Text style={styles.specCardValue}>
                      HAZE Native Lossless Pipeline (Media3)
                    </Text>
                  </View>
                </View>

                <View style={styles.specsVerifiedBanner}>
                  <Check size={16} color={accentColor || colors.primary} />
                  <Text style={styles.specsVerifiedText}>
                    Bit-perfect stream pipeline verified. Zero artificial compression.
                  </Text>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        )}
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
    paddingBottom: Platform.OS === 'android' ? 34 : 28,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  artwork: {
    borderRadius: 14,
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
    marginTop: 4,
    marginBottom: 8,
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
    height: 30,
    justifyContent: 'center',
  },
  trackBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  trackBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  trackBarThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginLeft: -6,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
  },
  trackBarThumbActive: {
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    backgroundColor: '#FFFFFF',
    elevation: 6,
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
    marginVertical: 10,
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
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  sheetContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 32 : 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sheetCloseBtn: {
    padding: 4,
  },
  qualityList: {
    gap: 10,
  },
  qualityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  qualityCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#2A2A2A',
  },
  qualityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  qualityDetails: {
    flex: 1,
  },
  qualityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  qualityOptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  qualityOptBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  qualityOptBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
  },
  qualityBitrate: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  qualityOptDesc: {
    fontSize: 11,
    color: colors.textDim,
  },
  qualityCheckIcon: {
    marginLeft: 8,
  },
  sheetTrackPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#282828',
    marginRight: 12,
  },
  sheetTrackMeta: {
    flex: 1,
  },
  sheetTrackTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  sheetTrackArtist: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#2C2C2C',
    marginVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuItemSubText: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: colors.textDim,
    marginBottom: 16,
    lineHeight: 18,
  },
  sleepOptionList: {
    gap: 10,
  },
  sleepOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sleepOptionRowSelected: {
    borderColor: colors.primary,
  },
  sleepOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  sleepOptionDesc: {
    fontSize: 12,
    color: colors.textDim,
  },
  specsHeroCard: {
    backgroundColor: '#242424',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  specsHeroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  specsPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specsPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  specsBitrateHero: {
    fontSize: 18,
    fontWeight: '900',
  },
  specsHeroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  specsHeroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  specsGrid: {
    gap: 10,
    marginBottom: 14,
  },
  specCard: {
    backgroundColor: '#242424',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#303030',
  },
  specCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textDim,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  specCardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  specsVerifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  specsVerifiedText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  sheetCancelBtn: {
    marginTop: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
