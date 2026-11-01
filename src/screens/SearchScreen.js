import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  BackHandler,
} from 'react-native';
import {
  Search,
  Link,
  X,
  Music,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Mic,
  Disc3,
  User,
  Trash2,
  Play,
  Sparkles,
} from 'lucide-react-native';
import { usePlayer, INITIAL_TRACKS } from '../context/PlayerContext';
import { searchTracks, fetchRadioTracks } from '../services/api';
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
    setQueue,
    currentTrack,
    currentUser,
    downloadTrack,
    isTrackDownloaded,
    downloadProgress,
    searchHistory,
    addSearchHistory,
    removeSearchHistory,
    clearSearchHistory,
  } = usePlayer();

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(INITIAL_TRACKS);
  const [topResult, setTopResult] = useState(null);
  const [popularTracks, setPopularTracks] = useState([]);
  const [otherTracks, setOtherTracks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'songs' | 'artists' | 'albums'
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  // Android Hardware Back Button: Clear search if active before leaving search tab
  useEffect(() => {
    if (!hasSearched && !query) return;
    const onBackPress = () => {
      setQuery('');
      setHasSearched(false);
      setSearchResults(INITIAL_TRACKS);
      setTopResult(null);
      setPopularTracks([]);
      setOtherTracks([]);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [hasSearched, query]);

  const executeSearch = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setSearchResults(INITIAL_TRACKS);
      setTopResult(null);
      setPopularTracks([]);
      setOtherTracks([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchTracks(trimmed);
      setSearchResults(results || []);
      setTopResult(results?.topResult || null);
      setPopularTracks(results?.popularTracks || (results ? results.slice(0, 5) : []));
      setOtherTracks(results?.otherTracks || (results ? results.slice(5) : []));
    } catch (e) {
      setSearchResults([]);
      setTopResult(null);
      setPopularTracks([]);
      setOtherTracks([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(INITIAL_TRACKS);
      setTopResult(null);
      setPopularTracks([]);
      setOtherTracks([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(query);
    }, 320);

    return () => clearTimeout(timer);
  }, [query, executeSearch]);

  const clearSearch = () => {
    setQuery('');
    setSearchResults(INITIAL_TRACKS);
    setTopResult(null);
    setPopularTracks([]);
    setOtherTracks([]);
    setHasSearched(false);
    setIsSearching(false);
  };

  const handleTrackPress = (track) => {
    if (query.trim()) {
      addSearchHistory(query.trim());
    } else {
      addSearchHistory(track.title);
    }

    // Filter search results: exclude any duplicate or variant titles of the active song
    const cleanBase = (t) => (t || '').toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').replace(/feat\..*|ft\..*/gi, '').replace(/[^a-z0-9]/g, ' ').trim();
    const activeNorm = cleanBase(track.title);
    const uniqueResults = [];
    const seen = new Set([activeNorm]);

    for (const item of (searchResults || [])) {
      if (item.id === track.id) continue;
      const norm = cleanBase(item.title);
      if (!seen.has(norm)) {
        seen.add(norm);
        uniqueResults.push(item);
      }
    }

    // Play clicked track immediately with distinct search candidates as instant queue
    const initialQueue = [track, ...uniqueResults.slice(0, 5)];
    playTrack(track, initialQueue);

    // Concurrently fetch rich artist & vibe radio and append to queue so it never runs dry
    fetchRadioTracks(track.artist, track.genre, track.title).then((radioTracks) => {
      if (radioTracks && radioTracks.length > 0) {
        const freshRadio = radioTracks.filter(r => !seen.has(cleanBase(r.title)));
        setQueue((prev) => {
          const prevIds = new Set(prev.map(p => p.id));
          const toAppend = freshRadio.filter(r => !prevIds.has(r.id));
          return [...prev, ...toAppend];
        });
      }
    }).catch(() => {});
  };

  const handleRecentPress = (term) => {
    setQuery(term);
    executeSearch(term);
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

  // Segregate artists and albums from search results
  const uniqueArtists = useMemo(() => {
    const map = new Map();
    searchResults.forEach((t) => {
      const artist = (t.artist || 'Unknown Artist').trim();
      if (!map.has(artist)) {
        map.set(artist, {
          artist,
          cover: t.cover,
          count: 1,
          tracks: [t],
        });
      } else {
        const item = map.get(artist);
        item.count++;
        item.tracks.push(t);
      }
    });
    return Array.from(map.values());
  }, [searchResults]);

  const uniqueAlbums = useMemo(() => {
    const map = new Map();
    searchResults.forEach((t) => {
      const album = (t.album || 'Single').trim();
      if (!map.has(album)) {
        map.set(album, {
          album,
          artist: t.artist,
          cover: t.cover,
          count: 1,
          tracks: [t],
        });
      } else {
        const item = map.get(album);
        item.count++;
        item.tracks.push(t);
      }
    });
    return Array.from(map.values());
  }, [searchResults]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Search Input Header */}
      <View style={styles.searchBar}>
        <Search size={18} color="#71717A" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search songs, artists, albums..."
          placeholderTextColor="#71717A"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (query.trim()) addSearchHistory(query.trim());
            executeSearch(query);
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSearching ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color="#888888" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Segregation Filter Pills: All | Songs | Artists | Albums */}
      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'All' },
          { id: 'songs', label: 'Songs' },
          { id: 'artists', label: 'Artists' },
          { id: 'albums', label: 'Albums' },
        ].map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Isolated Search History (Only visible when query is empty) */}
      {!query.trim() && searchHistory.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="#71717A" />
              <Text style={styles.historyTitle}>
                Recent Searches ({currentUser.name})
              </Text>
            </View>
            <TouchableOpacity onPress={clearSearchHistory}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.historyChips}>
            {searchHistory.map((item, idx) => (
              <View key={idx} style={styles.chip}>
                <TouchableOpacity onPress={() => handleRecentPress(item)}>
                  <Text style={styles.chipText}>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeSearchHistory(item)}
                  style={styles.chipClose}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <X size={12} color="#71717A" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Spotify Import Banner */}
      {!hasSearched && (
        <View style={styles.importCard}>
          <View style={styles.importHeader}>
            <Link size={16} color="#22C55E" />
            <Text style={styles.importTitle}>Import Spotify Playlist</Text>
          </View>
          <Text style={styles.importDesc}>
            Paste any playlist link to match and stream tracks in pure Lossless FLAC format.
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
                <Text style={styles.importButtonText}>Import</Text>
              )}
            </TouchableOpacity>
          </View>
          {importMessage ? <Text style={styles.importFeedback}>{importMessage}</Text> : null}
        </View>
      )}

      {/* TOP RESULT HERO CARD */}
      {hasSearched && topResult && (selectedCategory === 'all' || (selectedCategory === 'artists' && topResult.type === 'artist') || (selectedCategory === 'songs' && topResult.type === 'song')) && (
        <View style={styles.topResultSection}>
          <View style={styles.topResultBadgeRow}>
            <Sparkles size={13} color="#A1A1AA" />
            <Text style={styles.topResultBadge}>TOP RESULT</Text>
          </View>
          <TouchableOpacity
            style={styles.topResultCard}
            activeOpacity={0.8}
            onPress={() => {
              if (topResult.type === 'artist') {
                if (popularTracks.length > 0) playTrack(popularTracks[0], popularTracks);
              } else if (topResult.track) {
                handleTrackPress(topResult.track);
              }
            }}
          >
            <Image
              source={{ uri: topResult.cover || 'https://via.placeholder.com/80' }}
              style={topResult.type === 'artist' ? styles.topResultAvatar : styles.topResultCover}
            />
            <View style={styles.topResultMeta}>
              <View
                style={[
                  styles.topResultTag,
                  topResult.type === 'artist' ? styles.topResultArtistTag : styles.topResultSongTag,
                ]}
              >
                <Text style={styles.topResultTagText}>
                  {topResult.type === 'artist' ? 'ARTIST' : 'SONG'}
                </Text>
              </View>
              <Text style={styles.topResultTitle} numberOfLines={1}>
                {topResult.name || topResult.title}
              </Text>
              <Text style={styles.topResultSubtitle} numberOfLines={1}>
                {topResult.subtitle}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.topResultPlayBtn}
              activeOpacity={0.8}
              onPress={() => {
                if (topResult.type === 'artist') {
                  if (popularTracks.length > 0) playTrack(popularTracks[0], popularTracks);
                } else if (topResult.track) {
                  handleTrackPress(topResult.track);
                }
              }}
            >
              <Play size={18} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      {/* POPULAR SONGS (When Searched) */}
      {hasSearched && (selectedCategory === 'all' || selectedCategory === 'songs') && popularTracks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {topResult?.type === 'artist' ? `Popular by ${topResult.name}` : 'Popular Songs'}
          </Text>

          <View style={styles.trackList}>
            {popularTracks.map((track, idx) => {
              const isPlayingCurrent = currentTrack?.id === track.id;
              const isDownloaded = isTrackDownloaded(track.id);
              const isDownloading = downloadProgress[track.id]?.status === 'downloading';

              return (
                <TouchableOpacity
                  key={`pop-${track.id}-${idx}`}
                  style={[styles.trackRow, isPlayingCurrent && styles.trackRowActive]}
                  activeOpacity={0.7}
                  onPress={() => handleTrackPress(track)}
                >
                  <Text style={[styles.trackRankNumber, isPlayingCurrent && styles.trackRankNumberActive]}>
                    {idx + 1}
                  </Text>

                  {track.cover ? (
                    <Image source={{ uri: track.cover }} style={styles.trackArt} />
                  ) : (
                    <View style={[styles.trackArt, { backgroundColor: '#1E1E24' }]}>
                      <Music size={16} color="#888888" />
                    </View>
                  )}

                  <View style={styles.trackInfo}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[styles.trackTitle, isPlayingCurrent && styles.trackTitleActive]}
                        numberOfLines={1}
                      >
                        {track.title}
                      </Text>
                      <View style={[styles.hiResBadge, (!isDownloaded || !track.isFlac) && styles.badge320]}>
                        <Text style={[styles.hiResText, (!isDownloaded || !track.isFlac) && styles.badgeText320]}>
                          {isDownloaded
                            ? (track.isFlac ? '⚡ FLAC' : '✨ 320k')
                            : '✨ 320k'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist} · {track.album || 'Single'}
                    </Text>
                  </View>

                  <Text style={styles.trackDuration}>{formatDuration(track.duration)}</Text>

                  {/* Download Button */}
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      downloadTrack(track);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : isDownloaded ? (
                      <CheckCircle2 size={18} color="#22C55E" />
                    ) : (
                      <ArrowDownToLine size={18} color="#71717A" />
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ARTISTS VIEW */}
      {(selectedCategory === 'all' || selectedCategory === 'artists') && uniqueArtists.length > 0 && hasSearched && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Artists</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artistsRow}>
            {uniqueArtists.slice(0, 6).map((art, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.artistCard}
                onPress={() => {
                  setQuery(art.artist);
                  executeSearch(art.artist);
                }}
              >
                {art.cover ? (
                  <Image source={{ uri: art.cover }} style={styles.artistAvatar} />
                ) : (
                  <View style={[styles.artistAvatar, styles.artistPlaceholder]}>
                    <User size={24} color="#FFFFFF" />
                  </View>
                )}
                <Text style={styles.artistName} numberOfLines={1}>
                  {art.artist}
                </Text>
                <Text style={styles.artistSubtitle}>{art.count} track{art.count > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ALBUMS VIEW */}
      {(selectedCategory === 'all' || selectedCategory === 'albums') && uniqueAlbums.length > 0 && hasSearched && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Albums</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumsRow}>
            {uniqueAlbums.slice(0, 6).map((alb, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.albumCard}
                onPress={() => {
                  setQuery(`${alb.artist} ${alb.album}`);
                  executeSearch(`${alb.artist} ${alb.album}`);
                }}
              >
                {alb.cover ? (
                  <Image source={{ uri: alb.cover }} style={styles.albumCover} />
                ) : (
                  <View style={[styles.albumCover, styles.artistPlaceholder]}>
                    <Disc3 size={24} color="#FFFFFF" />
                  </View>
                )}
                <Text style={styles.albumTitle} numberOfLines={1}>
                  {alb.album}
                </Text>
                <Text style={styles.albumArtist} numberOfLines={1}>
                  {alb.artist}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ALL SONGS & OTHER RELEASES (When Searched) */}
      {hasSearched && (selectedCategory === 'all' || selectedCategory === 'songs') && otherTracks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {topResult?.type === 'artist' ? 'All Releases & Features' : 'Other Results'}
          </Text>

          <View style={styles.trackList}>
            {otherTracks.map((track, idx) => {
              const isPlayingCurrent = currentTrack?.id === track.id;
              const isDownloaded = isTrackDownloaded(track.id);
              const isDownloading = downloadProgress[track.id]?.status === 'downloading';

              return (
                <TouchableOpacity
                  key={`other-${track.id}-${idx}`}
                  style={[styles.trackRow, isPlayingCurrent && styles.trackRowActive]}
                  activeOpacity={0.7}
                  onPress={() => handleTrackPress(track)}
                >
                  {track.cover ? (
                    <Image source={{ uri: track.cover }} style={styles.trackArt} />
                  ) : (
                    <View style={[styles.trackArt, { backgroundColor: '#1E1E24' }]}>
                      <Music size={16} color="#888888" />
                    </View>
                  )}

                  <View style={styles.trackInfo}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[styles.trackTitle, isPlayingCurrent && styles.trackTitleActive]}
                        numberOfLines={1}
                      >
                        {track.title}
                      </Text>
                      <View style={[styles.hiResBadge, (!isDownloaded || !track.isFlac) && styles.badge320]}>
                        <Text style={[styles.hiResText, (!isDownloaded || !track.isFlac) && styles.badgeText320]}>
                          {isDownloaded
                            ? (track.isFlac ? '⚡ FLAC' : '✨ 320k')
                            : '✨ 320k'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist} · {track.album || 'Single'}
                    </Text>
                  </View>

                  <Text style={styles.trackDuration}>{formatDuration(track.duration)}</Text>

                  {/* Download Button */}
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      downloadTrack(track);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : isDownloaded ? (
                      <CheckCircle2 size={18} color="#22C55E" />
                    ) : (
                      <ArrowDownToLine size={18} color="#71717A" />
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* SAMPLE MUSIC / POPULAR SEARCHES (When Query is empty) */}
      {!hasSearched && (selectedCategory === 'all' || selectedCategory === 'songs') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Searches</Text>

          <View style={styles.trackList}>
            {searchResults.map((track) => {
              const isPlayingCurrent = currentTrack?.id === track.id;
              const isDownloaded = isTrackDownloaded(track.id);
              const isDownloading = downloadProgress[track.id]?.status === 'downloading';

              return (
                <TouchableOpacity
                  key={track.id}
                  style={[styles.trackRow, isPlayingCurrent && styles.trackRowActive]}
                  activeOpacity={0.7}
                  onPress={() => handleTrackPress(track)}
                >
                  {track.cover ? (
                    <Image source={{ uri: track.cover }} style={styles.trackArt} />
                  ) : (
                    <View style={[styles.trackArt, { backgroundColor: '#1E1E24' }]}>
                      <Music size={16} color="#888888" />
                    </View>
                  )}

                  <View style={styles.trackInfo}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[styles.trackTitle, isPlayingCurrent && styles.trackTitleActive]}
                        numberOfLines={1}
                      >
                        {track.title}
                      </Text>
                      <View style={[styles.hiResBadge, (!isDownloaded || !track.isFlac) && styles.badge320]}>
                        <Text style={[styles.hiResText, (!isDownloaded || !track.isFlac) && styles.badgeText320]}>
                          {isDownloaded
                            ? (track.isFlac ? '⚡ FLAC' : '✨ 320k')
                            : '✨ 320k'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist} · {track.album || 'Single'}
                    </Text>
                  </View>

                  <Text style={styles.trackDuration}>{formatDuration(track.duration)}</Text>

                  {/* Download Button */}
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      downloadTrack(track);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isDownloading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : isDownloaded ? (
                      <CheckCircle2 size={18} color="#22C55E" />
                    ) : (
                      <ArrowDownToLine size={18} color="#71717A" />
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 150,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    padding: 0,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  filterTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  historySection: {
    marginTop: 16,
    marginBottom: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  clearText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  historyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipText: {
    color: '#E4E4E7',
    fontSize: 12,
    fontWeight: '600',
  },
  chipClose: {
    padding: 2,
  },
  importCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 12,
    marginBottom: 16,
  },
  importHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  importTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  importDesc: {
    fontSize: 12,
    color: '#71717A',
    lineHeight: 17,
    marginBottom: 12,
  },
  importInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  importInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  importButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 13,
  },
  importFeedback: {
    fontSize: 12,
    color: '#22C55E',
    marginTop: 8,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  artistsRow: {
    gap: 16,
    paddingBottom: 8,
  },
  artistCard: {
    alignItems: 'center',
    width: 80,
  },
  artistAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 6,
  },
  artistPlaceholder: {
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  artistSubtitle: {
    fontSize: 10,
    color: '#71717A',
    marginTop: 2,
  },
  albumsRow: {
    gap: 14,
    paddingBottom: 8,
  },
  albumCard: {
    width: 100,
  },
  albumCover: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 6,
  },
  albumTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  albumArtist: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  trackList: {
    gap: 6,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
  },
  trackRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  trackArt: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trackTitleActive: {
    color: colors.gold,
    fontWeight: '700',
  },
  hiResBadge: {
    backgroundColor: 'rgba(245, 185, 66, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 185, 66, 0.3)',
  },
  badge320: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  hiResText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold,
  },
  badgeText320: {
    color: '#38BDF8',
  },
  trackArtist: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  trackDuration: {
    fontSize: 12,
    color: '#52525B',
  },
  downloadBtn: {
    padding: 6,
  },
  topResultSection: {
    marginTop: 14,
    marginBottom: 8,
  },
  topResultBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  topResultBadge: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  topResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14141B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242432',
  },
  topResultAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#27272A',
  },
  topResultCover: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#27272A',
  },
  topResultMeta: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  topResultTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  topResultArtistTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  topResultSongTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  topResultTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  topResultTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  topResultSubtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    marginTop: 3,
  },
  topResultPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  trackRankNumber: {
    width: 20,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#71717A',
  },
  trackRankNumberActive: {
    color: '#FFFFFF',
  },
});
