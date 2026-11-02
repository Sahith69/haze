import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Check, Sparkles, Zap, Shield, Wifi } from 'lucide-react-native';
import { colors } from '../theme/colors';

export const QUALITY_OPTIONS = [
  {
    id: '1411k',
    label: 'Lossless FLAC Master',
    bitrate: '1,411 kbps · 16-bit / 44.1 kHz',
    badge: 'FLAC',
    desc: 'Bit-perfect studio audio. Zero compression, master quality.',
    icon: Zap,
    badgeColor: colors.gold,
    badgeTextColor: colors.goldDark,
  },
  {
    id: '320k',
    label: 'Hi-Fi Studio Master',
    bitrate: '320 kbps · High Bitrate AAC',
    badge: 'STUDIO',
    desc: 'Crystal-clear audio. Fast loading with maximum clarity.',
    icon: Sparkles,
    badgeColor: '#38BDF8',
    badgeTextColor: '#0369A1',
  },
  {
    id: '256k',
    label: 'High Definition',
    bitrate: '256 kbps · Optimized Audio',
    badge: 'HD',
    desc: 'Balanced fidelity. Great for mobile network streaming.',
    icon: Wifi,
    badgeColor: '#A855F7',
    badgeTextColor: '#581C87',
  },
  {
    id: '128k',
    label: 'Data Saver',
    bitrate: '128 kbps · Low Bandwidth',
    badge: 'SAVER',
    desc: 'Conserves cellular data while maintaining solid fidelity.',
    icon: Shield,
    badgeColor: '#64748B',
    badgeTextColor: '#0F172A',
  },
];

export const AudioQualityModal = ({
  visible,
  onClose,
  currentUser,
  currentQuality,
  onSelectQuality,
  mode = 'streaming', // 'streaming' | 'download'
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dragPill} />

          <View style={styles.header}>
            <Text style={styles.superTitle}>
              {currentUser?.name?.toUpperCase()}'S AUDIO PREFERENCES
            </Text>
            <Text style={styles.title}>
              {mode === 'download' ? 'Offline Download Quality' : 'Streaming Quality'}
            </Text>
            <Text style={styles.subtitle}>
              Choose your preferred playback resolution. Saved automatically to your profile.
            </Text>
          </View>

          <View style={styles.optionsList}>
            {QUALITY_OPTIONS.map((opt) => {
              const isSelected = (currentQuality || '1411k') === opt.id;
              const IconComponent = opt.icon;

              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectQuality(opt.id);
                    onClose();
                  }}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      isSelected && { backgroundColor: opt.badgeColor },
                    ]}
                  >
                    <IconComponent
                      size={18}
                      color={isSelected ? '#000000' : '#A3A3A3'}
                    />
                  </View>

                  <View style={styles.optionInfo}>
                    <View style={styles.optionTitleRow}>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: opt.badgeColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgeText,
                            { color: opt.badgeTextColor },
                          ]}
                        >
                          {opt.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.bitrateText}>{opt.bitrate}</Text>
                    <Text style={styles.descText}>{opt.desc}</Text>
                  </View>

                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Check size={16} color="#000000" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
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
    backgroundColor: '#121217',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dragPill: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
  },
  superTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
    lineHeight: 18,
  },
  optionsList: {
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#D4D4D8',
  },
  optionLabelSelected: {
    color: '#FFFFFF',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bitrateText: {
    fontSize: 12,
    color: colors.gold,
    fontWeight: '600',
    marginTop: 2,
  },
  descText: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  closeBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
});
