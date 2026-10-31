import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Plus, ChevronRight, ListMusic } from 'lucide-react-native';
import { usePlayer, INITIAL_TRACKS } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const LibraryScreen = () => {
  const { playTrack, currentTrack, currentUser } = usePlayer();

  const playlists = [
    {
      id: 'p-1',
      title: 'Liked Songs',
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
          <Text style={styles.headerSubtitle}>MONOCHROME COLLECTION</Text>
        </View>
        <TouchableOpacity style={styles.newPlaylistBtn}>
          <Plus size={14} color="#000000" strokeWidth={3} />
          <Text style={styles.newPlaylistText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Playlists List matching Monochrome layout */}
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
            <ChevronRight size={16} color="#444444" />
          </TouchableOpacity>
        ))}
      </View>

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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#737373',
    fontFamily: 'monospace',
    marginTop: 2,
    letterSpacing: 1,
  },
  newPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  newPlaylistText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  playlistList: {
    backgroundColor: '#080808',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#121212',
  },
  playlistArt: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#171717',
    borderWidth: 0.5,
    borderColor: '#262626',
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  playlistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  playlistCount: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
});
