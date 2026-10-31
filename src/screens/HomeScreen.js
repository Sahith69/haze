import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlayer, INITIAL_TRACKS } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const HomeScreen = () => {
  const { playTrack, currentTrack, queue, currentUser, switchUser, flacEnabled, USERS } = usePlayer();
  const [activeFilter, setActiveFilter] = useState('All');
  const [showUserModal, setShowUserModal] = useState(false);

  const filters = ['All', 'Trending', 'Charts', 'Genres'];
  const trendingTracks = queue && queue.length > 0 ? queue : INITIAL_TRACKS;

  const jumpBackInItems = [
    {
      id: 'jb-1',
      title: 'Liked Songs',
      cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
      gradient: ['#F5B942', '#C2410C'],
      track: INITIAL_TRACKS[0],
    },
    {
      id: 'jb-2',
      title: 'Late Night Mix',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
      gradient: ['#3B3B5C', '#8B7CFF'],
      track: INITIAL_TRACKS[2],
    },
    {
      id: 'jb-3',
      title: 'Road Trip',
      cover: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&q=80',
      gradient: ['#0EA5E9', '#8B5CF6'],
      track: INITIAL_TRACKS[1],
    },
    {
      id: 'jb-4',
      title: 'Focus Flow',
      cover: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&q=80',
      gradient: ['#7C5CFF', '#FF5C9E'],
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
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>{flacEnabled ? 'FLAC' : 'HI-RES'}</Text>
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
          <Text style={styles.profileArrow}>▾</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.greeting}>Hello {currentUser.name}! {currentUser.avatar}</Text>
      <Text style={styles.qualitySubtext}>
        {flacEnabled ? '⚡ Lossless FLAC Master (1,411 kbps)' : '✨ Studio Mode · Tap badge in player for FLAC'}
      </Text>

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
            <Text style={styles.modalTitle}>Select Profile</Text>
            <Text style={styles.modalSubtitle}>Switch listening experience instantly</Text>

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
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

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
      <Text style={styles.sectionTitle}>Trending now</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingRow}
      >
        {trendingTracks.map((track) => (
          <TouchableOpacity
            key={track.id}
            activeOpacity={0.8}
            style={styles.trendingCard}
            onPress={() => playTrack(track)}
          >
            {track.cover ? (
              <Image source={{ uri: track.cover }} style={styles.cardCover} />
            ) : (
              <LinearGradient
                colors={track.gradient || ['#7C5CFF', '#FF5C9E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardCover}
              />
            )}
            <Text style={styles.cardTitle} numberOfLines={1}>
              {track.title}
            </Text>
            <Text style={styles.cardArtist} numberOfLines={1}>
              {track.artist}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Jump Back In Section */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Jump back in</Text>
      <View style={styles.jumpBackGrid}>
        {jumpBackInItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            style={styles.jumpBackCard}
            onPress={() => playTrack(item.track || INITIAL_TRACKS[0])}
          >
            {item.cover ? (
              <Image source={{ uri: item.cover }} style={styles.jumpBackArt} />
            ) : (
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.jumpBackArt}
              />
            )}
            <Text style={styles.jumpBackTitle} numberOfLines={1}>
              {item.title}
            </Text>
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
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
    color: colors.accentPink,
  },
  brandBadge: {
    backgroundColor: 'rgba(245, 185, 66, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 185, 66, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brandBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.5,
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  profileAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 11,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileArrow: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.text,
  },
  qualitySubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
    borderColor: colors.gold,
    backgroundColor: 'rgba(245, 185, 66, 0.1)',
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
    backgroundColor: 'rgba(245, 185, 66, 0.25)',
  },
  userBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold,
  },
  userCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 26,
    marginBottom: 12,
  },
  trendingRow: {
    flexDirection: 'row',
    gap: 14,
  },
  trendingCard: {
    width: 152,
  },
  cardCover: {
    width: 152,
    height: 152,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  cardArtist: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  jumpBackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  jumpBackCard: {
    width: '48.5%',
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  jumpBackArt: {
    width: 56,
    height: 56,
  },
  jumpBackTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    paddingRight: 6,
  },
});
