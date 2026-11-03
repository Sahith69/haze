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
import { DetailViewModal } from './src/screens/DetailViewModal';
import { AudioQualityModal } from './src/components/AudioQualityModal';
import { AddToPlaylistModal } from './src/components/AddToPlaylistModal';
import { UserSwitchModal } from './src/components/UserSwitchModal';
import { ToastBanner } from './src/components/ToastBanner';
import { colors } from './src/theme/colors';

const ScreenTransition = ({ activeTab, children }) => {
  const fadeAnim = React.useRef(new Animated.Value(0.3)).current;
  const slideAnim = React.useRef(new Animated.Value(8)).current;

  useEffect(() => {
    fadeAnim.setValue(0.3);
    slideAnim.setValue(8);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeTab]);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
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
    closeDetailView,
    detailModalData,
    detailViewData,
    currentTrack,
    showQualityModal,
    setShowQualityModal,
    qualityModalMode,
    currentUser,
    streamingQuality,
    downloadQuality,
    setStreamingQuality,
    setDownloadQuality,
    toastMessage,
    showUserModal,
    setShowUserModal,
    showAddToPlaylistModal,
    setShowAddToPlaylistModal,
  } = usePlayer();

  // Android Hardware Back Button Handler
  useEffect(() => {
    const onBackPress = () => {
      // 0. If UserSwitchModal is open -> close it
      if (showUserModal) {
        setShowUserModal(false);
        return true;
      }

      // 0.2 If AddToPlaylist modal open -> close it
      if (showAddToPlaylistModal) {
        setShowAddToPlaylistModal(false);
        return true;
      }

      // 1. If quality modal open -> close it
      if (showQualityModal) {
        setShowQualityModal(false);
        return true;
      }

      // 2. If detail view open -> close it
      if (activeModal === 'detail_view') {
        closeDetailView();
        return true;
      }

      // 3. If any modal open (lyrics, queue, equalizer, now_playing) -> pop stack
      if (activeModal) {
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
  }, [
    showUserModal,
    setShowUserModal,
    showAddToPlaylistModal,
    setShowAddToPlaylistModal,
    showQualityModal,
    setShowQualityModal,
    activeModal,
    activeTab,
    closeModal,
    closeDetailView,
    setActiveTab,
  ]);

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

        {/* Active Tab Screen with Smooth Transition */}
        <ScreenTransition activeTab={activeTab}>
          {renderActiveScreen()}
        </ScreenTransition>

        {/* Floating Mini Player (visible only when NO full-screen modal is active) */}
        {!activeModal && <MiniPlayer />}

        {/* Bottom Tab Bar (visible only when NO full-screen modal is active) */}
        {!activeModal && <BottomNavBar />}

        {/* Modals & Overlays */}
        {(detailModalData || detailViewData || activeModal === 'detail_view') && (
          <DetailViewModal />
        )}
        {currentTrack && <NowPlayingModal />}
        {currentTrack && <SyncedLyricsModal />}
        <QueueModal />
        <EqualizerModal />

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

        {/* Dual Profile Switcher Modal */}
        <UserSwitchModal />
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
