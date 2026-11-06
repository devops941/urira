import { Types } from 'mongoose';
import { HealthProfileModel } from '../health-profile/health-profile.model.js';
import { BMIRecordModel } from '../bmi/bmi.model.js';
import { NutritionSummary } from '../nutrition/nutrition.model.js';
import { WaterLog } from '../water/water.model.js';
import { SleepRecord } from '../sleep/sleep.model.js';
import { ActivityRecord } from '../activity/activity.model.js';
import { VitalRecord } from '../vitals/vital.model.js';
import { Medication } from '../medications/medication.model.js';

export interface RetrievedUserContext {
  formattedContext: string;
  contextSources: string[];
}

export class HealthContextService {
  /**
   * Selectively retrieve only the minimum authorized context relevant to the user's query
   */
  async getSelectiveContext(
    userId: string,
    prompt: string,
    topics: string[]
  ): Promise<RetrievedUserContext> {
    const contextLines: string[] = [];
    const sources: string[] = [];
    const lower = prompt.toLowerCase();
    const joinedTopics = topics.join(' ').toLowerCase();

    const needsProfileOrBmi =
      /bmi|weight|height|progress|overweight|underweight|body|profile|my health|champ/i.test(
        lower + ' ' + joinedTopics
      );

    const needsNutrition =
      /food|nutrition|diet|calor|protein|carb|fat|eat|breakfast|lunch|dinner|meal/i.test(
        lower + ' ' + joinedTopics
      );

    const needsHydration =
      /water|drink|hydration|fluid|thirst/i.test(lower + ' ' + joinedTopics);

    const needsSleep =
      /sleep|tired|fatigue|insomnia|wake|rest/i.test(lower + ' ' + joinedTopics);

    const needsActivity =
      /step|walk|activity|exercise|gym|workout|stamina|active/i.test(
        lower + ' ' + joinedTopics
      );

    const needsVitals =
      /vital|blood pressure|bp|heart rate|pulse|bpm|spo2|oxygen/i.test(
        lower + ' ' + joinedTopics
      );

    const needsMeds =
      /medication|medicine|pill|tablet|dose|schedule/i.test(lower + ' ' + joinedTopics);

    const userObjId = new Types.ObjectId(userId);
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Profile & BMI
    if (needsProfileOrBmi) {
      try {
        const profile = await HealthProfileModel.findOne({ userId: userObjId }).lean();
        const latestBmi = await BMIRecordModel.findOne({ userId: userObjId })
          .sort({ createdAt: -1 })
          .lean();

        if (profile) {
          sources.push('health_profile');
          const details: string[] = [];
          if (profile.firstName) details.push(`Name: ${profile.firstName}`);
          if (profile.biologicalSex) details.push(`Sex: ${profile.biologicalSex}`);
          if (profile.heightCm) details.push(`Height: ${profile.heightCm} cm`);
          if (profile.weightKg) details.push(`Current Weight: ${profile.weightKg} kg`);
          if (profile.targetWeightKg) details.push(`Target Weight: ${profile.targetWeightKg} kg`);
          if (profile.activityLevel) details.push(`Activity Level: ${profile.activityLevel}`);
          if (profile.healthGoal) details.push(`Primary Goal: ${profile.healthGoal}`);

          if (details.length > 0) {
            contextLines.push(`[Profile Demographics]: ${details.join(' | ')}`);
          }
        }

        if (latestBmi) {
          sources.push('bmi_records');
          contextLines.push(
            `[Latest BMI]: ${latestBmi.bmiValue} (${latestBmi.category}) recorded on ${new Date(
              latestBmi.createdAt
            ).toLocaleDateString()}`
          );
        }
      } catch {
        // Non-blocking
      }
    }

    // 2. Nutrition & Calories
    if (needsNutrition) {
      try {
        const nutSummary = await NutritionSummary.findOne({
          userId: userObjId,
          date: todayStr,
        }).lean();

        if (nutSummary) {
          sources.push('nutrition_logs');
          contextLines.push(
            `[Today's Nutrition (${todayStr})]: Consumed: ${Math.round(
              nutSummary.consumedCalories
            )} kcal (Target: ${nutSummary.calorieTarget || 2000} kcal) | Protein: ${Math.round(
              nutSummary.protein
            )}g | Carbs: ${Math.round(nutSummary.carbohydrates)}g | Fat: ${Math.round(
              nutSummary.fat
            )}g`
          );
        }
      } catch {
        // Non-blocking
      }
    }

    // 3. Hydration
    if (needsHydration) {
      try {
        const waterLogs = await WaterLog.find({
          userId: userObjId,
          dateString: todayStr,
        }).lean();

        if (waterLogs.length > 0) {
          sources.push('water_logs');
          const totalConsumed = waterLogs.reduce((sum, w) => sum + (w.quantityMl || 0), 0);
          contextLines.push(
            `[Today's Water Intake (${todayStr})]: Total Consumed: ${totalConsumed} ml across ${waterLogs.length} logged drinks`
          );
        }
      } catch {
        // Non-blocking
      }
    }

    // 4. Sleep
    if (needsSleep) {
      try {
        const recentSleep = await SleepRecord.findOne({ userId: userObjId })
          .sort({ dateString: -1 })
          .lean();

        if (recentSleep) {
          sources.push('sleep_records');
          const hours = (recentSleep.durationMinutes / 60).toFixed(1);
          contextLines.push(
            `[Recent Sleep (${recentSleep.dateString})]: Duration: ${hours} hours (${recentSleep.durationMinutes} mins) | Quality: ${recentSleep.sleepQuality}`
          );
        }
      } catch {
        // Non-blocking
      }
    }

    // 5. Activity
    if (needsActivity) {
      try {
        const activity = await ActivityRecord.findOne({
          userId: userObjId,
          dateString: todayStr,
        }).lean();

        if (activity) {
          sources.push('activity_records');
          contextLines.push(
            `[Today's Activity (${todayStr})]: Steps: ${activity.steps} | Distance: ${activity.distanceKm} km | Calories Burned: ${activity.estimatedCalories} kcal | Active Minutes: ${activity.activeDurationMinutes} mins`
          );
        }
      } catch {
        // Non-blocking
      }
    }

    // 6. Vitals
    if (needsVitals) {
      try {
        const vitals = await VitalRecord.find({ userId: userObjId })
          .sort({ measuredAt: -1 })
          .limit(3)
          .lean();

        if (vitals.length > 0) {
          sources.push('vital_records');
          const vitalSnippets = vitals.map((v) => {
            if (v.metricType === 'BLOOD_PRESSURE') {
              return `Blood Pressure: ${v.systolic}/${v.diastolic} ${v.unit}`;
            }
            return `${v.metricType}: ${v.value} ${v.unit}`;
          });
          contextLines.push(`[Recent Vitals]: ${vitalSnippets.join(' | ')}`);
        }
      } catch {
        // Non-blocking
      }
    }

    // 7. Medications
    if (needsMeds) {
      try {
        const meds = await Medication.find({
          userId: userObjId,
          isActive: true,
        })
          .limit(5)
          .lean();

        if (meds.length > 0) {
          sources.push('medication_schedule');
          const medList = meds.map((m) => `${m.name} (${m.strength || m.type}, ${m.frequency})`);
          contextLines.push(`[Active Medication Schedule]: ${medList.join(' | ')}`);
        }
      } catch {
        // Non-blocking
      }
    }

    return {
      formattedContext:
        contextLines.length > 0
          ? `AUTHENTICATED USER HEALTH DATA (Source: Verified UYIRA Records):\n${contextLines.join(
              '\n'
            )}`
          : 'NO SPECIFIC LOGGED RECORDS FOUND FOR THIS CATEGORY. (Inform user gently that they can record this in the relevant module if they wish to track it).',
      contextSources: sources,
    };
  }
}

export const healthContextService = new HealthContextService();
