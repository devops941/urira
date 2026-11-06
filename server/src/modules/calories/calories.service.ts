import { calorieRepository } from './calories.repository.js';
import { ICalorieRecord, CalorieActivityLevel, CalorieGoalType } from './calories.model.js';
import { healthProfileRepository } from '../health-profile/health-profile.repository.js';

export interface EstimateCaloriesDto {
  age?: number;
  biologicalSex?: 'MALE' | 'FEMALE';
  heightCm?: number;
  weightKg?: number;
  activityLevel: CalorieActivityLevel;
  goal: CalorieGoalType;
  notes?: string;
}

export interface CalorieResultDto {
  id: string;
  userId: string;
  age: number;
  biologicalSex: 'MALE' | 'FEMALE';
  heightCm: number;
  weightKg: number;
  activityLevel: CalorieActivityLevel;
  goal: CalorieGoalType;
  bmr: number;
  tdee: number;
  estimatedDailyCalories: number;
  adjustmentKcal: number;
  isPediatricOrSpecial: boolean;
  notes?: string;
  disclaimer: string;
  calculatedAt: Date;
}

export class CalorieService {
  private getActivityFactor(level: CalorieActivityLevel): number {
    switch (level) {
      case 'SEDENTARY':
        return 1.2;
      case 'LIGHTLY_ACTIVE':
        return 1.375;
      case 'MODERATELY_ACTIVE':
        return 1.55;
      case 'VERY_ACTIVE':
        return 1.725;
      case 'EXTRA_ACTIVE':
        return 1.9;
      default:
        return 1.2;
    }
  }

  private getDisclaimer(isPediatricOrSpecial: boolean): string {
    if (isPediatricOrSpecial) {
      return 'Pediatric / Special Advisory: Energy expenditure for individuals under 18, pregnant, or nursing requires specialized pediatric or obstetric evaluation rather than standard adult predictive equations.';
    }
    return 'Informational Guidance: Calorie targets are scientific estimates calculated via the Mifflin-St Jeor equation. Adjust based on your personal metabolic response and clinical guidance.';
  }

  async estimateAndSave(userId: string, input: EstimateCaloriesDto): Promise<CalorieResultDto> {
    const profile = await healthProfileRepository.findByUserId(userId);

    const age = input.age || (profile?.dateOfBirth ? this.calculateAge(profile.dateOfBirth) : 25) || 25;
    const biologicalSex = input.biologicalSex || (profile?.biologicalSex === 'FEMALE' ? 'FEMALE' : 'MALE');
    const heightCm = input.heightCm || profile?.heightCm;
    const weightKg = input.weightKg || profile?.weightKg;

    if (!heightCm || heightCm <= 0) {
      throw new Error('Valid height in centimeters is required.');
    }
    if (!weightKg || weightKg <= 0) {
      throw new Error('Valid weight in kilograms is required.');
    }

    // Mifflin-St Jeor formula
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
    if (biologicalSex === 'MALE') {
      bmr += 5;
    } else {
      bmr -= 161;
    }
    bmr = Math.round(bmr);

    // TDEE calculation
    const factor = this.getActivityFactor(input.activityLevel);
    const tdee = Math.round(bmr * factor);

    // Goal adjustments (conservative)
    let adjustmentKcal = 0;
    let estimatedDailyCalories = tdee;

    if (input.goal === 'LOSE_WEIGHT') {
      adjustmentKcal = -400;
      estimatedDailyCalories = Math.max(1200, tdee - 400);
    } else if (input.goal === 'GAIN_WEIGHT') {
      adjustmentKcal = 350;
      estimatedDailyCalories = tdee + 350;
    }

    const isPediatricOrSpecial = age < 18;

    const record = await calorieRepository.create({
      userId: userId as any,
      age,
      biologicalSex,
      heightCm,
      weightKg,
      activityLevel: input.activityLevel,
      goal: input.goal,
      bmr,
      tdee,
      estimatedDailyCalories,
      adjustmentKcal,
      isPediatricOrSpecial,
      notes: input.notes,
      calculatedAt: new Date(),
    });

    // Sync preferredDailyCalorieGoal to Health Profile
    try {
      await healthProfileRepository.upsertByUserId(userId, {
        preferredDailyCalorieGoal: estimatedDailyCalories,
        activityLevel: input.activityLevel,
      });
    } catch {
      // Non-blocking sync
    }

    return this.toDto(record);
  }

  async getHistory(userId: string, limit: number = 50): Promise<CalorieResultDto[]> {
    const records = await calorieRepository.findByUserId(userId, limit);
    return records.map((r) => this.toDto(r));
  }

  async getById(id: string, userId: string): Promise<CalorieResultDto | null> {
    const record = await calorieRepository.findByIdAndUserId(id, userId);
    return record ? this.toDto(record) : null;
  }

  async deleteById(id: string, userId: string): Promise<boolean> {
    const deleted = await calorieRepository.deleteByIdAndUserId(id, userId);
    return !!deleted;
  }

  async getLatest(userId: string): Promise<CalorieResultDto | null> {
    const record = await calorieRepository.findLatestByUserId(userId);
    return record ? this.toDto(record) : null;
  }

  private calculateAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  private toDto(record: ICalorieRecord): CalorieResultDto {
    return {
      id: record._id.toString(),
      userId: record.userId.toString(),
      age: record.age,
      biologicalSex: record.biologicalSex,
      heightCm: record.heightCm,
      weightKg: record.weightKg,
      activityLevel: record.activityLevel,
      goal: record.goal,
      bmr: record.bmr,
      tdee: record.tdee,
      estimatedDailyCalories: record.estimatedDailyCalories,
      adjustmentKcal: record.adjustmentKcal,
      isPediatricOrSpecial: record.isPediatricOrSpecial,
      notes: record.notes,
      disclaimer: this.getDisclaimer(record.isPediatricOrSpecial),
      calculatedAt: record.calculatedAt,
    };
  }
}

export const calorieService = new CalorieService();

