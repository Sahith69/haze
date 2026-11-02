import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Check, X, User } from 'lucide-react-native';
import { usePlayer, USERS } from '../context/PlayerContext';
import { colors } from '../theme/colors';

export const UserSwitchModal = () => {
  const { showUserModal, setShowUserModal, currentUser, switchUser } = usePlayer();

  if (!showUserModal) return null;

  const usersList = Object.values(USERS);

  const handleSelectUser = (userId) => {
    if (userId !== currentUser?.id) {
      switchUser(userId);
    }
    setShowUserModal(false);
  };

  return (
    <Modal
      visible={showUserModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowUserModal(false)}
    >
      <Pressable style={styles.backdrop} onPress={() => setShowUserModal(false)}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dragPill} />

          <View style={styles.header}>
            <View>
              <Text style={styles.superTitle}>HAZE DUAL PROFILE</Text>
              <Text style={styles.title}>Switch Profile</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowUserModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.textDim} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Each profile keeps its own liked tracks, playlists, offline downloads, and streaming preferences.
          </Text>

          <View style={styles.usersList}>
            {usersList.map((user) => {
              const isActive = currentUser?.id === user.id;

              return (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.userCard,
                    isActive && styles.userCardActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleSelectUser(user.id)}
                >
                  <View style={[styles.avatarWrap, isActive && styles.avatarWrapActive]}>
                    <Text style={styles.avatarEmoji}>{user.avatar}</Text>
                  </View>

                  <View style={styles.userDetails}>
                    <View style={styles.userNameRow}>
                      <Text style={[styles.userName, isActive && { color: colors.primary }]}>
                        {user.name}
                      </Text>
                      {isActive && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.userBadgeDesc}>{user.badge}</Text>
                    <Text style={styles.userSubDesc}>{user.description}</Text>
                  </View>

                  {isActive && (
                    <Check size={22} color={colors.primary} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: '#333333',
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  superTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 6,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#333333',
  },
  userCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#262D27',
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarWrapActive: {
    backgroundColor: 'rgba(30, 215, 96, 0.15)',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activeBadge: {
    backgroundColor: 'rgba(30, 215, 96, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  userBadgeDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  userSubDesc: {
    fontSize: 11,
    color: colors.textDim,
  },
  checkIcon: {
    marginLeft: 8,
  },
});
