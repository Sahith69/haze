import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Sparkles, Zap, ChevronDown, Check } from 'lucide-react-native';
import { usePlayer, INITIAL_TRACKS } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const HomeScreen = () => {
  const { playTrack, currentTrack, isPlaying, queue, currentUser, switchUser, flacEnabled, USERS } = usePlayer();
  const [activeFilter, setActiveFilter] = useState('All');
  const [showUserModal, setShowUserModal] = useState(false);

  const filters = ['All', 'Trending', 'Hi-Res Masters', 'Genres'];
  const trendingTracks = queue && queue.length > 0 ? queue : INITIAL_TRACKS;

  const jumpBackInItems = [
    {
      id: 'jb-1',
      title: 'Starboy Mix',
      subtitle: 'The Weeknd & Friends',
      cover: 'https://c.saavncdn.com/372/b7f9937fefd686876e90be4a96c9a6e9_500x500.jpg',
      track: INITIAL_TRACKS[0],
    },
    {
      id: 'jb-2',
      title: 'After Hours',
      subtitle: 'Night Vibes',
      cover: 'https://c.saavncdn.com/820/Blinding-Lights-English-2020-20200912094411-500x500.jpg',
      track: INITIAL_TRACKS[2],
    },
    {
      id: 'jb-3',
      title: 'Acoustic Hits',
      subtitle: 'Ed Sheeran & More',
      cover: 'https://c.saavncdn.com/286/2929d11a5d44a3592ced0383fa6f1977_500x500.jpg',
      track: INITIAL_TRACKS[1],
    },
    {
      id: 'jb-4',
      title: 'Pop Masterpieces',
      subtitle: 'Lady Gaga & Bruno',
      cover: 'https://c.saavncdn.com/645/Die-With-A-Smile-English-2024-20240816043202-500x500.jpg',
      track: INITIAL_TRACKS[4],
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Brand & Profile Header */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <Text style={styles.brandTitle}>HAZE</Text>
          <View style={[styles.brandBadge, flacEnabled && styles.brandBadgeFlac]}>
            <Text style={[styles.brandBadgeText, flacEnabled && styles.brandBadgeTextFlac]}>
              {flacEnabled ? '⚡ FLAC' : '✨ STUDIO'}
            </Text>
          </View>
        </View>

        {/* Profile Switcher Pill */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.profilePill}
          onPress={() => setShowUserModal(true)}
        >
          <LinearGradient
            colors={currentUser.colors}
            style={styles.profileAvatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.profileAvatarText}>{currentUser.avatar}</Text>
          </LinearGradient>
          <Text style={styles.profileName}>{currentUser.name}</Text>
          <ChevronDown size={14} color={colors.textSecondary} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>

      {/* Greeting & Active Mode Status */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>Hello, {currentUser.name}</Text>
        <Text style={styles.qualitySubtext}>
          {flacEnabled
            ? '⚡ 1,411 kbps Lossless FLAC Master Active'
            : '✨ 320 kbps Studio Master Active · Tap FLAC anytime'}
        </Text>
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
            <Text style={styles.modalSubtitle}>Custom audio fidelity configured for each profile</Text>

            {Object.values(USERS).map((user) => {
              const isSelected = currentUser.id === user.id;
              return (
                <TouchableOpacity
                  key={user.id}
                  activeOpacity={0.8}
                  style={[
                    styles.userCard,
                    isSelected && styles.userCardSelected,
                  ]}
                  onPress={() => {
                    switchUser(user.id);
                    setShowUserModal(false);
                  }}
                >
                  <LinearGradient
                    colors={user.colors}
                    style={styles.userCardAvatar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.userCardAvatarText}>{user.avatar}</Text>
                  </LinearGradient>

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
                      <Check size={16} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Hero Featured Master Banner */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.heroBanner}
        onPress={() => playTrack(trendingTracks[0])}
      >
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.45)', 'rgba(236, 72, 153, 0.25)', 'rgba(16, 16, 24, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <View style={styles.heroBadgeRow}>
            <Sparkles size={14} color="#F59E0B" />
            <Text style={styles.heroBadgeText}>STUDIO MASTER STREAMING</Text>
          </View>
          <Text style={styles.heroTitle}>{trendingTracks[0]?.title || 'Starboy'}</Text>
          <Text style={styles.heroArtist}>{trendingTracks[0]?.artist || 'The Weeknd'}</Text>
          <View style={styles.heroPlayRow}>
            <View style={styles.heroPlayBtn}>
              <Play size={18} color="#08080C" fill="#08080C" style={{ marginLeft: 2 }} />
              <Text style={styles.heroPlayText}>Play Master</Text>
            </View>
            <Text style={styles.heroQualityNote}>
              {flacEnabled ? 'Lossless FLAC · 1,411 kbps' : 'Studio Master · 320 kbps'}
            </Text>
          </View>
        </View>
        {trendingTracks[0]?.cover && (
          <Image source={{ uri: trendingTracks[0].cover }} style={styles.heroImage} />
        )}
      </TouchableOpacity>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
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
      </ScrollView>

      {/* Trending Now Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Trending now</Text>
        <Text style={styles.sectionSubtitle}>Updated hourly</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingRow}
      >
        {trendingTracks.map((track) => {
          const isCurrent = currentTrack?.id === track.id;
          return (
            <TouchableOpacity
              key={track.id}
              activeOpacity={0.85}
              style={styles.trendingCard}
              onPress={() => playTrack(track)}
            >
              <View style={styles.cardCoverWrapper}>
                {track.cover ? (
                  <Image source={{ uri: track.cover }} style={styles.cardCover} />
                ) : (
                  <LinearGradient
                    colors={track.gradient || ['#8B5CF6', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardCover}
                  />
                )}
                {isCurrent && (
                  <View style={styles.playingOverlay}>
                    <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                )}
                <View style={styles.audioBadgeTag}>
                  <Text style={styles.audioBadgeText}>HI-RES</Text>
                </View>
              </View>

              <Text style={[styles.cardTitle, isCurrent && { color: '#EC4899' }]} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.cardArtist} numberOfLines={1}>
                {track.artist}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Jump Back In Section */}
      <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
        <Text style={styles.sectionTitle}>Jump back in</Text>
        <Text style={styles.sectionSubtitle}>Recent favorites</Text>
      </View>

      <View style={styles.jumpBackGrid}>
        {jumpBackInItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            style={styles.jumpBackCard}
            onPress={() => playTrack(item.track || INITIAL_TRACKS[0])}
          >
            <Image source={{ uri: item.cover }} style={styles.jumpBackArt} />
            <View style={styles.jumpBackTextWrapper}>
              <Text style={styles.jumpBackTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.jumpBackSubtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Extra bottom padding to account for MiniPlayer & BottomNav */}
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#FFFFFF',
  },
  brandBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  brandBadgeFlac: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#06B6D4',
    letterSpacing: 0.8,
  },
  brandBadgeTextFlac: {
    color: '#F59E0B',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 24,
    gap: 6,
  },
  profileAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 12,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: '#FFFFFF',
  },
  qualitySubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 3,
    letterSpacing: 0.1,
  },
  heroBanner: {
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    flex: 1,
    paddingRight: 12,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroArtist: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
    marginBottom: 10,
  },
  heroPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
  },
  heroPlayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#08080C',
  },
  heroQualityNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  heroImage: {
    width: 100,
    height: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  trendingRow: {
    flexDirection: 'row',
    gap: 14,
  },
  trendingCard: {
    width: 144,
  },
  cardCoverWrapper: {
    width: 144,
    height: 144,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  cardCover: {
    width: '100%',
    height: '100%',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBadgeTag: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  audioBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: -0.2,
  },
  cardArtist: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  jumpBackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  jumpBackCard: {
    width: '48.5%',
    height: 60,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  jumpBackArt: {
    width: 60,
    height: 60,
  },
  jumpBackTextWrapper: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  jumpBackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  jumpBackSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#12121A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
    gap: 14,
  },
  userCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  userCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCardAvatarText: {
    fontSize: 22,
  },
  userCardInfo: {
    flex: 1,
  },
  userCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  userBadgePillActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  userBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  userCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
