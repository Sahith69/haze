import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { ChevronDown, Trash2, Play, Music } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const QueueModal = () => {
  const {
    currentTrack,
    queue,
    playTrack,
    removeFromQueue,
    clearQueue,
    setActiveModal,
  } = usePlayer();

  const upNextTracks = (queue || []).filter((t) => t.id !== currentTrack?.id);

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

        <Text style={styles.headerTitle}>Playback Queue</Text>

        {upNextTracks.length > 0 ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={clearQueue}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Now Playing Card */}
        {currentTrack && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>NOW PLAYING</Text>
            <View style={styles.activeTrackCard}>
              <Image source={{ uri: currentTrack.cover }} style={styles.trackThumb} />
              <View style={styles.trackDetails}>
                <Text style={styles.activeTrackTitle} numberOfLines={1}>
                  {currentTrack.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {currentTrack.artist}
                </Text>
              </View>
              <View style={styles.nowPlayingBadge}>
                <Text style={styles.nowPlayingText}>PLAYING</Text>
              </View>
            </View>
          </View>
        )}

        {/* Up Next List */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>
            UP NEXT ({upNextTracks.length})
          </Text>

          {upNextTracks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Music size={36} color={colors.borderLight} />
              <Text style={styles.emptyText}>Queue is empty</Text>
              <Text style={styles.emptySub}>
                Play songs from Search or Library to add them here
              </Text>
            </View>
          ) : (
            upNextTracks.map((track, idx) => (
              <View key={`queue_${track.id || idx}`} style={styles.queueRow}>
                <TouchableOpacity
                  style={styles.queueMainPressable}
                  activeOpacity={0.7}
                  onPress={() => playTrack(track, queue)}
                >
                  <Text style={styles.queueIndex}>{idx + 1}</Text>
                  <Image source={{ uri: track.cover }} style={styles.trackThumb} />
                  <View style={styles.trackDetails}>
                    <Text style={styles.trackTitle} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => {
                    if (removeFromQueue) removeFromQueue(track.id);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={16} color={colors.textDim} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 150,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textDim,
    letterSpacing: 1,
    marginBottom: 10,
  },
  activeTrackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  trackThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#181818',
  },
  trackDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  activeTrackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  nowPlayingBadge: {
    backgroundColor: 'rgba(30, 215, 96, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nowPlayingText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  queueMainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueIndex: {
    width: 22,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textDim,
    textAlign: 'center',
  },
});
