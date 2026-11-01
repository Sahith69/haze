import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal, RefreshControl } from 'react-native';
import { Play, Sparkles, Music2, ChevronDown, Check, ArrowDownToLine, CheckCircle2 } from 'lucide-react-native';
import { usePlayer, INITIAL_TRACKS } from '../context/PlayerContext';
import { fetchTrending, fetchVaultList } from '../services/api';
import { colors } from '../theme/colors';

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const HomeScreen = () => {
  const {
    playTrack,
    currentTrack,
    isPlaying,
    queue,
    setQueue,
    setVaultTracks,
    currentUser,
    switchUser,
    flacEnabled,
    USERS,
    downloadTrack,
    isTrackDownloaded,
    downloadProgress,
    streamingQuality,
    setShowQualityModal,
    setQualityModalMode,
  } = usePlayer();
  const [showUserModal, setShowUserModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const trendingTracks = queue && queue.length > 0 ? queue : INITIAL_TRACKS;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [freshTrending, vaultData] = await Promise.all([
        fetchTrending().catch(() => null),
        fetchVaultList().catch(() => null),
      ]);
      if (freshTrending && Array.isArray(freshTrending) && freshTrending.length > 0) {
        setQueue(freshTrending);
      }
      if (vaultData?.tracks && setVaultTracks) {
        setVaultTracks(vaultData.tracks);
      }
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FFFFFF"
          colors={['#FFFFFF']}
        />
      }
    >
      {/* HAZE Brand Header matching Sidebar & Header */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          {/* HAZE Signature Dot Logo */}
          <View style={styles.logoCircle}>
            <View style={styles.logoDot} />
          </View>
          <View style={styles.brandTextGroup}>
            <Text style={styles.brandTitle}>HAZE</Text>
            <Text style={styles.brandSubtitle}>STUDIO & LOSSLESS AUDIO</Text>
          </View>
        </View>

        <View style={styles.brandRight}>
          {/* Quality Mode Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.qualityBadgePill,
              streamingQuality === '1411k' && styles.qualityBadgePillFlac,
            ]}
            onPress={() => {
              setQualityModalMode('streaming');
              setShowQualityModal(true);
            }}
          >
            <Text
              style={[
                styles.qualityBadgePillText,
                streamingQuality === '1411k' && { color: colors.gold },
              ]}
            >
              {streamingQuality === '1411k'
                ? '⚡ FLAC'
                : streamingQuality === '320k'
                ? '✨ 320k'
                : streamingQuality === '256k'
                ? 'HD'
                : 'SAVER'}
            </Text>
          </TouchableOpacity>

          {/* Profile Switcher Pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.profilePill}
            onPress={() => setShowUserModal(true)}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{currentUser.avatar}</Text>
            </View>
            <Text style={styles.profileName}>{currentUser.name}</Text>
            <ChevronDown size={14} color="#888888" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Banner */}
      <View style={styles.featuredBanner}>
        <View style={styles.bannerBadge}>
          <Sparkles size={12} color="#FFFFFF" />
          <Text style={styles.bannerBadgeText}>
            {streamingQuality === '1411k' ? 'Pure FLAC & Lossless Master' : 'Hi-Fi Studio Audio'}
          </Text>
        </View>

        <Text style={styles.bannerTitle}>Welcome to HAZE.</Text>
        <Text style={styles.bannerSubtitle}>
          Stream and download millions of tracks with bit-perfect lossless quality, synchronized lyrics, Spotify smart shuffle, and offline vault.
        </Text>

        <View style={styles.bannerActionRow}>
          <TouchableOpacity
            style={styles.playButton}
            activeOpacity={0.85}
            onPress={() => playTrack(trendingTracks[0], trendingTracks)}
          >
            <Play size={14} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
            <Text style={styles.playButtonText}>Play Top Trending</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Switcher Modal */}
      <Modal
        visible={showUserModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUserModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Listener Profile</Text>
            <Text style={styles.modalSubtitle}>Configure listening preferences</Text>

            {Object.values(USERS).map((user) => {
              const isSelected = currentUser.id === user.id;
              return (
                <TouchableOpacity
                  key={user.id}
                  activeOpacity={0.8}
                  style={[styles.userCard, isSelected && styles.userCardSelected]}
                  onPress={() => {
                    switchUser(user.id);
                    setShowUserModal(false);
                  }}
                >
                  <View style={styles.userCardAvatar}>
                    <Text style={styles.userCardAvatarText}>{user.avatar}</Text>
                  </View>

                  <View style={styles.userCardInfo}>
                    <View style={styles.userCardNameRow}>
                      <Text style={styles.userCardName}>{user.name}</Text>
                      <View style={[styles.userBadgePill, isSelected && styles.userBadgePillActive]}>
                        <Text style={styles.userBadgeText}>{user.badge}</Text>
                      </View>
                    </View>
                    <Text style={styles.userCardDesc}>{user.description}</Text>
                  </View>

                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Check size={14} color="#000000" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Trending Now Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Music2 size={16} color="#A3A3A3" />
          <Text style={styles.sectionTitle}>Trending Now</Text>
        </View>
        <Text style={styles.sectionBadge}>Top Charts</Text>
      </View>

      {/* HAZE Track List (exact TrackList design) */}
      <View style={styles.trackList}>
        {trendingTracks.map((track, idx) => {
          const isThisPlaying = currentTrack?.id === track.id;
          const isDownloaded = isTrackDownloaded(track.id);
          const isDownloading = downloadProgress[track.id]?.status === 'downloading';

          return (
            <TouchableOpacity
              key={`${track.id}-${idx}`}
              activeOpacity={0.7}
              style={[styles.trackRow, isThisPlaying && styles.trackRowPlaying]}
              onPress={() => playTrack(track, trendingTracks)}
            >
              {isThisPlaying ? (
                <View style={styles.playingIndexBox}>
                  <Text style={styles.playingIndexText}>▶</Text>
                </View>
              ) : (
                <Text style={styles.trackIndex}>{idx + 1}</Text>
              )}
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
                  <View style={[styles.flacBadge, (!isDownloaded || !track.isFlac) && styles.badge320]}>
                    <Text style={[styles.flacBadgeText, (!isDownloaded || !track.isFlac) && styles.badgeText320]}>
                      {isDownloaded
                        ? (track.isFlac ? '⚡ FLAC' : '✨ 320k')
                        : '✨ 320k'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>

              {/* Quick Download Button */}
              <TouchableOpacity
                style={styles.downloadIconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => downloadTrack(track)}
                onLongPress={() => {
                  setQualityModalMode('download');
                  setShowQualityModal(true);
                }}
                delayLongPress={400}
              >
                {isDownloaded ? (
                  <CheckCircle2 size={16} color="#22C55E" />
                ) : isDownloading ? (
                  <Text style={styles.downloadingText}>...</Text>
                ) : (
                  <ArrowDownToLine size={15} color="#555555" />
                )}
              </TouchableOpacity>

              <Text style={styles.trackDuration}>
                {formatDuration(track.duration || 215)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom spacer */}
      <View style={{ height: 160 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    paddingTop: 54,
    paddingHorizontal: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  brandTextGroup: {
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: '#737373',
    letterSpacing: 1,
    marginTop: 1,
  },
  brandRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityBadgePill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityBadgePillFlac: {
    borderColor: 'rgba(245, 185, 66, 0.4)',
    backgroundColor: 'rgba(245, 185, 66, 0.08)',
  },
  qualityBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#CCCCCC',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  profileAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#222222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 10,
  },
  profileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featuredBanner: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#262626',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 10,
  },
  bannerBadgeText: {
    fontSize: 10,
    color: '#D4D4D4',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 18,
    marginTop: 6,
  },
  bannerActionRow: {
    marginTop: 14,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sectionBadge: {
    fontSize: 11,
    color: '#737373',
    fontFamily: 'monospace',
  },
  trackList: {
    backgroundColor: '#080808',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
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
  playingIndexBox: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingIndexText: {
    fontSize: 11,
    color: '#34D399',
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
  badge320: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  flacBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A3A3A3',
    fontFamily: 'monospace',
  },
  badgeText320: {
    color: '#38BDF8',
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
  downloadIconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadingText: {
    fontSize: 12,
    color: '#F5B942',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0D0D0D',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#242424',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#222222',
    marginBottom: 10,
    gap: 12,
  },
  userCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: '#1C1C1C',
  },
  userCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCardAvatarText: {
    fontSize: 18,
  },
  userCardInfo: {
    flex: 1,
  },
  userCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  userCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#262626',
  },
  userBadgePillActive: {
    backgroundColor: '#333333',
  },
  userBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E5E5E5',
    fontFamily: 'monospace',
  },
  userCardDesc: {
    fontSize: 11,
    color: '#8E8E93',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
