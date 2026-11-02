import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { HardDrive, Cloud, Play } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const CloudVaultScreen = () => {
  const { vaultTracks, playTrack, currentTrack, storageUsed, storageTotal, storagePercent, flacEnabled } = usePlayer();
  const barWidth = Math.min(100, Math.max(storagePercent || 0, vaultTracks && vaultTracks.length > 0 ? 3 : 0));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Text style={styles.headerTitle}>HAZE Lossless Vault</Text>

      {/* Storage Card matching HAZE theme */}
      <View style={styles.storageCard}>
        <View style={styles.storageHeaderRow}>
          <View style={styles.storageLeft}>
            <HardDrive size={18} color="#FFFFFF" />
            <Text style={styles.storageTitle}>Telegram Cloud Storage</Text>
          </View>
          <Text style={styles.storageStatus}>SYNCED</Text>
        </View>

        <View style={styles.storageStatsRow}>
          <Text style={styles.storageValue}>{storageUsed}</Text>
          <Text style={styles.storageTotal}>of {storageTotal} used</Text>
        </View>

        <View style={styles.storageBarBg}>
          <View style={[styles.storageBarFill, { width: `${barWidth}%` }]} />
        </View>
        <Text style={styles.storageSubtitle}>Every streamed song is automatically mirrored in full Lossless FLAC format.</Text>
      </View>

      {/* Vault Tracks Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Archived Tracks ({vaultTracks.length})</Text>
      </View>

      {/* Vault Track List */}
      <View style={styles.trackList}>
        {vaultTracks.length === 0 && (
          <View style={styles.emptyContainer}>
            <Cloud size={36} color="#444444" />
            <Text style={styles.emptyTitle}>Vault is ready</Text>
            <Text style={styles.emptySubtitle}>
              Play any song to stream and mirror directly to your Telegram Lossless FLAC Vault.
            </Text>
          </View>
        )}

        {vaultTracks.map((track, idx) => {
          const isThisPlaying = currentTrack?.id === track.id;
          return (
            <TouchableOpacity
              key={`${track.id}-${idx}`}
              activeOpacity={0.7}
              style={[styles.trackRow, isThisPlaying && styles.trackRowPlaying]}
              onPress={() => playTrack(track, vaultTracks)}
            >
              <Text style={styles.trackIndex}>{idx + 1}</Text>
              <Image
                source={{ uri: track.cover || 'https://via.placeholder.com/44' }}
                style={styles.trackCover}
              />
              <View style={styles.trackDetails}>
                <View style={styles.trackTitleRow}>
                  <Text
                    style={[styles.trackTitle, isThisPlaying && styles.trackTitlePlaying]}
                    numberOfLines={1}
                  >
                    {track.title}
                  </Text>
                  <View style={styles.flacBadge}>
                    <Text style={styles.flacBadgeText}>FLAC</Text>
                  </View>
                </View>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>
              <Text style={styles.trackDuration}>
                {formatDuration(track.duration || 215)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 160 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 160,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  storageCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  storageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storageTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storageStatus: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  storageStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 12,
  },
  storageValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  storageTotal: {
    fontSize: 12,
    color: '#8E8E93',
  },
  storageBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 10,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  storageSubtitle: {
    fontSize: 11,
    color: '#666666',
    marginTop: 10,
    lineHeight: 16,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#121212',
  },
  trackRowPlaying: {
    backgroundColor: '#121212',
  },
  trackIndex: {
    width: 22,
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  trackCover: {
    width: 40,
    height: 40,
    borderRadius: 5,
    backgroundColor: '#171717',
    marginLeft: 8,
  },
  trackDetails: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  trackTitlePlaying: {
    color: '#34D399',
    fontWeight: '700',
  },
  flacBadge: {
    backgroundColor: '#171717',
    borderWidth: 0.5,
    borderColor: '#262626',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  flacBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A3A3A3',
    fontFamily: 'monospace',
  },
  trackArtist: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  trackDuration: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'monospace',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
});
