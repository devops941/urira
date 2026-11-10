import { Types } from 'mongoose';
import { ActivityRecord } from '../activity/activity.model.js';
import { WaterLog } from '../water/water.model.js';
import { SleepRecord } from '../sleep/sleep.model.js';
import { Medication, MedicationDoseEvent } from '../medications/medication.model.js';
import { VitalRecord } from '../vitals/vital.model.js';
import { NutritionSummary } from '../nutrition/nutrition.model.js';
import { FoodLog } from '../food-logs/food-log.model.js';
import { HealthProfileModel } from '../health-profile/health-profile.model.js';
import { BMIRecordModel } from '../bmi/bmi.model.js';
import { UserModel } from '../users/user.model.js';

export interface HealthMetricDimension {
  name: string;
  score: number; // 0-100
  weight: number;
  status: 'OPTIMAL' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';
  statusLabel: string;
  currentValue: string;
  targetValue: string;
  color: string;
}

export interface HealthDashboardDto {
  overallHealthScore: number; // 0-100
  statusTag: string;
  timeframe: string;
  avatarSummary?: {
    title: string;
    description: string;
    fillPercentage: number;
    statusTier: 'PEAK' | 'ACTIVE' | 'LOW_ENERGY' | 'RECHARGE';
    statusHeading: string;
    statusMessage: string;
  };
  dimensions: HealthMetricDimension[];
  summaryObservations: string[];
  recommendations: string[];
  userSnapshot: {
    fullName: string;
    age?: number;
    biologicalSex?: string;
    bmi?: number;
    bmiCategory?: string;
  };
}

export interface TrendDataPoint {
  date: string;
  label: string;
  value: number;
  secondaryValue?: number;
}

/**
 * Robust local calendar date string formatter (YYYY-MM-DD)
 */
function toLocalDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export class ReportService {
  private getDateRange(timeframe: 'daily' | 'weekly' | 'monthly'): {
    startDate: Date;
    endDate: Date;
    startStr: string;
    endStr: string;
    daysCount: number;
  } {
    const now = new Date();
    const todayStr = toLocalDateString(now);

    if (timeframe === 'daily') {
      return {
        startDate: now,
        endDate: now,
        startStr: todayStr,
        endStr: todayStr,
        daysCount: 1,
      };
    } else if (timeframe === 'weekly') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return {
        startDate: start,
        endDate: now,
        startStr: toLocalDateString(start),
        endStr: todayStr,
        daysCount: 7,
      };
    } else {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      return {
        startDate: start,
        endDate: now,
        startStr: toLocalDateString(start),
        endStr: todayStr,
        daysCount: 30,
      };
    }
  }

  async getHealthDashboard(
    userId: string,
    timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<HealthDashboardDto> {
    const userObjectId = new Types.ObjectId(userId);
    const { startStr, endStr, daysCount } = this.getDateRange(timeframe);

    // Parallel multi-module database queries with exact range boundary matching
    const [
      profile,
      user,
      latestBmi,
      activities,
      waterLogs,
      sleepRecords,
      medications,
      doses,
      latestVitals,
      nutritionSummaries,
      foodLogs,
    ] = await Promise.all([
      HealthProfileModel.findOne({ userId: userObjectId }),
      UserModel.findById(userObjectId),
      BMIRecordModel.findOne({ userId: userObjectId }).sort({ calculatedAt: -1 }),
      ActivityRecord.find({ userId: userObjectId, dateString: { $gte: startStr, $lte: endStr } }),
      WaterLog.find({ userId: userObjectId, dateString: { $gte: startStr, $lte: endStr } }),
      SleepRecord.find({ userId: userObjectId, dateString: { $gte: startStr, $lte: endStr } }),
      Medication.find({ userId: userObjectId, isActive: true }),
      MedicationDoseEvent.find({ userId: userObjectId, dateString: { $gte: startStr, $lte: endStr } }),
      VitalRecord.find({ userId: userObjectId }).sort({ measuredAt: -1 }).limit(10),
      NutritionSummary.find({ userId: userObjectId, date: { $gte: startStr, $lte: endStr } }),
      FoodLog.find({ userId: userObjectId, dateString: { $gte: startStr, $lte: endStr } }),
    ]);

    // 1. Physical Activity Score
    const totalSteps = activities.reduce((acc: number, a: any) => acc + (a.steps || 0), 0);
    const avgSteps = timeframe === 'daily' ? totalSteps : Math.round(totalSteps / daysCount);
    const stepGoal = profile?.preferredStepGoal || 7000;
    const stepRatio = Math.min(1.2, avgSteps / Math.max(stepGoal, 1));
    const stepScore = Math.min(100, Math.round(stepRatio * 100));

    // 2. Hydration Score
    const totalWater = waterLogs.reduce((acc: number, w: any) => acc + (w.quantityMl || 0), 0);
    const avgWater = timeframe === 'daily' ? totalWater : Math.round(totalWater / daysCount);
    const waterGoal = profile?.preferredWaterIntakeMl || 2500;
    const waterRatio = Math.min(1.2, avgWater / Math.max(waterGoal, 1));
    const waterScore = Math.min(100, Math.round(waterRatio * 100));

    // 3. Sleep Quality Score
    const sleepGoalHours = profile?.preferredSleepGoalHours || 8;
    let avgSleepMinutes = 0;
    let sleepHours = 0;
    let sleepScore = 0;
    let sleepStatusLabel = 'No Sleep Log';

    if (sleepRecords.length > 0) {
      const totalSleepMins = sleepRecords.reduce((acc: number, s: any) => acc + (s.durationMinutes || 0), 0);
      avgSleepMinutes = Math.round(totalSleepMins / (timeframe === 'daily' ? 1 : sleepRecords.length));
      sleepHours = Number((avgSleepMinutes / 60).toFixed(1));
      const sleepDiff = Math.abs(sleepHours - sleepGoalHours);
      sleepScore = Math.max(20, Math.min(100, Math.round((1 - sleepDiff / 4) * 100)));
      sleepStatusLabel = sleepScore >= 80 ? 'Optimal' : sleepScore >= 60 ? 'Good' : 'Needs Focus';
    }

    // 4. Medication Adherence
    const scheduledDosesPerDay = medications.reduce(
      (sum: number, m: any) => sum + (m.scheduledTimes?.length || 1),
      0
    );
    const totalScheduled = scheduledDosesPerDay * daysCount;
    const takenDoses = doses.filter((d: any) => d.status === 'TAKEN').length;
    let medScore = 100;
    let medCurrentValue = 'No Meds Scheduled';
    let medStatusLabel = 'No Active Meds';

    if (medications.length > 0) {
      if (totalScheduled > 0) {
        medScore = Math.min(100, Math.round((takenDoses / totalScheduled) * 100));
        medCurrentValue = `${medScore}% (${takenDoses}/${totalScheduled} doses)`;
        medStatusLabel = medScore >= 80 ? 'Optimal' : medScore >= 50 ? 'Needs Focus' : 'Action Needed';
      } else {
        medScore = 100;
        medCurrentValue = '0 doses scheduled';
      }
    }

    // 5. Nutrition & Caloric Consistency (Multi-source aggregation: NutritionSummary + FoodLog)
    const nutritionMap = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
    nutritionSummaries.forEach((s: any) => {
      nutritionMap.set(s.date, {
        calories: s.consumedCalories || 0,
        protein: s.protein || 0,
        carbs: s.carbohydrates || 0,
        fat: s.fat || 0,
      });
    });
    foodLogs.forEach((f: any) => {
      if (!nutritionMap.has(f.dateString)) {
        const existing = nutritionMap.get(f.dateString) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
        existing.calories += f.calculatedNutrition?.calories || 0;
        existing.protein += f.calculatedNutrition?.protein || 0;
        existing.carbs += f.calculatedNutrition?.carbohydrates || 0;
        existing.fat += f.calculatedNutrition?.fat || 0;
        nutritionMap.set(f.dateString, existing);
      }
    });

    let totalCalories = 0;
    nutritionMap.forEach((v) => {
      totalCalories += v.calories;
    });

    const avgCalories = timeframe === 'daily' ? totalCalories : Math.round(totalCalories / daysCount);
    const calGoal = profile?.preferredDailyCalorieGoal || 2100;
    let nutritionScore = 0;
    let nutritionStatusLabel = 'No Food Logged';

    if (nutritionMap.size > 0 || avgCalories > 0) {
      const calDiffRatio = Math.abs(avgCalories - calGoal) / calGoal;
      nutritionScore = Math.max(30, Math.min(100, Math.round((1 - calDiffRatio) * 100)));
      nutritionStatusLabel = nutritionScore >= 80 ? 'Optimal' : nutritionScore >= 60 ? 'Good' : 'Needs Focus';
    }

    // 6. Vitals Stability
    const hrRecord = latestVitals.find((v: any) => v.metricType === 'HEART_RATE');
    const bpRecord = latestVitals.find((v: any) => v.metricType === 'BLOOD_PRESSURE');
    let vitalsScore = 50;
    let vitalsLabel = 'Not Recorded';
    let vitalsCurrentValue = 'Not Recorded';
    let vitalsStatus: 'OPTIMAL' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL' = 'NEEDS_ATTENTION';

    if (hrRecord?.value) {
      const hr = hrRecord.value;
      vitalsCurrentValue = `${hr} bpm`;
      if (bpRecord?.systolic && bpRecord?.diastolic) {
        vitalsCurrentValue += ` • ${bpRecord.systolic}/${bpRecord.diastolic} mmHg`;
      }
      if (hr >= 60 && hr <= 100) {
        vitalsScore = 85;
        vitalsStatus = 'OPTIMAL';
        vitalsLabel = 'Optimal';
      } else if (hr >= 50 && hr <= 110) {
        vitalsScore = 70;
        vitalsStatus = 'GOOD';
        vitalsLabel = 'Normal';
      } else {
        vitalsScore = 40;
        vitalsStatus = 'CRITICAL';
        vitalsLabel = 'Abnormal';
      }
    }

    // Overall Weighted Health Score (Only rewards active data dimensions)
    const overallScore = Math.round(
      stepScore * 0.2 +
      nutritionScore * 0.2 +
      waterScore * 0.15 +
      (sleepRecords.length > 0 ? sleepScore * 0.15 : 0) +
      (hrRecord?.value ? vitalsScore * 0.15 : 7.5) +
      medScore * 0.15
    );

    const getStatus = (score: number) => {
      if (score >= 80) return { status: 'OPTIMAL' as const, label: 'Optimal' };
      if (score >= 60) return { status: 'GOOD' as const, label: 'Good' };
      if (score >= 40) return { status: 'NEEDS_ATTENTION' as const, label: 'Needs Focus' };
      return { status: 'CRITICAL' as const, label: 'Action Needed' };
    };

    const overallTag =
      overallScore >= 80
        ? 'Excellent Health Vitality'
        : overallScore >= 65
        ? 'Healthy & Balanced'
        : overallScore >= 45
        ? 'Moderate Wellness'
        : 'Requires Health Attention';

    const dimensions: HealthMetricDimension[] = [
      {
        name: 'Physical Activity',
        score: stepScore,
        weight: 0.2,
        status: getStatus(stepScore).status,
        statusLabel: getStatus(stepScore).label,
        currentValue:
          timeframe === 'daily'
            ? `${totalSteps.toLocaleString()} steps today`
            : `${avgSteps.toLocaleString()} steps/day (avg)`,
        targetValue: `${stepGoal.toLocaleString()} steps`,
        color: '#0EA5E9',
      },
      {
        name: 'Nutrition & Diet',
        score: nutritionScore,
        weight: 0.2,
        status: nutritionScore > 0 ? getStatus(nutritionScore).status : 'NEEDS_ATTENTION',
        statusLabel: nutritionStatusLabel,
        currentValue:
          timeframe === 'daily'
            ? `${totalCalories.toLocaleString()} kcal today`
            : `${avgCalories.toLocaleString()} kcal/day (avg)`,
        targetValue: `${calGoal.toLocaleString()} kcal target`,
        color: '#F97316',
      },
      {
        name: 'Hydration',
        score: waterScore,
        weight: 0.15,
        status: getStatus(waterScore).status,
        statusLabel: getStatus(waterScore).label,
        currentValue:
          timeframe === 'daily'
            ? `${totalWater.toLocaleString()} ml today`
            : `${avgWater.toLocaleString()} ml/day (avg)`,
        targetValue: `${waterGoal.toLocaleString()} ml`,
        color: '#06B6D4',
      },
      {
        name: 'Sleep Quality',
        score: sleepScore,
        weight: 0.15,
        status: sleepRecords.length > 0 ? getStatus(sleepScore).status : 'NEEDS_ATTENTION',
        statusLabel: sleepStatusLabel,
        currentValue: sleepRecords.length > 0 ? `${sleepHours.toFixed(1)} hrs/night` : 'No Log Recorded',
        targetValue: `${sleepGoalHours} hrs`,
        color: '#8B5CF6',
      },
      {
        name: 'Vital Signs',
        score: vitalsScore,
        weight: 0.15,
        status: vitalsStatus,
        statusLabel: vitalsLabel,
        currentValue: vitalsCurrentValue,
        targetValue: '60–100 bpm norm',
        color: '#E11D48',
      },
      {
        name: 'Medication Adherence',
        score: medScore,
        weight: 0.15,
        status: medications.length > 0 ? getStatus(medScore).status : 'OPTIMAL',
        statusLabel: medStatusLabel,
        currentValue: medCurrentValue,
        targetValue: '100% adherence',
        color: '#16A34A',
      },
    ];

    // Living Avatar Narrative based on dynamic metrics
    const tier: 'PEAK' | 'ACTIVE' | 'LOW_ENERGY' | 'RECHARGE' =
      overallScore >= 80 ? 'PEAK' : overallScore >= 60 ? 'ACTIVE' : overallScore >= 40 ? 'LOW_ENERGY' : 'RECHARGE';

    const avatarNarrative =
      timeframe === 'daily'
        ? {
            title: `Today's Health Avatar (${overallScore}% Charged)`,
            description: `Today you logged ${totalSteps.toLocaleString()} steps and ${totalWater.toLocaleString()} ml hydration. ${
              overallScore >= 70
                ? 'Your daily vitality is high, energized and on track!'
                : 'Take an evening walk and drink water to charge up your avatar!'
            }`,
            statusHeading: overallScore >= 70 ? 'Vibrant & Active' : 'Moderate Wellness',
            statusMessage: `${totalSteps.toLocaleString()} steps • ${totalWater.toLocaleString()} ml water • ${medScore}% adherence`,
          }
        : timeframe === 'weekly'
        ? {
            title: `7-Day Weekly Vitality Avatar (${overallScore}% Energy)`,
            description: `Past 7 days daily average: ${avgSteps.toLocaleString()} steps/day and ${avgWater.toLocaleString()} ml/day. ${
              overallScore >= 70
                ? 'Consistent weekly healthy habit formation!'
                : 'Steady daily hydration and steps will elevate your weekly average.'
            }`,
            statusHeading: overallScore >= 70 ? 'Balanced Week' : 'Needs Weekly Focus',
            statusMessage: `Avg ${avgSteps.toLocaleString()} steps/day • Avg ${avgWater.toLocaleString()} ml/day`,
          }
        : {
            title: `30-Day Monthly Health Avatar (${overallScore}% Synthesis)`,
            description: `30-day health transformation: ${totalSteps.toLocaleString()} total steps recorded with ${totalWater.toLocaleString()} ml total hydration. ${
              overallScore >= 70
                ? 'Solid long-term lifestyle adherence and cardiovascular resilience!'
                : 'Building daily consistency will transform your monthly health baseline.'
            }`,
            statusHeading: overallScore >= 70 ? 'Monthly High Achiever' : 'Monthly Focus Needed',
            statusMessage: `30-day totals: ${totalSteps.toLocaleString()} steps • ${totalWater.toLocaleString()} ml water`,
          };

    const avatarSummary = {
      ...avatarNarrative,
      fillPercentage: overallScore,
      statusTier: tier,
    };

    const observations: string[] = [
      `Overall composite wellness score stands at ${overallScore}/100 based on ${timeframe} tracking.`,
      avgSteps >= stepGoal
        ? 'Daily physical activity exceeds clinical recommendations.'
        : `Daily physical activity averages ${avgSteps.toLocaleString()} steps; increasing brisk walking by 2,000 steps will improve cardiovascular resilience.`,
      avgWater >= waterGoal
        ? 'Hydration volume is maintained consistently.'
        : 'Daily water intake is below target; prioritize hydration intervals throughout work hours.',
    ];

    if (medications.length > 0) {
      observations.push(
        medScore >= 90
          ? 'Medication schedule is being followed with high clinical adherence.'
          : 'Several scheduled medication doses were missed or unrecorded; set reminder cues.'
      );
    } else {
      observations.push('No active medications scheduled in your clinical profile.');
    }

    const recommendations: string[] = [
      'Maintain continuous sleep schedule with at least 7.5 hours of quiet rest.',
      'Sustain balanced macronutrient distribution with adequate hydration.',
      'Track quarterly blood pressure and heart rate readings.',
    ];

    const fullName = profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ''}`.trim()
      : user?.fullName || 'Health Champion';

    let age: number | undefined;
    if (profile?.dateOfBirth) {
      const birth = new Date(profile.dateOfBirth);
      const now = new Date();
      age = now.getFullYear() - birth.getFullYear();
    }

    return {
      overallHealthScore: overallScore,
      statusTag: overallTag,
      timeframe,
      avatarSummary,
      dimensions,
      summaryObservations: observations,
      recommendations,
      userSnapshot: {
        fullName,
        age,
        biologicalSex: profile?.biologicalSex,
        bmi: latestBmi ? Number(latestBmi.bmiValue) : undefined,
        bmiCategory: latestBmi?.category,
      },
    };
  }

  async getHistoricalTrends(
    userId: string,
    metric: 'steps' | 'water' | 'sleep' | 'vitals' | 'calories',
    days: number = 14
  ): Promise<TrendDataPoint[]> {
    const userObjectId = new Types.ObjectId(userId);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    const startStr = toLocalDateString(start);
    const endStr = toLocalDateString(end);

    const points: TrendDataPoint[] = [];

    // Map each calendar day
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(end.getDate() - i);
      const dateStr = toLocalDateString(d);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      points.push({ date: dateStr, label, value: 0 });
    }

    if (metric === 'steps') {
      const logs = await ActivityRecord.find({
        userId: userObjectId,
        dateString: { $gte: startStr, $lte: endStr },
      });
      const map = new Map<string, number>();
      logs.forEach((l: any) => map.set(l.dateString, (map.get(l.dateString) || 0) + (l.steps || 0)));
      points.forEach((p) => {
        p.value = map.get(p.date) || 0;
      });
    } else if (metric === 'water') {
      const logs = await WaterLog.find({
        userId: userObjectId,
        dateString: { $gte: startStr, $lte: endStr },
      });
      const map = new Map<string, number>();
      logs.forEach((l: any) => map.set(l.dateString, (map.get(l.dateString) || 0) + (l.quantityMl || 0)));
      points.forEach((p) => {
        p.value = map.get(p.date) || 0;
      });
    } else if (metric === 'sleep') {
      const logs = await SleepRecord.find({
        userId: userObjectId,
        dateString: { $gte: startStr, $lte: endStr },
      });
      const map = new Map<string, number>();
      logs.forEach((l: any) =>
        map.set(l.dateString, Number(((l.durationMinutes || 0) / 60).toFixed(1)))
      );
      points.forEach((p) => {
        p.value = map.get(p.date) || 0;
      });
    } else if (metric === 'calories') {
      const summaries = await NutritionSummary.find({
        userId: userObjectId,
        date: { $gte: startStr, $lte: endStr },
      });
      const foodLogs = await FoodLog.find({
        userId: userObjectId,
        dateString: { $gte: startStr, $lte: endStr },
      });
      const map = new Map<string, number>();
      summaries.forEach((s: any) => map.set(s.date, s.consumedCalories || 0));
      foodLogs.forEach((f: any) => {
        if (!map.has(f.dateString)) {
          map.set(f.dateString, (map.get(f.dateString) || 0) + (f.calculatedNutrition?.calories || 0));
        }
      });
      points.forEach((p) => {
        p.value = Math.round(map.get(p.date) || 0);
      });
    } else if (metric === 'vitals') {
      const records = await VitalRecord.find({
        userId: userObjectId,
        metricType: 'HEART_RATE',
      }).sort({ measuredAt: -1 });
      const map = new Map<string, number>();
      records.forEach((r: any) => {
        const dStr = r.dateString || toLocalDateString(new Date(r.measuredAt));
        if (!map.has(dStr)) {
          map.set(dStr, r.value || 0);
        }
      });
      points.forEach((p) => {
        p.value = map.get(p.date) || 0;
      });
    }

    return points;
  }

  async generateCsvExport(userId: string): Promise<string> {
    const userObjectId = new Types.ObjectId(userId);
    const [profile, activities, waterLogs, sleepRecords, vitals, medications] = await Promise.all([
      HealthProfileModel.findOne({ userId: userObjectId }),
      ActivityRecord.find({ userId: userObjectId }).sort({ dateString: -1 }).limit(100),
      WaterLog.find({ userId: userObjectId }).sort({ dateString: -1 }).limit(100),
      SleepRecord.find({ userId: userObjectId }).sort({ dateString: -1 }).limit(100),
      VitalRecord.find({ userId: userObjectId }).sort({ measuredAt: -1 }).limit(100),
      Medication.find({ userId: userObjectId }),
    ]);

    const patientName = profile?.firstName
      ? `${profile.firstName} ${profile.lastName || ''}`.trim()
      : 'User';

    let patientAge: string = 'N/A';
    if (profile?.dateOfBirth) {
      const birth = new Date(profile.dateOfBirth);
      patientAge = `${new Date().getFullYear() - birth.getFullYear()}`;
    }

    const lines: string[] = [];
    lines.push('UYIRA SMART HEALTH MONITORING - CLINICAL DATA EXPORT');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Patient: ${patientName}, Sex: ${profile?.biologicalSex || 'N/A'}, Age: ${patientAge}, Height: ${profile?.heightCm || 'N/A'}cm, Weight: ${profile?.weightKg || 'N/A'}kg`);
    lines.push('');

    // Activity Table
    lines.push('--- PHYSICAL ACTIVITY LOGS ---');
    lines.push('Date,Activity Type,Steps,Distance (km),Active Minutes,Calories Burned,Source');
    activities.forEach((a: any) => {
      lines.push(`${a.dateString},${a.activityType},${a.steps},${a.distanceKm},${a.activeDurationMinutes},${a.estimatedCalories},${a.source}`);
    });
    lines.push('');

    // Water Table
    lines.push('--- HYDRATION LOGS ---');
    lines.push('Date,Beverage Type,Quantity (ml),Recorded At');
    waterLogs.forEach((w: any) => {
      lines.push(`${w.dateString},${w.beverageType},${w.quantityMl},${w.recordedAt.toISOString()}`);
    });
    lines.push('');

    // Sleep Table
    lines.push('--- SLEEP SESSIONS ---');
    lines.push('Date,Bedtime,Wake Time,Duration (Hours),Sleep Quality,Notes');
    sleepRecords.forEach((s: any) => {
      const hrs = (s.durationMinutes / 60).toFixed(1);
      lines.push(`${s.dateString},${s.bedtime.toISOString()},${s.wakeTime.toISOString()},${hrs},${s.sleepQuality},"${s.notes || ''}"`);
    });
    lines.push('');

    // Vitals Table
    lines.push('--- VITAL SIGNS READINGS ---');
    lines.push('Date,Metric Type,Value,Systolic,Diastolic,Unit,Source');
    vitals.forEach((v: any) => {
      const val = v.value !== undefined ? v.value : '';
      const sys = v.systolic !== undefined ? v.systolic : '';
      const dia = v.diastolic !== undefined ? v.diastolic : '';
      lines.push(`${v.measuredAt.toISOString()},${v.metricType},${val},${sys},${dia},${v.unit},${v.source}`);
    });
    lines.push('');

    // Medications Table
    lines.push('--- ACTIVE MEDICATIONS ---');
    lines.push('Name,Form,Dosage,Frequency,Scheduled Times,Instructions');
    medications.forEach((m: any) => {
      lines.push(`${m.name},${m.type},${m.strength || ''},${m.frequency},"${m.scheduledTimes.join('; ')}","${m.instructions || ''}"`);
    });

    return lines.join('\n');
  }

  async generatePrintableReportHtml(userId: string): Promise<string> {
    const dashboard = await this.getHealthDashboard(userId, 'monthly');
    const userObjectId = new Types.ObjectId(userId);
    const vitals = await VitalRecord.find({ userId: userObjectId }).sort({ measuredAt: -1 }).limit(10);
    const medications = await Medication.find({ userId: userObjectId, isActive: true });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UYIRA Clinical Health Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #1F2937; background: #FFF; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #12372A; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: 800; color: #12372A; letter-spacing: 1px; }
    .logo span { color: #16A34A; }
    .report-title { text-align: right; }
    .report-title h2 { margin: 0; color: #12372A; }
    .report-title p { margin: 4px 0 0; color: #64748B; font-size: 13px; }
    .patient-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin: 24px 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .patient-field label { font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; display: block; margin-bottom: 4px; }
    .patient-field span { font-size: 15px; font-weight: 600; color: #1F2937; }
    .score-banner { background: #E8F3EC; border: 1px solid #C7E2D1; border-radius: 12px; padding: 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
    .score-number { font-size: 38px; font-weight: 800; color: #12372A; }
    .score-text { font-size: 18px; font-weight: 700; color: #12372A; }
    .score-sub { font-size: 13px; color: #2D6A4F; margin-top: 4px; }
    h3 { color: #12372A; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-top: 32px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #F8FAFC; text-align: left; padding: 10px 12px; font-size: 12px; font-weight: 700; color: #64748B; border-bottom: 1px solid #CBD5E1; }
    td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #F1F5F9; color: #1F2937; }
    .status-badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #E2E8F0; }
    .optimal { background: #DCFCE7; color: #16A34A; }
    .good { background: #E0F2FE; color: #0EA5E9; }
    .alert { background: #FEE2E2; color: #EF4444; }
    .notes-box { background: #FFFBEB; border: 1px solid #FDE68A; padding: 16px; border-radius: 8px; margin-top: 16px; font-size: 13px; line-height: 1.6; color: #92400E; }
    .doctor-sign { margin-top: 50px; display: flex; justify-content: space-between; border-top: 1px dashed #CBD5E1; padding-top: 24px; }
    .sign-col { width: 45%; }
    .sign-line { border-bottom: 1px solid #1F2937; margin-top: 40px; }
    @media print {
      body { margin: 15px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">UYIRA <span>HEALTH</span></div>
    <div class="report-title">
      <h2>Comprehensive Health Summary Report</h2>
      <p>Report Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>

  <div class="patient-box">
    <div class="patient-field">
      <label>Patient Name</label>
      <span>${dashboard.userSnapshot.fullName}</span>
    </div>
    <div class="patient-field">
      <label>Age & Gender</label>
      <span>${dashboard.userSnapshot.age || 'N/A'} yrs / ${dashboard.userSnapshot.biologicalSex || 'N/A'}</span>
    </div>
    <div class="patient-field">
      <label>Baseline BMI</label>
      <span>${dashboard.userSnapshot.bmi?.toFixed(2) || 'N/A'} (${dashboard.userSnapshot.bmiCategory || 'N/A'})</span>
    </div>
    <div class="patient-field">
      <label>Report Timeframe</label>
      <span>Last 30 Days (Monthly)</span>
    </div>
  </div>

  <div class="score-banner">
    <div>
      <div class="score-text">Clinical Wellness Vitality Score</div>
      <div class="score-sub">${dashboard.statusTag}</div>
    </div>
    <div class="score-number">${dashboard.overallHealthScore}<span style="font-size: 18px; color: #64748B;">/100</span></div>
  </div>

  <h3>Key Wellness Dimensions Breakdown</h3>
  <table>
    <thead>
      <tr>
        <th>Health Dimension</th>
        <th>Recorded Level</th>
        <th>Clinical Target</th>
        <th>Dimension Score</th>
        <th>Clinical Status</th>
      </tr>
    </thead>
    <tbody>
      ${dashboard.dimensions.map((d) => `
        <tr>
          <td><strong>${d.name}</strong></td>
          <td>${d.currentValue}</td>
          <td>${d.targetValue}</td>
          <td>${d.score}%</td>
          <td><span class="status-badge ${d.status === 'OPTIMAL' ? 'optimal' : d.status === 'GOOD' ? 'good' : 'alert'}">${d.statusLabel}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3>Recent Vital Signs Snapshot</h3>
  <table>
    <thead>
      <tr>
        <th>Date & Time</th>
        <th>Vital Sign Metric</th>
        <th>Measurement Value</th>
        <th>Normal Clinical Range</th>
        <th>Data Source</th>
      </tr>
    </thead>
    <tbody>
      ${vitals.length === 0 ? '<tr><td colspan="5">No recent vitals measurements on file.</td></tr>' : vitals.map((v: any) => {
        let valStr = '';
        let normStr = '';
        if (v.metricType === 'HEART_RATE') {
          valStr = `${v.value} bpm`;
          normStr = '60 - 100 bpm';
        } else if (v.metricType === 'BLOOD_PRESSURE') {
          valStr = `${v.systolic}/${v.diastolic} mmHg`;
          normStr = '< 120/80 mmHg';
        } else if (v.metricType === 'BLOOD_OXYGEN') {
          valStr = `${v.value}%`;
          normStr = '95% - 100%';
        } else if (v.metricType === 'BODY_TEMPERATURE') {
          valStr = `${v.value}°C`;
          normStr = '36.1°C - 37.2°C';
        }
        return `
          <tr>
            <td>${v.measuredAt.toLocaleDateString()} ${v.measuredAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td><strong>${v.metricType.replace(/_/g, ' ')}</strong></td>
            <td>${valStr}</td>
            <td>${normStr}</td>
            <td><span class="status-badge">${v.source}</span></td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h3>Active Prescription Schedule</h3>
  <table>
    <thead>
      <tr>
        <th>Medication Name</th>
        <th>Form & Dosage</th>
        <th>Dosing Frequency</th>
        <th>Scheduled Times</th>
        <th>Instructions</th>
      </tr>
    </thead>
    <tbody>
      ${medications.length === 0 ? '<tr><td colspan="5">No active prescription records tracked.</td></tr>' : medications.map((m: any) => `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td>${m.type} • ${m.strength || '1 dose'}</td>
          <td>${m.frequency.replace(/_/g, ' ')}</td>
          <td>${m.scheduledTimes.join(', ')}</td>
          <td>${m.instructions || 'As advised'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h3>Physician Review & Clinical Observations</h3>
  <div class="notes-box">
    <strong>Clinical Notes:</strong>
    <ul>
      ${dashboard.summaryObservations.map((obs) => `<li>${obs}</li>`).join('')}
    </ul>
    <strong>Lifestyle Recommendations:</strong>
    <ul>
      ${dashboard.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
    </ul>
  </div>

  <div class="doctor-sign">
    <div class="sign-col">
      <div class="sign-line"></div>
      <p style="font-size: 12px; color: #64748B; margin-top: 4px;">Attending Physician / Reviewer Signature</p>
    </div>
    <div class="sign-col">
      <div class="sign-line"></div>
      <p style="font-size: 12px; color: #64748B; margin-top: 4px;">Date of Clinical Review</p>
    </div>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 24px; background: #12372A; color: #FFF; font-weight: bold; border-radius: 8px; border: none; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>
</body>
</html>
    `;
  }
}

export const reportService = new ReportService();
