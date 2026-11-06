import { healthProfileRepository } from './health-profile.repository.js';
import { IHealthProfile } from './health-profile.model.js';
import { UserModel } from '../users/user.model.js';
import { WaterGoal } from '../water/water.model.js';
import { uploadAvatarToCloudinary } from '../../utils/cloudinary.js';

export interface HealthProfileDto {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  age?: number;
  biologicalSex?: string;
  profilePhoto?: string;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  preferredUnit: string;
  activityLevel: string;
  healthGoal: string;
  preferredWaterIntakeMl: number;
  preferredStepGoal: number;
  preferredSleepGoalHours: number;
  preferredDailyCalorieGoal?: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  completionPercentage: number;
  isOnboardingCompleted: boolean;
  updatedAt: Date;
}

export class HealthProfileService {
  /**
   * Calculate exact age in completed years from Date of Birth
   */
  public calculateAge(dob?: Date | string | null): number | undefined {
    if (!dob) return undefined;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return undefined;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : undefined;
  }

  /**
   * Calculate profile completion percentage based on core health attributes (10% each)
   */
  public calculateCompletionPercentage(data: Partial<IHealthProfile>): number {
    const fieldsToCheck: Array<keyof IHealthProfile> = [
      'firstName',
      'dateOfBirth',
      'biologicalSex',
      'profilePhoto',
      'heightCm',
      'weightKg',
      'targetWeightKg',
      'activityLevel',
      'healthGoal',
      'emergencyContactName',
    ];

    let completed = 0;
    for (const field of fieldsToCheck) {
      const val = data[field];
      if (val !== undefined && val !== null && val !== '') {
        completed++;
      }
    }

    // If user has successfully finalized onboarding with all required core health metrics,
    // ensure completion reaches 100% even if optional profile photo is added later.
    if (data.isOnboardingCompleted && completed >= 8) {
      return 100;
    }

    return Math.min(100, Math.round((completed / fieldsToCheck.length) * 100));
  }

  /**
   * Complete onboarding with all provided health data points
   */
  async completeOnboarding(
    userId: string,
    data: Partial<IHealthProfile>
  ): Promise<HealthProfileDto> {
    const existing = await healthProfileRepository.findByUserId(userId);
    const sanitizedData: any = { ...data };

    // Sanitize dateOfBirth
    if (sanitizedData.dateOfBirth) {
      const parsed = new Date(sanitizedData.dateOfBirth);
      if (isNaN(parsed.getTime())) {
        delete sanitizedData.dateOfBirth;
      } else {
        sanitizedData.dateOfBirth = parsed;
      }
    }

    // Sanitize heightCm (support feet auto-conversion e.g. 5.8 -> 177cm)
    if (sanitizedData.heightCm !== undefined && sanitizedData.heightCm !== null) {
      const h = typeof sanitizedData.heightCm === 'string' ? parseFloat(sanitizedData.heightCm) : sanitizedData.heightCm;
      if (!isNaN(h) && h > 0) {
        sanitizedData.heightCm = h <= 8 ? Math.round(h * 30.48) : Math.round(h);
        if (sanitizedData.heightCm < 30 || sanitizedData.heightCm > 300) {
          delete sanitizedData.heightCm;
        }
      } else {
        delete sanitizedData.heightCm;
      }
    }

    // Sanitize weightKg
    if (sanitizedData.weightKg !== undefined && sanitizedData.weightKg !== null) {
      const w = typeof sanitizedData.weightKg === 'string' ? parseFloat(sanitizedData.weightKg) : sanitizedData.weightKg;
      if (!isNaN(w) && w >= 2 && w <= 500) {
        sanitizedData.weightKg = Math.round(w * 10) / 10;
      } else {
        delete sanitizedData.weightKg;
      }
    }

    // Sanitize targetWeightKg
    if (sanitizedData.targetWeightKg !== undefined && sanitizedData.targetWeightKg !== null) {
      const tw = typeof sanitizedData.targetWeightKg === 'string' ? parseFloat(sanitizedData.targetWeightKg) : sanitizedData.targetWeightKg;
      if (!isNaN(tw) && tw >= 2 && tw <= 500) {
        sanitizedData.targetWeightKg = Math.round(tw * 10) / 10;
      } else {
        delete sanitizedData.targetWeightKg;
      }
    }

    // Sanitize biologicalSex
    if (sanitizedData.biologicalSex && !['MALE', 'FEMALE', 'OTHER'].includes(sanitizedData.biologicalSex)) {
      delete sanitizedData.biologicalSex;
    }

    // Sanitize activityLevel
    const validActivities = ['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'];
    if (sanitizedData.activityLevel && !validActivities.includes(sanitizedData.activityLevel)) {
      sanitizedData.activityLevel = 'MODERATELY_ACTIVE';
    }

    // Sanitize healthGoal
    const validGoals = ['MAINTAIN_WEIGHT', 'LOSE_WEIGHT', 'GAIN_WEIGHT', 'GENERAL_WELLNESS'];
    if (sanitizedData.healthGoal && !validGoals.includes(sanitizedData.healthGoal)) {
      sanitizedData.healthGoal = 'GENERAL_WELLNESS';
    }

    // Clamp goals to schema limits
    if (sanitizedData.preferredWaterIntakeMl !== undefined) {
      const ml = Number(sanitizedData.preferredWaterIntakeMl);
      sanitizedData.preferredWaterIntakeMl = isNaN(ml) ? 2500 : Math.max(500, Math.min(10000, ml));
    }
    if (sanitizedData.preferredStepGoal !== undefined) {
      const steps = Number(sanitizedData.preferredStepGoal);
      sanitizedData.preferredStepGoal = isNaN(steps) ? 8000 : Math.max(1000, Math.min(100000, steps));
    }
    if (sanitizedData.preferredSleepGoalHours !== undefined) {
      const sleep = Number(sanitizedData.preferredSleepGoalHours);
      sanitizedData.preferredSleepGoalHours = isNaN(sleep) ? 8 : Math.max(4, Math.min(16, sleep));
    }

    // Clean undefined/null entries
    Object.keys(sanitizedData).forEach((key) => {
      if (sanitizedData[key] === undefined || sanitizedData[key] === null) {
        delete sanitizedData[key];
      }
    });

    const merged = { ...(existing?.toObject() || {}), ...sanitizedData, isOnboardingCompleted: true };
    const completionPercentage = this.calculateCompletionPercentage(merged);

    const updated = await healthProfileRepository.upsertByUserId(userId, {
      ...sanitizedData,
      isOnboardingCompleted: true,
      completionPercentage,
    });

    // Auto-record initial baseline BMI if physical baseline measurements were provided
    if (sanitizedData.heightCm && sanitizedData.weightKg) {
      try {
        const { BMIRecordModel } = await import('../bmi/bmi.model.js');
        const existingBmi = await BMIRecordModel.findOne({ userId });
        if (!existingBmi) {
          const { bmiService } = await import('../bmi/bmi.service.js');
          await bmiService.calculateAndSave(userId, {
            heightCm: sanitizedData.heightCm,
            weightKg: sanitizedData.weightKg,
            userAge: this.calculateAge(sanitizedData.dateOfBirth || existing?.dateOfBirth),
            notes: 'Baseline measurement logged during initial onboarding.',
          });
        }
      } catch {
        // Non-blocking
      }
    }

    return this.toDto(updated);
  }

