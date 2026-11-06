import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Leaf, Sparkles } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export interface FloatingAIChatButtonProps {
  bottomOffset?: number;
  rightOffset?: number;
  onPress?: () => void;
}

export const FloatingAIChatButton: React.FC<FloatingAIChatButtonProps> = ({
  bottomOffset = 104,
  rightOffset = 18,
  onPress,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/(protected)/assistant' as any);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          right: rightOffset,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.fabButton}
        onPress={handlePress}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="Open UYIRA AI Health Assistant"
        accessibilityHint="Opens the intelligent health chat assistant"
      >
        {/* Glowing Mint Halo Background */}
        <View style={styles.innerHalo}>
          {/* UYIRA Leaf & AI Sparkle Vector Composition */}
          <View style={styles.emblemContainer}>
            <Leaf
              size={26}
              color="#34D399"
              strokeWidth={2.4}
              style={styles.leafIcon}
            />
            <View style={styles.sparkleWrap}>
              <Sparkles size={15} color="#FFFFFF" strokeWidth={2.6} />
            </View>
          </View>
        </View>

        {/* Floating Top-Right Notification Dot */}
        <View style={styles.onlineDot} />

        {/* Sleek "AI" Bottom Indicator Badge */}
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 998,
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#12372A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#C6E7D2',
    shadowColor: '#12372A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
  },
  innerHalo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(232, 243, 236, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafIcon: {
    transform: [{ rotate: '-10deg' }],
  },
  sparkleWrap: {
    position: 'absolute',
    top: -2,
    right: -5,
  },
  onlineDot: {
    position: 'absolute',
    top: 2,
    right: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  aiBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#16A34A',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  aiBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
});
