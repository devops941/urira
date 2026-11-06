import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import {
  X,
  Home,
  Shield,
  Scale,
  Flame,
  History,
  Target,
  BarChart2,
  Settings,
  LogOut,
  ChevronRight,
  User,
  Utensils,
  Footprints,
  Droplets,
  Moon,
  Pill,
  Heart,
  Sparkles,
  Bot,
  FileText,
  ShieldCheck,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { profileService } from '../../services/health/profileService';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.85, 335);

export interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface NavItemDef {
  label: string;
  icon: any;
  route: string;
  color: string;
  bg: string;
  badge?: string;
}

interface NavSectionDef {
  title: string;
  items: NavItemDef[];
}

export const SideDrawer: React.FC<SideDrawerProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [drawerAvatarError, setDrawerAvatarError] = React.useState(false);

  React.useEffect(() => {
    if (visible && !user?.profilePhoto) {
      profileService.getProfile()
        .then((prof) => {
          if (prof?.profilePhoto) {
            useAuthStore.getState().updateUser({ profilePhoto: prof.profilePhoto });
          }
        })
        .catch(() => {});
    }
  }, [visible, user?.profilePhoto]);

  React.useEffect(() => {
    setDrawerAvatarError(false);
  }, [user?.profilePhoto]);

  const navigateTo = (path: string) => {
    onClose();
    setTimeout(() => {
      router.push(path as any);
    }, 150);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/(auth)/welcome');
  };

  const navSections: NavSectionDef[] = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Home Dashboard', icon: Home, route: '/(protected)/home', color: '#16A34A', bg: '#DCFCE7' },
        { label: 'AI Health Assistant', icon: Bot, route: '/(protected)/assistant', color: '#10B981', bg: '#E8F5EE', badge: 'AI' },
        { label: 'Health Analytics', icon: BarChart2, route: '/(protected)/analytics', color: '#0EA5E9', bg: '#E0F2FE' },
      ],
    },
    {
      title: 'DAILY TRACKERS',
      items: [
        { label: 'Wellness Hub', icon: Sparkles, route: '/(protected)/wellness', color: '#8B5CF6', bg: '#EDE9FE' },
        { label: 'Activity & Steps', icon: Footprints, route: '/(protected)/activity', color: '#0EA5E9', bg: '#E0F2FE' },
        { label: 'Water & Hydration', icon: Droplets, route: '/(protected)/water', color: '#06B6D4', bg: '#CFFAFE' },
        { label: 'Nutrition & Diet', icon: Utensils, route: '/(protected)/nutrition', color: '#F97316', bg: '#FFEDD5' },
        { label: 'Sleep Tracker', icon: Moon, route: '/(protected)/sleep', color: '#8B5CF6', bg: '#EDE9FE' },
        { label: 'Medications', icon: Pill, route: '/(protected)/medications', color: '#10B981', bg: '#DCFCE7' },
      ],
    },
    {
      title: 'HEALTH TOOLS & PROFILE',
      items: [
        { label: 'Health Profile', icon: Shield, route: '/(protected)/health-profile', color: '#16A34A', bg: '#DCFCE7' },
        { label: 'BMI Calculator', icon: Scale, route: '/(protected)/bmi', color: '#16A34A', bg: '#DCFCE7' },
        { label: 'Calorie Estimation', icon: Flame, route: '/(protected)/calories', color: '#F97316', bg: '#FFEDD5' },
        { label: 'Health Goals', icon: Target, route: '/(protected)/goals', color: '#0D9488', bg: '#CCFBF1' },
        { label: 'Health History', icon: History, route: '/(protected)/history', color: '#64748B', bg: '#F1F5F9' },
        { label: 'Settings', icon: Settings, route: '/(protected)/health-profile/edit', color: '#64748B', bg: '#F1F5F9' },
      ],
    },
    {
      title: 'LEGAL & POLICIES',
      items: [
        { label: 'Terms & Conditions', icon: FileText, route: '/(protected)/terms', color: '#0D9488', bg: '#CCFBF1' },
        { label: 'Privacy Policy', icon: ShieldCheck, route: '/(protected)/privacy', color: '#16A34A', bg: '#DCFCE7' },
      ],
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop click to dismiss */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Drawer Content Container */}
        <View style={styles.drawerContainer}>
          {/* Top Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.brandContainer}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={styles.drawerLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandSubtitle}>Smart Health Monitoring</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close menu"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* User Profile Hero Card */}
          <TouchableOpacity
            style={styles.userCard}
            onPress={() => navigateTo('/(protected)/health-profile')}
            activeOpacity={0.82}
          >
            <View style={styles.avatarCircle}>
              {user?.profilePhoto && !drawerAvatarError ? (
                <Image
                  source={{ uri: user.profilePhoto }}
                  style={styles.drawerAvatarImage}
                  resizeMode="cover"
                  onError={() => setDrawerAvatarError(true)}
                />
              ) : (
                <User size={22} color="#16A34A" />
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.fullName || 'Health Champion'}
              </Text>
              <View style={styles.viewProfileRow}>
                <View style={styles.statusLiveDot} />
                <Text style={styles.viewProfileText}>View Health Profile</Text>
                <ChevronRight size={13} color="#16A34A" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Grouped Navigation Scroll */}
          <ScrollView
            style={styles.navScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.navContent}
          >
            {navSections.map((section, sIdx) => (
              <View key={sIdx} style={styles.sectionBlock}>
                <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
                <View style={styles.sectionCard}>
                  {section.items.map((item, iIdx) => {
                    const IconComp = item.icon;
                    return (
                      <React.Fragment key={iIdx}>
                        {iIdx > 0 && <View style={styles.itemDivider} />}
                        <TouchableOpacity
                          style={styles.navRow}
                          onPress={() => navigateTo(item.route)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.navIconBox, { backgroundColor: item.bg }]}>
                            <IconComp size={17} color={item.color} />
                          </View>

                          <Text style={styles.navLabel}>{item.label}</Text>

                          {item.badge && (
                            <View style={styles.aiBadge}>
                              <Text style={styles.aiBadgeText}>{item.badge}</Text>
                            </View>
                          )}

                          <ChevronRight size={14} color="#CBD5E1" />
                        </TouchableOpacity>
                      </React.Fragment>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Bottom Footer & Logout */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.75}
            >
              <View style={styles.logoutIconBox}>
                <LogOut size={16} color="#E11D48" />
              </View>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>UYIRA Health Platform • v1.0.0</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingHorizontal: 16,
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  brandContainer: {
    flex: 1,
  },
  drawerLogo: {
    width: 105,
    height: 32,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    letterSpacing: 0.4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* User Profile Hero Card */
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#16A34A',
    overflow: 'hidden',
  },
  drawerAvatarImage: {
    width: 44,
    height: 44,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  viewProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  viewProfileText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  /* Grouped Navigation */
  navScroll: {
    flex: 1,
  },
  navContent: {
    paddingBottom: 16,
  },
  sectionBlock: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#FAFCFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 48,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  navIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  navLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  aiBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  /* Footer & Logout */
  footerContainer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  logoutIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
  },
  versionText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
});
