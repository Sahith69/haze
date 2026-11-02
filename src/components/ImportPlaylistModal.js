import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from 'react-native';
import { X, Link2, FileSpreadsheet, Upload, CheckCircle2, AlertCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { importSpotifyPlaylist } from '../services/api';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

function parseCSVToTracks(text) {
  if (!text || !text.trim()) return [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  function splitLine(line) {
    const res = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        res.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += c;
      }
    }
    res.push(cur.trim().replace(/^"|"$/g, ''));
    return res;
  }

  const firstRow = splitLine(lines[0]);
  let titleIdx = -1;
  let artistIdx = -1;
  let albumIdx = -1;

  firstRow.forEach((col, idx) => {
    const c = col.toLowerCase().replace(/[^a-z]/g, '');
    if (['trackname', 'title', 'track', 'songname', 'song'].includes(c)) titleIdx = idx;
    if (['artistnames', 'artistname', 'artist', 'artists', 'performer'].includes(c)) artistIdx = idx;
    if (['albumname', 'album'].includes(c)) albumIdx = idx;
  });

  const startIdx = titleIdx !== -1 || artistIdx !== -1 ? 1 : 0;
  if (titleIdx === -1) titleIdx = 0;
  if (artistIdx === -1) artistIdx = 1;

  const tracks = [];
  const timestamp = Date.now();
  for (let i = startIdx; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    const title = cols[titleIdx] || '';
    const artist = cols[artistIdx] || 'Unknown Artist';
    const album = albumIdx !== -1 && cols[albumIdx] ? cols[albumIdx] : 'Imported Spotify Playlist';

    if (title && title.toLowerCase() !== 'track name' && title.toLowerCase() !== 'title') {
      tracks.push({
        id: `csv-${timestamp}-${i}`,
        title,
        artist,
        album,
        cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3d/9d/d0/3d9dd0a3-e5e6-73d3-f938-e2182b810928/190295851286.jpg/600x600bb.jpg',
        duration: 210,
        isHiRes: true,
        qualityLabel: '320 kbps · Studio Master',
      });
    }
  }

  return tracks;
}

