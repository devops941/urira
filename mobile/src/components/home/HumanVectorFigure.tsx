import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  G,
  Path,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { VitalityTier } from '../../types/vitality';

interface HumanVectorFigureProps {
  tier: VitalityTier;
  biologicalSex?: 'MALE' | 'FEMALE' | 'OTHER';
  size?: number;
}

export const HumanVectorFigure: React.FC<HumanVectorFigureProps> = ({
  tier,
  biologicalSex = 'MALE',
  size = 180,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Tier color mapping
  const tierColors = {
    PEAK: {
      primary: '#16A34A',
      secondary: '#4ADE80',
      aura: '#DCFCE7',
      pedestal: '#22C55E',
      torso: '#12372A',
    },
    ACTIVE: {
      primary: '#0EA5E9',
      secondary: '#38BDF8',
      aura: '#E0F2FE',
      pedestal: '#0284C7',
      torso: '#0369A1',
    },
    LOW_ENERGY: {
      primary: '#F59E0B',
      secondary: '#FBBF24',
      aura: '#FEF3C7',
      pedestal: '#D97706',
      torso: '#78350F',
    },
    RECHARGE: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      aura: '#EDE9FE',
      pedestal: '#7C3AED',
      torso: '#4C1D95',
    },
  }[tier];

  const isFemale = biologicalSex === 'FEMALE';
  const width = size;
  const height = size * 1.25;

  return (
    <View style={[styles.container, { width, height }]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
        <Svg width={width} height={height} viewBox="0 0 200 250">
          <Defs>
            {/* Background Glow */}
            <RadialGradient id="auraGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={tierColors.aura} stopOpacity="0.8" />
              <Stop offset="70%" stopColor={tierColors.aura} stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>

            {/* Pedestal Gradient */}
            <LinearGradient id="pedestalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={tierColors.secondary} stopOpacity="0.8" />
              <Stop offset="100%" stopColor={tierColors.pedestal} stopOpacity="0.2" />
            </LinearGradient>

            {/* Body Gradient */}
            <LinearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={tierColors.torso} />
              <Stop offset="100%" stopColor={tierColors.primary} />
            </LinearGradient>
          </Defs>

          {/* Ambient Aura Disc */}
          <Circle cx="100" cy="120" r="95" fill="url(#auraGlow)" />

          {/* Glowing Pedestal Rings beneath feet */}
          <Ellipse cx="100" cy="225" rx="65" ry="14" fill="none" stroke={tierColors.secondary} strokeWidth="3" strokeOpacity="0.6" strokeDasharray="6,4" />
          <Ellipse cx="100" cy="225" rx="50" ry="10" fill="url(#pedestalGrad)" />
          <Ellipse cx="100" cy="225" rx="32" ry="6" fill={tierColors.secondary} fillOpacity="0.4" />

          {/* Character Silhouette Group */}
          <G transform={tier === 'LOW_ENERGY' ? 'translate(0, 10)' : 'translate(0, 0)'}>
            {/* Head */}
            <Circle
              cx="100"
              cy={tier === 'LOW_ENERGY' ? '56' : '46'}
              r={isFemale ? '18' : '20'}
              fill="url(#bodyGrad)"
            />

            {/* Hair Accent */}
            {isFemale ? (
              <Path
                d="M 82 46 C 80 32, 120 32, 118 46 C 122 55, 120 68, 114 74 C 114 62, 110 50, 100 48 C 90 50, 86 62, 86 74 C 80 68, 78 55, 82 46 Z"
                fill={tierColors.torso}
                opacity="0.9"
              />
            ) : (
              <Path
                d="M 82 44 C 84 32, 116 32, 118 44 C 114 36, 86 36, 82 44 Z"
                fill={tierColors.torso}
                opacity="0.9"
              />
            )}

            {/* Neck */}
            <Path
              d={tier === 'LOW_ENERGY' ? 'M 95 72 L 105 72 L 103 82 L 97 82 Z' : 'M 96 64 L 104 64 L 103 76 L 97 76 Z'}
              fill={tierColors.primary}
            />

            {/* Torso */}
            {tier === 'LOW_ENERGY' ? (
              /* Slouched Torso */
              <Path
                d="M 84 82 C 78 96, 76 130, 82 148 L 118 148 C 124 130, 122 96, 116 82 Z"
                fill="url(#bodyGrad)"
              />
            ) : tier === 'ACTIVE' ? (
              /* Dynamic Walking Torso */
              <Path
                d="M 80 76 C 76 94, 76 128, 82 144 L 118 144 C 124 128, 124 94, 120 76 Z"
                fill="url(#bodyGrad)"
              />
            ) : (
              /* Upright Confident Torso (Peak / Recharge) */
              <Path
                d={
                  isFemale
                    ? 'M 84 76 C 80 92, 88 114, 82 142 L 118 142 C 112 114, 120 92, 116 76 Z'
                    : 'M 78 76 C 74 96, 76 124, 82 144 L 118 144 C 124 124, 126 96, 122 76 Z'
                }
                fill="url(#bodyGrad)"
              />
            )}

            {/* Left Arm */}
            {tier === 'LOW_ENERGY' ? (
              /* Hand on hip / tired */
              <Path
                d="M 84 84 C 70 96, 68 118, 80 128"
                stroke={tierColors.primary}
                strokeWidth={isFemale ? '9' : '11'}
                strokeLinecap="round"
                fill="none"
              />
            ) : tier === 'ACTIVE' ? (
              /* Swinging forward */
              <Path
                d="M 80 78 C 66 94, 60 114, 72 130"
                stroke={tierColors.primary}
                strokeWidth={isFemale ? '9' : '11'}
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              /* Confident relaxed */
              <Path
                d="M 78 78 C 68 100, 68 126, 72 148"
                stroke={tierColors.primary}
                strokeWidth={isFemale ? '9' : '11'}
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Right Arm */}
            {tier === 'LOW_ENERGY' ? (
              /* Hand down tired */
              <Path
                d="M 116 84 C 128 100, 128 126, 124 148"
                stroke={tierColors.primary}
                strokeWidth={isFemale ? '9' : '11'}
                strokeLinecap="round"
                fill="none"
              />
            ) : tier === 'ACTIVE' ? (
              /* Swinging backward */
              <Path
                d="M 120 78 C 132 96, 134 116, 126 136"
                stroke={tierColors.primary}
                strokeWidth={isFemale ? '9' : '11'}
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              /* Confident thumbs up / energetic */
              <Path
                d="M 122 78 C 132 100, 132 126, 128 148"
                stroke={tierColors.primary}
                strokeWidth={isFemale ? '9' : '11'}
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Left Leg */}
            {tier === 'ACTIVE' ? (
              /* Forward stride */
              <Path
                d="M 88 144 C 84 170, 76 195, 78 222"
                stroke={tierColors.torso}
                strokeWidth={isFemale ? '11' : '13'}
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              /* Standing straight */
              <Path
                d="M 88 144 C 86 170, 86 196, 88 222"
                stroke={tierColors.torso}
                strokeWidth={isFemale ? '11' : '13'}
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Right Leg */}
            {tier === 'ACTIVE' ? (
              /* Back stride */
              <Path
                d="M 112 144 C 116 170, 124 195, 122 222"
                stroke={tierColors.torso}
                strokeWidth={isFemale ? '11' : '13'}
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              /* Standing straight */
              <Path
                d="M 112 144 C 114 170, 114 196, 112 222"
                stroke={tierColors.torso}
                strokeWidth={isFemale ? '11' : '13'}
                strokeLinecap="round"
                fill="none"
              />
            )}

            {/* Core Biometric Heart / Vitality Node */}
            <Circle
              cx="100"
              cy={tier === 'LOW_ENERGY' ? '106' : '96'}
              r="7"
              fill={tierColors.secondary}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <Circle
              cx="100"
              cy={tier === 'LOW_ENERGY' ? '106' : '96'}
              r="12"
              fill="none"
              stroke={tierColors.secondary}
              strokeWidth="1.5"
              strokeOpacity="0.7"
              strokeDasharray="3,2"
            />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

