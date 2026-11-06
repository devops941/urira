import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, {
  Circle,
  Rect,
  Path,
  Defs,
  ClipPath,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

export interface LiquidFillBodyAvatarProps {
  percentage: number; // 0 to 100
  timeframe?: 'daily' | 'weekly' | 'monthly';
  tier?: 'PEAK' | 'ACTIVE' | 'LOW_ENERGY' | 'RECHARGE';
  size?: number; // width
  showPercentageBadge?: boolean;
}

export const LiquidFillBodyAvatar: React.FC<LiquidFillBodyAvatarProps> = ({
  percentage = 60,
  timeframe = 'weekly',
  tier = 'ACTIVE',
  size = 120,
  showPercentageBadge = true,
}) => {
  const clampedPct = Math.max(0, Math.min(100, Math.round(percentage)));
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Color theme mapping matching the user's reference infographics
  const theme = (() => {
    if (clampedPct >= 80 || tier === 'PEAK') {
      return {
        fillGradientStart: '#22C55E',
        fillGradientEnd: '#16A34A',
        unfilledColor: '#DCFCE7',
        borderColor: '#15803D',
        badgeBg: '#DCFCE7',
        badgeText: '#15803D',
        pedestalGlow: '#86EFAC',
        statusLabel: 'Healthy / Peak',
      };
    }
    if (clampedPct >= 60 || tier === 'ACTIVE') {
      return {
        fillGradientStart: '#38BDF8',
        fillGradientEnd: '#0284C7',
        unfilledColor: '#E0F2FE',
        borderColor: '#0284C7',
        badgeBg: '#E0F2FE',
        badgeText: '#0369A1',
        pedestalGlow: '#BAE6FD',
        statusLabel: 'Active / Normal',
      };
    }
    if (clampedPct >= 40 || tier === 'LOW_ENERGY') {
      return {
        fillGradientStart: '#FBBF24',
        fillGradientEnd: '#D97706',
        unfilledColor: '#FEF3C7',
        borderColor: '#B45309',
        badgeBg: '#FEF3C7',
        badgeText: '#B45309',
        pedestalGlow: '#FDE68A',
        statusLabel: 'Moderate Wellness',
      };
    }
    return {
      fillGradientStart: '#A78BFA',
      fillGradientEnd: '#7C3AED',
      unfilledColor: '#EDE9FE',
      borderColor: '#6D28D9',
      badgeBg: '#EDE9FE',
      badgeText: '#5B21B6',
      pedestalGlow: '#DDD6FE',
      statusLabel: 'Action Needed',
    };
  })();

  // Geometry: Top of head is y=6, bottom of feet is y=188. Total height = 182.
  // Liquid fills from bottom (188) upwards to 6
  const fillHeight = (clampedPct / 100) * 182;
  const liquidY = 188 - fillHeight;

  // Wave crest coordinates
  const waveD = `
    M 0 ${liquidY}
    Q 30 ${liquidY - 4}, 60 ${liquidY}
    T 120 ${liquidY}
    L 120 200
    L 0 200
    Z
  `;

  const width = size;
  const height = size * 1.55; // 120w -> ~186h

  return (
    <View style={[styles.wrapper, { width }]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
        <Svg width={width} height={height} viewBox="0 0 120 200">
          <Defs>
            {/* The Human Figure Silhouette ClipPath */}
            <ClipPath id="humanFigureClip">
              {/* Head */}
              <Circle cx={60} cy={22} r={16} />
              {/* Torso & Hips */}
              <Rect x={44} y={44} width={32} height={70} rx={10} />
              {/* Left Arm */}
              <Rect x={22} y={48} width={14} height={66} rx={7} />
              {/* Right Arm */}
              <Rect x={84} y={48} width={14} height={66} rx={7} />
              {/* Left Leg */}
              <Rect x={44} y={106} width={14} height={82} rx={7} />
              {/* Right Leg */}
              <Rect x={62} y={106} width={14} height={82} rx={7} />
            </ClipPath>

            {/* Liquid Fill Gradient */}
            <LinearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={theme.fillGradientStart} />
              <Stop offset="100%" stopColor={theme.fillGradientEnd} />
            </LinearGradient>
          </Defs>

          {/* Pedestal Glow at bottom */}
          <Path
            d="M 28 194 Q 60 198, 92 194 Q 60 190, 28 194 Z"
            fill={theme.pedestalGlow}
            opacity={0.8}
          />

          {/* 1. Base Unfilled Body Silhouette (Light background) */}
          <G fill={theme.unfilledColor}>
            <Circle cx={60} cy={22} r={16} />
            <Rect x={44} y={44} width={32} height={70} rx={10} />
            <Rect x={22} y={48} width={14} height={66} rx={7} />
            <Rect x={84} y={48} width={14} height={66} rx={7} />
            <Rect x={44} y={106} width={14} height={82} rx={7} />
            <Rect x={62} y={106} width={14} height={82} rx={7} />
          </G>

          {/* 2. Dynamic Liquid Fill clipped inside the human figure */}
          <G clipPath="url(#humanFigureClip)">
            {/* The liquid volume rising from bottom up */}
            <Path d={waveD} fill="url(#liquidGrad)" />
            {/* Soft wave surface highlight */}
            <Path
              d={`M 0 ${liquidY} Q 30 ${liquidY - 3}, 60 ${liquidY} T 120 ${liquidY} L 120 ${liquidY + 4} L 0 ${liquidY + 4} Z`}
              fill="#FFFFFF"
              opacity={0.35}
            />
          </G>

          {/* 3. Clean Silhouette Outline stroke */}
          <G fill="none" stroke={theme.borderColor} strokeWidth={1.8} opacity={0.65}>
            <Circle cx={60} cy={22} r={16} />
            <Rect x={44} y={44} width={32} height={70} rx={10} />
            <Rect x={22} y={48} width={14} height={66} rx={7} />
            <Rect x={84} y={48} width={14} height={66} rx={7} />
            <Rect x={44} y={106} width={14} height={82} rx={7} />
            <Rect x={62} y={106} width={14} height={82} rx={7} />
          </G>
        </Svg>
      </Animated.View>

      {/* Percentage Pill Badge */}
      {showPercentageBadge && (
        <View style={[styles.badge, { backgroundColor: theme.badgeBg, borderColor: theme.borderColor }]}>
          <Text style={[styles.badgeText, { color: theme.badgeText }]}>
            {clampedPct}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

