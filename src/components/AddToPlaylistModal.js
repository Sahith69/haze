import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, X, ListMusic, Check, Music2 } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const AddToPlaylistModal = () => {
  const {
    showAddToPlaylistModal,
    setShowAddToPlaylistModal,
    playlistModalTrack,
    userPlaylists,
    addTrackToPlaylist,
    createPlaylist,
  } = usePlayer();

  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  if (!showAddToPlaylistModal) return null;

  const track = playlistModalTrack;

  const handleSelectPlaylist = (playlistId) => {
    if (track) {
      addTrackToPlaylist(playlistId, track);
    }
    setShowAddToPlaylistModal(false);
    setIsCreatingInline(false);
    setNewPlaylistName('');
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;
    const playlistId = `pl-${Date.now()}`;
    await createPlaylist(newPlaylistName.trim());
    if (track) {
      // Add track to the newly created playlist
      setTimeout(() => {
        addTrackToPlaylist(playlistId, track);
      }, 100);
    }
    setNewPlaylistName('');
    setIsCreatingInline(false);
    setShowAddToPlaylistModal(false);
  };

  return (
    <Modal
      visible={showAddToPlaylistModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowAddToPlaylistModal(false);
        setIsCreatingInline(false);
      }}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => {
          setShowAddToPlaylistModal(false);
          setIsCreatingInline(false);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.sheetContainer}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header Indicator Pill */}
          <View style={styles.grabber} />

          {/* Sheet Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Add to Playlist</Text>
              {track && (
                <Text style={styles.trackSubtitle} numberOfLines={1}>
                  {track.title} · {track.artist}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setShowAddToPlaylistModal(false);
                setIsCreatingInline(false);
              }}
            >
              <X size={20} color="#888888" />
            </TouchableOpacity>
          </View>

          {/* Inline Create New Playlist Section */}
          {isCreatingInline ? (
            <View style={styles.inlineCreateBox}>
              <TextInput
                style={styles.inlineInput}
                placeholder="Playlist name..."
                placeholderTextColor="#666666"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
              />
              <View style={styles.inlineActionRow}>
                <TouchableOpacity
                  style={styles.inlineCancelBtn}
                  onPress={() => {
                    setIsCreatingInline(false);
                    setNewPlaylistName('');
                  }}
                >
                  <Text style={styles.inlineCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.inlineSubmitBtn,
                    !newPlaylistName.trim() && { opacity: 0.5 },
                  ]}
                  disabled={!newPlaylistName.trim()}
                  onPress={handleCreateAndAdd}
                >
                  <Text style={styles.inlineSubmitText}>Create & Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.createBtn}
              activeOpacity={0.8}
              onPress={() => setIsCreatingInline(true)}
            >
              <View style={styles.createIconBox}>
                <Plus size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.createText}>New Playlist</Text>
            </TouchableOpacity>
          )}

          {/* User Playlists List */}
          <ScrollView style={styles.playlistList} showsVerticalScrollIndicator={false}>
            {userPlaylists && userPlaylists.length > 0 ? (
              userPlaylists.map((pl) => {
                const containsTrack = track && (pl.tracks || []).some((t) => t.id === track.id);
                return (
                  <TouchableOpacity
                    key={pl.id}
                    style={styles.playlistRow}
                    activeOpacity={0.7}
                    onPress={() => handleSelectPlaylist(pl.id)}
                  >
                    {pl.cover ? (
                      <Image source={{ uri: pl.cover }} style={styles.playlistCover} />
                    ) : (
                      <LinearGradient
                        colors={['#7C5CFF', '#2A6BFF']}
                        style={styles.playlistCover}
                      >
                        <ListMusic size={18} color="#FFFFFF" />
                      </LinearGradient>
                    )}

                    <View style={styles.playlistMeta}>
                      <Text style={styles.playlistName} numberOfLines={1}>
                        {pl.name}
                      </Text>
                      <Text style={styles.playlistCount}>
                        {(pl.tracks || []).length} {pl.tracks?.length === 1 ? 'song' : 'songs'}
                      </Text>
                    </View>

                    {containsTrack && (
                      <View style={styles.addedBadge}>
                        <Check size={14} color="#34D399" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Music2 size={32} color="#444444" />
                <Text style={styles.emptyText}>No playlists yet. Create your first one!</Text>
              </View>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0E0E12',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: '#1F1F28',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333333',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  trackSubtitle: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  createIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inlineCreateBox: {
    backgroundColor: '#16161C',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#262630',
    marginBottom: 12,
  },
  inlineInput: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#33333F',
    marginBottom: 10,
  },
  inlineActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  inlineCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inlineCancelText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
  },
  inlineSubmitBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inlineSubmitText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  playlistList: {
    maxHeight: 320,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 12,
  },
  playlistCover: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistMeta: {
    flex: 1,
  },
  playlistName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playlistCount: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  addedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    color: '#666666',
    fontSize: 12,
  },
});
