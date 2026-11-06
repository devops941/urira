import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
  Platform,
  StatusBar,
} from 'react-native';
import { ArrowLeft, Menu, Bell, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { profileService } from '../../services/health/profileService';
import { colors } from '../../theme/colors';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  isDrawerTrigger?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  rightAction?: React.ReactNode;
  showUniversalActions?: boolean;
  profilePhoto?: string;
  style?: ViewStyle;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  isDrawerTrigger = false,
  onBackPress,
  onMenuPress,
  rightAction,
  showUniversalActions = true,
  profilePhoto,
  style,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [avatarError, setAvatarError] = React.useState(false);

  const effectiveAvatar = profilePhoto || user?.profilePhoto;

  // Auto-fetch profile photo from health-profile if missing from both props and authStore
  React.useEffect(() => {
    if (!profilePhoto && !user?.profilePhoto) {
      profileService.getProfile()
        .then((prof) => {
          if (prof?.profilePhoto) {
            useAuthStore.getState().updateUser({ profilePhoto: prof.profilePhoto });
          }
        })
        .catch(() => {});
    }
  }, [profilePhoto, user?.profilePhoto]);

  React.useEffect(() => {
    setAvatarError(false);
  }, [effectiveAvatar]);

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleMenu = () => {
    if (onMenuPress) {
      onMenuPress();
    } else if (onBackPress) {
      onBackPress();
    }
  };

  // Safe top padding to clear status bar, notches, camera punch-holes, and system time
  const topPadding =
    Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight || 28) + 12
      : Math.max(insets.top, 20) + 6;

  return (
    <View style={[styles.headerContainer, { paddingTop: topPadding }, style]}>
      <View style={styles.topRow}>
        {/* Left Action: Menu on Top-level / Back on Sub-screens */}
        <View style={styles.leftContainer}>
          {isDrawerTrigger ? (
            <TouchableOpacity
              onPress={handleMenu}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Menu size={22} color={colors.primary} />
            </TouchableOpacity>
          ) : showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft size={22} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Center Logo: Perfectly Centered on the Screen */}
        <View style={styles.centerContainer} pointerEvents="none">
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Right Action: Universal Notifications + Profile Avatar */}
        <View style={styles.rightActionContainer}>
          {rightAction ? (
            rightAction
          ) : showUniversalActions ? (
            <View style={styles.universalRightRow}>
              {/* Notification Bell with Red Badge */}
              <TouchableOpacity
                style={styles.bellButton}
                onPress={() => router.push('/(protected)/history')}
                accessibilityRole="button"
                accessibilityLabel="Notifications and history"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Bell size={20} color={colors.primaryText} />
                <View style={styles.bellBadge} />
              </TouchableOpacity>

              {/* Profile Avatar with Photo / Icon */}
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => router.push('/(protected)/health-profile')}
                accessibilityRole="button"
                accessibilityLabel="Health Profile"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {effectiveAvatar && !avatarError ? (
                  <Image
                    source={{ uri: effectiveAvatar }}
                    style={styles.avatarButtonImage}
                    resizeMode="cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <User size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </View>

      {/* Screen Title prominently placed below header row */}
      {title && (
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    position: 'relative',
  },
  leftContainer: {
    zIndex: 2,
    minWidth: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  centerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoImage: {
    width: 110,
    height: 38,
  },
  rightActionContainer: {
    zIndex: 2,
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  universalRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  bellBadge: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.8,
    borderColor: '#16A34A',
  },
  avatarButtonImage: {
    width: 40,
    height: 40,
    borderRadius: 11,
  },
  titleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 2,
  },
});
