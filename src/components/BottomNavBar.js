import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Search, HardDrive, Library } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const BottomNavBar = () => {
  const { activeTab, setActiveTab } = usePlayer();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'vault', label: 'Vault', icon: HardDrive },
    { id: 'library', label: 'Library', icon: Library },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.7}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.id)}
          >
            <IconComponent
              size={20}
              color={isActive ? '#FFFFFF' : '#666666'}
              strokeWidth={isActive ? 2.4 : 1.8}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    zIndex: 80,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666666',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
