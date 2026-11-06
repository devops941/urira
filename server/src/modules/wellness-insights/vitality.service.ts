import { ActivityService } from '../activity/activity.service.js';
import { WaterService } from '../water/water.service.js';
import { SleepService } from '../sleep/sleep.service.js';
import { VitalService } from '../vitals/vital.service.js';
import { NutritionService } from '../nutrition/nutrition.service.js';
import { healthProfileRepository } from '../health-profile/health-profile.repository.js';

export type VitalityTier = 'PEAK' | 'ACTIVE' | 'LOW_ENERGY' | 'RECHARGE';

export interface DailyVitalityScoreDto {
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
  suggestedBoostActions: Array<{
    id: string;
    actionType: 'WATER' | 'FOOD' | 'WALK' | 'SLEEP' | 'VITALS';
    label: string;
    sublabel: string;
    vitalityBoost: number;
    targetRoute: string;
  }>;
}

export class VitalityService {
  private activityService: ActivityService;
  private waterService: WaterService;
  private sleepService: SleepService;
  private vitalService: VitalService;
  private nutritionService: NutritionService;

  constructor() {
    this.activityService = new ActivityService();
    this.waterService = new WaterService();
    this.sleepService = new SleepService();
    this.vitalService = new VitalService();
    this.nutritionService = new NutritionService();
  }

