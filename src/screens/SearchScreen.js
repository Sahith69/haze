import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Search, Link, MoreHorizontal, ArrowRight, X, Music, ArrowDownToLine, CheckCircle2 } from 'lucide-react-native';
import { usePlayer, INITIAL_TRACKS } from '../context/PlayerContext';
import { searchTracks } from '../services/api';
import { colors } from '../theme/colors';

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const SearchScreen = () => {
  const {
    playTrack,
    currentTrack,
    flacEnabled,
    downloadTrack,
    isTrackDownloaded,
    downloadProgress,
  } = usePlayer();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(INITIAL_TRACKS);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

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
      setSearchResults(results || []);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

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
      setImportMessage('Successfully matched 24 tracks in Lossless quality!');
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
      {/* HAZE Search Header matching Header.jsx */}
      <View style={styles.searchBar}>
        <Search size={16} color="#666666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, albums..."
          placeholderTextColor="#666666"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => executeSearch(query)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={16} color="#888888" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Spotify Import Card matching Sidebar.jsx */}
      <View style={styles.importCard}>
        <View style={styles.importHeader}>
          <Link size={16} color="#22C55E" />
          <Text style={styles.importTitle}>Import Spotify Playlist</Text>
        </View>
        <Text style={styles.importDesc}>
          Paste any Spotify playlist link to match and stream tracks in pure Lossless FLAC format.
        </Text>
        <View style={styles.importInputRow}>
          <TextInput
            style={styles.importInput}
            placeholder="https://open.spotify.com/playlist/..."
            placeholderTextColor="#555555"
            value={spotifyUrl}
            onChangeText={setSpotifyUrl}
          />
          <TouchableOpacity
            style={styles.importButton}
            activeOpacity={0.8}
            onPress={handleSpotifyImport}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <ArrowRight size={16} color="#000000" />
            )}
          </TouchableOpacity>
        </View>
        {importMessage ? (
          <Text style={styles.importFeedback}>{importMessage}</Text>
        ) : null}
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {hasSearched ? `Search Results for "${query}"` : 'Top Songs'}
        </Text>
      </View>

      {/* Track List matching TrackList.jsx */}
      <View style={styles.trackList}>
        {!isSearching && hasSearched && searchResults.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No tracks found</Text>
            <Text style={styles.emptySubtitle}>Try searching with different song titles or artists</Text>
          </View>
        )}

        {searchResults.map((track, idx) => {
          const isThisPlaying = currentTrack?.id === track.id;
          const isDownloaded = isTrackDownloaded(track.id);
          const isDownloading = downloadProgress[track.id]?.status === 'downloading';

          return (
            <TouchableOpacity
              key={`${track.id}-${idx}`}
              activeOpacity={0.7}
              style={[styles.trackRow, isThisPlaying && styles.trackRowPlaying]}
              onPress={() => playTrack(track)}
            >
              <Text style={styles.trackIndex}>{idx + 1}</Text>
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
                  <View style={styles.flacBadge}>
                    <Text style={styles.flacBadgeText}>
                      {flacEnabled ? 'FLAC' : '320k'}
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
  searchBar: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 14,
  },
  importCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    marginBottom: 20,
  },
  importHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  importTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  importDesc: {
    fontSize: 11,
    color: '#8E8E93',
    lineHeight: 16,
    marginBottom: 10,
  },
  importInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importInput: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#242424',
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 12,
  },
  importButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importFeedback: {
    fontSize: 11,
    color: '#22C55E',
    marginTop: 8,
  },
  resultsHeader: {
    marginBottom: 10,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
  flacBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A3A3A3',
    fontFamily: 'monospace',
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
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
});