export const ImportPlaylistModal = ({ visible, onClose }) => {
  const { createPlaylist, showToast, currentUser, accentColor } = usePlayer();

  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'csv'
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedTracks, setParsedTracks] = useState([]);
  const [playlistName, setPlaylistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePickDocument = async () => {
    setErrorMsg('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      setCsvFileName(file.name || 'playlist.csv');

      const content = await FileSystem.readAsStringAsync(file.uri);
      setCsvContent(content);

      const tracks = parseCSVToTracks(content);
      setParsedTracks(tracks);

      const baseName = (file.name || 'Imported Playlist').replace(/\.[^/.]+$/, '');
      if (!playlistName.trim()) {
        setPlaylistName(baseName);
      }
    } catch (err) {
      console.warn('[ImportPlaylistModal] pick document error:', err);
      setErrorMsg('Failed to read the chosen CSV file.');
    }
  };

  const handleCsvTextChange = (text) => {
    setCsvContent(text);
    const tracks = parseCSVToTracks(text);
    setParsedTracks(tracks);
    if (!playlistName.trim() && tracks.length > 0) {
      setPlaylistName('Imported CSV Playlist');
    }
  };

  const handleImportLink = async () => {
    if (!spotifyUrl.trim()) {
      setErrorMsg('Please paste a Spotify playlist URL');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await importSpotifyPlaylist(spotifyUrl.trim());
      if (!data || !data.tracks || data.tracks.length === 0) {
        throw new Error('No tracks found in this playlist');
      }

      const nameToUse = playlistName.trim() || data.name || 'Imported Spotify Playlist';
      await createPlaylist(
        nameToUse,
        `Imported from Spotify (${data.tracks.length} tracks)`,
        data.tracks,
        data.cover || null
      );

      if (showToast) {
        showToast(`Imported "${nameToUse}" (${data.tracks.length} tracks)`, 'success');
      }

      onClose();
      setSpotifyUrl('');
      setPlaylistName('');
    } catch (err) {
      console.error('[ImportPlaylistModal] Import link error:', err);
      setErrorMsg(err.message || 'Failed to import Spotify playlist. Please ensure the link is public.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = async () => {
    if (parsedTracks.length === 0) {
      setErrorMsg('Please choose a CSV file or paste valid CSV tracklist first');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const nameToUse = playlistName.trim() || csvFileName.replace(/\.[^/.]+$/, '') || 'Imported CSV Playlist';
      await createPlaylist(
        nameToUse,
        `Imported from CSV (${parsedTracks.length} tracks)`,
        parsedTracks
      );

      if (showToast) {
        showToast(`Imported "${nameToUse}" (${parsedTracks.length} tracks)`, 'success');
      }

      onClose();
      setCsvContent('');
      setCsvFileName('');
      setParsedTracks([]);
      setPlaylistName('');
    } catch (err) {
      console.error('[ImportPlaylistModal] Import CSV error:', err);
      setErrorMsg(err.message || 'Failed to import CSV playlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dragPill} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.superTitle}>SPOTIFY & CSV IMPORT</Text>
              <Text style={styles.title}>Import Playlist</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={colors.textDim} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Import playlists directly into <Text style={{ color: accentColor || colors.primary, fontWeight: '700' }}>{currentUser?.name || 'Your'}</Text> library.
          </Text>

          {/* Mode Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'link' && [styles.tabBtnActive, { backgroundColor: accentColor || colors.primary }],
              ]}
              onPress={() => {
                setActiveTab('link');
                setErrorMsg('');
              }}
              activeOpacity={0.8}
            >
              <Link2 size={16} color={activeTab === 'link' ? '#000000' : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTab === 'link' && styles.tabTextActive]}>Spotify Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'csv' && [styles.tabBtnActive, { backgroundColor: accentColor || colors.primary }],
              ]}
              onPress={() => {
                setActiveTab('csv');
                setErrorMsg('');
              }}
              activeOpacity={0.8}
            >
              <FileSpreadsheet size={16} color={activeTab === 'csv' ? '#000000' : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTab === 'csv' && styles.tabTextActive]}>CSV File</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color="#FF5252" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* TAB 1: SPOTIFY LINK */}
          {activeTab === 'link' ? (
            <View style={styles.body}>
              <Text style={styles.inputLabel}>Spotify Playlist Link</Text>
              <TextInput
                style={styles.textInput}
                placeholder="https://open.spotify.com/playlist/..."
                placeholderTextColor={colors.textDim}
                value={spotifyUrl}
                onChangeText={setSpotifyUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputLabel}>Custom Playlist Title (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Leave blank to use Spotify title"
                placeholderTextColor={colors.textDim}
                value={playlistName}
                onChangeText={setPlaylistName}
              />

              <TouchableOpacity
                style={[
                  styles.importBtn,
                  { backgroundColor: accentColor || colors.primary },
                  loading && styles.importBtnDisabled,
                ]}
                onPress={handleImportLink}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#000000" />
                    <Text style={styles.importBtnText}>Scraping Tracks...</Text>
                  </View>
                ) : (
                  <Text style={styles.importBtnText}>Import from Spotify</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* TAB 2: CSV FILE */
            <ScrollView showsVerticalScrollIndicator={false} style={styles.bodyScroll}>
              <TouchableOpacity style={styles.pickFileBtn} onPress={handlePickDocument} activeOpacity={0.8}>
                <Upload size={20} color={accentColor || colors.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickFileTitle}>
                    {csvFileName ? csvFileName : 'Select CSV File'}
                  </Text>
                  <Text style={styles.pickFileSub}>
                    {parsedTracks.length > 0
                      ? `✓ ${parsedTracks.length} tracks detected`
                      : 'From Exportify, Soundiiz, TuneMyMusic'}
                  </Text>
                </View>
                {parsedTracks.length > 0 && <CheckCircle2 size={18} color={accentColor || colors.primary} />}
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Playlist Title</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Give your imported playlist a name"
                placeholderTextColor={colors.textDim}
                value={playlistName}
                onChangeText={setPlaylistName}
              />

              <Text style={styles.inputLabel}>Or Paste Raw CSV Text</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder={`Track Name, Artist Name, Album Name\nBlinding Lights, The Weeknd, After Hours`}
                placeholderTextColor={colors.textDim}
                value={csvContent}
                onChangeText={handleCsvTextChange}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[
                  styles.importBtn,
                  { backgroundColor: accentColor || colors.primary },
                  (loading || parsedTracks.length === 0) && styles.importBtnDisabled,
                ]}
                onPress={handleImportCSV}
                disabled={loading || parsedTracks.length === 0}
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#000000" />
                    <Text style={styles.importBtnText}>Importing Tracks...</Text>
                  </View>
                ) : (
                  <Text style={styles.importBtnText}>
                    Import {parsedTracks.length > 0 ? `${parsedTracks.length} Tracks` : 'CSV Playlist'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: '#333333',
    maxHeight: '85%',
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  superTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 6,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: '#000000',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#FF7B7B',
    flex: 1,
    fontWeight: '600',
  },
  body: {
    paddingBottom: 8,
  },
  bodyScroll: {
    maxHeight: 320,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#383838',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderWidth: 1.5,
    borderColor: '#3A3A3A',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  pickFileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  pickFileSub: {
    fontSize: 12,
    color: colors.textDim,
  },
  importBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  importBtnDisabled: {
    opacity: 0.5,
  },
  importBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
