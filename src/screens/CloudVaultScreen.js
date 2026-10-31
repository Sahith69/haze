import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MoreHorizontal, HardDriveDownload, CloudCheck } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const CloudVaultScreen = () => {
  const { vaultTracks, playTrack, currentTrack, storageUsed, storageTotal } = usePlayer();
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Hi-Res', 'On phone'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Title */}
      <Text style={styles.headerTitle}>Cloud Vault</Text>

      {/* Cloudflare R2 Storage Card */}
      <View style={styles.storageCard}>
        <View style={styles.storageHeader}>
          <Text style={styles.storageValue}>{storageUsed}</Text>
          <Text style={styles.storageTotal}>of {storageTotal} used</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.storageBarBg}>
          <View style={[styles.storageBarFill, { width: '14%' }]} />
        </View>
        <Text style={styles.storageSubtitle}>Cloudflare R2 Lossless Storage · Zero Egress</Text>
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
        {vaultTracks.map((track) => {
          const isPlayingThis = currentTrack?.id === track.id;
          return (
            <TouchableOpacity
              key={track.id}
              activeOpacity={0.7}
              style={styles.trackRow}
              onPress={() => playTrack(track)}
            >
              {/* 48px Artwork */}
              <LinearGradient
                colors={track.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.trackArt}
              />

              {/* Title, Badge & Artist */}
              <View style={styles.trackInfo}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.trackTitle,
                      isPlayingThis && { color: colors.accentPink },
                    ]}
                    numberOfLines={1}
                  >
                    {track.title}
                  </Text>
                  {track.isHiRes && (
                    <View style={styles.hiResBadge}>
                      <Text style={styles.hiResText}>HI-RES</Text>
                    </View>
                  )}
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
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.text,
  },
  storageCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  storageValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  storageTotal: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  storageBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginTop: 12,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  storageSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  filterPill: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
  },
  filterPillInactive: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  filterText: {
    fontSize: 13,
  },
  filterTextActive: {
    fontWeight: '700',
    color: colors.bg,
  },
  filterTextInactive: {
    fontWeight: '600',
    color: colors.text,
  },
  trackList: {
    marginTop: 18,
    gap: 12,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  trackArt: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  trackInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
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
