import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const EqualizerModal = () => {
  const {
    eqPreset,
    setEqPreset,
    eqBands,
    setEqBand,
    volumeLeveling,
    setVolumeLeveling,
    closeModal,
  } = usePlayer();

  const presets = ['Flat', 'Bass boost', 'Vocal', 'Rock'];

  const bands = [
    { key: '31', label: '31' },
    { key: '62', label: '62' },
    { key: '125', label: '125' },
    { key: '250', label: '250' },
    { key: '500', label: '500' },
    { key: '1k', label: '1k' },
    { key: '2k', label: '2k' },
    { key: '4k', label: '4k' },
    { key: '8k', label: '8k' },
    { key: '16k', label: '16k' },
  ];

  const handlePresetSelect = (preset) => {
    setEqPreset(preset);
    if (preset === 'Flat') {
      bands.forEach(b => setEqBand(b.key, 80));
    } else if (preset === 'Bass boost') {
      setEqBand('31', 130);
      setEqBand('62', 120);
      setEqBand('125', 105);
      setEqBand('250', 90);
      setEqBand('500', 80);
      setEqBand('1k', 75);
      setEqBand('2k', 80);
      setEqBand('4k', 85);
      setEqBand('8k', 90);
      setEqBand('16k', 95);
    } else if (preset === 'Vocal') {
      setEqBand('31', 60);
      setEqBand('62', 70);
      setEqBand('125', 85);
      setEqBand('250', 110);
      setEqBand('500', 125);
      setEqBand('1k', 120);
      setEqBand('2k', 105);
      setEqBand('4k', 90);
      setEqBand('8k', 80);
      setEqBand('16k', 70);
    } else if (preset === 'Rock') {
      setEqBand('31', 120);
      setEqBand('62', 100);
      setEqBand('125', 80);
      setEqBand('250', 70);
      setEqBand('500', 85);
      setEqBand('1k', 100);
      setEqBand('2k', 115);
      setEqBand('4k', 120);
      setEqBand('8k', 110);
      setEqBand('16k', 105);
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.content}>
        {/* Top Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={closeModal}>
            <ChevronDown size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Equalizer</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Preset Selector Pills */}
        <View style={styles.presetsRow}>
          {presets.map((preset) => {
            const isActive = eqPreset === preset;
            return (
              <TouchableOpacity
                key={preset}
                activeOpacity={0.8}
                style={[
                  styles.presetPill,
                  isActive ? styles.presetPillActive : styles.presetPillInactive,
                ]}
                onPress={() => handlePresetSelect(preset)}
              >
                <Text
                  style={[
                    styles.presetText,
                    isActive ? styles.presetTextActive : styles.presetTextInactive,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 10-Band Graphic Equalizer Faders matching 08_Equalizer */}
        <View style={styles.eqContainer}>
          {bands.map((band) => {
            const val = eqBands[band.key] || 80; // 0 to 160
            const thumbBottom = Math.max(0, Math.min(val - 10, 140));

            return (
              <TouchableOpacity
                key={band.key}
                activeOpacity={0.9}
                style={styles.bandColumn}
                onPress={() => {
                  const nextVal = (val + 30) % 150 + 20;
                  setEqBand(band.key, nextVal);
                }}
              >
                {/* 160px Vertical Fader Track */}
                <View style={styles.faderTrack}>
                  <View style={[styles.faderFill, { height: val }]} />
                  <View style={[styles.faderThumb, { bottom: thumbBottom }]} />
                </View>
                <Text style={styles.bandLabel}>{band.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Volume Leveling Switch matching 08_Equalizer */}
        <View style={styles.levelingCard}>
          <View>
            <Text style={styles.levelingTitle}>Volume leveling</Text>
            <Text style={styles.levelingDesc}>Same loudness on every song</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.switchTrack,
              volumeLeveling ? styles.switchTrackOn : styles.switchTrackOff,
            ]}
            onPress={() => setVolumeLeveling(!volumeLeveling)}
          >
            <View
              style={[
                styles.switchThumb,
                volumeLeveling ? styles.switchThumbOn : styles.switchThumbOff,
              ]}
            />
          </TouchableOpacity>
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
    paddingTop: 52,
    paddingHorizontal: 20,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    gap: 8,
  },
  presetPill: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetPillActive: {
    backgroundColor: '#FFFFFF',
  },
  presetPillInactive: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  presetText: {
    fontSize: 13,
  },
  presetTextActive: {
    fontWeight: '700',
    color: colors.bg,
  },
  presetTextInactive: {
    fontWeight: '600',
    color: colors.text,
  },
  eqContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 38,
    paddingHorizontal: 4,
  },
  bandColumn: {
    width: 28,
    alignItems: 'center',
    gap: 12,
  },
  faderTrack: {
    position: 'relative',
    width: 4,
    height: 160,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  faderFill: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  faderThumb: {
    position: 'absolute',
    left: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  bandLabel: {
    fontSize: 10,
    color: colors.textDim,
  },
  levelingCard: {
    marginTop: 38,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  levelingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  levelingDesc: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    position: 'relative',
  },
  switchTrackOn: {
    backgroundColor: colors.gold,
  },
  switchTrackOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  switchThumb: {
    position: 'absolute',
    top: 3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  switchThumbOn: {
    right: 3,
  },
  switchThumbOff: {
    left: 3,
  },
});
