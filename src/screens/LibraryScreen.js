import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, MoreHorizontal, ChevronRight } from 'lucide-react-native';
import { usePlayer, INITIAL_TRACKS } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const LibraryScreen = () => {
  const { playTrack, currentTrack, currentUser } = usePlayer();
  const [activeFilter, setActiveFilter] = useState('Playlists');

  const filters = ['Playlists', 'Liked Masters', 'Artists', 'Albums'];

  const playlists = [
    {
      id: 'p-1',
      title: 'Liked Masters',
      count: '142 tracks · Lossless FLAC',
      cover: 'https://c.saavncdn.com/372/b7f9937fefd686876e90be4a96c9a6e9_500x500.jpg',
      track: INITIAL_TRACKS[0],
    },
    {
      id: 'p-2',
      title: 'Late Night Audiophile',
      count: '38 tracks · 24-bit Studio',
      cover: 'https://c.saavncdn.com/820/Blinding-Lights-English-2020-20200912094411-500x500.jpg',
      track: INITIAL_TRACKS[2],
    },
    {
      id: 'p-3',
      title: 'Acoustic Sessions',
      count: '65 tracks · Lossless FLAC',
      cover: 'https://c.saavncdn.com/286/2929d11a5d44a3592ced0383fa6f1977_500x500.jpg',
      track: INITIAL_TRACKS[1],
    },
    {
      id: 'p-4',
      title: 'Pop & R&B Hits',
      count: '52 tracks · Studio Master',
      cover: 'https://c.saavncdn.com/645/Die-With-A-Smile-English-2024-20240816043202-500x500.jpg',
      track: INITIAL_TRACKS[4],
    },
    {
      id: 'p-5',
      title: 'Thriller & Classics',
      count: '29 tracks · Remastered',
      cover: 'https://c.saavncdn.com/295/2742a0391b87aa58b7ba3eefaf57fcf0_500x500.jpg',
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
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.newPlaylistText}>New Playlist</Text>
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

      {/* Playlists List */}
      <View style={styles.playlistList}>
        {playlists.map((playlist) => (
          <TouchableOpacity
            key={playlist.id}
            activeOpacity={0.7}
            style={styles.playlistCard}
            onPress={() => playTrack(playlist.track || INITIAL_TRACKS[0])}
          >
            <Image source={{ uri: playlist.cover }} style={styles.playlistArt} />
            <View style={styles.playlistInfo}>
              <Text style={styles.playlistTitle} numberOfLines={1}>
                {playlist.title}
              </Text>
              <Text style={styles.playlistCount} numberOfLines={1}>
                {playlist.count}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textDim} />
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
    paddingTop: 54,
    paddingHorizontal: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 2,
  },
  newPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  newPlaylistText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
  playlistList: {
    marginTop: 6,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginBottom: 4,
  },
  playlistArt: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  playlistTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  playlistCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
});
