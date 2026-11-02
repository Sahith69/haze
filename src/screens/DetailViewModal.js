import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronDown,
  ArrowLeft,
  Play,
  Shuffle,
  Music2,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';
import { fetchArtistDetails, fetchAlbumDetails } from '../services/api';

const { width, height } = Dimensions.get('window');

function formatDuration(totalSec) {
  if (!totalSec || isNaN(totalSec)) return '';
  const mins = Math.floor(totalSec / 60);
  const secs = Math.floor(totalSec % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs} hr ${remMins} min`;
  }
  return `${mins} min ${secs > 0 ? `${secs} sec` : ''}`;
}

function formatTrackTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const DetailViewModal = () => {
  const {
    detailModalData,
    hasDetailHistory,
    closeDetailView,
    openArtistView,
    openAlbumView,
    playTrack,
    currentTrack,
    isPlaying,
    promptAddToPlaylist,
  } = usePlayer();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const modalAnim = useRef(new Animated.Value(height)).current;
  const isClosingRef = useRef(false);

  useEffect(() => {
    Animated.spring(modalAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, []);

  const handleSmoothClose = () => {
    if (isClosingRef.current) return;
    if (hasDetailHistory) {
      closeDetailView();
      return;
    }
    isClosingRef.current = true;
    Animated.timing(modalAnim, {
      toValue: height,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      closeDetailView();
    });
  };

  useEffect(() => {
    const onBack = () => {
      handleSmoothClose();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!detailModalData) return;
    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      if (detailModalData.type === 'artist') {
        const res = await fetchArtistDetails(detailModalData.title);
        if (!isCancelled) {
          setData(res);
          setLoading(false);
        }
      } else if (detailModalData.type === 'album') {
        const res = await fetchAlbumDetails(detailModalData.title, detailModalData.artist);
        if (!isCancelled) {
          setData(res);
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [detailModalData]);

  if (!detailModalData) return null;

  const isArtist = detailModalData.type === 'artist';

  const handlePlayAll = (shuffle = false) => {
    const trackList = isArtist ? data?.topSongs : data?.tracks;
    if (!trackList || trackList.length === 0) return;

    let queueToPlay = [...trackList];
    if (shuffle) {
      for (let i = queueToPlay.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queueToPlay[i], queueToPlay[j]] = [queueToPlay[j], queueToPlay[i]];
      }
    }
    playTrack(queueToPlay[0], queueToPlay);
  };

  return (
    <Animated.View style={[styles.modalOverlay, { transform: [{ translateY: modalAnim }] }]}>
      <View style={styles.container}>
        {/* Top Floating Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={handleSmoothClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {hasDetailHistory ? (
              <ArrowLeft size={22} color="#FFFFFF" />
            ) : (
              <ChevronDown size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
          <Text style={styles.headerCategory} numberOfLines={1}>
            {isArtist ? 'ARTIST' : 'ALBUM'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO BANNER SECTION */}
          <View style={styles.heroSection}>
            {isArtist ? (
              // ARTIST HERO
              <View style={styles.artistHeroBox}>
                <View style={styles.artistImageWrapper}>
                  <Image
                    source={{ uri: data?.cover || detailModalData.cover || 'https://via.placeholder.com/300' }}
                    style={styles.artistImage}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                </View>
                <View style={styles.artistMetaCol}>
                  <View style={styles.verifiedBadgeRow}>
                    <CheckCircle2 size={13} color="#38BDF8" fill="#38BDF8" />
                    <Text style={styles.verifiedText}>VERIFIED ARTIST</Text>
                  </View>
                  <Text style={styles.artistHeroName} numberOfLines={2}>
                    {detailModalData.title}
                  </Text>
                  <Text style={styles.artistGenreText}>
                    {data?.genre || 'Global Music'} • {data?.topSongs?.length || 0} Popular Tracks
                  </Text>
                </View>
              </View>
            ) : (
              // ALBUM HERO
              <View style={styles.albumHeroBox}>
                <View style={styles.albumCoverWrapper}>
                  <Image
                    source={{ uri: data?.cover || detailModalData.cover || 'https://via.placeholder.com/300' }}
                    style={styles.albumCoverImage}
                  />
                </View>
                <View style={styles.albumMetaCol}>
                  <Text style={styles.albumHeroTitle} numberOfLines={2}>
                    {detailModalData.title}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      if (data?.artist || detailModalData.artist) {
                        openArtistView(data?.artist || detailModalData.artist);
                      }
                    }}
                  >
                    <Text style={styles.albumHeroArtist}>
                      by <Text style={styles.albumHeroArtistLink}>{data?.artist || detailModalData.artist || 'Unknown Artist'}</Text>
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.albumInfoRow}>
                    <Text style={styles.albumInfoBadge}>
                      {data?.year || '2026'} • {data?.tracks?.length || 0} Tracks
                      {data?.totalDuration ? ` • ${formatDuration(data.totalDuration)}` : ''}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ACTION BUTTONS ROW */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.playAllPillBtn}
                activeOpacity={0.8}
                onPress={() => handlePlayAll(false)}
              >
                <Play size={17} color="#000000" fill="#000000" style={{ marginLeft: 2 }} />
                <Text style={styles.playAllText}>
                  {isArtist ? 'Play Top Songs' : 'Play Album'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shufflePillBtn}
                activeOpacity={0.8}
                onPress={() => handlePlayAll(true)}
              >
                <Shuffle size={17} color="#FFFFFF" />
                <Text style={styles.shuffleText}>Shuffle</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* LOADING STATE */}
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>
                {isArtist ? 'Discovering artist catalog & top tracks...' : 'Loading complete album tracklist...'}
              </Text>
            </View>
          )}

          {/* TRACKLIST SECTION */}
          {!loading && (
            <View style={styles.tracklistSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>
                  {isArtist ? 'TOP TRACKS' : 'TRACKLIST'}
                </Text>
                <Text style={styles.trackCountLabel}>
                  {(isArtist ? data?.topSongs?.length : data?.tracks?.length) || 0} songs
                </Text>
              </View>

              {/* LIST ITEMS */}
              {(isArtist ? data?.topSongs : data?.tracks)?.map((track, idx) => {
                const isTrackPlaying = currentTrack?.id === track.id && isPlaying;

                return (
                  <TouchableOpacity
                    key={track.id || idx}
                    style={[styles.trackRow, isTrackPlaying && styles.trackRowPlaying]}
                    activeOpacity={0.7}
                    onPress={() => {
                      const fullList = isArtist ? data?.topSongs : data?.tracks;
                      playTrack(track, fullList);
                    }}
                  >
                    {/* Index or Track Number */}
                    <View style={styles.indexCol}>
                      {isTrackPlaying ? (
                        <Music2 size={16} color="#22C55E" />
                      ) : (
                        <Text style={styles.indexText}>{isArtist ? idx + 1 : track.trackNumber || idx + 1}</Text>
                      )}
                    </View>

                    {/* Artwork thumbnail */}
                    <Image
                      source={{ uri: track.cover || 'https://via.placeholder.com/60' }}
                      style={styles.trackThumb}
                    />

                    {/* Title & Artist / Album details */}
                    <View style={styles.trackDetailsCol}>
                      <Text
                        style={[styles.trackRowTitle, isTrackPlaying && styles.trackRowTitlePlaying]}
                        numberOfLines={1}
                      >
                        {track.title}
                      </Text>
                      {isArtist ? (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          hitSlop={{ top: 4, bottom: 4, left: 0, right: 6 }}
                          onPress={(e) => {
                            if (track.album) {
                              e.stopPropagation?.();
                              openAlbumView(track.album, track.artist || detailModalData.title, track.cover);
                            }
                          }}
                        >
                          <Text style={styles.trackRowSub} numberOfLines={1}>
                            {track.album || track.artist}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.trackRowSub} numberOfLines={1}>
                          {track.artist}
                        </Text>
                      )}
                    </View>

                    {/* Duration & 3-dots */}
                    <Text style={styles.durationText}>
                      {formatTrackTime(track.duration)}
                    </Text>

                    <TouchableOpacity
                      style={styles.moreBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => promptAddToPlaylist(track)}
                    >
                      <MoreHorizontal size={18} color="#71717A" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* EMPTY STATE */}
          {!loading && (!data || ((isArtist ? data?.topSongs : data?.tracks)?.length === 0)) && (
            <View style={styles.emptyBox}>
              <Music2 size={32} color="#52525B" />
              <Text style={styles.emptyTitle}>No tracks available</Text>
              <Text style={styles.emptySubtitle}>Unable to retrieve song catalog for {detailModalData.title}.</Text>
            </View>
          )}

          {/* ARTIST ALBUMS DISCOGRAPHY SECTION */}
          {isArtist && data?.albums && data.albums.length > 0 && !loading && (
            <View style={styles.albumsSection}>
              <Text style={styles.sectionHeading}>ALBUMS & SINGLES</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.albumsScroll}
              >
                {data.albums.map((alb) => (
                  <TouchableOpacity
                    key={alb.id}
                    style={styles.albumCard}
                    activeOpacity={0.7}
                    onPress={() => openAlbumView(alb.title, detailModalData.title, alb.cover)}
                  >
                    <Image
                      source={{ uri: alb.cover || 'https://via.placeholder.com/200' }}
                      style={styles.albumCardCover}
                    />
                    <Text style={styles.albumCardTitle} numberOfLines={1}>
                      {alb.title}
                    </Text>
                    <Text style={styles.albumCardSub} numberOfLines={1}>
                      {alb.year} • {alb.trackCount ? `${alb.trackCount} songs` : 'Album'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    zIndex: 120,
  },
  container: {
    flex: 1,
  },
  topHeader: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20, 20, 26, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  heroSection: {
    marginBottom: 28,
  },
  artistHeroBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  artistImageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 16,
  },
  artistImage: {
    width: '100%',
    height: '100%',
  },
  artistMetaCol: {
    alignItems: 'center',
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  artistHeroName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  artistGenreText: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 4,
  },
  albumHeroBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  albumCoverWrapper: {
    width: 170,
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 12,
    marginBottom: 18,
  },
  albumCoverImage: {
    width: '100%',
    height: '100%',
  },
  albumMetaCol: {
    alignItems: 'center',
  },
  albumHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  albumHeroArtist: {
    fontSize: 14,
    color: '#A1A1AA',
    marginTop: 6,
  },
  albumHeroArtistLink: {
    color: '#38BDF8',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  albumInfoRow: {
    marginTop: 6,
  },
  albumInfoBadge: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  playAllPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  playAllText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  shufflePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  shuffleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  tracklistSection: {
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 1.2,
    fontFamily: 'monospace',
  },
  trackCountLabel: {
    fontSize: 11,
    color: '#52525B',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  trackRowPlaying: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  indexCol: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  trackThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginLeft: 8,
    marginRight: 12,
    backgroundColor: '#18181B',
  },
  trackDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  trackRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  trackRowTitlePlaying: {
    color: '#22C55E',
  },
  trackRowSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  durationText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
    marginRight: 10,
  },
  moreBtn: {
    padding: 6,
  },
  albumsSection: {
    marginTop: 32,
  },
  albumsScroll: {
    gap: 14,
    paddingTop: 12,
  },
  albumCard: {
    width: 130,
  },
  albumCardCover: {
    width: 130,
    height: 130,
    borderRadius: 12,
    backgroundColor: '#18181B',
    marginBottom: 8,
  },
  albumCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  albumCardSub: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
