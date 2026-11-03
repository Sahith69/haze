import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Platform, StatusBar as RNStatusBar } from 'react-native';
import { usePlayer } from '../context/PlayerContext';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 44;

export const ToastBanner = ({ message: propMessage }) => {
  const playerContext = usePlayer();
  const contextMessage = playerContext?.toastMessage;
  const message = propMessage || contextMessage;

  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 70, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -60, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [message]);

  if (!message) return null;

  const getBorderColor = () => {
    if (message.type === 'success') return 'rgba(34, 197, 94, 0.5)';
    if (message.type === 'error') return 'rgba(239, 68, 68, 0.5)';
    if (message.type === 'progress') return 'rgba(245, 185, 66, 0.5)';
    return 'rgba(255, 255, 255, 0.25)';
  };

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateY }],
          opacity,
          borderColor: getBorderColor(),
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.toastText} numberOfLines={2}>
        {message.text}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: STATUS_BAR_HEIGHT + 10,
    left: 20,
    right: 20,
    zIndex: 99999,
    backgroundColor: 'rgba(20, 20, 26, 0.96)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 25,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
