import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  StatusBar as RNStatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, Mic2, Plus, Minus, RotateCcw, Languages } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { ToastBanner } from '../components/ToastBanner';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 44;

export const SyncedLyricsModal = () => {
  const {
    activeModal,
    currentTrack,
    position,
    duration,
    liveLyrics,
    seekTo,
    closeModal,
    accentColor,
    showToast,
  } = usePlayer();
  const scrollViewRef = useRef(null);
  const [syncOffset, setSyncOffset] = useState(0); // Offset in seconds (-5.0s to +5.0s)
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const translationCacheRef = useRef({});

  // Reset offset and translation state when track changes
  useEffect(() => {
    setSyncOffset(0);
    setShowTranslation(false);
  }, [currentTrack?.id]);

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

  const toggleTranslation = async () => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    const trackId = currentTrack?.id;
    if (!trackId || lyricsList.length === 0) return;

    if (translationCacheRef.current[trackId]) {
      setShowTranslation(true);
      return;
    }

    try {
      setIsTranslating(true);
      const originalLines = lyricsList.map((item) => item.text);
      const joined = originalLines.join('\n');
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(joined)}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Translation status: ${response.status}`);
      const data = await response.json();

      const fullTranslatedText = (data?.[0] || []).map((part) => part[0]).join('');
      const translatedLines = fullTranslatedText.split('\n');

      const translatedLyrics = lyricsList.map((item, idx) => ({
        time: item.time,
        text: translatedLines[idx]?.trim() || item.text,
      }));

      translationCacheRef.current[trackId] = translatedLyrics;
      setShowTranslation(true);
      if (showToast) {
        showToast('Translated to English', 'success');
      }
    } catch (err) {
      console.warn('[SyncedLyricsModal] Translation error:', err);
      if (showToast) {
        showToast('Translation unavailable offline', 'info');
      }
    } finally {
      setIsTranslating(false);
    }
  };

  const displayLyrics = useMemo(() => {
    const trackId = currentTrack?.id;
    if (showTranslation && trackId && translationCacheRef.current[trackId]) {
      return translationCacheRef.current[trackId];
    }
    return lyricsList;
  }, [lyricsList, showTranslation, currentTrack?.id]);

  // Find active line index based on position + syncOffset
  const activeLineIndex = useMemo(() => {
    if (displayLyrics.length === 0) return -1;
    const effectivePos = position + syncOffset;
    let idx = -1;
    for (let i = 0; i < displayLyrics.length; i++) {
      if (effectivePos >= displayLyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [displayLyrics, position, syncOffset]);

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineIndex >= 0 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: Math.max(0, activeLineIndex * 54 - height * 0.35),
        animated: true,
      });
    }
  }, [activeLineIndex]);

  const adjustOffset = (delta) => {
    setSyncOffset((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      return Math.max(-5.0, Math.min(5.0, next));
    });
  };

  return (
    <Modal
      visible={activeModal === 'lyrics'}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <View style={styles.container}>
        <ToastBanner />
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={closeModal}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronDown size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentTrack?.title || 'Lyrics'}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {showTranslation ? 'English Translation' : (currentTrack?.artist || 'Synced Lyrics')}
            </Text>
          </View>

          {lyricsList.length > 0 ? (
            <TouchableOpacity
              style={[
                styles.translateBtn,
                showTranslation && {
                  backgroundColor: accentColor || colors.primary,
                  borderColor: accentColor || colors.primary,
                },
              ]}
              onPress={toggleTranslation}
              disabled={isTranslating}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              {isTranslating ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ transform: [{ scale: 0.75 }] }} />
              ) : (
                <>
                  <Languages size={15} color={showTranslation ? '#000000' : '#FFFFFF'} />
                  <Text
                    style={[
                      styles.translateBtnText,
                      showTranslation && { color: '#000000', fontWeight: '800' },
                    ]}
                  >
                    EN
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Sync Offset Controls */}
        {displayLyrics.length > 0 && (
          <View style={styles.offsetBar}>
            <Text style={styles.offsetLabel}>Sync Offset</Text>
            <View style={styles.offsetControls}>
              <TouchableOpacity
                style={styles.offsetBtn}
                onPress={() => adjustOffset(-0.5)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Minus size={14} color="#FFFFFF" />
                <Text style={styles.offsetBtnText}>0.5s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.offsetValuePill,
                  syncOffset !== 0 && { borderColor: accentColor || colors.primary, backgroundColor: (accentColor || colors.primary) + '20' },
                ]}
                onPress={() => setSyncOffset(0)}
              >
                <Text
                  style={[
                    styles.offsetValueText,
                    syncOffset !== 0 && { color: accentColor || colors.primary, fontWeight: '800' },
                  ]}
                >
                  {syncOffset === 0 ? '0.0s' : `${syncOffset > 0 ? '+' : ''}${syncOffset.toFixed(1)}s`}
                </Text>
                {syncOffset !== 0 && (
                  <RotateCcw size={11} color={accentColor || colors.primary} style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.offsetBtn}
                onPress={() => adjustOffset(0.5)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Plus size={14} color="#FFFFFF" />
                <Text style={styles.offsetBtnText}>0.5s</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lyrics Scrollable Area */}
        {displayLyrics.length > 0 ? (
          <ScrollView
            ref={scrollViewRef}
            style={styles.lyricsScroll}
            contentContainerStyle={styles.lyricsContent}
            showsVerticalScrollIndicator={false}
          >
            {displayLyrics.map((item, idx) => {
              const isActive = idx === activeLineIndex;
              return (
                <TouchableOpacity
                  key={`lyric_${idx}`}
                  style={styles.lineTouchable}
                  activeOpacity={0.7}
                  onPress={() => seekTo(Math.max(0, item.time - syncOffset))}
                >
                  <Text
                    style={[
                      styles.lineText,
                      isActive && [styles.lineTextActive, { color: accentColor || '#FFFFFF' }],
                    ]}
                  >
                    {item.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Mic2 size={48} color={colors.borderLight} />
            <Text style={styles.emptyTitle}>No Synced Lyrics Found</Text>
            <Text style={styles.emptySubtitle}>
              Lyrics could not be found on LRCLIB for this track
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: STATUS_BAR_HEIGHT + 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },
  closeBtn: {
    padding: 6,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  offsetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  offsetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  offsetControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offsetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 2,
  },
  offsetBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  offsetValuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#383838',
  },
  offsetValueText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '700',
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsContent: {
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 180,
  },
  lineTouchable: {
    paddingVertical: 14,
  },
  lineText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.35)',
    lineHeight: 28,
  },
  lineTextActive: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 32,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
  translateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: '#383838',
    gap: 4,
    minWidth: 54,
    justifyContent: 'center',
  },
  translateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
