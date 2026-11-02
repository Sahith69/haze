import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import {
  Heart,
  Plus,
  HardDrive,
  Download,
  FolderMusic,
  Play,
  Trash2,
  Share2,
  Music2,
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

const LIBRARY_TABS = ['Playlists', 'Liked Tracks', 'Downloads', 'Cloud Vault'];

export const LibraryScreen = () => {
  const {
    likedTracks,
    playlists,
    createPlaylist,
    deletePlaylist,
    downloadedTracks,
    vaultTracks,
    openDetailView,
    playTrack,
    currentTrack,
    isPlaying,
    showToast,
  } = usePlayer();

  const [activeTab, setActiveTab] = useState('Playlists');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreateModal(false);
    showToast('Playlist created', 'success');
  };

  const renderContent = () => {
    if (activeTab === 'Playlists') {
      return (
        <View style={styles.tabContent}>
          {/* Action Row */}
          <TouchableOpacity
            style={styles.createPlaylistBtn}
            activeOpacity={0.8}
            onPress={() => setShowCreateModal(true)}
          >
            <View style={styles.createIconWrapper}>
              <Plus size={20} color="#000000" />
            </View>
            <Text style={styles.createBtnText}>Create New Playlist</Text>
          </TouchableOpacity>

          {/* Liked Tracks Item */}
          <TouchableOpacity
            style={styles.playlistRow}
            activeOpacity={0.7}
            onPress={() =>
              openDetailView({
                type: 'playlist',
                title: 'Liked Tracks',
                description: `${likedTracks.length} favorite songs`,
                cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80',
                tracks: likedTracks,
              })
            }
          >
            <View style={[styles.playlistThumb, { backgroundColor: '#450af5' }]}>
              <Heart size={22} color="#FFFFFF" fill="#FFFFFF" />
            </View>
            <View style={styles.playlistMeta}>
              <Text style={styles.playlistTitle}>Liked Tracks</Text>
              <Text style={styles.playlistSubtitle}>
                {likedTracks.length} {likedTracks.length === 1 ? 'song' : 'songs'} · Auto Playlist
              </Text>
            </View>
          </TouchableOpacity>

          {/* User Playlists */}
          {playlists.map((pl) => (
            <TouchableOpacity
              key={pl.id}
              style={styles.playlistRow}
              activeOpacity={0.7}
              onPress={() =>
                openDetailView({
                  type: 'playlist',
                  id: pl.id,
                  title: pl.name,
                  description: `${(pl.tracks || []).length} songs`,
                  cover: pl.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
                  tracks: pl.tracks || [],
                })
              }
            >
              <View style={[styles.playlistThumb, { backgroundColor: '#282828' }]}>
                <FolderMusic size={22} color={colors.primary} />
              </View>
              <View style={styles.playlistMeta}>
                <Text style={styles.playlistTitle}>{pl.name}</Text>
                <Text style={styles.playlistSubtitle}>
                  {(pl.tracks || []).length} {((pl.tracks || []).length === 1) ? 'song' : 'songs'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (activeTab === 'Liked Tracks') {
      return (
        <View style={styles.tabContent}>
          {likedTracks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Heart size={44} color={colors.borderLight} />
              <Text style={styles.emptyTitle}>No Liked Tracks Yet</Text>
              <Text style={styles.emptySub}>
                Tap the heart on any song to save it to your favorites
              </Text>
            </View>
          ) : (
            likedTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <TouchableOpacity
                  key={`liked_${track.id || idx}`}
                  style={[styles.trackRow, isCurrent && styles.trackRowActive]}
                  activeOpacity={0.7}
                  onPress={() => playTrack(track, likedTracks)}
                >
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
            })
          )}
        </View>
      );
    }

    if (activeTab === 'Downloads') {
      const downloadsList = downloadedTracks || [];
      return (
        <View style={styles.tabContent}>
          {downloadsList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Download size={44} color={colors.borderLight} />
              <Text style={styles.emptyTitle}>No Downloaded Songs</Text>
              <Text style={styles.emptySub}>
                Download tracks for offline high-fidelity playback
              </Text>
            </View>
          ) : (
            downloadsList.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <TouchableOpacity
                  key={`downloaded_${track.id || idx}`}
                  style={[styles.trackRow, isCurrent && styles.trackRowActive]}
                  activeOpacity={0.7}
                  onPress={() => playTrack(track, downloadsList)}
                >
                  <Image source={{ uri: track.cover }} style={styles.trackThumb} />
                  <View style={styles.trackDetails}>
                    <Text
                      style={[styles.trackName, isCurrent && { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      {track.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist} · Offline Audio
                    </Text>
                  </View>
                  <Play
                    size={16}
                    color={isCurrent ? colors.primary : colors.textDim}
                    fill={isCurrent ? colors.primary : 'transparent'}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      );
    }

    if (activeTab === 'Cloud Vault') {
      const vaultList = vaultTracks || [];
      return (
        <View style={styles.tabContent}>
          {vaultList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <HardDrive size={44} color={colors.borderLight} />
              <Text style={styles.emptyTitle}>Telegram FLAC Vault Empty</Text>
              <Text style={styles.emptySub}>
                Lossless FLAC audio will be automatically archived and displayed here
              </Text>
            </View>
          ) : (
            vaultList.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <TouchableOpacity
                  key={`vault_${track.id || idx}`}
                  style={[styles.trackRow, isCurrent && styles.trackRowActive]}
                  activeOpacity={0.7}
                  onPress={() => playTrack(track, vaultList)}
                >
                  <Image source={{ uri: track.cover }} style={styles.trackThumb} />
                  <View style={styles.trackDetails}>
                    <Text
                      style={[styles.trackName, isCurrent && { color: colors.primary }]}
                      numberOfLines={1}
                    >
                      {track.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist} · 1,411 kbps FLAC Master
                    </Text>
                  </View>
                  <Play
                    size={16}
                    color={isCurrent ? colors.primary : colors.textDim}
                    fill={isCurrent ? colors.primary : 'transparent'}
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Library</Text>
      </View>

      {/* Spotube Sub-Tabs */}
      <View style={styles.subTabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabsScroll}
        >
          {LIBRARY_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.subTabPill, isActive && styles.subTabPillActive]}
                activeOpacity={0.7}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.subTabText,
                    isActive && styles.subTabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List ScrollView */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Give your playlist a name"
              placeholderTextColor={colors.textDim}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCreatePlaylist}
              >
                <Text style={styles.confirmBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subTabsWrapper: {
    paddingBottom: 10,
  },
  subTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  subTabPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#333333',
  },
  subTabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subTabTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 150,
  },
  tabContent: {
    paddingTop: 4,
  },
  createPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 8,
  },
  createIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 14,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  playlistThumb: {
    width: 50,
    height: 50,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistMeta: {
    flex: 1,
    marginLeft: 14,
  },
  playlistTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  playlistSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginBottom: 2,
  },
  trackRowActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  trackThumb: {
    width: 46,
    height: 46,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#383838',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#181818',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#383838',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
});
