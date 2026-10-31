import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Link, MoreHorizontal, ArrowRight } from 'lucide-react-native';
import { usePlayer, INITIAL_TRACKS } from '../context/PlayerContext';
import { searchTracks } from '../services/api';
import { colors } from '../theme/colors';

export const SearchScreen = () => {
  const { playTrack, currentTrack } = usePlayer();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(INITIAL_TRACKS);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tracks');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  const filters = ['Tracks', 'Artists', 'Albums', 'Playlists'];

  // Real API search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(INITIAL_TRACKS);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchTracks(query);
      if (results && results.length > 0) {
        const mapped = results.map((t, idx) => ({
          ...t,
          gradient: [
            ['#7C5CFF', '#FF5C9E'],
            ['#FF9A3C', '#FF3C6E'],
            ['#18C8A8', '#2A6BFF'],
            ['#F5B942', '#C2410C'],
            ['#3B3B5C', '#8B7CFF'],
          ][idx % 5],
        }));
        setSearchResults(mapped);
      }
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSpotifyImport = () => {
    if (!spotifyUrl.trim()) return;
    setIsImporting(true);
    setImportMessage('Fetching playlist tracks from Spotify...');
    setTimeout(() => {
      setIsImporting(false);
      setImportMessage('Successfully matched 24 tracks!');
      setTimeout(() => setImportMessage(''), 3000);
    }, 1500);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.headerTitle}>Search</Text>

      {/* Glass Search Input */}
      <View style={styles.searchBar}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, albums..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
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

      {/* Search Results List */}
      <View style={styles.trackList}>
        {isSearching && (
          <ActivityIndicator color={colors.accentPink} style={{ marginVertical: 12 }} />
        )}
        {searchResults.map((track) => {
          const isPlayingThis = currentTrack?.id === track.id;
          return (
            <TouchableOpacity
              key={track.id}
              activeOpacity={0.7}
              style={styles.trackRow}
              onPress={() => playTrack(track)}
            >
              {track.cover ? (
                <Image source={{ uri: track.cover }} style={styles.trackArt} />
              ) : (
                <LinearGradient
                  colors={track.gradient || ['#7C5CFF', '#FF5C9E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.trackArt}
                />
              )}

              <View style={styles.trackInfo}>
                <Text
                  style={[
                    styles.trackTitle,
                    isPlayingThis && { color: colors.accentPink },
                  ]}
                  numberOfLines={1}
                >
                  {track.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>
              <TouchableOpacity style={styles.actionBtn}>
                <MoreHorizontal size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Spotify Import Card matching 05_Search */}
      <View style={styles.importCard}>
        <View style={styles.importHeader}>
          <Link size={20} color={colors.gold} />
          <Text style={styles.importTitle}>Import a playlist from a link</Text>
        </View>
        <Text style={styles.importDesc}>
          Paste any Spotify, Apple Music, or Tidal playlist URL to match and import tracks instantly.
        </Text>
        <View style={styles.importInputRow}>
          <TextInput
            style={styles.importInput}
            placeholder="https://open.spotify.com/playlist/..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={spotifyUrl}
            onChangeText={setSpotifyUrl}
          />
          <TouchableOpacity
            style={styles.importButton}
            activeOpacity={0.8}
            onPress={handleSpotifyImport}
          >
            <ArrowRight size={18} color={colors.goldDark} />
          </TouchableOpacity>
        </View>
        {importMessage ? (
          <Text style={styles.importFeedback}>{importMessage}</Text>
        ) : null}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.text,
  },
  searchBar: {
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 18,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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
  trackList: {
    marginTop: 20,
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
  trackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
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
  importCard: {
    marginTop: 28,
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  importHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  importTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  importDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  importInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  importInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  importButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importFeedback: {
    fontSize: 12,
    color: colors.gold,
    marginTop: 8,
    fontWeight: '600',
  },
});
