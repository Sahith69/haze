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
  Share,
  TextInput,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Play,
  Shuffle,
  MoreVertical,
  Music2,
  Download,
  Share2,
  Trash2,
  Edit3,
  X,
  Check,
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchArtistDetails, fetchAlbumDetails } from '../services/api';
import { colors } from '../theme/colors';
import { MiniPlayer } from '../components/MiniPlayer';

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
    removeTrackFromPlaylist,
    updatePlaylist,
    accentColor,
    showToast,
    setShuffleMode,
  } = usePlayer();

  const data = detailViewData || detailModalData;
  const initialTracks = data?.tracks || [];
  const initialCover = data?.cover || '';

  const [activeTracks, setActiveTracks] = useState(initialTracks);
  const [heroCover, setHeroCover] = useState(initialCover);
  const [loading, setLoading] = useState(false);

  // Edit playlist modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [playlistName, setPlaylistName] = useState(data?.title || '');
  const [playlistDesc, setPlaylistDesc] = useState(data?.description || '');

  useEffect(() => {
    if (!data) return;
    setPlaylistName(data.title || '');
    setPlaylistDesc(data.description || '');

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

  const isCustomPlaylist = Boolean(data.type === 'playlist' && data.playlistId);
  const title = isCustomPlaylist ? playlistName : (data.title || 'Collection');
  const description = isCustomPlaylist ? playlistDesc : (data.description || '');

  const handlePlayAll = () => {
    if (activeTracks.length > 0) {
      playTrack(activeTracks[0], activeTracks);
    }
  };

  const handleShuffleAll = () => {
    if (activeTracks.length > 0) {
      if (setShuffleMode) setShuffleMode('on');
      AsyncStorage.setItem('@haze_shuffle_mode', 'on').catch(() => {});
      const randomFirst = activeTracks[Math.floor(Math.random() * activeTracks.length)];
      playTrack(randomFirst, activeTracks);
      if (showToast) showToast('Smart Shuffle On · Queue Randomized', 'info');
    }
  };

  const handleExportCSV = async () => {
    if (activeTracks.length === 0) {
      if (showToast) showToast('No tracks to export', 'info');
      return;
    }
    try {
      const header = '"Track Title","Artist","Album","Duration (s)"\n';
      const rows = activeTracks.map((t) => {
        const safeTitle = (t.title || '').replace(/"/g, '""');
        const safeArtist = (t.artist || '').replace(/"/g, '""');
        const safeAlbum = (t.album || '').replace(/"/g, '""');
        const dur = Math.round(t.duration || 0);
        return `"${safeTitle}","${safeArtist}","${safeAlbum}",${dur}`;
      }).join('\n');
      const csvContent = header + rows;
      await Share.share({
        title: `${title}.csv`,
        message: csvContent,
      });
      if (showToast) showToast('CSV ready to share or save', 'success');
    } catch (err) {
      console.log('Error exporting CSV:', err);
    }
  };

  const handleShareCollection = async () => {
    try {
      const sample = activeTracks.slice(0, 5).map((t, i) => `${i + 1}. ${t.title} - ${t.artist}`).join('\n');
      const more = activeTracks.length > 5 ? `\n...and ${activeTracks.length - 5} more tracks` : '';
      await Share.share({
        title: `HAZE: ${title}`,
        message: `🎵 Check out "${title}" on HAZE (${activeTracks.length} tracks):\n\n${sample}${more}`,
      });
    } catch (err) {
      console.log('Error sharing collection:', err);
    }
  };

  const handleRemoveTrack = (track) => {
    if (!isCustomPlaylist || !data.playlistId) return;
    removeTrackFromPlaylist(data.playlistId, track.id);
    setActiveTracks((prev) => prev.filter((t) => t.id !== track.id));
    if (showToast) showToast(`Removed "${track.title}" from playlist`, 'info');
  };

  const handleSavePlaylistEdit = () => {
    if (!playlistName.trim()) return;
    if (updatePlaylist && data.playlistId) {
      updatePlaylist(data.playlistId, {
        name: playlistName.trim(),
        description: playlistDesc.trim(),
      });
      setShowEditModal(false);
      if (showToast) showToast('Playlist updated', 'success');
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
          {isCustomPlaylist ? (
            <TouchableOpacity
              style={styles.topBarActionBtn}
              onPress={() => setShowEditModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Edit3 size={18} color={accentColor || colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[styles.scrollContent, currentTrack && { paddingBottom: 90 }]}
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

            {/* Main Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.playAllBtn, { backgroundColor: accentColor || colors.primary }]}
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

              <TouchableOpacity
                style={styles.iconActionBtn}
                activeOpacity={0.7}
                onPress={handleExportCSV}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Download size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconActionBtn}
                activeOpacity={0.7}
                onPress={handleShareCollection}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Share2 size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tracks List */}
          <View style={styles.trackList}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={accentColor || colors.primary} />
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
                          style={[styles.trackName, isCurrent && { color: accentColor || colors.primary }]}
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

                    {isCustomPlaylist ? (
                      <TouchableOpacity
                        style={styles.removeTrackBtn}
                        onPress={() => handleRemoveTrack(track)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 size={16} color={colors.textDim} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.moreBtn}
                        onPress={() => promptAddToPlaylist && promptAddToPlaylist(track)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <MoreVertical size={16} color={colors.textDim} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Docked MiniPlayer when a track is playing or paused */}
        {currentTrack && (
          <MiniPlayer bottomOffset={Platform.OS === 'android' ? 12 : 24} />
        )}

        {/* Edit Playlist Modal */}
        {showEditModal && (
          <Modal
            visible={showEditModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowEditModal(false)}
          >
            <View style={styles.editBackdrop}>
              <View style={styles.editCard}>
                <View style={styles.editHeader}>
                  <Text style={styles.editTitle}>Edit Playlist</Text>
                  <TouchableOpacity onPress={() => setShowEditModal(false)}>
                    <X size={20} color={colors.textDim} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>PLAYLIST NAME</Text>
                <TextInput
                  style={styles.textInput}
                  value={playlistName}
                  onChangeText={setPlaylistName}
                  placeholder="Playlist name"
                  placeholderTextColor={colors.textDim}
                />

                <Text style={styles.inputLabel}>DESCRIPTION</Text>
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  value={playlistDesc}
                  onChangeText={setPlaylistDesc}
                  placeholder="Optional description"
                  placeholderTextColor={colors.textDim}
                  multiline
                />

                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelEditBtn}
                    onPress={() => setShowEditModal(false)}
                  >
                    <Text style={styles.cancelEditText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveEditBtn, { backgroundColor: accentColor || colors.primary }]}
                    onPress={handleSavePlaylistEdit}
                  >
                    <Check size={16} color="#000000" style={{ marginRight: 4 }} />
                    <Text style={styles.saveEditText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
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
  topBarActionBtn: {
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
    gap: 10,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
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
    paddingHorizontal: 18,
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
  iconActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#282828',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#383838',
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
  removeTrackBtn: {
    padding: 8,
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
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  editCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textDim,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#262626',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#383838',
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelEditBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
  },
  cancelEditText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  saveEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },
  saveEditText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
});
