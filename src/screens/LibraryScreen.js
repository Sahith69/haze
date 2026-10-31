import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, MoreHorizontal, Heart, ListMusic } from 'lucide-react-native';
import { usePlayer, INITIAL_TRACKS } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const LibraryScreen = () => {
  const { playTrack, currentTrack, currentUser } = usePlayer();
  const [activeFilter, setActiveFilter] = useState('Playlists');

  const filters = ['Playlists', 'Liked', 'Artists', 'Albums'];

  const playlists = [
    {
      id: 'p-1',
      title: 'Liked Songs',
      count: '142 songs',
      cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
      gradient: ['#F5B942', '#C2410C'],
      track: INITIAL_TRACKS[0],
    },
    {
      id: 'p-2',
      title: 'Late Night Mix',
      count: '38 songs',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
      gradient: ['#3B3B5C', '#8B7CFF'],
      track: INITIAL_TRACKS[2],
    },
    {
      id: 'p-3',
      title: 'Road Trip',
      count: '65 songs',
      cover: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&q=80',
      gradient: ['#0EA5E9', '#8B5CF6'],
      track: INITIAL_TRACKS[1],
    },
    {
      id: 'p-4',
      title: 'Focus Flow',
      count: '52 songs',
      cover: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&q=80',
      gradient: ['#7C5CFF', '#FF5C9E'],
      track: INITIAL_TRACKS[4],
    },
    {
      id: 'p-5',
      title: 'Synthwave & Cyberpunk',
      count: '29 songs',
      cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80',
      gradient: ['#FF9A3C', '#FF3C6E'],
      track: INITIAL_TRACKS[3],
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.headerTitle}>{currentUser.name}'s Library</Text>
          <Text style={styles.headerSubtitle}>{currentUser.avatar} {currentUser.badge}</Text>
        </View>
        <TouchableOpacity style={styles.newPlaylistBtn}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.newPlaylistText}>New playlist</Text>
        </TouchableOpacity>
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

      {/* Playlist List */}
      <View style={styles.playlistList}>
        {playlists.map((pl) => (
          <TouchableOpacity
            key={pl.id}
            activeOpacity={0.7}
            style={styles.playlistRow}
            onPress={() => playTrack(pl.track || INITIAL_TRACKS[0])}
          >
            {pl.cover ? (
              <Image source={{ uri: pl.cover }} style={styles.playlistArt} />
            ) : (
              <LinearGradient
                colors={pl.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playlistArt}
              />
            )}
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistTitle} numberOfLines={1}>
                {pl.title}
              </Text>
              <Text style={styles.playlistCount} numberOfLines={1}>
                {pl.count}
              </Text>
            </View>
            <TouchableOpacity style={styles.actionBtn}>
              <MoreHorizontal size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {/* Extra bottom padding */}
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold,
    marginTop: 2,
  },
  newPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 14,
  },
  newPlaylistText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
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
  playlistList: {
    marginTop: 20,
    gap: 12,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  playlistArt: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  playlistCount: {
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
