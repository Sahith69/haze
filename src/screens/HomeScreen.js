import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { Play, Settings, Cast, Music, Disc3, Sparkles } from 'lucide-react-native';
import { usePlayer, INITIAL_TRACKS } from '../context/PlayerContext';
import { fetchTrending, fetchVaultList } from '../services/api';
import { colors } from '../theme/colors';

const GENRES = [
  { id: 'pop', name: 'Pop', color: '#E13300' },
  { id: 'hiphop', name: 'Hip-Hop', color: '#BA5D07' },
  { id: 'indie', name: 'Indie & Alt', color: '#608108' },
  { id: 'rock', name: 'Rock', color: '#E91429' },
  { id: 'chill', name: 'Chill & Lo-Fi', color: '#477D95' },
  { id: 'telugu', name: 'Telugu Hits', color: '#8D67AB' },
  { id: 'bollywood', name: 'Bollywood', color: '#D84000' },
  { id: 'dance', name: 'Electronic', color: '#1E3264' },
];

const POPULAR_ARTISTS = [
  { name: 'The Weeknd', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg', genre: 'R&B / Pop' },
  { name: 'Billie Eilish', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/bf/82/53/bf82531e-b8eb-4e68-07dd-b5cb88764835/24UMGIM41846.rgb.jpg/600x600bb.jpg', genre: 'Alternative' },
  { name: 'Kendrick Lamar', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/58/05/27/58052723-5e93-c40b-741a-a0f5a7066d74/22UMGIM47895.rgb.jpg/600x600bb.jpg', genre: 'Hip-Hop' },
  { name: 'Arijit Singh', cover: 'https://c.saavncdn.com/artists/Arijit_Singh_002_20230323062147_500x500.jpg', genre: 'Bollywood' },
  { name: 'Anirudh Ravichander', cover: 'https://c.saavncdn.com/artists/Anirudh_Ravichander_004_20231019114757_500x500.jpg', genre: 'Soundtrack' },
  { name: 'Taylor Swift', cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/37/64/98/376498bb-4a56-82ae-eb01-389f4172cebe/24UMGIM28639.rgb.jpg/600x600bb.jpg', genre: 'Pop' },
];

export const HomeScreen = () => {
  const {
    playTrack,
    currentTrack,
    isPlaying,
    queue,
    trendingTracks,
    setTrendingTracks,
    setVaultTracks,
    openArtistView,
    openAlbumView,
    setActiveTab,
    setSearchQuery,
    performSearch,
    setShowQualityModal,
    setQualityModalMode,
  } = usePlayer();

  const [refreshing, setRefreshing] = useState(false);

  const activeTracks = trendingTracks && trendingTracks.length > 0 ? trendingTracks : queue && queue.length > 0 ? queue : INITIAL_TRACKS;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [freshTrending, vaultData] = await Promise.all([
        fetchTrending().catch(() => null),
        fetchVaultList().catch(() => null),
      ]);
      if (freshTrending && Array.isArray(freshTrending) && freshTrending.length > 0) {
        setTrendingTracks(freshTrending);
      }
      if (vaultData?.tracks && setVaultTracks) {
        setVaultTracks(vaultData.tracks);
      }
    } catch (e) {
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenrePress = (genreName) => {
    if (setSearchQuery) setSearchQuery(genreName);
    if (performSearch) performSearch(genreName);
    setActiveTab('search');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Spotube Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandingLeft}>
          <Text style={styles.brandTitle}>HAZE</Text>
          <View style={styles.spotubeEnginePill}>
            <Text style={styles.spotubeEngineText}>Spotube UI</Text>
          </View>
        </View>

        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              setQualityModalMode('stream');
              setShowQualityModal(true);
            }}
          >
            <Settings size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Section 1: Recently Played / Top Picks */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recently Played</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {activeTracks.slice(0, 8).map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          return (
            <TouchableOpacity
              key={`${track.id || idx}`}
              style={styles.recentCard}
              activeOpacity={0.8}
              onPress={() => playTrack(track, activeTracks)}
            >
              <View style={styles.cardImageContainer}>
                <Image
                  source={{ uri: track.cover || 'https://via.placeholder.com/150' }}
                  style={styles.cardCover}
                />
                {isCurrent && isPlaying && (
                  <View style={styles.playingOverlay}>
                    <Play size={20} color={colors.primary} fill={colors.primary} />
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {track.title}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {track.artist}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Section 2: Popular Artists */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popular Artists</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
      >
        {POPULAR_ARTISTS.map((artist, idx) => (
          <TouchableOpacity
            key={`artist_${idx}`}
            style={styles.artistCard}
            activeOpacity={0.8}
            onPress={() => {
              if (openArtistView) {
                openArtistView({ name: artist.name, cover: artist.cover });
              }
            }}
          >
            <Image source={{ uri: artist.cover }} style={styles.artistAvatar} />
            <Text style={styles.artistName} numberOfLines={1}>
              {artist.name}
            </Text>
            <Text style={styles.artistGenre} numberOfLines={1}>
              {artist.genre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section 3: Trending Hits */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trending Worldwide</Text>
      </View>
      <View style={styles.trackListContainer}>
        {activeTracks.slice(0, 6).map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          return (
            <TouchableOpacity
              key={`trending_${track.id || idx}`}
              style={[styles.trackRow, isCurrent && styles.trackRowActive]}
              activeOpacity={0.7}
              onPress={() => playTrack(track, activeTracks)}
            >
              <Text style={styles.trackIndex}>{idx + 1}</Text>
              <Image source={{ uri: track.cover }} style={styles.trackThumb} />
              <View style={styles.trackDetails}>
                <Text
                  style={[styles.trackName, isCurrent && { color: colors.primary }]}
                  numberOfLines={1}
                >
                  {track.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>
              <Play
                size={16}
                color={isCurrent ? colors.primary : colors.textDim}
                fill={isCurrent ? colors.primary : 'transparent'}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Section 4: Browse Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
      </View>
      <View style={styles.genreGrid}>
        {GENRES.map((genre) => (
          <TouchableOpacity
            key={genre.id}
            style={[styles.genreCard, { backgroundColor: genre.color }]}
            activeOpacity={0.8}
            onPress={() => handleGenrePress(genre.name)}
          >
            <Text style={styles.genreTitle}>{genre.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 150,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 8,
  },
  brandingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  spotubeEnginePill: {
    backgroundColor: 'rgba(30, 215, 96, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(30, 215, 96, 0.3)',
  },
  spotubeEngineText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  recentCard: {
    width: 135,
  },
  cardImageContainer: {
    width: 135,
    height: 135,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    marginBottom: 8,
  },
  cardCover: {
    width: '100%',
    height: '100%',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  artistCard: {
    width: 105,
    alignItems: 'center',
  },
  artistAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceElevated,
    marginBottom: 8,
  },
  artistName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  artistGenre: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textDim,
    textAlign: 'center',
    marginTop: 1,
  },
  trackListContainer: {
    paddingHorizontal: 16,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 2,
  },
  trackRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  trackIndex: {
    width: 24,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDim,
  },
  trackThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  trackDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  trackName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    gap: 12,
  },
  genreCard: {
    width: '48%',
    height: 80,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'flex-start',
  },
  genreTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
