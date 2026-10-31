import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export const AmbientBackground = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Top Left Violet Nebula */}
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.22)', 'rgba(139, 92, 246, 0.05)', 'transparent']}
        style={styles.topLeftGlow}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
      />

      {/* Top Right Pink Glow */}
      <LinearGradient
        colors={['rgba(236, 72, 153, 0.18)', 'rgba(236, 72, 153, 0.04)', 'transparent']}
        style={styles.topRightGlow}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.8 }}
      />

      {/* Mid Subtle Cyan Accent Glow */}
      <LinearGradient
        colors={['rgba(6, 182, 212, 0.12)', 'rgba(59, 130, 246, 0.03)', 'transparent']}
        style={styles.midCyanGlow}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Bottom Floating Glow */}
      <LinearGradient
        colors={['rgba(124, 92, 255, 0.15)', 'transparent']}
        style={styles.bottomGlow}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
      />

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    position: 'relative',
    overflow: 'hidden',
  },
  topLeftGlow: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: width * 0.9,
    height: 380,
    borderRadius: 190,
  },
  topRightGlow: {
    position: 'absolute',
    top: 60,
    right: -60,
    width: width * 0.85,
    height: 340,
    borderRadius: 170,
  },
  midCyanGlow: {
    position: 'absolute',
    top: height * 0.45,
    left: -40,
    width: width * 0.75,
    height: 280,
    borderRadius: 140,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
  },
});
