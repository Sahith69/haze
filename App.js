import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, BackHandler, Text, Animated, SafeAreaView } from 'react-native';
import { PlayerProvider, usePlayer } from './src/context/PlayerContext';
import { AmbientBackground } from './src/components/AmbientBackground';
import { MiniPlayer } from './src/components/MiniPlayer';
import { BottomNavBar } from './src/components/BottomNavBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { CloudVaultScreen } from './src/screens/CloudVaultScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { NowPlayingModal } from './src/screens/NowPlayingModal';
import { SyncedLyricsModal } from './src/screens/SyncedLyricsModal';
import { QueueModal } from './src/screens/QueueModal';
import { EqualizerModal } from './src/screens/EqualizerModal';
import { AudioQualityModal } from './src/components/AudioQualityModal';
import { AddToPlaylistModal } from './src/components/AddToPlaylistModal';
import { colors } from './src/theme/colors';

const ToastBanner = ({ message }) => {
  const translateY = React.useRef(new Animated.Value(-60)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

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
    if (message.type === 'success') return 'rgba(34, 197, 94, 0.4)';
    if (message.type === 'error') return 'rgba(239, 68, 68, 0.4)';
    if (message.type === 'progress') return 'rgba(245, 185, 66, 0.4)';
    return 'rgba(255, 255, 255, 0.2)';
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

const MainNavigator = () => {
  const {
    activeTab,
    setActiveTab,
    activeModal,
    setActiveModal,
    closeModal,
    showQualityModal,
    setShowQualityModal,
    qualityModalMode,
    currentUser,
    streamingQuality,
    downloadQuality,
    setStreamingQuality,
    setDownloadQuality,
    toastMessage,
    showAddToPlaylistModal,
    setShowAddToPlaylistModal,
  } = usePlayer();

  // Android Hardware Back Button Handler
  useEffect(() => {
    const onBackPress = () => {
      // 0. If AddToPlaylist modal open -> close it
      if (showAddToPlaylistModal) {
        setShowAddToPlaylistModal(false);
        return true;
      }

      // 1. If quality modal open -> close it
      if (showQualityModal) {
        setShowQualityModal(false);
        return true;
      }

      // 2. If queue/equalizer modal open -> return to now_playing
      if (activeModal && activeModal !== 'now_playing') {
        setActiveModal('now_playing');
        return true;
      }

      // 3. If now_playing modal open -> minimize to miniplayer
      if (activeModal === 'now_playing') {
        closeModal();
        return true;
      }

      // 4. If on search/vault/library tab -> return to home tab
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }

      // 5. On home screen: let system minimize app
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [showQualityModal, activeModal, activeTab, closeModal, setActiveModal, setActiveTab, setShowQualityModal]);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'search':
        return <SearchScreen />;
      case 'vault':
        return <CloudVaultScreen />;
      case 'library':
        return <LibraryScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AmbientBackground>
        {/* In-app Toast Banner */}
        <ToastBanner message={toastMessage} />

        {/* Active Tab Screen */}
        {renderActiveScreen()}

        {/* Floating Mini Player (visible unless a full-screen modal is active) */}
        {!activeModal && <MiniPlayer />}

        {/* Bottom Tab Bar */}
        <BottomNavBar />

        {/* Modals & Overlays */}
        {activeModal === 'now_playing' && <NowPlayingModal />}
        {activeModal === 'queue' && <QueueModal />}
        {activeModal === 'equalizer' && <EqualizerModal />}

        {/* Audio Quality Preferences Modal */}
        <AudioQualityModal
          visible={showQualityModal}
          onClose={() => setShowQualityModal(false)}
          currentUser={currentUser}
          mode={qualityModalMode}
          currentQuality={qualityModalMode === 'download' ? downloadQuality : streamingQuality}
          onSelectQuality={qualityModalMode === 'download' ? setDownloadQuality : setStreamingQuality}
        />

        {/* Add to Playlist Bottom Sheet Modal */}
        <AddToPlaylistModal />
      </AmbientBackground>
    </View>
  );
};

export default function App() {
  return (
    <PlayerProvider>
      <MainNavigator />
    </PlayerProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  toastWrapper: {
    position: 'absolute',
    top: 48,
    left: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: 'rgba(20, 20, 26, 0.94)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
