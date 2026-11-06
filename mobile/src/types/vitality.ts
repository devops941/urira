export type VitalityTier = 'PEAK' | 'ACTIVE' | 'LOW_ENERGY' | 'RECHARGE';

export interface VitalityBoostAction {
  id: string;
  actionType: 'WATER' | 'FOOD' | 'WALK' | 'SLEEP' | 'VITALS';
  label: string;
  sublabel: string;
  vitalityBoost: number;
  targetRoute: string;
}

export interface DailyVitalityScore {
  score: number; // 0 to 100
  tier: VitalityTier;
  tierLabel: string;
  statusHeading: string;
  statusMessage: string;
  biologicalSex: 'MALE' | 'FEMALE' | 'OTHER';
  dimensionScores: {
    steps: {
      current: number;
      target: number;
      percentage: number;
      weightedScore: number;
    };
    water: {
      currentMl: number;
      targetMl: number;
      percentage: number;
      weightedScore: number;
    };
    nutrition: {
      caloriesConsumed: number;
      calorieTarget: number;
      percentage: number;
      weightedScore: number;
    };
    sleep: {
      hours: number;
      targetHours: number;
      percentage: number;
      weightedScore: number;
    };
    vitals: {
      status: 'NORMAL' | 'WARNING' | 'UNRECORDED';
      weightedScore: number;
    };
  };
  suggestedBoostActions: VitalityBoostAction[];
}

