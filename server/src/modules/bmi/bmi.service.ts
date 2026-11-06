import { bmiRepository } from './bmi.repository.js';
import { BmiCategory, IBMIRecord } from './bmi.model.js';
import { healthProfileRepository } from '../health-profile/health-profile.repository.js';
import { healthProfileService } from '../health-profile/health-profile.service.js';

export interface CalculateBmiDto {
  heightCm?: number;
  weightKg?: number;
  // Optional imperial inputs
  heightFeet?: number;
  heightInches?: number;
  weightLbs?: number;
  unitSystem?: 'METRIC' | 'IMPERIAL';
  userAge?: number;
  notes?: string;
}

export interface BmiResultDto {
  id: string;
  userId: string;
  heightCm: number;
  weightKg: number;
  bmiValue: number;
  category: BmiCategory;
  categoryColor: string;
  isPediatric: boolean;
  userAge?: number;
  unitSystem: 'METRIC' | 'IMPERIAL';
  notes?: string;
  disclaimer: string;
  calculatedAt: Date;
}

export class BMIService {
  public classifyCategory(bmi: number): { category: BmiCategory; color: string } {
    if (bmi < 18.5) {
      return { category: 'Underweight', color: '#0EA5E9' };
    }
    if (bmi <= 24.9) {
      return { category: 'Healthy Weight', color: '#16A34A' };
    }
    if (bmi <= 29.9) {
      return { category: 'Overweight', color: '#F59E0B' };
    }
    return { category: 'Obesity', color: '#DC2626' };
  }

  public getDisclaimer(isPediatric: boolean): string {
    if (isPediatric) {
      return 'Pediatric Notice: Standard adult BMI cutoffs do not apply to individuals under 20. CDC/WHO age-and-sex specific growth percentiles should be evaluated by a pediatrician.';
    }
    return 'Informational Guidance: BMI is a screening metric and does not directly measure body fat or diagnose cardiovascular/metabolic health. Consult a medical professional for clinical evaluations.';
  }

  /**
   * Calculate and persist BMI record
   */
  async calculateAndSave(userId: string, input: CalculateBmiDto): Promise<BmiResultDto> {
    let heightCm = input.heightCm;
    let weightKg = input.weightKg;
    const unitSystem = input.unitSystem || 'METRIC';

    // Convert imperial to metric if needed
    if (unitSystem === 'IMPERIAL') {
      const feet = input.heightFeet || 0;
      const inches = input.heightInches || 0;
      const totalInches = feet * 12 + inches;
      if (totalInches > 0) {
        heightCm = Math.round(totalInches * 2.54 * 10) / 10;
      }
      if (input.weightLbs && input.weightLbs > 0) {
        weightKg = Math.round((input.weightLbs / 2.20462) * 10) / 10;
      }
    }

    if (!heightCm || heightCm <= 0) {
      throw new Error('Valid height is required and must be greater than zero.');
    }
    if (!weightKg || weightKg <= 0) {
      throw new Error('Valid weight is required and must be greater than zero.');
    }

    // Standard metric BMI formula
    const heightM = heightCm / 100;
    const rawBmi = weightKg / (heightM * heightM);
    const bmiValue = Math.round(rawBmi * 100) / 100;

    // Detect user age from profile if not explicitly passed
    let userAge = input.userAge;
    if (userAge === undefined) {
      const profile = await healthProfileRepository.findByUserId(userId);
      if (profile?.dateOfBirth) {
        userAge = healthProfileService.calculateAge(profile.dateOfBirth);
      }
    }

    const isPediatric = userAge !== undefined && userAge < 20;
    const { category, color } = this.classifyCategory(bmiValue);

    const record = await bmiRepository.create({
      userId: userId as any,
      heightCm,
      weightKg,
      bmiValue,
      category,
      categoryColor: color,
      isPediatric,
      userAge,
      unitSystem,
      notes: input.notes,
      calculatedAt: new Date(),
    });

    // Auto-sync physical stats into user's Health Profile
    try {
      await healthProfileRepository.upsertByUserId(userId, {
        heightCm,
        weightKg,
        preferredUnit: unitSystem,
      });
    } catch {
      // Non-blocking sync
    }

    return this.toDto(record);
  }

  async getHistory(userId: string, limit: number = 50): Promise<BmiResultDto[]> {
    const records = await bmiRepository.findByUserId(userId, limit);
    return records.map((r) => this.toDto(r));
  }

  async getById(id: string, userId: string): Promise<BmiResultDto | null> {
    const record = await bmiRepository.findByIdAndUserId(id, userId);
    return record ? this.toDto(record) : null;
  }

  async deleteById(id: string, userId: string): Promise<boolean> {
    const deleted = await bmiRepository.deleteByIdAndUserId(id, userId);
    return !!deleted;
  }

  async getLatest(userId: string): Promise<BmiResultDto | null> {
    const record = await bmiRepository.findLatestByUserId(userId);
    return record ? this.toDto(record) : null;
  }

  private toDto(record: IBMIRecord): BmiResultDto {
    return {
      id: record._id.toString(),
      userId: record.userId.toString(),
      heightCm: record.heightCm,
      weightKg: record.weightKg,
      bmiValue: record.bmiValue,
      category: record.category,
      categoryColor: record.categoryColor,
      isPediatric: record.isPediatric,
      userAge: record.userAge,
      unitSystem: record.unitSystem,
      notes: record.notes,
      disclaimer: this.getDisclaimer(record.isPediatric),
      calculatedAt: record.calculatedAt,
    };
  }
}

export const bmiService = new BMIService();

