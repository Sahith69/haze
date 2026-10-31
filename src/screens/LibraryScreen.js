import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import {
  Plus,
  ChevronRight,
  Heart,
  ArrowDownToLine,
  ListMusic,
  Play,
  Trash2,
  X,
  Music,
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const LibraryScreen = () => {
  const {
    playTrack,
    currentTrack,
    currentUser,
    likedTracks,
    userPlaylists,
    downloadedTracks,
    createPlaylist,
    deletePlaylist,
    removeDownload,
    toggleLike,
    flacEnabled,
  } = usePlayer();

  // Active view: 'overview' | 'likes' | 'downloads' | 'playlist'
  const [activeView, setActiveView] = useState('overview');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  // New Playlist Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    await createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setShowCreateModal(false);
  };

  const totalDownloadedMB = (
    downloadedTracks.reduce((acc, t) => acc + (t.fileSize || 0), 0) / (1024 * 1024)
  ).toFixed(1);

  // Sub-view: Liked Songs
  if (activeView === 'likes') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity onPress={() => setActiveView('overview')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Library</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shelfHeader}>
          <View style={styles.shelfIconCircleHeart}>
            <Heart size={24} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shelfBigTitle}>Liked Songs</Text>
            <Text style={styles.shelfSubtitle}>
              {currentUser.name} · {likedTracks.length} tracks
            </Text>
          </View>
          {likedTracks.length > 0 && (
            <TouchableOpacity
              style={styles.playAllBtn}
              onPress={() => playTrack(likedTracks[0])}
            >
              <Play size={16} color="#000000" fill="#000000" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.trackList}>
          {likedTracks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Heart size={36} color="#333333" />
              <Text style={styles.emptyTitle}>No liked songs yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the heart on any song to save it to your personal likes.
              </Text>
            </View>
          ) : (
            likedTracks.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id;
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
                    <Text
                      style={[styles.trackTitle, isThisPlaying && styles.trackTitlePlaying]}
                      numberOfLines={1}
                    >
                      {track.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{ padding: 6 }}
                    onPress={() => toggleLike(track)}
                  >
                    <Heart size={18} color="#EF4444" fill="#EF4444" />
                  </TouchableOpacity>
                  <Text style={styles.trackDuration}>
                    {formatDuration(track.duration || 215)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={{ height: 160 }} />
      </ScrollView>
    );
  }

  // Sub-view: Offline Downloads
  if (activeView === 'downloads') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity onPress={() => setActiveView('overview')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Library</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shelfHeader}>
          <View style={styles.shelfIconCircleDownload}>
            <ArrowDownToLine size={24} color="#000000" strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shelfBigTitle}>Downloaded Music</Text>
            <Text style={styles.shelfSubtitle}>
              {currentUser.name} · {downloadedTracks.length} tracks · {totalDownloadedMB} MB offline
            </Text>
          </View>
          {downloadedTracks.length > 0 && (
            <TouchableOpacity
              style={styles.playAllBtn}
              onPress={() => playTrack(downloadedTracks[0])}
            >
              <Play size={16} color="#000000" fill="#000000" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.trackList}>
          {downloadedTracks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ArrowDownToLine size={36} color="#333333" />
              <Text style={styles.emptyTitle}>No downloaded tracks</Text>
              <Text style={styles.emptySubtitle}>
                Download songs to listen offline with bit-perfect quality and zero internet usage.
              </Text>
            </View>
          ) : (
            downloadedTracks.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id;
              return (
                <TouchableOpacity
                  key={`${track.id}-${idx}`}
                  activeOpacity={0.7}
                  style={[styles.trackRow, isThisPlaying && styles.trackRowPlaying]}
                  onPress={() => playTrack(track)}
                >
                  <Text style={styles.trackIndex}>{idx + 1}</Text>
                  <Image
                    source={{
                      uri: track.localCoverUri || track.cover || 'https://via.placeholder.com/44',
                    }}
                    style={styles.trackCover}
                  />
                  <View style={styles.trackDetails}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text
                        style={[styles.trackTitle, isThisPlaying && styles.trackTitlePlaying]}
                        numberOfLines={1}
                      >
                        {track.title}
                      </Text>
                      <View style={styles.flacBadge}>
                        <Text style={styles.flacBadgeText}>{track.isFlac ? 'FLAC' : '320k'}</Text>
                      </View>
                    </View>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={{ padding: 6 }}
                    onPress={() => removeDownload(track.id)}
                  >
                    <Trash2 size={16} color="#666666" />
                  </TouchableOpacity>

                  <Text style={styles.trackDuration}>
                    {formatDuration(track.duration || 215)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={{ height: 160 }} />
      </ScrollView>
    );
  }

  // Sub-view: Playlist detail
  if (activeView === 'playlist' && selectedPlaylist) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity onPress={() => setActiveView('overview')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              deletePlaylist(selectedPlaylist.id);
              setActiveView('overview');
            }}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.shelfHeader}>
          <Image
            source={{ uri: selectedPlaylist.cover || 'https://via.placeholder.com/60' }}
            style={styles.playlistArt}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.shelfBigTitle}>{selectedPlaylist.name}</Text>
            <Text style={styles.shelfSubtitle}>
              {currentUser.name} · {selectedPlaylist.tracks?.length || 0} tracks
            </Text>
          </View>
          {selectedPlaylist.tracks?.length > 0 && (
            <TouchableOpacity
              style={styles.playAllBtn}
              onPress={() => playTrack(selectedPlaylist.tracks[0])}
            >
              <Play size={16} color="#000000" fill="#000000" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.trackList}>
          {(!selectedPlaylist.tracks || selectedPlaylist.tracks.length === 0) ? (
            <View style={styles.emptyContainer}>
              <ListMusic size={36} color="#333333" />
              <Text style={styles.emptyTitle}>This playlist is empty</Text>
              <Text style={styles.emptySubtitle}>
                Add tracks from Search or Trending to populate this playlist.
              </Text>
            </View>
          ) : (
            selectedPlaylist.tracks.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id;
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
                    <Text
                      style={[styles.trackTitle, isThisPlaying && styles.trackTitlePlaying]}
                      numberOfLines={1}
                    >
                      {track.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist}
                    </Text>
                  </View>
                  <Text style={styles.trackDuration}>
                    {formatDuration(track.duration || 215)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={{ height: 160 }} />
      </ScrollView>
    );
  }

  // Overview Main View
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.headerTitle}>{currentUser.name}'s Library</Text>
          <Text style={styles.headerSubtitle}>HAZE COLLECTION</Text>
        </View>
        <TouchableOpacity
          style={styles.newPlaylistBtn}
          activeOpacity={0.8}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={14} color="#000000" strokeWidth={3} />
          <Text style={styles.newPlaylistText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Main Shelves: Liked Songs & Offline Downloads */}
      <View style={styles.shelfList}>
        {/* Liked Songs Shelf */}
        <TouchableOpacity
          style={styles.shelfCard}
          activeOpacity={0.7}
          onPress={() => setActiveView('likes')}
        >
          <View style={styles.shelfIconCircleHeartSmall}>
            <Heart size={20} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          <View style={styles.shelfCardInfo}>
            <Text style={styles.shelfCardTitle}>Liked Songs</Text>
            <Text style={styles.shelfCardSubtitle}>
              {likedTracks.length} {likedTracks.length === 1 ? 'track' : 'tracks'} ·{' '}
              {currentUser.badge}
            </Text>
          </View>
          <ChevronRight size={16} color="#555555" />
        </TouchableOpacity>

        {/* Offline Downloads Shelf */}
        <TouchableOpacity
          style={styles.shelfCard}
          activeOpacity={0.7}
          onPress={() => setActiveView('downloads')}
        >
          <View style={styles.shelfIconCircleDownloadSmall}>
            <ArrowDownToLine size={20} color="#000000" strokeWidth={2.5} />
          </View>
          <View style={styles.shelfCardInfo}>
            <Text style={styles.shelfCardTitle}>Downloaded Music</Text>
            <Text style={styles.shelfCardSubtitle}>
              {downloadedTracks.length} {downloadedTracks.length === 1 ? 'track' : 'tracks'} ·{' '}
              {totalDownloadedMB} MB offline
            </Text>
          </View>
          <ChevronRight size={16} color="#555555" />
        </TouchableOpacity>
      </View>

      {/* User Playlists Section Header */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Custom Playlists ({userPlaylists.length})</Text>
      </View>

      {/* Playlists List */}
      <View style={styles.playlistList}>
        {userPlaylists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ListMusic size={32} color="#333333" />
            <Text style={styles.emptyTitle}>No playlists created yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the "+ New" button above to start your first custom playlist.
            </Text>
          </View>
        ) : (
          userPlaylists.map((playlist) => (
            <TouchableOpacity
              key={playlist.id}
              activeOpacity={0.7}
              style={styles.playlistCard}
              onPress={() => {
                setSelectedPlaylist(playlist);
                setActiveView('playlist');
              }}
            >
              <Image source={{ uri: playlist.cover }} style={styles.playlistArt} />
              <View style={styles.playlistInfo}>
                <Text style={styles.playlistTitle} numberOfLines={1}>
                  {playlist.name}
                </Text>
                <Text style={styles.playlistCount} numberOfLines={1}>
                  {playlist.tracks?.length || 0} tracks
                </Text>
              </View>
              <ChevronRight size={16} color="#444444" />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Playlist</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={20} color="#888888" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Playlist name"
              placeholderTextColor="#666666"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />

            <TextInput
              style={[styles.modalInput, { marginTop: 10 }]}
              placeholder="Description (optional)"
              placeholderTextColor="#666666"
              value={newPlaylistDesc}
              onChangeText={setNewPlaylistDesc}
            />

            <TouchableOpacity
              style={[
                styles.createBtn,
                !newPlaylistName.trim() && { opacity: 0.5 },
              ]}
              disabled={!newPlaylistName.trim()}
              onPress={handleCreatePlaylist}
            >
              <Text style={styles.createBtnText}>Create Playlist</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
  shelfList: {
    gap: 10,
    marginBottom: 24,
  },
  shelfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#1C1C1C',
    borderRadius: 12,
    padding: 14,
    gap: 14,
  },
  shelfIconCircleHeartSmall: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfIconCircleDownloadSmall: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfCardInfo: {
    flex: 1,
  },
  shelfCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shelfCardSubtitle: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#1E1E1E',
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playlistTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playlistCount: {
    fontSize: 11,
    color: '#737373',
    marginTop: 3,
  },
  emptyContainer: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#141414',
    borderRadius: 14,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  shelfIconCircleHeart: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#7C5CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfIconCircleDownload: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfBigTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  shelfSubtitle: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  playAllBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#141414',
  },
  trackIndex: {
    width: 22,
    fontSize: 11,
    color: '#555555',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  trackCover: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    marginRight: 10,
  },
  trackDetails: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trackTitlePlaying: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    marginLeft: 8,
  },
  flacBadge: {
    borderWidth: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#242424',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#262626',
  },
  createBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
});
