import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlayer, INITIAL_TRACKS } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const HomeScreen = () => {
  const { playTrack, currentTrack, queue } = usePlayer();
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Trending', 'Charts', 'Genres'];
  const trendingTracks = queue && queue.length > 0 ? queue : INITIAL_TRACKS;

  const jumpBackInItems = [
    { id: 'jb-1', title: 'Liked Songs', gradient: ['#F5B942', '#C2410C'] },
    { id: 'jb-2', title: 'Late Night Mix', gradient: ['#3B3B5C', '#8B7CFF'] },
    { id: 'jb-3', title: 'Road Trip', gradient: ['#0EA5E9', '#8B5CF6'] },
    { id: 'jb-4', title: 'Focus Flow', gradient: ['#7C5CFF', '#FF5C9E'] },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Brand & Greeting Header */}
      <View style={styles.brandRow}>
        <Text style={styles.brandTitle}>HAZE</Text>
        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeText}>HI-RES</Text>
        </View>
      </View>
      <Text style={styles.greeting}>Hello Name!!</Text>

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
            onPress={() => playTrack(INITIAL_TRACKS[0])}
          >
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.jumpBackArt}
            />
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
    gap: 8,
    marginBottom: 4,
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
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.text,
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
