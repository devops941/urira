import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Footprints,
  HeartPulse,
  Apple,
  Droplets,
  Moon,
  ArrowRight,
  Utensils,
  Salad,
  Sparkles,
  Watch,
  Activity,
  Flame,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AppButton } from '../../components/common/AppButton';
import { colors } from '../../theme/colors';

interface SlideItem {
  id: string;
  heading: string;
  supportingText: string;
  image: any;
  imageMode: 'contain' | 'cover';
  circleBg: string;
  badges: Array<{
    icon: React.ReactNode;
    style: any;
  }>;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [activeDot, setActiveDot] = useState(0);
  const flatListRef = useRef<FlatList<SlideItem>>(null);

  // Width of each slide in the horizontal carousel
  const slideWidth = Math.min(windowWidth - 32, 400);

  const SLIDES: SlideItem[] = [
    {
      id: 'fitness',
      heading: 'Your Health,\nYour Journey',
      supportingText: 'Build healthier habits and take care of your wellbeing with UYIRA.',
      image: require('../../../assets/images/welcome_hero.png'),
      imageMode: 'contain',
      circleBg: '#F0FDF4',
      badges: [
        {
          icon: <Footprints size={18} color="#16A34A" />,
          style: styles.badgeTopLeft,
        },
        {
          icon: <HeartPulse size={18} color="#E11D48" />,
          style: styles.badgeTopRight,
        },
        {
          icon: <Apple size={18} color="#16A34A" />,
          style: styles.badgeMidLeft,
        },
        {
          icon: <Droplets size={18} color="#06B6D4" />,
          style: styles.badgeMidRight,
        },
        {
          icon: <Moon size={18} color="#0EA5E9" />,
          style: styles.badgeFarRight,
        },
      ],
    },
    {
      id: 'nutrition',
      heading: 'Smart Nutrition,\nHealthy Living',
      supportingText: 'Nourish your body with wholesome meals and personalized dietary guidance.',
      image: require('../../../assets/images/carousel_nutrition.jpg'),
      imageMode: 'cover',
      circleBg: '#ECFDF5',
      badges: [
        {
          icon: <Apple size={18} color="#16A34A" />,
          style: styles.badgeTopLeft,
        },
        {
          icon: <Utensils size={18} color="#059669" />,
          style: styles.badgeTopRight,
        },
        {
          icon: <Salad size={18} color="#10B981" />,
          style: styles.badgeMidLeft,
        },
        {
          icon: <Droplets size={18} color="#06B6D4" />,
          style: styles.badgeMidRight,
        },
        {
          icon: <Sparkles size={18} color="#F59E0B" />,
          style: styles.badgeFarRight,
        },
      ],
    },
    {
      id: 'activity_fitness',
      heading: 'Daily Activity,\nTotal Wellness',
      supportingText: 'Track your footsteps, active workouts, and sleep cycles seamlessly.',
      image: require('../../../assets/images/carousel_vitals.jpg'),
      imageMode: 'cover',
      circleBg: '#F0F9FF',
      badges: [
        {
          icon: <Footprints size={18} color="#0EA5E9" />,
          style: styles.badgeTopLeft,
        },
        {
          icon: <Watch size={18} color="#6366F1" />,
          style: styles.badgeTopRight,
        },
        {
          icon: <Activity size={18} color="#0284C7" />,
          style: styles.badgeMidLeft,
        },
        {
          icon: <Moon size={18} color="#0EA5E9" />,
          style: styles.badgeMidRight,
        },
        {
          icon: <Flame size={18} color="#EA580C" />,
          style: styles.badgeFarRight,
        },
      ],
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / slideWidth);
    if (index >= 0 && index < SLIDES.length && index !== activeDot) {
      setActiveDot(index);
    }
  };

  const handleDotPress = (index: number) => {
    setActiveDot(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      {/* Top Header Branding: Only logo, no duplicated text */}
      <View style={styles.topSection}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Center Section: Carousel + Dots vertically centered */}
      <View style={styles.middleSection}>
        {/* Swipeable Carousel: Each slide has its own title, subtitle, and image */}
        <View style={[styles.carouselContainer, { width: slideWidth }]}>
          <FlatList
            ref={flatListRef}
            data={SLIDES}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onMomentumScrollEnd={handleScroll}
            getItemLayout={(_, index) => ({
              length: slideWidth,
              offset: slideWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={[styles.slideItem, { width: slideWidth }]}>
                {/* Main Copy for this slide */}
                <View style={styles.copySection}>
                  <Text style={styles.heading}>{item.heading}</Text>
                  <Text style={styles.supportingText}>{item.supportingText}</Text>
                </View>

                {/* Central Illustration / Photo Card with Floating Health Badges */}
                <View style={styles.illustrationSection}>
                  <View style={[styles.heroCircle, { backgroundColor: item.circleBg }]}>
                    <Image
                      source={item.image}
                      style={styles.heroImage}
                      resizeMode={item.imageMode}
                    />
                  </View>

                  {item.badges.map((badge, idx) => (
                    <View key={idx} style={[styles.floatingBadge, badge.style]}>
                      {badge.icon}
                    </View>
                  ))}
                </View>
              </View>
            )}
          />
        </View>

        {/* 3 Carousel Indicator Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => {
            const isActive = activeDot === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleDotPress(idx)}
                style={[styles.dot, isActive ? styles.dotActive : styles.dotInactive]}
                accessibilityRole="button"
                accessibilityLabel={`Slide ${idx + 1}`}
              />
            );
          })}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionSection, { width: slideWidth }]}>
        <AppButton
          title="Get Started"
          variant="primary"
          onPress={() => router.push('/(auth)/register')}
          rightIcon={<ArrowRight size={18} color={colors.surface} />}
          style={styles.primaryButton}
        />

        <AppButton
          title="I Already Have an Account"
          variant="secondary"
          onPress={() => router.push('/(auth)/login')}
          style={styles.secondaryButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 24,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  logo: {
    width: 155,
    height: 56,
  },
  middleSection: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 6,
  },
  carouselContainer: {
    alignItems: 'center',
    overflow: 'hidden',
  },
  slideItem: {
    alignItems: 'center',
  },
  copySection: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 12,
    minHeight: 88,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  supportingText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  illustrationSection: {
    height: 260,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  heroCircle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  floatingBadge: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeTopLeft: {
    top: 8,
    left: 24,
  },
  badgeTopRight: {
    top: 10,
    right: 24,
  },
  badgeMidLeft: {
    top: 100,
    left: 8,
  },
  badgeMidRight: {
    top: 92,
    right: 12,
  },
  badgeFarRight: {
    bottom: 20,
    right: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#CBD5E1',
  },
  actionSection: {
    gap: 12,
    marginTop: 6,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
});
