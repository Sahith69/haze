import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, SkipBack, Play, Pause, SkipForward } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const SyncedLyricsModal = () => {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    closeModal,
  } = usePlayer();

  const [activeLineIndex, setActiveLineIndex] = useState(2);

  const demoLyrics = [
    { time: 10, text: 'Streetlights blur in the midnight rain' },
    { time: 24, text: 'Chasing the signals through the wire' },
    { time: 42, text: 'Active line, tap any line to seek' },
    { time: 68, text: 'Voices fading in the neon glow' },
    { time: 92, text: 'We hold the frequency alive' },
    { time: 120, text: 'Electric horizon calls our name' },
    { time: 145, text: 'Drifting beyond the edge of sound' },
  ];

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.modalOverlay}>
      {/* Deep Indigo/Violet Gradient matching 03_Synced_Lyrics */}
      <LinearGradient
        colors={['#5B3FD1', '#2A1B6B', '#0B0B0F']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <View style={styles.content}>
        {/* Top Track Info Row */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={closeModal}>
            <ChevronDown size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <LinearGradient
            colors={currentTrack.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.trackArt}
          />

          <View style={styles.trackMeta}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          <View style={styles.hiResBadge}>
            <Text style={styles.hiResText}>HI-RES</Text>
          </View>
        </View>

        {/* Giant Millisecond Synced Lyrics */}
        <ScrollView
          style={styles.lyricsScroll}
          contentContainerStyle={styles.lyricsContent}
          showsVerticalScrollIndicator={false}
        >
          {demoLyrics.map((line, idx) => {
            const isActive = idx === activeLineIndex;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => {
                  setActiveLineIndex(idx);
                  seekTo(line.time);
                }}
              >
                <Text
                  style={[
                    styles.lyricLine,
                    isActive ? styles.lyricLineActive : styles.lyricLineInactive,
                  ]}
                >
                  {line.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bottom Scrubber & Mini Controls */}
        <View style={styles.bottomControls}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={previousTrack}>
              <SkipBack size={28} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.playPauseBtn}
              onPress={togglePlayPause}
            >
              {isPlaying ? (
                <Pause size={28} color={colors.bg} fill={colors.bg} />
              ) : (
                <Play size={28} color={colors.bg} fill={colors.bg} />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={nextTrack}>
              <SkipForward size={28} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: colors.bg,
    zIndex: 110,
  },
  content: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackArt: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  trackMeta: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackArtist: {
    fontSize: 13,
    color: colors.textSub,
    marginTop: 2,
  },
  hiResBadge: {
    backgroundColor: colors.gold,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hiResText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.goldDark,
    letterSpacing: 0.6,
  },
  lyricsScroll: {
    flex: 1,
    marginTop: 48,
  },
  lyricsContent: {
    gap: 24,
    paddingBottom: 40,
  },
  lyricLine: {
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 38,
  },
  lyricLineActive: {
    fontSize: 34,
    color: '#FFFFFF',
    lineHeight: 44,
  },
  lyricLineInactive: {
    fontSize: 26,
    color: colors.lyricsInactive,
  },
  bottomControls: {
    paddingBottom: 44,
    marginTop: 10,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginTop: 20,
  },
  iconBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
