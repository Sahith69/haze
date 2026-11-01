import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Home, Search, HardDrive, Library } from 'lucide-react-native';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme/colors';

const TabItem = ({ tab, isActive, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const IconComponent = tab.icon;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.82, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3.5, tension: 90, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.tabButton}
      onPress={handlePress}
    >
      <Animated.View style={[styles.tabContent, { transform: [{ scale }] }]}>
        <IconComponent
          size={20}
          color={isActive ? '#FFFFFF' : '#666666'}
          strokeWidth={isActive ? 2.4 : 1.8}
        />
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {tab.label}
        </Text>
        {isActive && <View style={styles.activeDot} />}
      </Animated.View>
    </TouchableOpacity>
  );
};

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
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onPress={() => setActiveTab(tab.id)}
        />
      ))}
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
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
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
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});
