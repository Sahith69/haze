import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MoreHorizontal, Cloud, ShieldCheck, Play, ArrowDownToLine } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const CloudVaultScreen = () => {
  const { vaultTracks, playTrack, currentTrack, storageUsed, storageTotal, storagePercent, flacEnabled } = usePlayer();
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Lossless FLAC', 'Cached'];
  const barWidth = Math.min(100, Math.max(storagePercent || 0, vaultTracks && vaultTracks.length > 0 ? 3 : 0));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Title */}
      <Text style={styles.headerTitle}>Cloud Vault</Text>

      {/* Cloud Storage Card */}
      <View style={styles.storageCard}>
        <View style={styles.storageHeaderRow}>
          <View style={styles.storageLeft}>
            <Cloud size={22} color="#F59E0B" />
            <Text style={styles.storageTitle}>Lossless Archive</Text>
          </View>
          <View style={styles.syncBadge}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.syncBadgeText}>Telegram Sync</Text>
          </View>
        </View>

        <View style={styles.storageStatsRow}>
          <Text style={styles.storageValue}>{storageUsed}</Text>
          <Text style={styles.storageTotal}>of {storageTotal} Cloudflare/TG used</Text>
        </View>

        {/* Dynamic Multi-Color Progress Bar */}
        <View style={styles.storageBarBg}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.storageBarFill, { width: `${barWidth}%` }]}
          />
        </View>
        <Text style={styles.storageSubtitle}>Every song you play is automatically preserved in Lossless FLAC Master format.</Text>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              activeOpacity={0.8}
              style={[
                styles.filterPill,
                isActive ? styles.filterPillActive : styles.filterPillInactive,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  isActive ? styles.filterTextActive : styles.filterTextInactive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Vault Track List */}
      <View style={styles.trackList}>
        {vaultTracks.length === 0 && (
          <View style={styles.emptyContainer}>
            <Cloud size={40} color="rgba(255, 255, 255, 0.25)" />
            <Text style={styles.emptyTitle}>Vault is ready</Text>
            <Text style={styles.emptySubtitle}>
              Play any track from Home or Search to instantly stream and mirror to your Lossless FLAC Vault.
            </Text>
          </View>
        )}

        {vaultTracks.map((track) => {
          const isPlayingThis = currentTrack?.id === track.id;
          return (
            <TouchableOpacity
              key={track.id}
              activeOpacity={0.7}
              style={[styles.trackRow, isPlayingThis && styles.trackRowActive]}
              onPress={() => playTrack(track)}
            >
              <View style={styles.artContainer}>
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
                {isPlayingThis && (
                  <View style={styles.playingOverlay}>
                    <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                )}
              </View>

              {/* Title, Badge & Artist */}
              <View style={styles.trackInfo}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.trackTitle,
                      isPlayingThis && { color: '#EC4899' },
                    ]}
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

              {/* Action Button */}
              <TouchableOpacity style={styles.actionBtn}>
                <MoreHorizontal size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Extra bottom padding for MiniPlayer & BottomNav */}
      <View style={{ height: 160 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 54,
    paddingHorizontal: 18,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  storageCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
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
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  syncBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  storageStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 14,
  },
  storageValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  storageTotal: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  storageBarBg: {
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    marginTop: 12,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: 7,
    borderRadius: 3.5,
  },
  storageSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
  },
  filterPill: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
  },
  filterPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  filterText: {
    fontSize: 13,
  },
  filterTextActive: {
    fontWeight: '700',
    color: '#08080C',
  },
  filterTextInactive: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trackList: {
    marginTop: 12,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginBottom: 4,
  },
  trackRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  artContainer: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  trackArt: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  flacBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  flacBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  trackArtist: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
