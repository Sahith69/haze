import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Search, Cloud, Library } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const BottomNavBar = () => {
  const { activeTab, setActiveTab } = usePlayer();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'vault', label: 'Vault', icon: Cloud },
    { id: 'library', label: 'Library', icon: Library },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        const tintColor = isActive ? '#FFFFFF' : colors.textSecondary;

        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.7}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.id)}
          >
            <IconComponent size={22} color={tintColor} strokeWidth={1.8} />
            <Text style={[styles.tabLabel, { color: tintColor }]}>
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
    height: 84,
    paddingTop: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.navBg,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 80,
  },
  tabButton: {
    width: 72,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
