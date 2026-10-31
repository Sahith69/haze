import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export const AmbientBackground = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Top Violet Orb */}
      <View style={styles.violetOrb} />
      {/* Mid Pink Orb */}
      <View style={styles.pinkOrb} />
      {/* Bottom Blue Orb */}
      <View style={styles.blueOrb} />

      {/* Subtle Top Ambient Gradient */}
      <LinearGradient
        colors={['rgba(124, 92, 255, 0.30)', 'rgba(124, 92, 255, 0.08)', 'transparent']}
        style={styles.topGradient}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
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
  violetOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#7C5CFF',
    opacity: 0.35,
    left: -80,
    top: 100,
    // Note: React Native shadow creates a diffused glow
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 80,
    elevation: 20,
  },
  pinkOrb: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FF5C9E',
    opacity: 0.28,
    right: -90,
    top: 380,
    shadowColor: '#FF5C9E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 70,
    elevation: 20,
  },
  blueOrb: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#2A6BFF',
    opacity: 0.25,
    left: 40,
    bottom: -60,
    shadowColor: '#2A6BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 60,
    elevation: 20,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
});
