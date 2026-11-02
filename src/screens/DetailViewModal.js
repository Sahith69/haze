import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  Modal,
  StatusBar as RNStatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Play, Shuffle, MoreVertical, Music2 } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { fetchArtistDetails, fetchAlbumDetails } from '../services/api';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 44;

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const DetailViewModal = () => {
  const {
    activeModal,
    detailViewData,
    detailModalData,
    closeDetailView,
    playTrack,
    currentTrack,
    isPlaying,
    promptAddToPlaylist,
  } = usePlayer();

  const data = detailViewData || detailModalData;
  const initialTracks = data?.tracks || [];
  const initialCover = data?.cover || '';

  const [activeTracks, setActiveTracks] = useState(initialTracks);
  const [heroCover, setHeroCover] = useState(initialCover);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data) return;
    if (data.tracks && data.tracks.length > 0) {
      setActiveTracks(data.tracks);
      setHeroCover(data.cover || '');
      setLoading(false);
      return;
    }

    let isCurrent = true;
    const fetchDetails = async () => {
      setActiveTracks([]);
      setHeroCover(data.cover || '');
      setLoading(true);
      try {
        if (data.type === 'artist' && data.title) {
          const res = await fetchArtistDetails(data.title);
          if (isCurrent && res) {
            const list = res.tracks || res.songs || res.topSongs || [];
            if (list.length > 0) setActiveTracks(list);
            const img = res.cover || res.image;
            if (img) setHeroCover(img);
          }
        } else if (data.type === 'album' && data.title) {
          const res = await fetchAlbumDetails(data.title, data.artist);
          if (isCurrent && res) {
            const list = res.tracks || res.songs || [];
            if (list.length > 0) setActiveTracks(list);
            const img = res.cover || res.image;
            if (img) setHeroCover(img);
          }
        }
      } catch (e) {
      } finally {
        if (isCurrent) setLoading(false);
      }
    };
    fetchDetails();
    return () => { isCurrent = false; };
  }, [data]);

  if (!data) return null;

  const title = data.title || 'Collection';
  const description = data.description || '';

  const handlePlayAll = () => {
    if (activeTracks.length > 0) {
      playTrack(activeTracks[0], activeTracks);
    }
  };

  const handleShuffleAll = () => {
    if (activeTracks.length > 0) {
      const shuffled = [...activeTracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
    }
  };

  return (
    <Modal
      visible={activeModal === 'detail_view'}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeDetailView}
    >
      <View style={styles.container}>
      {/* Top Bar with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={closeDetailView}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: heroCover || 'https://via.placeholder.com/300' }}
            style={styles.heroCover}
          />
          <Text style={styles.heroTitle}>{title}</Text>
          {description ? (
            <Text style={styles.heroSubtitle}>{description}</Text>
          ) : null}
          <Text style={styles.trackCountText}>
            {loading ? 'Loading tracks...' : `${activeTracks.length} ${activeTracks.length === 1 ? 'track' : 'tracks'}`}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.playAllBtn}
              activeOpacity={0.8}
              onPress={handlePlayAll}
            >
              <Play size={18} color="#000000" fill="#000000" style={{ marginRight: 6 }} />
              <Text style={styles.playAllText}>Play All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shuffleBtn}
              activeOpacity={0.8}
              onPress={handleShuffleAll}
            >
              <Shuffle size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.shuffleText}>Shuffle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tracks List */}
        <View style={styles.trackList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Fetching discography...</Text>
            </View>
          ) : activeTracks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Music2 size={36} color={colors.borderLight} />
              <Text style={styles.emptyText}>No tracks in this collection</Text>
            </View>
          ) : (
            activeTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <View
                  key={`detail_track_${track.id || idx}`}
                  style={[styles.trackRow, isCurrent && styles.trackRowActive]}
                >
                  <TouchableOpacity
                    style={styles.trackPressable}
                    activeOpacity={0.7}
                    onPress={() => playTrack(track, activeTracks)}
                  >
                    <Text style={styles.trackIndex}>{idx + 1}</Text>
                    <Image source={{ uri: track.cover || 'https://via.placeholder.com/150' }} style={styles.trackThumb} />
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

                    {track.duration > 0 && (
                      <Text style={styles.durationText}>
                        {formatDuration(track.duration)}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => promptAddToPlaylist && promptAddToPlaylist(track)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MoreVertical size={16} color={colors.textDim} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: STATUS_BAR_HEIGHT + 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  heroCover: {
    width: 170,
    height: 170,
    borderRadius: 10,
    backgroundColor: '#242424',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  trackCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
  },
  playAllText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#383838',
  },
  shuffleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackList: {
    marginTop: 16,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 2,
  },
  trackRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  trackPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackIndex: {
    width: 26,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDim,
  },
  trackThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#242424',
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
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textDim,
    marginRight: 8,
  },
  moreBtn: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDim,
    marginTop: 8,
  },
});
