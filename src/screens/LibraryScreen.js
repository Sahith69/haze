import React, { useState, useMemo, useEffect } from 'react';
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
  BackHandler,
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
  User,
  Disc3,
  Shuffle,
} from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { SpotifyImportModal } from '../components/SpotifyImportModal';
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

  // Top level category: 'playlists' | 'songs' | 'artists' | 'albums'
  const [selectedTab, setSelectedTab] = useState('playlists');

  // Sub-view navigation: null | 'likes' | 'downloads' | 'playlist' | 'artist_detail' | 'album_detail'
  const [activeSubView, setActiveSubView] = useState(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const selectedPlaylist = useMemo(() => {
    return userPlaylists.find(p => p.id === selectedPlaylistId) || null;
  }, [userPlaylists, selectedPlaylistId]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  // Android Hardware Back Button: Close subviews (e.g. artist/album details) before exiting tab
  useEffect(() => {
    if (!activeSubView) return;
    const onBackPress = () => {
      setActiveSubView(null);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [activeSubView]);

  // New Playlist Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
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

  // Combine liked + downloaded tracks into all saved tracks (deduplicated)
  const allSavedTracks = useMemo(() => {
    const map = new Map();
    [...downloadedTracks, ...likedTracks].forEach(t => {
      if (t && t.id && !map.has(t.id)) {
        map.set(t.id, t);
      }
    });
    return Array.from(map.values());
  }, [likedTracks, downloadedTracks]);

  // Segregate unique artists
  const segregatedArtists = useMemo(() => {
    const map = new Map();
    allSavedTracks.forEach(t => {
      const name = (t.artist || 'Unknown Artist').trim();
      if (!map.has(name)) {
        map.set(name, {
          artist: name,
          cover: t.cover || t.localCoverUri,
          tracks: [t],
        });
      } else {
        map.get(name).tracks.push(t);
      }
    });
    return Array.from(map.values());
  }, [allSavedTracks]);

  // Segregate unique albums
  const segregatedAlbums = useMemo(() => {
    const map = new Map();
    allSavedTracks.forEach(t => {
      const albumName = (t.album || 'Single').trim();
      if (!map.has(albumName)) {
        map.set(albumName, {
          album: albumName,
          artist: t.artist || 'Unknown Artist',
          cover: t.cover || t.localCoverUri,
          tracks: [t],
        });
      } else {
        map.get(albumName).tracks.push(t);
      }
    });
    return Array.from(map.values());
  }, [allSavedTracks]);

  // SUB-VIEW: ARTIST DETAIL
  if (activeSubView === 'artist_detail' && selectedArtist) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity onPress={() => setActiveSubView(null)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Artists</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.artistBanner}>
          {selectedArtist.cover ? (
            <Image source={{ uri: selectedArtist.cover }} style={styles.bigArtistAvatar} />
          ) : (
            <View style={[styles.bigArtistAvatar, styles.artistPlaceholder]}>
              <User size={36} color="#FFFFFF" />
            </View>
          )}
          <Text style={styles.bigArtistName}>{selectedArtist.artist}</Text>
          <Text style={styles.shelfSubtitle}>
            {selectedArtist.tracks.length} track{selectedArtist.tracks.length > 1 ? 's' : ''} in your library
          </Text>

          {selectedArtist.tracks.length > 0 && (
            <TouchableOpacity
              style={styles.playAllFullBtn}
              onPress={() => playTrack(selectedArtist.tracks[0], selectedArtist.tracks)}
            >
              <Play size={16} color="#000000" fill="#000000" />
              <Text style={styles.playAllText}>Play All</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.trackList}>
          {selectedArtist.tracks.map((track, idx) => {
            const isThisPlaying = currentTrack?.id === track.id;
            return (
              <TouchableOpacity
                key={`${track.id}-${idx}`}
                style={[styles.trackRow, isThisPlaying && styles.trackRowPlaying]}
                onPress={() => playTrack(track, selectedArtist.tracks)}
              >
                <Text style={styles.trackIndex}>{idx + 1}</Text>
                <Image
                  source={{ uri: track.localCoverUri || track.cover || 'https://via.placeholder.com/44' }}
                  style={styles.trackCover}
                />
                <View style={styles.trackDetails}>
                  <Text style={[styles.trackTitle, isThisPlaying && styles.trackTitlePlaying]} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>{track.album || 'Single'}</Text>
                </View>
                <Text style={styles.trackDuration}>{formatDuration(track.duration || 215)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 160 }} />
      </ScrollView>
    );
  }

  // SUB-VIEW: ALBUM DETAIL
  if (activeSubView === 'album_detail' && selectedAlbum) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity onPress={() => setActiveSubView(null)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Albums</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.artistBanner}>
          <Image
            source={{ uri: selectedAlbum.cover || 'https://via.placeholder.com/120' }}
            style={styles.bigAlbumCover}
          />
          <Text style={styles.bigArtistName}>{selectedAlbum.album}</Text>
          <Text style={styles.shelfSubtitle}>{selectedAlbum.artist} · {selectedAlbum.tracks.length} tracks</Text>

          {selectedAlbum.tracks.length > 0 && (
            <TouchableOpacity
              style={styles.playAllFullBtn}
              onPress={() => playTrack(selectedAlbum.tracks[0], selectedAlbum.tracks)}
            >
              <Play size={16} color="#000000" fill="#000000" />
              <Text style={styles.playAllText}>Play Album</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.trackList}>
          {selectedAlbum.tracks.map((track, idx) => {
            const isThisPlaying = currentTrack?.id === track.id;
            return (
              <TouchableOpacity
                key={`${track.id}-${idx}`}
                style={[styles.trackRow, isThisPlaying && styles.trackRowPlaying]}
                onPress={() => playTrack(track, selectedAlbum.tracks)}
              >
                <Text style={styles.trackIndex}>{idx + 1}</Text>
                <View style={styles.trackDetails}>
                  <Text style={[styles.trackTitle, isThisPlaying && styles.trackTitlePlaying]} numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                </View>
                <Text style={styles.trackDuration}>{formatDuration(track.duration || 215)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 160 }} />
      </ScrollView>
    );
  }

  // SUB-VIEW: LIKED SONGS
  if (activeSubView === 'likes') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity onPress={() => setActiveSubView(null)} style={styles.backBtn}>
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
              onPress={() => playTrack(likedTracks[0], likedTracks)}
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
              <Text style={styles.emptySubtitle}>Tap the heart on any song to save it here.</Text>
            </View>
          ) : (
            likedTracks.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id;
              return (
                <TouchableOpacity
                  key={`${track.id}-${idx}`}
                  activeOpacity={0.7}
                  style={[styles.trackRow, isThisPlaying && styles.trackRowPlaying]}
                  onPress={() => playTrack(track, likedTracks)}
                >
                  <Text style={styles.trackIndex}>{idx + 1}</Text>
                  <Image source={{ uri: track.cover || 'https://via.placeholder.com/44' }} style={styles.trackCover} />
                  <View style={styles.trackDetails}>
                    <Text style={[styles.trackTitle, isThisPlaying && styles.trackTitlePlaying]} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  <TouchableOpacity style={{ padding: 6 }} onPress={() => toggleLike(track)}>
                    <Heart size={18} color="#EF4444" fill="#EF4444" />
                  </TouchableOpacity>
                  <Text style={styles.trackDuration}>{formatDuration(track.duration || 215)}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={{ height: 160 }} />
      </ScrollView>
    );
  }

  // SUB-VIEW: OFFLINE DOWNLOADS
  if (activeSubView === 'downloads') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity onPress={() => setActiveSubView(null)} style={styles.backBtn}>
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
              onPress={() => playTrack(downloadedTracks[0], downloadedTracks)}
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
              <Text style={styles.emptySubtitle}>Download songs to listen offline with zero network usage.</Text>
            </View>
          ) : (
            downloadedTracks.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id;
              return (
                <TouchableOpacity
                  key={`${track.id}-${idx}`}
                  activeOpacity={0.7}
                  style={[styles.trackRow, isThisPlaying && styles.trackRowPlaying]}
                  onPress={() => playTrack(track, downloadedTracks)}
                >
                  <Text style={styles.trackIndex}>{idx + 1}</Text>
                  <Image source={{ uri: track.localCoverUri || track.cover || 'https://via.placeholder.com/44' }} style={styles.trackCover} />
                  <View style={styles.trackDetails}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.trackTitle, isThisPlaying && styles.trackTitlePlaying]} numberOfLines={1}>
                        {track.title}
                      </Text>
                      <View style={styles.flacBadge}>
                        <Text style={styles.flacBadgeText}>{track.isFlac ? 'FLAC' : '320k'}</Text>
                      </View>
                    </View>
                    <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  <TouchableOpacity style={{ padding: 6 }} onPress={() => removeDownload(track.id)}>
                    <Trash2 size={16} color="#71717A" />
                  </TouchableOpacity>
                  <Text style={styles.trackDuration}>{formatDuration(track.duration || 215)}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={{ height: 160 }} />
      </ScrollView>
    );
  }

  // SUB-VIEW: PLAYLIST DETAIL
  if (activeSubView === 'playlist' && selectedPlaylist) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity onPress={() => setActiveSubView(null)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Library</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { deletePlaylist(selectedPlaylist.id); setActiveSubView(null); }}>
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.shelfHeader}>
          <Image source={{ uri: selectedPlaylist.cover || 'https://via.placeholder.com/60' }} style={styles.playlistArt} />
          <View style={{ flex: 1 }}>
            <Text style={styles.shelfBigTitle}>{selectedPlaylist.name}</Text>
            <Text style={styles.shelfSubtitle}>{currentUser.name} · {selectedPlaylist.tracks?.length || 0} tracks</Text>
          </View>
          {selectedPlaylist.tracks?.length > 0 && (
            <TouchableOpacity style={styles.playAllBtn} onPress={() => playTrack(selectedPlaylist.tracks[0], selectedPlaylist.tracks)}>
              <Play size={16} color="#000000" fill="#000000" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.trackList}>
          {(!selectedPlaylist.tracks || selectedPlaylist.tracks.length === 0) ? (
            <View style={styles.emptyContainer}>
              <ListMusic size={36} color="#333333" />
              <Text style={styles.emptyTitle}>This playlist is empty</Text>
              <Text style={styles.emptySubtitle}>Add tracks from Search to populate this playlist.</Text>
            </View>
          ) : (
            selectedPlaylist.tracks.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id;
              return (
                <TouchableOpacity
                  key={`${track.id}-${idx}`}
                  style={[styles.trackRow, isThisPlaying && styles.trackRowPlaying]}
                  onPress={() => playTrack(track, selectedPlaylist.tracks)}
                >
                  <Text style={styles.trackIndex}>{idx + 1}</Text>
                  <Image source={{ uri: track.cover || 'https://via.placeholder.com/44' }} style={styles.trackCover} />
                  <View style={styles.trackDetails}>
                    <Text style={[styles.trackTitle, isThisPlaying && styles.trackTitlePlaying]} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  <Text style={styles.trackDuration}>{formatDuration(track.duration || 215)}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={{ height: 160 }} />
      </ScrollView>
    );
  }

  // MAIN LIBRARY VIEW WITH SEGREGATION TABS: Playlists | Songs | Artists | Albums
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Library Header */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.headerTitle}>{currentUser.name}'s Library</Text>
          <Text style={styles.headerSubtitle}>HAZE COLLECTION</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.spotifyImportBtn}
            activeOpacity={0.8}
            onPress={() => setShowSpotifyModal(true)}
          >
            <Text style={styles.spotifyImportText}>⚡ Spotify</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.newPlaylistBtn} activeOpacity={0.8} onPress={() => setShowCreateModal(true)}>
            <Plus size={14} color="#000000" strokeWidth={3} />
            <Text style={styles.newPlaylistText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Segregation Filter Tabs */}
      <View style={styles.tabRow}>
        {[
          { id: 'playlists', label: 'Playlists' },
          { id: 'songs', label: `Songs (${allSavedTracks.length})` },
          { id: 'artists', label: `Artists (${segregatedArtists.length})` },
          { id: 'albums', label: `Albums (${segregatedAlbums.length})` },
        ].map((tab) => {
          const isSelected = selectedTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabPill, isSelected && styles.tabPillActive]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* TAB 1: PLAYLISTS VIEW */}
      {selectedTab === 'playlists' && (
        <View>
          <View style={styles.shelfList}>
            <TouchableOpacity style={styles.shelfCard} activeOpacity={0.7} onPress={() => setActiveSubView('likes')}>
              <View style={styles.shelfIconCircleHeartSmall}>
                <Heart size={20} color="#FFFFFF" fill="#FFFFFF" />
              </View>
              <View style={styles.shelfCardInfo}>
                <Text style={styles.shelfCardTitle}>Liked Songs</Text>
                <Text style={styles.shelfCardSubtitle}>{likedTracks.length} tracks · {currentUser.badge}</Text>
              </View>
              <ChevronRight size={16} color="#71717A" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.shelfCard} activeOpacity={0.7} onPress={() => setActiveSubView('downloads')}>
              <View style={styles.shelfIconCircleDownloadSmall}>
                <ArrowDownToLine size={20} color="#000000" strokeWidth={2.5} />
              </View>
              <View style={styles.shelfCardInfo}>
                <Text style={styles.shelfCardTitle}>Downloaded Music</Text>
                <Text style={styles.shelfCardSubtitle}>{downloadedTracks.length} tracks · {totalDownloadedMB} MB offline</Text>
              </View>
              <ChevronRight size={16} color="#71717A" />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Custom Playlists ({userPlaylists.length})</Text>
          </View>

          {userPlaylists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ListMusic size={32} color="#3F3F46" />
              <Text style={styles.emptyTitle}>No custom playlists</Text>
              <Text style={styles.emptySubtitle}>Tap "New" above to curate your first playlist.</Text>
            </View>
          ) : (
            <View style={styles.shelfList}>
              {userPlaylists.map((pl) => (
                <TouchableOpacity
                  key={pl.id}
                  style={styles.shelfCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedPlaylistId(pl.id);
                    setActiveSubView('playlist');
                  }}
                >
                  <Image source={{ uri: pl.cover || 'https://via.placeholder.com/52' }} style={styles.playlistIconSquare} />
                  <View style={styles.shelfCardInfo}>
                    <Text style={styles.shelfCardTitle}>{pl.name}</Text>
                    <Text style={styles.shelfCardSubtitle}>{pl.tracks?.length || 0} tracks</Text>
                  </View>
                  <ChevronRight size={16} color="#71717A" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* TAB 2: SONGS VIEW */}
      {selectedTab === 'songs' && (
        <View style={styles.trackList}>
          {allSavedTracks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Music size={36} color="#3F3F46" />
              <Text style={styles.emptyTitle}>No saved songs</Text>
              <Text style={styles.emptySubtitle}>Like or download songs to see them here.</Text>
            </View>
          ) : (
            allSavedTracks.map((track, idx) => {
              const isThisPlaying = currentTrack?.id === track.id;
              return (
                <TouchableOpacity
                  key={`${track.id}-${idx}`}
                  style={[styles.trackRow, isThisPlaying && styles.trackRowPlaying]}
                  onPress={() => playTrack(track, allSavedTracks)}
                >
                  <Text style={styles.trackIndex}>{idx + 1}</Text>
                  <Image source={{ uri: track.localCoverUri || track.cover || 'https://via.placeholder.com/44' }} style={styles.trackCover} />
                  <View style={styles.trackDetails}>
                    <Text style={[styles.trackTitle, isThisPlaying && styles.trackTitlePlaying]} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  <Text style={styles.trackDuration}>{formatDuration(track.duration || 215)}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {/* TAB 3: ARTISTS VIEW */}
      {selectedTab === 'artists' && (
        <View style={styles.gridList}>
          {segregatedArtists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <User size={36} color="#3F3F46" />
              <Text style={styles.emptyTitle}>No artists found</Text>
              <Text style={styles.emptySubtitle}>Like or download music to see your favorite artists.</Text>
            </View>
          ) : (
            segregatedArtists.map((art, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.gridArtistCard}
                onPress={() => {
                  setSelectedArtist(art);
                  setActiveSubView('artist_detail');
                }}
              >
                {art.cover ? (
                  <Image source={{ uri: art.cover }} style={styles.gridArtistAvatar} />
                ) : (
                  <View style={[styles.gridArtistAvatar, styles.artistPlaceholder]}>
                    <User size={30} color="#FFFFFF" />
                  </View>
                )}
                <Text style={styles.gridArtistName} numberOfLines={1}>{art.artist}</Text>
                <Text style={styles.gridArtistSub}>{art.tracks.length} track{art.tracks.length > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* TAB 4: ALBUMS VIEW */}
      {selectedTab === 'albums' && (
        <View style={styles.gridList}>
          {segregatedAlbums.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Disc3 size={36} color="#3F3F46" />
              <Text style={styles.emptyTitle}>No albums found</Text>
              <Text style={styles.emptySubtitle}>Saved albums will appear here.</Text>
            </View>
          ) : (
            segregatedAlbums.map((alb, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.gridAlbumCard}
                onPress={() => {
                  setSelectedAlbum(alb);
                  setActiveSubView('album_detail');
                }}
              >
                <Image source={{ uri: alb.cover || 'https://via.placeholder.com/100' }} style={styles.gridAlbumCover} />
                <Text style={styles.gridAlbumName} numberOfLines={1}>{alb.album}</Text>
                <Text style={styles.gridAlbumSub} numberOfLines={1}>{alb.artist}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Create Playlist Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Playlist</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.inputField}
              placeholder="Playlist name"
              placeholderTextColor="#666666"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <TextInput
              style={[styles.inputField, { height: 60 }]}
              placeholder="Description (optional)"
              placeholderTextColor="#666666"
              value={newPlaylistDesc}
              onChangeText={setNewPlaylistDesc}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleCreatePlaylist}>
                <Text style={styles.modalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Spotify Link & CSV Import Modal */}
      <SpotifyImportModal
        visible={showSpotifyModal}
        onClose={() => setShowSpotifyModal(false)}
      />

      <View style={{ height: 160 }} />
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
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  spotifyImportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  spotifyImportText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4ADE80',
  },
  newPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  newPlaylistText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  shelfList: {
    gap: 10,
    marginBottom: 20,
  },
  shelfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 14,
  },
  shelfIconCircleHeartSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfIconCircleDownloadSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 10,
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
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  sectionHeaderRow: {
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  trackList: {
    gap: 6,
    marginTop: 6,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 12,
  },
  trackRowPlaying: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  trackIndex: {
    width: 20,
    fontSize: 13,
    fontWeight: '700',
    color: '#52525B',
    textAlign: 'center',
  },
  trackCover: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  trackDetails: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trackTitlePlaying: {
    color: colors.gold,
    fontWeight: '700',
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
  flacBadge: {
    backgroundColor: 'rgba(245, 185, 66, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  flacBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 6,
  },
  backBtnText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '700',
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  shelfIconCircleHeart: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelfIconCircleDownload: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistArt: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  shelfBigTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  shelfSubtitle: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 2,
  },
  playAllBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  artistBanner: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    gap: 6,
  },
  bigArtistAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  bigAlbumCover: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginBottom: 8,
  },
  artistPlaceholder: {
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigArtistName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  playAllFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 10,
  },
  playAllText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
  gridList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
  },
  gridArtistCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  gridArtistAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
  },
  gridArtistName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  gridArtistSub: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  gridAlbumCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  gridAlbumCover: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
  },
  gridAlbumName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gridAlbumSub: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4D4D8',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
    maxWidth: 240,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  inputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: '#A1A1AA',
    fontWeight: '700',
  },
  modalConfirmBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modalConfirmText: {
    color: '#000000',
    fontWeight: '800',
  },
});
