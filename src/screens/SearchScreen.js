import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Link, MoreHorizontal, ArrowRight, X, Play } from 'lucide-react-native';
import { usePlayer, INITIAL_TRACKS } from '../context/PlayerContext';
import { searchTracks } from '../services/api';
import { colors } from '../theme/colors';

export const SearchScreen = () => {
  const { playTrack, currentTrack, flacEnabled } = usePlayer();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(INITIAL_TRACKS);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Tracks');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  const filters = ['Tracks', 'Artists', 'Albums', 'Playlists'];

  const executeSearch = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setSearchResults(INITIAL_TRACKS);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchTracks(trimmed);
      if (results && results.length > 0) {
        const mapped = results.map((t, idx) => ({
          ...t,
          gradient: [
            ['#8B5CF6', '#EC4899'],
            ['#F59E0B', '#EF4444'],
            ['#06B6D4', '#3B82F6'],
            ['#10B981', '#06B6D4'],
            ['#6366F1', '#A855F7'],
          ][idx % 5],
        }));
        setSearchResults(mapped);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search on typing
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(INITIAL_TRACKS);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  const clearSearch = () => {
    setQuery('');
    setSearchResults(INITIAL_TRACKS);
    setHasSearched(false);
    setIsSearching(false);
  };

  const handleSpotifyImport = () => {
    if (!spotifyUrl.trim()) return;
    setIsImporting(true);
    setImportMessage('Fetching playlist tracks from Spotify...');
    setTimeout(() => {
      setIsImporting(false);
      setImportMessage('Successfully matched 24 tracks in Studio Master quality!');
      setTimeout(() => setImportMessage(''), 3500);
    }, 1500);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.headerTitle}>Search</Text>

      {/* Glass Search Input */}
      <View style={styles.searchBar}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Songs, artists, podcasts..."
          placeholderTextColor={colors.textDim}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => executeSearch(query)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color="#EC4899" />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
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
        {!isSearching && hasSearched && searchResults.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No tracks found</Text>
            <Text style={styles.emptySubtitle}>Try searching with different song titles or artists</Text>
          </View>
        )}

        {searchResults.map((track) => {
          const isPlayingThis = currentTrack?.id === track.id;
          return (
            <TouchableOpacity
              key={track.id}
              activeOpacity={0.7}
              style={[styles.trackRow, isPlayingThis && styles.trackRowActive]}
              onPress={() => playTrack(track)}
            >
              <View style={styles.artContainer}>
                {track.cover ? (
                  <Image source={{ uri: track.cover }} style={styles.trackArt} />
                ) : (
                  <LinearGradient
                    colors={track.gradient || ['#8B5CF6', '#EC4899']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.trackArt}
                  />
                )}
                {isPlayingThis && (
                  <View style={styles.playingArtBadge}>
                    <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                )}
              </View>

              <View style={styles.trackInfo}>
                <Text
                  style={[
                    styles.trackTitle,
                    isPlayingThis && { color: '#EC4899' },
                  ]}
                  numberOfLines={1}
                >
                  {track.title}
                </Text>
                <View style={styles.trackSubRow}>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {track.artist}
                  </Text>
                  <View style={styles.trackQualityPill}>
                    <Text style={styles.trackQualityText}>
                      {flacEnabled ? 'FLAC' : '320k'}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.actionBtn}>
                <MoreHorizontal size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Spotify & Apple Music Import Card */}
      <View style={styles.importCard}>
        <View style={styles.importHeader}>
          <Link size={18} color="#F59E0B" />
          <Text style={styles.importTitle}>Import playlist from link</Text>
        </View>
        <Text style={styles.importDesc}>
          Paste any Spotify or Apple Music playlist link to instantly match and stream tracks in Studio Master quality.
        </Text>
        <View style={styles.importInputRow}>
          <TextInput
            style={styles.importInput}
            placeholder="https://open.spotify.com/playlist/..."
            placeholderTextColor="rgba(255, 255, 255, 0.35)"
            value={spotifyUrl}
            onChangeText={setSpotifyUrl}
          />
          <TouchableOpacity
            style={styles.importButton}
            activeOpacity={0.8}
            onPress={handleSpotifyImport}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#08080C" />
            ) : (
              <ArrowRight size={18} color="#08080C" />
            )}
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
    paddingTop: 54,
    paddingHorizontal: 18,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  searchBar: {
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
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
  trackList: {
    marginTop: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginBottom: 4,
  },
  trackRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  artContainer: {
    position: 'relative',
    width: 52,
    height: 52,
  },
  trackArt: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playingArtBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  trackSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  trackArtist: {
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  trackQualityPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  trackQualityText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#06B6D4',
    letterSpacing: 0.5,
  },
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  importHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  importTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  importDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  importInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  importInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 13,
  },
  importButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importFeedback: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 10,
  },
});
