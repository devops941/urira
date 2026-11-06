import { z } from 'zod';
import { ActivityService } from '../activity/activity.service.js';
import { WaterService } from '../water/water.service.js';
import { SleepService } from '../sleep/sleep.service.js';
import { VitalService } from '../vitals/vital.service.js';
import { MedicationService } from '../medications/medication.service.js';
import { aiProviderService } from '../ai-recommendations/ai-provider.service.js';

const WellnessInsightSchema = z.object({
  summary: z.string(),
  observations: z.array(
    z.object({
      category: z.string(),
      message: z.string(),
    })
  ),
  suggestions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
    })
  ),
  disclaimer: z.string(),
});

export class WellnessInsightService {
  private activityService: ActivityService;
  private waterService: WaterService;
  private sleepService: SleepService;
  private vitalService: VitalService;
  private medicationService: MedicationService;

  constructor() {
    this.activityService = new ActivityService();
    this.waterService = new WaterService();
    this.sleepService = new SleepService();
    this.vitalService = new VitalService();
    this.medicationService = new MedicationService();
  }

  async generateInsights(userId: string) {
    const [act, water, sleep, vitals, meds] = await Promise.all([
      this.activityService.getTodaySummary(userId),
      this.waterService.getTodaySummary(userId),
      this.sleepService.getLatest(userId),
      this.vitalService.getLatestSnapshot(userId),
      this.medicationService.getTodaySchedule(userId),
    ]);

    const consumedWater = water.totalConsumedMl || water.totalWaterMl || 0;

    const systemPrompt = `You are a clinical preventive healthcare assistant for UYIRA.
Analyze the user's recorded wellness metrics and provide an encouraging, objective summary.
CRITICAL RULES:
1. Base all observations strictly on the supplied metrics.
2. Never invent fake readings or diagnose medical conditions.
3. Keep suggestions lifestyle-oriented (hydration, walking, sleep hygiene, medication regularity).
4. Return strictly valid JSON matching the schema.`;

    const userPrompt = `USER WELLNESS METRICS:
- Today Steps: ${act.totalSteps} / ${act.stepGoal} goal (${act.progressPercentage}%)
- Today Water: ${consumedWater} ml / ${water.targetMl} ml target
- Sleep: ${sleep.hasRecord ? `${sleep.durationHours} hours (Quality: ${sleep.latest?.sleepQuality})` : 'No recent sleep logged'}
- Medication Adherence: ${meds.totalScheduled > 0 ? `${meds.takenCount}/${meds.totalScheduled} taken (${meds.adherencePercentage}%)` : 'No scheduled medications'}
- Heart Rate: ${vitals.heartRate ? `${vitals.heartRate.value} bpm` : 'Not recorded'}
- Blood Pressure: ${vitals.bloodPressure ? `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg` : 'Not recorded'}

OUTPUT JSON FORMAT:
{
  "summary": "Brief 2-sentence holistic evaluation of today's health status",
  "observations": [
    { "category": "activity", "message": "Observed activity status" },
    { "category": "hydration", "message": "Observed hydration status" },
    { "category": "sleep", "message": "Observed sleep consistency" }
  ],
  "suggestions": [
    { "title": "Hydration Reminder", "description": "Specific suggestion", "category": "hydration" },
    { "title": "Movement Habit", "description": "Specific suggestion", "category": "activity" }
  ],
  "disclaimer": "General wellness information, not medical advice. Consult your healthcare provider for medical inquiries."
}`;

    const fallbackGenerator = () => {
      const observations = [];
      const suggestions = [];

      // Activity
      if (act.totalSteps >= act.stepGoal) {
        observations.push({
          category: 'activity',
          message: `Great job! You achieved your step target with ${act.totalSteps.toLocaleString()} steps today.`,
        });
      } else {
        observations.push({
          category: 'activity',
          message: `You have logged ${act.totalSteps.toLocaleString()} steps today (${act.progressPercentage}% of your ${act.stepGoal.toLocaleString()} goal).`,
        });
        suggestions.push({
          title: 'Evening Brisk Walk',
          description: `A 20-minute walk can help you cover the remaining ${act.remainingSteps.toLocaleString()} steps.`,
          category: 'activity',
        });
      }

      // Hydration
      if (consumedWater >= water.targetMl) {
        observations.push({
          category: 'hydration',
          message: `Optimal hydration! You have met your daily target of ${water.targetMl.toLocaleString()} ml.`,
        });
      } else {
        observations.push({
          category: 'hydration',
          message: `You have consumed ${consumedWater.toLocaleString()} ml of water (${water.progressPercentage || Math.round((consumedWater / (water.targetMl || 1)) * 100)}% of ${water.targetMl.toLocaleString()} ml).`,
        });
        suggestions.push({
          title: 'Sip Water Regularly',
          description: `Keep a water bottle nearby to complete your remaining ${(water.remainingMl !== undefined ? water.remainingMl : Math.max(water.targetMl - consumedWater, 0)).toLocaleString()} ml before bedtime.`,
          category: 'hydration',
        });
      }

      // Sleep
      if (sleep.hasRecord) {
        observations.push({
          category: 'sleep',
          message: `Recorded ${sleep.durationHours} hours of sleep with ${sleep.latest?.sleepQuality.toLowerCase().replace('_', ' ')} quality.`,
        });
      } else {
        suggestions.push({
          title: 'Log Tonight\'s Sleep',
          description: 'Recording your bedtime and wake-up time helps optimize circadian recovery.',
          category: 'sleep',
        });
      }

      return {
        summary: `Your daily wellness metrics show steady progress with ${act.totalSteps.toLocaleString()} steps and ${consumedWater.toLocaleString()} ml water intake recorded.`,
        observations,
        suggestions,
        disclaimer:
          'This wellness assessment is for informational and healthy habit building purposes. It does not constitute medical diagnosis or therapeutic prescription.',
      };
    };

    const rawResult = await aiProviderService.generateStructuredJson<any>(
      systemPrompt,
      userPrompt,
      fallbackGenerator
    );

    return WellnessInsightSchema.parse(rawResult);
  }
}

