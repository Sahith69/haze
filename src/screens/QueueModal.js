import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Animated, Dimensions, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, Shuffle, Trash2, GripVertical, MoreHorizontal, Sparkles } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

const { height } = Dimensions.get('window');

export const QueueModal = () => {
  const {
    currentTrack,
    queue,
    playTrack,
    clearQueue,
    shuffleQueue,
    closeModal,
    isShuffle,
    isEndlessShuffle,
    toggleEndlessShuffle,
  } = usePlayer();

  const modalAnim = useRef(new Animated.Value(height)).current;
  const isClosingRef = useRef(false);

  useEffect(() => {
    Animated.spring(modalAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, []);

  const handleSmoothClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.timing(modalAnim, {
      toValue: height,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      closeModal();
    });
  };

  useEffect(() => {
    const onBack = () => {
      handleSmoothClose();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, []);

  const upNextTracks = queue.filter(t => t.id !== currentTrack?.id);

  return (
    <Animated.View style={[styles.modalOverlay, { transform: [{ translateY: modalAnim }] }]}>
      <View style={styles.content}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleSmoothClose}>
            <ChevronDown size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Queue</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.actionPill,
                isEndlessShuffle && styles.actionPillEndless,
                isShuffle && !isEndlessShuffle && styles.actionPillShuffle,
              ]}
              onPress={shuffleQueue}
            >
              <Shuffle
                size={14}
                color={isEndlessShuffle ? '#C084FC' : isShuffle ? '#22C55E' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.actionText,
                  isEndlessShuffle && { color: '#C084FC', fontWeight: '800' },
                  isShuffle && !isEndlessShuffle && { color: '#22C55E', fontWeight: '800' },
                ]}
              >
                {isEndlessShuffle ? '∞ Endless' : isShuffle ? '✨ Shuffle' : 'Shuffle'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionPill} onPress={clearQueue}>
              <Trash2 size={14} color="#FFFFFF" />
              <Text style={styles.actionText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
          {/* NOW PLAYING SECTION */}
          <Text style={styles.sectionHeader}>NOW PLAYING</Text>
          {currentTrack && (
            <View style={styles.nowPlayingCard}>
              {currentTrack.cover ? (
                <Image source={{ uri: currentTrack.cover }} style={styles.cardArt} />
              ) : (
                <LinearGradient
                  colors={currentTrack.gradient || ['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardArt}
                />
              )}
              <View style={styles.cardInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {currentTrack.title}
                  </Text>
                  {currentTrack.isHiRes && (
                    <View style={styles.hiResBadge}>
                      <Text style={styles.hiResText}>HI-RES</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardArtist} numberOfLines={1}>
                  {currentTrack.artist}
                </Text>
              </View>
            </View>
          )}

          {/* UP NEXT SECTION */}
          <Text style={[styles.sectionHeader, { marginTop: 28 }]}>UP NEXT</Text>
          <View style={styles.upNextList}>
            {upNextTracks.map((track, idx) => (
              <TouchableOpacity
                key={`${track.id}-${idx}`}
                activeOpacity={0.7}
                style={styles.trackRow}
                onPress={() => playTrack(track)}
              >
                {track.cover ? (
                  <Image source={{ uri: track.cover }} style={styles.trackArt} />
                ) : (
                  <LinearGradient
                    colors={track.gradient || ['#8B5CF6', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.trackArt}
                  />
                )}
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {track.artist}
                  </Text>
                </View>
                <TouchableOpacity style={styles.actionBtn}>
                  <GripVertical size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          {/* Endless Autoplay Status Card */}
          <TouchableOpacity
            style={[styles.endlessCard, isEndlessShuffle && styles.endlessCardActive]}
            activeOpacity={0.8}
            onPress={toggleEndlessShuffle}
          >
            <View style={[styles.endlessIconBox, isEndlessShuffle && styles.endlessIconBoxActive]}>
              <Text style={styles.endlessIconSymbol}>∞</Text>
            </View>
            <View style={styles.endlessCardTextCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.endlessCardTitle}>Endless Autoplay & Shuffle</Text>
                {isEndlessShuffle && (
                  <View style={styles.livePulseDot} />
                )}
              </View>
              <Text style={styles.endlessCardSub}>
                {isEndlessShuffle
                  ? 'Continuous discovery active · Similar music flows endlessly'
                  : 'Tap to auto-discover & endlessly queue similar songs'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: colors.bg,
    zIndex: 110,
  },
  content: {
    flex: 1,
    paddingTop: 52,
    paddingHorizontal: 24,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  actionPillShuffle: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  actionPillEndless: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  endlessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 20,
    gap: 12,
  },
  endlessCardActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  endlessIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endlessIconBoxActive: {
    backgroundColor: '#A855F7',
  },
  endlessIconSymbol: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  endlessCardTextCol: {
    flex: 1,
  },
  endlessCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A855F7',
  },
  endlessCardSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  scrollList: {
    flex: 1,
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  nowPlayingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 14,
  },
  cardArt: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  cardInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hiResBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hiResText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.goldDark,
    letterSpacing: 0.5,
  },
  cardArtist: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
  upNextList: {
    gap: 12,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  trackArt: {
    width: 46,
    height: 46,
    borderRadius: 10,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  trackArtist: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
