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

function getGreeting() {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 18) return 'Good afternoon';
  return 'Good evening';
}

const POPULAR_ARTISTS = [
  { name: 'The Weeknd', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg', genre: 'R&B / Pop' },
  { name: 'Billie Eilish', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/bf/82/53/bf82531e-b8eb-4e68-07dd-b5cb88764835/24UMGIM41846.rgb.jpg/600x600bb.jpg', genre: 'Alternative' },
  { name: 'Taylor Swift', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/37/64/98/376498bb-4a56-82ae-eb01-389f4172cebe/24UMGIM28639.rgb.jpg/600x600bb.jpg', genre: 'Pop' },
  { name: 'Arijit Singh', cover: 'https://c.saavncdn.com/artists/Arijit_Singh_002_20230323062147_500x500.jpg', genre: 'Bollywood' },
  { name: 'Kendrick Lamar', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/58/05/27/58052723-5e93-c40b-741a-a0f5a7066d74/22UMGIM47895.rgb.jpg/600x600bb.jpg', genre: 'Hip-Hop' },
  { name: 'Sai Abhyankkar', cover: 'https://c.saavncdn.com/editorial/SaiAbhyankkarHits_20240722100808_500x500.jpg', genre: 'Indie / Pop' },
  { name: 'Drake', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/4e/c5/42/4ec54284-be47-7561-c8b8-d4218eb8548c/23UMGIM95147.rgb.jpg/600x600bb.jpg', genre: 'Hip-Hop' },
  { name: 'Anirudh Ravichander', cover: 'https://c.saavncdn.com/artists/Anirudh_Ravichander_004_20231019114757_500x500.jpg', genre: 'Soundtrack' },
  { name: 'Dua Lipa', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/ea/98/86/ea988636-24e6-d98c-ec0c-dcfa328b9d31/190295286101.jpg/600x600bb.jpg', genre: 'Dance / Pop' },
];

export const HomeScreen = () => {
  const {
    playTrack,
    currentTrack,
    isPlaying,
    queue,
    trendingTracks,
    setTrendingTracks,
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
    openArtistView,
    openAlbumView,
  } = usePlayer();
  const [showUserModal, setShowUserModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activeTrendingTracks = (trendingTracks && trendingTracks.length > 0)
    ? trendingTracks
    : (queue && queue.length > 0 ? queue : INITIAL_TRACKS);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [freshTrending, vaultData] = await Promise.all([
        fetchTrending().catch(() => null),
        fetchVaultList().catch(() => null),
      ]);
      if (freshTrending && Array.isArray(freshTrending) && freshTrending.length > 0) {
        setTrendingTracks(freshTrending);
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
      {/* Spotube Header Bar */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.subGreetingText}>HAZE STUDIO · HI-FI AUDIO</Text>
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

      {/* Spotube 2-Column Quick Picks Grid */}
      <View style={styles.quickPicksGrid}>
        {activeTrendingTracks.slice(0, 6).map((track, idx) => {
          const isThisPlaying = currentTrack?.id === track.id && isPlaying;
          return (
            <TouchableOpacity
              key={`quick-${track.id}-${idx}`}
              style={[styles.quickPickCard, isThisPlaying && styles.quickPickCardActive]}
              activeOpacity={0.75}
              onPress={() => playTrack(track, activeTrendingTracks)}
            >
              <Image
                source={{ uri: track.cover || 'https://via.placeholder.com/60' }}
                style={styles.quickPickCover}
              />
              <View style={styles.quickPickTextWrap}>
                <Text style={[styles.quickPickTitle, isThisPlaying && styles.quickPickTitleActive]} numberOfLines={2}>
                  {track.title}
                </Text>
              </View>
              {isThisPlaying && (
                <View style={styles.quickPickPlayDot}>
                  <Play size={10} color="#000000" fill="#000000" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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

      {/* Popular Artists Horizontal Rail */}
      <View style={styles.artistsSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Popular Artists</Text>
          </View>
          <Text style={styles.sectionBadge}>Catalog</Text>
        </View>
        <ScrollView
          horizontal
          nestedScrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.artistsRail}
        >
          {POPULAR_ARTISTS.map((artist, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.artistCard}
              activeOpacity={0.7}
              onPress={() => openArtistView(artist.name, artist.cover)}
            >
              <Image source={{ uri: artist.cover }} style={styles.artistAvatar} />
              <Text style={styles.artistName} numberOfLines={1}>
                {artist.name}
              </Text>
              <Text style={styles.artistGenre} numberOfLines={1}>
                {artist.genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Trending Now Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Music2 size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Top Charts & Trending</Text>
        </View>
        <Text style={styles.sectionBadge}>Hi-Fi</Text>
      </View>

      {/* Spotube Track List */}
      <View style={styles.trackList}>
        {activeTrendingTracks.map((track, idx) => {
          const isThisPlaying = currentTrack?.id === track.id;
          const isDownloaded = isTrackDownloaded(track.id);
          const isDownloading = downloadProgress[track.id]?.status === 'downloading';

          return (
            <View
              key={`${track.id}-${idx}`}
              style={[styles.trackRow, isThisPlaying && styles.trackRowPlaying]}
            >
              {/* Left Play Tap Area: Index & Artwork */}
              <TouchableOpacity
                style={styles.trackLeftTouch}
                activeOpacity={0.7}
                onPress={() => playTrack(track, activeTrendingTracks)}
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
              </TouchableOpacity>

              {/* Middle Area: Title (tap to play) & Artist (tap for artist catalog) */}
              <View style={styles.trackDetails}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => playTrack(track, activeTrendingTracks)}
                >
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
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{ top: 2, bottom: 6, left: 0, right: 12 }}
                  onPress={() => openArtistView(track.artist, track.cover)}
                >
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {track.artist}
                  </Text>
                </TouchableOpacity>
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
                  <CheckCircle2 size={16} color={colors.primary} />
                ) : isDownloading ? (
                  <Text style={styles.downloadingText}>...</Text>
                ) : (
                  <ArrowDownToLine size={15} color="#666666" />
                )}
              </TouchableOpacity>

              <Text style={styles.trackDuration}>
                {formatDuration(track.duration || 215)}
              </Text>
            </View>
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
    backgroundColor: colors.bg,
  },
  contentContainer: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 160,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandLeft: {
    flexDirection: 'column',
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subGreetingText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 1.2,
    marginTop: 2,
    fontFamily: 'monospace',
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualityBadgePillFlac: {
    borderColor: 'rgba(245, 196, 81, 0.4)',
    backgroundColor: 'rgba(245, 196, 81, 0.08)',
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  profileAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 10,
  },
  profileName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  quickPicksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  quickPickCard: {
    width: '48.5%',
    height: 52,
    backgroundColor: colors.card,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickPickCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.cardHover,
  },
  quickPickCover: {
    width: 52,
    height: 52,
    backgroundColor: '#1E2130',
  },
  quickPickTextWrap: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  quickPickTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 14,
  },
  quickPickTitleActive: {
    color: colors.primary,
  },
  quickPickPlayDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  artistsSection: {
    marginBottom: 24,
  },
  artistsRail: {
    gap: 16,
    paddingVertical: 4,
    paddingRight: 16,
  },
  artistCard: {
    alignItems: 'center',
    width: 76,
  },
  artistAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1E2130',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  artistName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    width: '100%',
  },
  artistGenre: {
    fontSize: 10,
    color: colors.textDim,
    textAlign: 'center',
    width: '100%',
    marginTop: 2,
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: 'rgba(30, 215, 96, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(30, 215, 96, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontFamily: 'monospace',
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
    borderBottomColor: colors.border,
  },
  trackRowPlaying: {
    backgroundColor: colors.cardHover,
  },
  trackLeftTouch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackIndex: {
    width: 22,
    fontSize: 12,
    color: colors.textDim,
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
    color: colors.primary,
  },
  trackCover: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#1E2130',
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
    color: colors.text,
    flexShrink: 1,
  },
  trackTitlePlaying: {
    color: colors.primary,
    fontWeight: '700',
  },
  flacBadge: {
    backgroundColor: colors.badgeBg,
    borderWidth: 0.5,
    borderColor: colors.badgeBorder,
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
    color: colors.badgeText,
    fontFamily: 'monospace',
  },
  badgeText320: {
    color: colors.cyan,
  },
  trackArtist: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trackDuration: {
    fontSize: 11,
    color: colors.textDim,
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
    color: colors.gold,
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
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#11131C',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    gap: 12,
  },
  userCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#161928',
  },
  userCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
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
    color: colors.text,
  },
  userBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  userBadgePillActive: {
    backgroundColor: colors.primary,
  },
  userBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E5E5E5',
    fontFamily: 'monospace',
  },
  userCardDesc: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
