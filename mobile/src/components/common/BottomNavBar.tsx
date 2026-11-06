import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Home, Utensils, Activity, BarChart2, User } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

export interface BottomNavBarProps {
  activeTab?:
    | 'home'
    | 'nutrition'
    | 'wellness'
    | 'analytics'
    | 'profile'
    | 'health'
    | 'track'
    | 'reports';
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab = 'home' }) => {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Normalize legacy and current tabs to the 5 primary pillars
  const currentTab = (() => {
    if (activeTab === 'health' || activeTab === 'track') return 'wellness';
    if (activeTab === 'reports') return 'analytics';
    if (pathname.includes('/nutrition')) return 'nutrition';
    if (pathname.includes('/wellness') || pathname.includes('/activity') || pathname.includes('/water') || pathname.includes('/sleep')) return 'wellness';
    if (pathname.includes('/analytics') || pathname.includes('/history')) return 'analytics';
    if (pathname.includes('/health-profile')) return 'profile';
    if (pathname.includes('/home')) return 'home';
    return activeTab;
  })();

  const tabs = [
    { key: 'home', label: 'Home', icon: Home, route: '/(protected)/home' },
    { key: 'nutrition', label: 'Nutrition', icon: Utensils, route: '/(protected)/nutrition' },
    { key: 'wellness', label: 'Wellness', icon: Activity, route: '/(protected)/wellness' },
    { key: 'analytics', label: 'Analytics', icon: BarChart2, route: '/(protected)/analytics' },
    { key: 'profile', label: 'Profile', icon: User, route: '/(protected)/health-profile' },
  ];

  const handleTabPress = (route: string) => {
    if (pathname !== route) {
      router.push(route as any);
    }
  };

  // Safe bottom offset so it floats above home indicator / navigation pill
  const bottomMargin = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 16);

  return (
    <View style={[styles.floatingWrapper, { marginBottom: bottomMargin }]}>
      <View style={styles.floatingContainer}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.key;
          const IconComponent = tab.icon;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.75}
            >
              <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                <IconComponent
                  size={20}
                  color={isActive ? colors.primary : '#94A3B8'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </View>

              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>

              {/* Active Subtitle Dot indicator */}
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 99,
  },
  floatingContainer: {
    flexDirection: 'row',
    height: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    shadowColor: '#12372A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 20,
    position: 'relative',
  },
  activeTabButton: {
    // Subtle touch highlight
  },
  iconContainer: {
    width: 38,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  activeIconContainer: {
    backgroundColor: '#E8F3EC',
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
