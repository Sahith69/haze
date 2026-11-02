import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Search as SearchIcon, X, Play, MoreVertical, Disc3, Mic2, ListMusic } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { searchMusic } from '../services/api';
import { colors } from '../theme/colors';

const CATEGORIES = ['All', 'Tracks', 'Artists', 'Albums'];

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
    isPlaying,
    searchQuery,
    setSearchQuery,
    openArtistView,
    openAlbumView,
    promptAddToPlaylist,
  } = usePlayer();

  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const debounceTimer = useRef(null);

  const executeSearch = async (text) => {
    if (!text || text.trim().length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchMusic(text.trim());
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (text) => {
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      executeSearch(text);
    }, 350);
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
  };

  // Filter results according to active category
  const filteredResults = results.filter((item) => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Tracks') return true; // Most API items are tracks
    if (activeCategory === 'Artists') return item.isArtist || false;
    if (activeCategory === 'Albums') return item.isAlbum || false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchInputContainer}>
          <SearchIcon size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Search songs, artists, albums..."
            placeholderTextColor={colors.textDim}
            value={searchQuery}
            onChangeText={handleQueryChange}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Spotube Category Filter Pills */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.pill, isActive && styles.pillActive]}
                activeOpacity={0.7}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={filteredResults}
          keyExtractor={(item, index) => `${item.id || index}`}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.resultRow, isCurrent && styles.resultRowActive]}
                activeOpacity={0.7}
                onPress={() => playTrack(item, filteredResults)}
              >
                <Image
                  source={{ uri: item.cover || 'https://via.placeholder.com/150' }}
                  style={styles.resultCover}
                />
                <View style={styles.resultDetails}>
                  <Text
                    style={[styles.resultTitle, isCurrent && { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.resultSubtitle} numberOfLines={1}>
                    {item.artist}
                  </Text>
                </View>

                {item.duration > 0 && (
                  <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
                )}

                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={() => promptAddToPlaylist && promptAddToPlaylist(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MoreVertical size={18} color={colors.textDim} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <View style={styles.centerContainer}>
          <SearchIcon size={48} color={colors.borderLight} />
          <Text style={styles.emptyPromptTitle}>Search Spotube Library</Text>
          <Text style={styles.emptyPromptSub}>
            Type any song, artist, album, or genre name above
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#333333',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  categoriesWrapper: {
    paddingBottom: 8,
  },
  categoryPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#333333',
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 150,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  resultRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  resultCover: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: '#242424',
  },
  resultDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textDim,
    marginRight: 10,
  },
  moreBtn: {
    padding: 6,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  emptyPromptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 6,
  },
  emptyPromptSub: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
});
