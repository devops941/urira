import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Platform,
} from 'react-native';
import {
  Footprints,
  Droplets,
  Utensils,
  Moon,
} from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop, Rect, Path } from 'react-native-svg';
import { DailyVitalityScore, VitalityTier } from '../../types/vitality';
import { VITALITY_THEMES, getAvatarImageSource } from './avatarAssets';
import { HumanVectorFigure } from './HumanVectorFigure';
import {
  DailyStepSummaryDto,
  DailyWaterSummaryDto,
  SleepRecordDto,
} from '../../types/wellness';
import { INutritionSummary } from '../../types/nutrition';

interface LivingAvatarCardProps {
  vitality: DailyVitalityScore | null;
  userName?: string;
  stepsSummary?: DailyStepSummaryDto | null;
  waterSummary?: DailyWaterSummaryDto | null;
  nutritionSummary?: INutritionSummary | null;
  sleepRecord?: SleepRecordDto | null;
  onBoostApplied?: () => Promise<void> | void;
  profileWaterTarget?: number;
  profileCalTarget?: number;
}

export const LivingAvatarCard: React.FC<LivingAvatarCardProps> = ({
  vitality,
  userName,
  stepsSummary,
  waterSummary,
  nutritionSummary,
  sleepRecord,
  profileWaterTarget,
  profileCalTarget,
}) => {
  const [imageError, setImageError] = useState(false);

  // Compute live percentages with zero-lag fallback to actual loaded summaries
  const stepsPct =
    vitality?.dimensionScores?.steps?.percentage ??
    Math.round(
      Math.min(
        1.0,
        (stepsSummary?.totalSteps ?? 0) /
          Math.max(stepsSummary?.targetSteps ?? 8000, 1)
      ) * 100
    );

  const waterAmount = (waterSummary as any)?.totalConsumedMl ?? waterSummary?.totalAmountMl ?? 0;
  const waterTarget = profileWaterTarget || waterSummary?.targetMl || 2500;
  const waterPct =
    vitality?.dimensionScores?.water?.percentage ??
    Math.round(Math.min(1.0, waterAmount / Math.max(waterTarget, 1)) * 100);

  const nutConsumed = nutritionSummary?.consumedCalories ?? 0;
  const nutTarget = profileCalTarget || nutritionSummary?.calorieTarget || 2096;
  const nutritionPct =
    vitality?.dimensionScores?.nutrition?.percentage ??
    Math.round(Math.min(1.0, nutConsumed / Math.max(nutTarget, 1)) * 100);

  const hasSleep = !!(sleepRecord?.durationMinutes && sleepRecord.durationMinutes > 0);
  const sleepHours = hasSleep ? sleepRecord!.durationMinutes / 60 : 0;
  const sleepPct =
    vitality?.dimensionScores?.sleep?.percentage ??
    (hasSleep ? Math.round(Math.min(1.0, sleepHours / 8.0) * 100) : 0);

  // Composite Score across 4 Core Pillars (Steps, Water, Nutrition, Sleep)
  const score =
    vitality?.score ??
    Math.min(
      100,
      Math.round(
        0.25 * stepsPct +
          0.25 * waterPct +
          0.25 * nutritionPct +
          0.25 * sleepPct
      )
    );

  // Tier determination
  let tier: VitalityTier = vitality?.tier ?? 'ACTIVE';
  if (!vitality) {
    if (score >= 80) tier = 'PEAK';
    else if (score >= 50) tier = 'ACTIVE';
    else if (score >= 30) tier = 'LOW_ENERGY';
    else tier = 'RECHARGE';
  }

  const biologicalSex = vitality?.biologicalSex ?? 'MALE';
  const theme = VITALITY_THEMES[tier] || VITALITY_THEMES.ACTIVE;

  // Floating breathing animation
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  // SVG Circular Gauge Dimensions
  const circleSize = 92;
  const strokeWidth = 8.5;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (circumference * Math.min(100, Math.max(0, score))) / 100;

  return (
    <View style={styles.cardContainer}>
      {/* Seamless, 100% Full-Bleed Ambient Background Gradient */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          {/* Base Soft Horizon Gradient: Clean, crisp white on left -> fresh soft mint on right */}
          <LinearGradient id="heroCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="35%" stopColor="#F8FCF9" />
            <Stop offset="70%" stopColor="#EEF9F2" />
            <Stop offset="100%" stopColor="#DCF5E6" />
          </LinearGradient>

          {/* Soft Luminous Avatar Aura specifically highlighting the 3D Character */}
          <RadialGradient id="avatarStageGlow" cx="82%" cy="45%" r="42%">
            <Stop offset="0%" stopColor="#86EFAC" stopOpacity="0.45" />
            <Stop offset="55%" stopColor="#BBF7D0" stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#DCF5E6" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* 1. Full Base Seamless Gradient covering 100% with no cut-offs or aspect distortion */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroCardGrad)" />

        {/* 2. Soft Ambient Halo highlighting the 3D Avatar */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#avatarStageGlow)" />
      </Svg>

      {/* Top Tag & Badge Row */}
      <View style={styles.topRow}>
        <View style={styles.kickerPill}>
          <View style={styles.greenLiveDot} />
          <Text style={styles.kickerText}>LIVING HEALTH AVATAR</Text>
        </View>

        <View style={styles.tierBadgePill}>
          <Text style={styles.tierBadgeEmoji}>
            {tier === 'PEAK'
              ? '🌟'
              : tier === 'ACTIVE'
              ? '🏃'
              : tier === 'LOW_ENERGY'
              ? '💧'
              : '🌙'}
          </Text>
          <Text style={styles.tierBadgeLabel}>
            {tier === 'PEAK'
              ? 'Peak Vitality'
              : tier === 'ACTIVE'
              ? 'Active Momentum'
              : tier === 'LOW_ENERGY'
              ? 'Low Energy'
              : 'Rest & Recharge'}
          </Text>
        </View>
      </View>

      {/* Main Center Stage: Left Text, Middle Gauge, Right 3D Avatar */}
      <View style={styles.stageRow}>
        {/* Left Column: Heading & Motivation */}
        <View style={styles.textColumn}>
          <Text style={styles.headingTitle}>
            {tier === 'PEAK'
              ? 'Peak Vitality Reached! 🌟'
              : tier === 'ACTIVE'
              ? 'Your Vitality is Growing! 🚀'
              : tier === 'LOW_ENERGY'
              ? 'Fuel Up Your Body! 💧'
              : 'Rest & Recharge! 🌙'}
          </Text>
          <Text style={styles.headingSubtitle}>
            {tier === 'PEAK'
              ? `Outstanding discipline! You're operating at ${score}% peak vitality today.`
              : tier === 'ACTIVE'
              ? `Keep up the great progress! You're ${score}% towards Peak Vitality.`
              : tier === 'LOW_ENERGY'
              ? `Energy is running low at ${score}%. A quick hydration boost will help!`
              : `Take it easy this morning. Let's start with water and a light stretch.`}
          </Text>
        </View>

        {/* Center Column: SVG Circular Vitality Ring */}
        <View style={styles.gaugeColumn}>
          <View style={styles.gaugeContainer}>
            <Svg width={circleSize} height={circleSize} style={styles.gaugeSvg}>
              <Defs>
                <LinearGradient id="vitalityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#22C55E" />
                  <Stop offset="100%" stopColor="#15803D" />
                </LinearGradient>
              </Defs>
              {/* Background Track */}
              <Circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                stroke="#E2E8F0"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Animated Progress Arc */}
              <Circle
                cx={circleSize / 2}
                cy={circleSize / 2}
                r={radius}
                stroke="url(#vitalityGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${circleSize / 2} ${circleSize / 2})`}
              />
            </Svg>

            <View style={styles.gaugeCenterTextWrap}>
              <Text style={styles.gaugeScoreNumber}>{score}%</Text>
              <Text style={styles.gaugeScoreLabel}>VITALITY</Text>
            </View>
          </View>
        </View>

        {/* Right Column: 3D Living Character (Transparent PNG Seamlessly Integrated) */}
        <View style={styles.avatarColumn}>
          <View style={styles.pedestalShadow} />
          <Animated.View
            style={[styles.avatarFloatWrap, { transform: [{ translateY: floatAnim }] }]}
          >
            {!imageError ? (
              <Image
                source={getAvatarImageSource(tier, biologicalSex)}
                style={styles.avatarImage}
                resizeMode="contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <HumanVectorFigure tier={tier} biologicalSex={biologicalSex} size={110} />
            )}
          </Animated.View>
        </View>
      </View>

      {/* Bottom Health Pillars Strip (5 Columns with colored progress bars) */}
      <View style={styles.pillarsStrip}>
        {/* Pillar 1: Steps */}
        <View style={styles.pillarItem}>
          <View style={styles.pillarHeader}>
            <Footprints size={12} color="#0EA5E9" />
            <Text style={styles.pillarLabel}>Steps</Text>
          </View>
          <Text style={styles.pillarValue}>{stepsPct}%</Text>
          <View style={styles.pillarTrack}>
            <View style={[styles.pillarFill, { width: `${Math.min(100, stepsPct)}%`, backgroundColor: '#0EA5E9' }]} />
          </View>
        </View>

        {/* Pillar 2: Water */}
        <View style={styles.pillarItem}>
          <View style={styles.pillarHeader}>
            <Droplets size={12} color="#06B6D4" />
            <Text style={styles.pillarLabel}>Water</Text>
          </View>
          <Text style={styles.pillarValue}>{waterPct}%</Text>
          <View style={styles.pillarTrack}>
            <View style={[styles.pillarFill, { width: `${Math.min(100, waterPct)}%`, backgroundColor: '#06B6D4' }]} />
          </View>
        </View>

        {/* Pillar 3: Food */}
        <View style={styles.pillarItem}>
          <View style={styles.pillarHeader}>
            <Utensils size={12} color="#F97316" />
            <Text style={styles.pillarLabel}>Food</Text>
          </View>
          <Text style={styles.pillarValue}>{nutritionPct}%</Text>
          <View style={styles.pillarTrack}>
            <View style={[styles.pillarFill, { width: `${Math.min(100, nutritionPct)}%`, backgroundColor: '#F97316' }]} />
          </View>
        </View>

        {/* Pillar 4: Sleep */}
        <View style={styles.pillarItem}>
          <View style={styles.pillarHeader}>
            <Moon size={12} color="#8B5CF6" />
            <Text style={styles.pillarLabel}>Sleep</Text>
          </View>
          <Text style={styles.pillarValue}>{sleepPct}%</Text>
          <View style={styles.pillarTrack}>
            <View style={[styles.pillarFill, { width: `${Math.min(100, sleepPct)}%`, backgroundColor: '#8B5CF6' }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E8F5EE',
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#12372A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 16px rgba(18, 55, 42, 0.06)',
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 2,
  },
  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  greenLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  kickerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.6,
  },
  tierBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  tierBadgeEmoji: {
    fontSize: 12,
  },
  tierBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
    zIndex: 2,
  },
  textColumn: {
    flex: 1.25,
    paddingRight: 6,
  },
  headingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 23,
    marginBottom: 4,
  },
  headingSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  gaugeColumn: {
    width: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeContainer: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeSvg: {
    position: 'absolute',
  },
  gaugeCenterTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeScoreNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#12372A',
    letterSpacing: -0.5,
  },
  gaugeScoreLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  avatarColumn: {
    width: 95,
    height: 125,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFloatWrap: {
    width: 95,
    height: 125,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 95,
    height: 125,
  },
  pedestalShadow: {
    position: 'absolute',
    bottom: 8,
    width: 65,
    height: 10,
    borderRadius: 30,
    backgroundColor: '#86EFAC',
    opacity: 0.35,
    transform: [{ scaleY: 0.5 }],
  },
  pillarsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 12,
    zIndex: 2,
  },
  pillarItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 3,
  },
  pillarLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },
  pillarValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  pillarTrack: {
    width: '80%',
    height: 3.5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  pillarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