  async calculateDailyVitality(userId: string): Promise<DailyVitalityScoreDto> {
    const [profile, act, water, sleep, vitals, nutrition] = await Promise.all([
      healthProfileRepository.findByUserId(userId),
      this.activityService.getTodaySummary(userId).catch(() => ({ totalSteps: 0, stepGoal: 8000, progressPercentage: 0 })),
      this.waterService.getTodaySummary(userId).catch(() => ({ totalConsumedMl: 0, targetMl: 2500, progressPercentage: 0 } as any)),
      this.sleepService.getLatest(userId).catch(() => null),
      this.vitalService.getLatestSnapshot(userId).catch(() => null),
      this.nutritionService.getTodaySummary(userId).catch(() => ({ consumedCalories: 0, calorieTarget: 2000 } as any)),
    ]);

    const biologicalSex = (profile?.biologicalSex as any) || 'MALE';

    // 1. Steps Dimension (25% Weight)
    const stepTarget = profile?.preferredStepGoal || act.stepGoal || 8000;
    const currentSteps = act.totalSteps || 0;
    const stepsRatio = Math.min(1.0, currentSteps / Math.max(stepTarget, 1));
    const stepsScore = Math.round(stepsRatio * 25);
    const stepsPercentage = Math.round(stepsRatio * 100);

    // 2. Water Dimension (25% Weight)
    const waterTarget = profile?.preferredWaterIntakeMl || water.targetMl || 2500;
    const currentWater = (water as any).totalConsumedMl ?? (water as any).consumedMl ?? 0;
    const waterRatio = Math.min(1.0, currentWater / Math.max(waterTarget, 1));
    const waterScore = Math.round(waterRatio * 25);
    const waterPercentage = Math.round(waterRatio * 100);

    // 3. Nutrition Dimension (20% Weight)
    const calTarget = profile?.preferredDailyCalorieGoal || (nutrition as any).calorieTarget || (nutrition as any).targetCalories || 2000;
    const currentCals = nutrition.consumedCalories || 0;
    const calRatio = Math.min(1.0, currentCals / Math.max(calTarget, 1));
    const nutritionScore = Math.round(calRatio * 20);
    const nutritionPercentage = Math.round(calRatio * 100);

    // 4. Sleep Dimension (20% Weight)
    const sleepTargetHours = profile?.preferredSleepGoalHours || 8.0;
    const actualSleepHours = sleep?.durationHours || 0;
    const sleepRatio = Math.min(1.0, actualSleepHours / Math.max(sleepTargetHours, 1));
    const sleepScore = Math.round(sleepRatio * 20);
    const sleepPercentage = Math.round(sleepRatio * 100);

    // 5. Vitals Dimension (10% Weight)
    let vitalsStatus: 'NORMAL' | 'WARNING' | 'UNRECORDED' = 'UNRECORDED';
    let vitalsScore = 5; // Default unrecorded baseline
    if (vitals && vitals.heartRate?.value) {
      const hr = vitals.heartRate.value;
      if (hr >= 55 && hr <= 100) {
        vitalsStatus = 'NORMAL';
        vitalsScore = 10;
      } else {
        vitalsStatus = 'WARNING';
        vitalsScore = 6;
      }
    }

    // Total Composite Score
    const totalScore = Math.min(100, Math.max(0, stepsScore + waterScore + nutritionScore + sleepScore + vitalsScore));

    // Determine Tier & Status
    let tier: VitalityTier = 'RECHARGE';
    let tierLabel = 'Rest & Recharge';
    let statusHeading = 'Power Up Your Morning';
    let statusMessage = 'Start logging your water, breakfast, and steps to awaken your Vitality Avatar.';

    if (totalScore >= 80) {
      tier = 'PEAK';
      tierLabel = 'Peak Vitality';
      statusHeading = 'Peak Vitality — You’re Crushing Today!';
      statusMessage = 'Your body is fully energized with optimal hydration, movement, and nutrition balance.';
    } else if (totalScore >= 50) {
      tier = 'ACTIVE';
      tierLabel = 'Active Momentum';
      statusHeading = 'Great Momentum — Vitality Rising!';
      statusMessage = 'You are making steady progress today. A little more water or a short walk will push you into Peak Vitality!';
    } else if (totalScore >= 30) {
      tier = 'LOW_ENERGY';
      tierLabel = 'Low Energy Detected';
      statusHeading = 'Your Body Needs Vital Fuel';
      statusMessage = `${waterPercentage < 50 ? 'Dehydration detected. ' : ''}${nutritionPercentage < 50 ? 'Calories are low. ' : ''}Rehydrate and fuel up to restore your avatar's strength.`;
    }

    // Suggested Instant Vitality Boost Actions
    const suggestedBoostActions: DailyVitalityScoreDto['suggestedBoostActions'] = [];

    if (waterPercentage < 80) {
      suggestedBoostActions.push({
        id: 'boost_water_500',
        actionType: 'WATER',
        label: '+500ml Water',
        sublabel: '+12% Vitality boost',
        vitalityBoost: 12,
        targetRoute: '/(protected)/water',
      });
    }

    if (nutritionPercentage < 70) {
      suggestedBoostActions.push({
        id: 'boost_food_log',
        actionType: 'FOOD',
        label: 'Log Meal',
        sublabel: '+15% Energy boost',
        vitalityBoost: 15,
        targetRoute: '/(protected)/nutrition/log',
      });
    }

    if (stepsPercentage < 70) {
      suggestedBoostActions.push({
        id: 'boost_walk',
        actionType: 'WALK',
        label: 'Quick Walk',
        sublabel: '+10% Movement boost',
        vitalityBoost: 10,
        targetRoute: '/(protected)/activity',
      });
    }

    if (vitalsStatus === 'UNRECORDED') {
      suggestedBoostActions.push({
        id: 'boost_vitals',
        actionType: 'VITALS',
        label: 'Check Pulse',
        sublabel: '+5% Baseline boost',
        vitalityBoost: 5,
        targetRoute: '/(protected)/vitals',
      });
    }

    return {
      score: totalScore,
      tier,
      tierLabel,
      statusHeading,
      statusMessage,
      biologicalSex,
      dimensionScores: {
        steps: {
          current: currentSteps,
          target: stepTarget,
          percentage: stepsPercentage,
          weightedScore: stepsScore,
        },
        water: {
          currentMl: currentWater,
          targetMl: waterTarget,
          percentage: waterPercentage,
          weightedScore: waterScore,
        },
        nutrition: {
          caloriesConsumed: currentCals,
          calorieTarget: calTarget,
          percentage: nutritionPercentage,
          weightedScore: nutritionScore,
        },
        sleep: {
          hours: actualSleepHours,
          targetHours: sleepTargetHours,
          percentage: sleepPercentage,
          weightedScore: sleepScore,
        },
        vitals: {
          status: vitalsStatus,
          weightedScore: vitalsScore,
        },
      },
      suggestedBoostActions: suggestedBoostActions.slice(0, 2),
    };
  }
}

export const vitalityService = new VitalityService();
