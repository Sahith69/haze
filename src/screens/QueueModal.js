import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, Shuffle, Trash2, GripVertical, MoreHorizontal } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const QueueModal = () => {
  const {
    currentTrack,
    queue,
    playTrack,
    clearQueue,
    shuffleQueue,
    closeModal,
  } = usePlayer();

  const upNextTracks = queue.filter(t => t.id !== currentTrack?.id);

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.content}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={closeModal}>
            <ChevronDown size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Queue</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionPill} onPress={shuffleQueue}>
              <Shuffle size={14} color="#FFFFFF" />
              <Text style={styles.actionText}>Shuffle</Text>
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

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </View>
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
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
