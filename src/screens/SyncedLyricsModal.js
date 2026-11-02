import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ChevronDown, Mic2 } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export const SyncedLyricsModal = () => {
  const { currentTrack, position, duration, liveLyrics, seekTo, setActiveModal } = usePlayer();
  const scrollViewRef = useRef(null);

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

  // Find active line index based on position
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

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineIndex >= 0 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: Math.max(0, activeLineIndex * 54 - height * 0.35),
        animated: true,
      });
    }
  }, [activeLineIndex]);

  return (
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
            {currentTrack?.artist || 'Spotube LRCLIB Sync'}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

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
                onPress={() => seekTo(item.time)}
              >
                <Text style={[styles.lineText, isActive && styles.lineTextActive]}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#121212',
    zIndex: 1050,
    paddingTop: 48,
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
  lyricsScroll: {
    flex: 1,
  },
  lyricsContent: {
    paddingHorizontal: 28,
    paddingTop: 40,
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
