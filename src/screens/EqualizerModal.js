import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { ToastBanner } from '../components/ToastBanner';
import { colors } from '../theme/colors';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 44;

export const EqualizerModal = () => {
  const {
    activeModal,
    eqPreset,
    setEqPreset,
    eqBands,
    setEqBand,
    volumeLeveling,
    setVolumeLeveling,
    closeModal,
    setActiveModal,
    currentTrack,
    crossfadeSeconds,
    setCrossfadeSeconds,
    accentColor,
    showToast,
  } = usePlayer();

  const handleClose = () => {
    if (currentTrack) {
      setActiveModal('now_playing');
    } else {
      closeModal();
    }
  };

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
    <Modal
      visible={activeModal === 'equalizer'}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <ToastBanner />
        <View style={styles.content}>
          {/* Top Header */}
          <View style={styles.headerBar}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleClose}>
              <ChevronDown size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Audio & Equalizer</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
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
                      isActive
                        ? [styles.presetPillActive, { backgroundColor: accentColor || '#FFFFFF' }]
                        : styles.presetPillInactive,
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

            {/* 10-Band Graphic Equalizer Faders */}
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
                      const nextVal = ((val + 30) % 150) + 20;
                      setEqBand(band.key, nextVal);
                    }}
                  >
                    {/* 160px Vertical Fader Track */}
                    <View style={styles.faderTrack}>
                      <View style={[styles.faderFill, { height: val, backgroundColor: accentColor || colors.primary }]} />
                      <View style={[styles.faderThumb, { bottom: thumbBottom, backgroundColor: '#FFFFFF' }]} />
                    </View>
                    <Text style={styles.bandLabel}>{band.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Crossfade & Gapless Playback Suite */}
            <View style={styles.featureCard}>
              <View style={styles.featureCardHeader}>
                <Text style={styles.featureTitle}>Crossfade & Gapless Playback</Text>
                <Text style={styles.featureDesc}>Smoothly blend transitions between consecutive tracks</Text>
              </View>

              <View style={styles.crossfadePillsRow}>
                {[
                  { sec: 0, label: 'Off' },
                  { sec: 2, label: '2s' },
                  { sec: 3, label: '3s' },
                  { sec: 5, label: '5s' },
                ].map((item) => {
                  const isSelected = crossfadeSeconds === item.sec;
                  return (
                    <TouchableOpacity
                      key={`cf_${item.sec}`}
                      style={[
                        styles.crossfadePill,
                        isSelected && [
                          styles.crossfadePillActive,
                          { backgroundColor: accentColor || colors.primary, borderColor: accentColor || colors.primary },
                        ],
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setCrossfadeSeconds(item.sec);
                        if (showToast) {
                          showToast(
                            item.sec === 0
                              ? 'Crossfade turned off'
                              : `Crossfade set to ${item.label}`,
                            'info'
                          );
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.crossfadePillText,
                          isSelected && styles.crossfadePillTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Volume Leveling Switch */}
            <View style={styles.levelingCard}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.levelingTitle}>Volume leveling</Text>
                <Text style={styles.levelingDesc}>Consistent loudness across every studio track</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.switchTrack,
                  volumeLeveling
                    ? [styles.switchTrackOn, { backgroundColor: accentColor || colors.primary }]
                    : styles.switchTrackOff,
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
          </ScrollView>
        </View>
      </View>
  </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    paddingTop: STATUS_BAR_HEIGHT + 10,
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
    marginTop: 20,
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  featureCard: {
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
  },
  featureCardHeader: {
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: colors.textDim,
  },
  crossfadePillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  crossfadePill: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#383838',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossfadePillActive: {
    backgroundColor: colors.primary,
  },
  crossfadePillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  crossfadePillTextActive: {
    color: '#000000',
    fontWeight: '900',
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
