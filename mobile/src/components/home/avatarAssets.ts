import { VitalityTier } from '../../types/vitality';

export interface AvatarVisualTheme {
  primaryColor: string;
  secondaryColor: string;
  accentBg: string;
  borderColor: string;
  badgeBg: string;
  badgeTextColor: string;
  pedestalGlow: string;
  tierTitle: string;
  tierBadgeText: string;
}

export const VITALITY_THEMES: Record<VitalityTier, AvatarVisualTheme> = {
  PEAK: {
    primaryColor: '#16A34A',
    secondaryColor: '#4ADE80',
    accentBg: '#F0FDF4',
    borderColor: '#BBF7D0',
    badgeBg: '#DCFCE7',
    badgeTextColor: '#15803D',
    pedestalGlow: '#22C55E',
    tierTitle: 'Peak Vitality — Unstoppable!',
    tierBadgeText: '🔥 80-100% Peak',
  },
  ACTIVE: {
    primaryColor: '#0EA5E9',
    secondaryColor: '#38BDF8',
    accentBg: '#F0F9FF',
    borderColor: '#BAE6FD',
    badgeBg: '#E0F2FE',
    badgeTextColor: '#0369A1',
    pedestalGlow: '#0284C7',
    tierTitle: 'Active Momentum — Rising!',
    tierBadgeText: '⚡ 50-79% Active',
  },
  LOW_ENERGY: {
    primaryColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    accentBg: '#FFFBEB',
    borderColor: '#FDE68A',
    badgeBg: '#FEF3C7',
    badgeTextColor: '#B45309',
    pedestalGlow: '#D97706',
    tierTitle: 'Low Energy — Needs Fuel & Water',
    tierBadgeText: '⚠️ 30-49% Low Energy',
  },
  RECHARGE: {
    primaryColor: '#8B5CF6',
    secondaryColor: '#A78BFA',
    accentBg: '#FAF5FF',
    borderColor: '#E9D5FF',
    badgeBg: '#F3E8FF',
    badgeTextColor: '#6B21A8',
    pedestalGlow: '#7C3AED',
    tierTitle: 'Rest & Recharge — Power Up',
    tierBadgeText: '🌙 <30% Recharge',
  },
};

export const getAvatarImageSource = (
  tier: VitalityTier,
  biologicalSex?: 'MALE' | 'FEMALE' | 'OTHER'
) => {
  const isFemale = biologicalSex === 'FEMALE';

  if (isFemale) {
    switch (tier) {
      case 'PEAK':
        return require('../../../assets/images/avatars/avatar_female_peak.png');
      case 'ACTIVE':
        return require('../../../assets/images/avatars/avatar_female_active.png');
      case 'LOW_ENERGY':
        return require('../../../assets/images/avatars/avatar_female_fatigued.png');
      case 'RECHARGE':
      default:
        return require('../../../assets/images/avatars/avatar_female_rest.png');
    }
  }

  // Male / Other default
  switch (tier) {
    case 'PEAK':
      return require('../../../assets/images/avatars/avatar_male_peak.png');
    case 'ACTIVE':
      return require('../../../assets/images/avatars/avatar_male_active.png');
    case 'LOW_ENERGY':
      return require('../../../assets/images/avatars/avatar_male_fatigued.png');
    case 'RECHARGE':
    default:
      return require('../../../assets/images/avatars/avatar_male_rest.png');
  }
};

