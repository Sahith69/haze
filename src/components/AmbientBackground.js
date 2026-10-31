import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

export const AmbientBackground = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Subtle Monochrome Dark Vignette */}
      <LinearGradient
        colors={['#0D0D0D', '#000000', '#000000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
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
  },
});
