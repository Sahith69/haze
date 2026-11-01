import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { X, Link, FileSpreadsheet, CheckCircle2, Music2, Sparkles, FolderUp } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { API_BASE_URL } from '../config';
import { colors } from '../theme/colors';

export const SpotifyImportModal = ({ visible, onClose }) => {
  const { createPlaylist, addTrackToPlaylist, setToastMessage } = usePlayer();

  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'csv'
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [playlistName, setPlaylistName] = useState('My Spotify Playlist');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [previewTracks, setPreviewTracks] = useState([]);
  const [previewCover, setPreviewCover] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  if (!visible) return null;

  // Parse CSV content line-by-line
  const parseCsvContent = (content) => {
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const tracks = [];
    const firstLine = lines[0].toLowerCase();

    // Check if Exportify / Spotlistr CSV header
    if (firstLine.includes('track name') || firstLine.includes('title')) {
      const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim().toLowerCase());
      const titleIdx = headers.findIndex((h) => h.includes('track name') || h.includes('title') || h === 'song');
      const artistIdx = headers.findIndex((h) => h.includes('artist'));
      const albumIdx = headers.findIndex((h) => h.includes('album'));

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        const cleanRow = row.map((cell) => cell.replace(/^"|"$/g, '').trim());

        const title = cleanRow[titleIdx] || '';
        const artist = cleanRow[artistIdx] || 'Various Artists';
        const album = cleanRow[albumIdx] || 'Spotify Import';

        if (title) {
          tracks.push({
            id: `spot-${Date.now()}-${i}`,
            title,
            artist,
            album,
            cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/6f/bc/e6/6fbce6c4-c38c-72d8-4fd0-66cfff32f679/20UMGIM12176.rgb.jpg/600x600bb.jpg',
            duration: 210,
            isHiRes: true,
            qualityLabel: '320 kbps · Studio Master',
          });
        }
      }
    } else {
      // Plain lines e.g. "Artist - Title" or "Title by Artist"
      lines.forEach((line, idx) => {
        let title = line;
        let artist = 'Various Artists';

        if (line.includes(' - ')) {
          const parts = line.split(' - ');
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        } else if (line.includes(' by ')) {
          const parts = line.split(' by ');
          title = parts[0].trim();
          artist = parts[1].trim();
        }

        if (title) {
          tracks.push({
            id: `spot-${Date.now()}-${idx}`,
            title,
            artist,
            album: 'Spotify Import',
            cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/6f/bc/e6/6fbce6c4-c38c-72d8-4fd0-66cfff32f679/20UMGIM12176.rgb.jpg/600x600bb.jpg',
            duration: 210,
            isHiRes: true,
            qualityLabel: '320 kbps · Studio Master',
          });
        }
      });
    }

    return tracks;
  };

  // Fetch playlist via Link Scraper
  const handleFetchLink = async () => {
    if (!spotifyUrl.trim()) return;
    setIsLoading(true);
    setStatusText('Extracting playlist tracks from Spotify...');

    try {
      const res = await fetch(`${API_BASE_URL}/api/spotify/playlist?url=${encodeURIComponent(spotifyUrl.trim())}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setPlaylistName(data.name || 'Imported Spotify Playlist');
      setPreviewCover(data.cover || '');
      setPreviewTracks(data.tracks || []);
      setStatusText(`Found ${data.tracks?.length || 0} tracks in 320k Studio Master quality.`);
    } catch (err) {
      console.warn('[Spotify] Scrape error:', err.message);
      setStatusText('Failed to load playlist. Check URL or try CSV import.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pick CSV from device storage
  const handlePickCsv = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFileName(file.name);
        const autoName = file.name.replace(/\.[^/.]+$/, '');
        setPlaylistName(autoName || 'Imported CSV Playlist');

        setIsLoading(true);
        setStatusText('Reading CSV file...');

        const content = await FileSystem.readAsStringAsync(file.uri);
        const parsed = parseCsvContent(content);
        setPreviewTracks(parsed);
        setStatusText(`Detected ${parsed.length} songs from CSV!`);
      }
    } catch (err) {
      console.warn('[CSV Import] Error:', err.message);
      setStatusText(`Could not read file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Save parsed tracks to HAZE user library
  const handleImportToLibrary = async () => {
    if (previewTracks.length === 0) return;
    setIsLoading(true);
    setStatusText(`Saving "${playlistName}" to your library...`);

    try {
      await createPlaylist(
        playlistName,
        `Imported ${previewTracks.length} tracks via Spotify`,
        previewTracks
      );

      setToastMessage({
        type: 'success',
        text: `✓ Imported "${playlistName}" with ${previewTracks.length} tracks!`,
      });

      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('[Import] Save error:', err);
      setStatusText('Error saving playlist to library');
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          style={styles.sheetContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Indicator Grabber */}
          <View style={styles.grabber} />

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconBadge}>
                <Sparkles size={16} color="#22C55E" />
              </View>
              <Text style={styles.modalTitle}>Import Spotify Playlist</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#888888" />
            </TouchableOpacity>
          </View>

          {/* Tab Selector: Link vs CSV */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'link' && styles.tabBtnActive]}
              onPress={() => setActiveTab('link')}
            >
              <Link size={14} color={activeTab === 'link' ? '#000000' : '#888888'} />
              <Text style={[styles.tabBtnText, activeTab === 'link' && styles.tabBtnTextActive]}>
                Spotify Link
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'csv' && styles.tabBtnActive]}
              onPress={() => setActiveTab('csv')}
            >
              <FileSpreadsheet size={14} color={activeTab === 'csv' ? '#000000' : '#888888'} />
              <Text style={[styles.tabBtnText, activeTab === 'csv' && styles.tabBtnTextActive]}>
                CSV File
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: Spotify Link */}
          {activeTab === 'link' && (
            <View style={styles.tabContent}>
              <Text style={styles.inputLabel}>Spotify Playlist URL</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://open.spotify.com/playlist/..."
                  placeholderTextColor="#555555"
                  value={spotifyUrl}
                  onChangeText={setSpotifyUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.fetchBtn, !spotifyUrl.trim() && { opacity: 0.5 }]}
                  disabled={!spotifyUrl.trim() || isLoading}
                  onPress={handleFetchLink}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <Text style={styles.fetchBtnText}>Fetch</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 2: CSV File Picker */}
          {activeTab === 'csv' && (
            <View style={styles.tabContent}>
              <Text style={styles.inputLabel}>Exportify or Spotlistr CSV</Text>
              <TouchableOpacity
                style={styles.filePickerBox}
                activeOpacity={0.8}
                onPress={handlePickCsv}
              >
                <FolderUp size={28} color="#22C55E" />
                <Text style={styles.filePickerTitle}>
                  {selectedFileName || 'Tap to choose .csv file'}
                </Text>
                <Text style={styles.filePickerSub}>
                  Compatible with Exportify, Spotlistr, and TuneMyMusic
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Status Message */}
          {statusText ? (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          ) : null}

          {/* Preview Tracks List */}
          {previewTracks.length > 0 && (
            <View style={styles.previewContainer}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>
                  Playlist: <Text style={{ color: '#FFFFFF' }}>{playlistName}</Text>
                </Text>
                <Text style={styles.previewCount}>
                  {previewTracks.length} tracks detected
                </Text>
              </View>

              <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
                {previewTracks.slice(0, 15).map((track, i) => (
                  <View key={i} style={styles.previewRow}>
                    <Text style={styles.previewIndex}>{i + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewTrackTitle} numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Text style={styles.previewTrackArtist} numberOfLines={1}>
                        {track.artist}
                      </Text>
                    </View>
                    <View style={styles.qualityPill}>
                      <Text style={styles.qualityPillText}>✨ 320k</Text>
                    </View>
                  </View>
                ))}
                {previewTracks.length > 15 && (
                  <Text style={styles.moreTracksNotice}>
                    + {previewTracks.length - 15} more tracks
                  </Text>
                )}
              </ScrollView>

              {/* Action: Import Button */}
              <TouchableOpacity
                style={styles.importSubmitBtn}
                activeOpacity={0.85}
                disabled={isLoading}
                onPress={handleImportToLibrary}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#000000" />
                    <Text style={styles.importSubmitText}>
                      Import {previewTracks.length} Songs to HAZE
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0A0A0E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1C1C24',
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
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#14141A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  tabBtnTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  tabContent: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#16161E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#262634',
  },
  fetchBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fetchBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  filePickerBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  filePickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  filePickerSub: {
    fontSize: 11,
    color: '#71717A',
    textAlign: 'center',
  },
  statusBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    marginBottom: 12,
  },
  statusText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
  },
  previewContainer: {
    marginTop: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 13,
    color: '#A1A1AA',
    fontWeight: '600',
  },
  previewCount: {
    fontSize: 11,
    color: '#71717A',
    fontFamily: 'monospace',
  },
  previewScroll: {
    maxHeight: 180,
    backgroundColor: '#121218',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1F1F2A',
    marginBottom: 14,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
    gap: 10,
  },
  previewIndex: {
    fontSize: 11,
    color: '#52525B',
    width: 20,
    fontFamily: 'monospace',
  },
  previewTrackTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewTrackArtist: {
    fontSize: 11,
    color: '#71717A',
  },
  qualityPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityPillText: {
    color: '#38BDF8',
    fontSize: 9,
    fontWeight: '700',
  },
  moreTracksNotice: {
    textAlign: 'center',
    fontSize: 11,
    color: '#71717A',
    paddingVertical: 8,
  },
  importSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  importSubmitText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
});