  /**
   * Skip onboarding wizard and proceed with current defaults
   */
  async skipOnboarding(userId: string): Promise<HealthProfileDto> {
    const updated = await healthProfileRepository.upsertByUserId(userId, {
      isOnboardingCompleted: true,
    });
    return this.toDto(updated);
  }

  /**
   * Get health profile for the authenticated user, auto-initializing if new
   */
  async getProfile(userId: string): Promise<HealthProfileDto> {
    let profile = await healthProfileRepository.findByUserId(userId);

    if (!profile) {
      // Seed with user's registered name
      const user = await UserModel.findById(userId).select('fullName email');
      const nameParts = (user?.fullName || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      profile = await healthProfileRepository.create({
        userId: userId as any,
        firstName,
        lastName,
        preferredUnit: 'METRIC',
        preferredWaterIntakeMl: 2500,
        preferredStepGoal: 8000,
        preferredSleepGoalHours: 8,
        completionPercentage: firstName ? 10 : 0,
        isOnboardingCompleted: false,
      });
    } else {
      let needsSave = false;
      if (!profile.preferredDailyCalorieGoal) {
        profile.preferredDailyCalorieGoal = this.calculateDynamicCalorieTarget(profile.toObject());
        needsSave = true;
      }
      if (needsSave) {
        await profile.save().catch(() => {});
      }

      // Synchronize hydration goal with WaterGoal collection
      if (profile.preferredWaterIntakeMl && profile.preferredWaterIntakeMl > 0) {
        await WaterGoal.findOneAndUpdate(
          { userId },
          { targetMl: profile.preferredWaterIntakeMl },
          { upsert: true }
        ).catch(() => {});
      }
    }

    return this.toDto(profile);
  }

  calculateDynamicCalorieTarget(profile: Partial<IHealthProfile>): number {
    const weightKg = profile.weightKg || 70;
    const heightCm = profile.heightCm || 170;
    const dob = profile.dateOfBirth;
    const age = (dob ? this.calculateAge(dob) : 25) ?? 25;
    const isFemale = profile.biologicalSex === 'FEMALE';

    // Mifflin-St Jeor BMR calculation
    let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (isFemale ? -161 : 5);

    // Activity multiplier
    let factor = 1.2;
    const act = (profile.activityLevel || 'SEDENTARY').toUpperCase();
    if (act.includes('EXTRA') || act.includes('VERY')) factor = 1.725;
    else if (act.includes('MODERATE')) factor = 1.55;
    else if (act.includes('LIGHT')) factor = 1.375;
    else factor = 1.2;

    let tdee = Math.round(bmr * factor);

    // Goal adjustment
    const goal = (profile.healthGoal || 'MAINTAIN_WEIGHT').toUpperCase();
    if (goal.includes('LOSE')) {
      tdee = Math.round(tdee - 450); // Caloric deficit
    } else if (goal.includes('GAIN')) {
      tdee = Math.round(tdee + 400); // Caloric surplus
    }

    return Math.max(1200, Math.min(4500, tdee));
  }

  /**
   * Update health profile for the authenticated user only
   */
  async updateProfile(
    userId: string,
    updateData: Partial<IHealthProfile>
  ): Promise<HealthProfileDto> {
    const existing = await healthProfileRepository.findByUserId(userId);
    const sanitizedData = { ...updateData };
    if (sanitizedData.dateOfBirth) {
      const parsed = new Date(sanitizedData.dateOfBirth);
      if (isNaN(parsed.getTime())) {
        delete sanitizedData.dateOfBirth;
      } else {
        sanitizedData.dateOfBirth = parsed;
      }
    }

    const merged = { ...(existing?.toObject() || {}), ...sanitizedData };
    const completionPercentage = this.calculateCompletionPercentage(merged);

    // Calculate dynamic calorie target based on user's biometric parameters
    const preferredDailyCalorieGoal =
      sanitizedData.preferredDailyCalorieGoal ||
      this.calculateDynamicCalorieTarget(merged);

    // Synchronize hydration goal directly with water service repository
    if (sanitizedData.preferredWaterIntakeMl && sanitizedData.preferredWaterIntakeMl > 0) {
      try {
        await WaterGoal.findOneAndUpdate(
          { userId },
          { targetMl: sanitizedData.preferredWaterIntakeMl },
          { upsert: true }
        );
      } catch {
        // Non-blocking
      }
    }

    const updated = await healthProfileRepository.upsertByUserId(userId, {
      ...sanitizedData,
      preferredDailyCalorieGoal,
      completionPercentage,
    });

    return this.toDto(updated);
  }

  /**
   * Upload user avatar to Cloudinary and update profilePhoto in database
   */
  async uploadAvatar(userId: string, buffer: Buffer): Promise<HealthProfileDto> {
    const uploadResult = await uploadAvatarToCloudinary(buffer, userId);
    const profilePhoto = uploadResult.secure_url;

    const existing = await healthProfileRepository.findByUserId(userId);
    const merged = { ...(existing?.toObject() || {}), profilePhoto };
    const completionPercentage = this.calculateCompletionPercentage(merged);

    const updated = await healthProfileRepository.upsertByUserId(userId, {
      profilePhoto,
      completionPercentage,
    });

    try {
      await UserModel.findByIdAndUpdate(userId, { profilePhoto });
    } catch {
      // Non-blocking
    }

    return this.toDto(updated);
  }

  private toDto(doc: IHealthProfile): HealthProfileDto {
    const dob = doc.dateOfBirth;
    const age = this.calculateAge(dob);
    const fullName = `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || 'Health Champion';

    const rawDoc = typeof (doc as any).toObject === 'function' ? (doc as any).toObject() : doc;
    const completionPercentage = this.calculateCompletionPercentage(rawDoc);

    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      firstName: doc.firstName || '',
      lastName: doc.lastName || '',
      fullName,
      dateOfBirth: dob ? new Date(dob).toISOString().split('T')[0] : undefined,
      age,
      biologicalSex: doc.biologicalSex,
      profilePhoto: doc.profilePhoto,
      heightCm: doc.heightCm,
      weightKg: doc.weightKg,
      targetWeightKg: doc.targetWeightKg,
      preferredUnit: doc.preferredUnit || 'METRIC',
      activityLevel: doc.activityLevel || 'SEDENTARY',
      healthGoal: doc.healthGoal || 'GENERAL_WELLNESS',
      preferredWaterIntakeMl: doc.preferredWaterIntakeMl || 2500,
      preferredStepGoal: doc.preferredStepGoal || 8000,
      preferredSleepGoalHours: doc.preferredSleepGoalHours || 8,
      preferredDailyCalorieGoal:
        doc.preferredDailyCalorieGoal || this.calculateDynamicCalorieTarget(rawDoc),
      emergencyContactName: doc.emergencyContactName,
      emergencyContactPhone: doc.emergencyContactPhone,
      medicalNotes: doc.medicalNotes,
      completionPercentage,
      isOnboardingCompleted: !!doc.isOnboardingCompleted,
      updatedAt: doc.updatedAt,
    };
  }
}

export const healthProfileService = new HealthProfileService();

