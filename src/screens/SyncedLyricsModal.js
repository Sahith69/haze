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
} from 'react-native';
import { ChevronDown, Mic2, Plus, Minus, RotateCcw } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 44;

export const SyncedLyricsModal = () => {
  const { activeModal, currentTrack, position, duration, liveLyrics, seekTo, setActiveModal, accentColor } = usePlayer();
  const scrollViewRef = useRef(null);
  const [syncOffset, setSyncOffset] = useState(0); // Offset in seconds (-5.0s to +5.0s)

  // Reset offset when track changes
  useEffect(() => {
    setSyncOffset(0);
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

  // Find active line index based on position + syncOffset
  const activeLineIndex = useMemo(() => {
    if (lyricsList.length === 0) return -1;
    const effectivePos = position + syncOffset;
    let idx = -1;
    for (let i = 0; i < lyricsList.length; i++) {
      if (effectivePos >= lyricsList[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyricsList, position, syncOffset]);

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
      onRequestClose={() => setActiveModal('now_playing')}
    >
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setActiveModal('now_playing')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronDown size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentTrack?.title || 'Lyrics'}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {currentTrack?.artist || 'Synced Lyrics'}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Sync Offset Controls */}
        {lyricsList.length > 0 && (
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
        {lyricsList.length > 0 ? (
          <ScrollView
            ref={scrollViewRef}
            style={styles.lyricsScroll}
            contentContainerStyle={styles.lyricsContent}
            showsVerticalScrollIndicator={false}
          >
            {lyricsList.map((item, idx) => {
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
});
