import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
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
import { colors } from './src/theme/colors';

const MainNavigator = () => {
  const { activeTab, activeModal } = usePlayer();

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
        {/* Active Tab Screen */}
        {renderActiveScreen()}

        {/* Floating Mini Player (visible unless a full-screen modal is active) */}
        {!activeModal && <MiniPlayer />}

        {/* Bottom Tab Bar */}
        <BottomNavBar />

        {/* Modals & Overlays */}
        {activeModal === 'now_playing' && <NowPlayingModal />}
        {activeModal === 'lyrics' && <SyncedLyricsModal />}
        {activeModal === 'queue' && <QueueModal />}
        {activeModal === 'equalizer' && <EqualizerModal />}
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
});
