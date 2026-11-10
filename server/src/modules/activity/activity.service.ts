import { ActivityRepository } from './activity.repository.js';
import { HealthProfileModel } from '../health-profile/health-profile.model.js';
import {
  CreateActivityInput,
  UpdateActivityInput,
  QueryActivityHistoryInput,
} from './activity.validation.js';
import { IActivityRecordDocument } from './activity.model.js';

export class ActivityService {
  private repo: ActivityRepository;

  constructor() {
    this.repo = new ActivityRepository();
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private async getUserStepGoal(userId: string): Promise<number> {
    try {
      const profile = await HealthProfileModel.findOne({ userId }).exec();
      return profile?.preferredStepGoal || 8000;
    } catch {
      return 8000;
    }
  }

  async addActivity(userId: string, input: CreateActivityInput) {
    const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();
    const dateString = input.dateString || this.getTodayString();

    const distanceKm =
      input.distanceKm !== undefined
        ? Math.round(input.distanceKm * 100) / 100
        : Math.round(input.steps * 0.000762 * 100) / 100;

    const activeDurationMinutes =
      input.activeDurationMinutes !== undefined
        ? input.activeDurationMinutes
        : Math.round(input.steps / 100);

    const estimatedCalories =
      input.estimatedCalories !== undefined
        ? input.estimatedCalories
        : Math.round(input.steps * 0.04);

    const record = await this.repo.create({
      userId: userId as any,
      activityType: input.activityType || 'WALKING',
      steps: input.steps,
      distanceKm,
      activeDurationMinutes,
      estimatedCalories,
      source: input.source,
      deviceIdentifier: input.deviceIdentifier,
      dateString,
      recordedAt,
      notes: input.notes,
    });

    const todaySummary = await this.getTodaySummary(userId);
    return { record, todaySummary };
  }

  async getTodaySummary(userId: string, targetDate?: string) {
    const today = targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? targetDate : this.getTodayString();
    const records = await this.repo.findByDate(userId, today);
    const stepGoal = await this.getUserStepGoal(userId);

    const totalSteps = records.reduce((sum, r) => sum + r.steps, 0);
    let totalDistanceKm =
      Math.round(records.reduce((sum, r) => sum + (r.distanceKm || 0), 0) * 100) / 100;
    const totalActiveMinutes = records.reduce(
      (sum, r) => sum + (r.activeDurationMinutes || 0),
      0
    );
    let totalCalories = records.reduce(
      (sum, r) => sum + (r.estimatedCalories || 0),
      0
    );

    // Biomechanical correction: if steps exist but distance/calories are unnaturally low from legacy logs
    if (totalSteps > 50) {
      const minSensibleDistanceKm = Math.round(totalSteps * 0.00072 * 100) / 100;
      if (totalDistanceKm < minSensibleDistanceKm * 0.5) {
        totalDistanceKm = minSensibleDistanceKm;
      }
      const minSensibleCalories = Math.round(totalSteps * 0.045);
      if (totalCalories < minSensibleCalories * 0.5) {
        totalCalories = minSensibleCalories;
      }
    }

    const progressPercentage = Math.min(
      Math.round((totalSteps / (stepGoal || 1)) * 100),
      100
    );

    return {
      date: today,
      totalSteps,
      stepGoal,
      remainingSteps: Math.max(stepGoal - totalSteps, 0),
      progressPercentage,
      totalDistanceKm,
      totalActiveMinutes,
      totalCalories,
      recordCount: records.length,
      records,
    };
  }

  async getWeeklyTrends(userId: string) {
    const today = new Date();
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const startDate = days[0];
    const endDate = days[days.length - 1];
    const records = await this.repo.findByDateRange(userId, startDate, endDate);
    const stepGoal = await this.getUserStepGoal(userId);

    // Map records by day
    const dayMap = new Map<string, { steps: number; distance: number; calories: number }>();
    for (const d of days) {
      dayMap.set(d, { steps: 0, distance: 0, calories: 0 });
    }

    for (const r of records) {
      if (dayMap.has(r.dateString)) {
        const cur = dayMap.get(r.dateString)!;
        cur.steps += r.steps;
        cur.distance += r.distanceKm || 0;
        cur.calories += r.estimatedCalories || 0;
      }
    }

    const history = days.map((date) => {
      const val = dayMap.get(date)!;
      return {
        date,
        steps: val.steps,
        distanceKm: Math.round(val.distance * 100) / 100,
        calories: val.calories,
        goal: stepGoal,
        goalReached: val.steps >= stepGoal,
      };
    });

    const totalWeeklySteps = history.reduce((sum, h) => sum + h.steps, 0);
    const avgDailySteps = Math.round(totalWeeklySteps / 7);

    return {
      startDate,
      endDate,
      stepGoal,
      totalWeeklySteps,
      avgDailySteps,
      history,
    };
  }

  async getHistory(userId: string, input: QueryActivityHistoryInput) {
    const today = this.getTodayString();
    const startDate = input.startDate || input.date || today;
    const endDate = input.endDate || input.date || today;

    const records = await this.repo.findByDateRange(userId, startDate, endDate);
    return { startDate, endDate, total: records.length, records };
  }

  async getRangeSummary(userId: string, startDate?: string, endDate?: string) {
    const today = this.getTodayString();
    let startStr = startDate || today;
    let endStr = endDate || startStr;

    // Ensure chronological order
    if (startStr > endStr) {
      const tmp = startStr;
      startStr = endStr;
      endStr = tmp;
    }

    const records = await this.repo.findByDateRange(userId, startStr, endStr);
    const stepGoal = await this.getUserStepGoal(userId);

    let totalSteps = 0;
    let totalDistanceKm = 0;
    let totalActiveMinutes = 0;
    let totalCalories = 0;

    const dayMap = new Map<string, { steps: number; distanceKm: number; calories: number }>();
    for (const r of records) {
      totalSteps += r.steps;
      totalDistanceKm += r.distanceKm || 0;
      totalActiveMinutes += r.activeDurationMinutes || 0;
      totalCalories += r.estimatedCalories || 0;

      const cur = dayMap.get(r.dateString) || { steps: 0, distanceKm: 0, calories: 0 };
      cur.steps += r.steps;
      cur.distanceKm += r.distanceKm || 0;
      cur.calories += r.estimatedCalories || 0;
      dayMap.set(r.dateString, cur);
    }

    if (totalSteps > 50) {
      const minSensibleDistanceKm = Math.round(totalSteps * 0.00072 * 100) / 100;
      if (totalDistanceKm < minSensibleDistanceKm * 0.5) {
        totalDistanceKm = minSensibleDistanceKm;
      }
      const minSensibleCalories = Math.round(totalSteps * 0.045);
      if (totalCalories < minSensibleCalories * 0.5) {
        totalCalories = minSensibleCalories;
      }
    }

    const startObj = new Date(startStr + 'T00:00:00Z');
    const endObj = new Date(endStr + 'T00:00:00Z');
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.max(1, Math.round((endObj.getTime() - startObj.getTime()) / msPerDay) + 1);
    const avgDailySteps = Math.round(totalSteps / diffDays);

    const dailyBreakdown: Array<{
      date: string;
      label: string;
      steps: number;
      distanceKm: number;
      calories: number;
      goal: number;
      goalReached: boolean;
    }> = [];

    if (diffDays <= 35) {
      // Daily breakdown
      const cur = new Date(startObj);
      while (cur <= endObj) {
        const dStr = cur.toISOString().split('T')[0];
        const stat = dayMap.get(dStr) || { steps: 0, distanceKm: 0, calories: 0 };
        const label = cur.toLocaleDateString('en-US', { weekday: 'narrow' });
        dailyBreakdown.push({
          date: dStr,
          label,
          steps: stat.steps,
          distanceKm: Math.round(stat.distanceKm * 100) / 100,
          calories: stat.calories,
          goal: stepGoal,
          goalReached: stat.steps >= stepGoal,
        });
        cur.setDate(cur.getDate() + 1);
      }
    } else if (diffDays <= 120) {
      // Weekly grouped breakdown (chunks of 7 days)
      const cur = new Date(startObj);
      let weekIdx = 1;
      while (cur <= endObj) {
        let chunkSteps = 0;
        let chunkDistance = 0;
        let chunkCalories = 0;
        const weekStartDateStr = cur.toISOString().split('T')[0];
        for (let d = 0; d < 7 && cur <= endObj; d++) {
          const dStr = cur.toISOString().split('T')[0];
          const stat = dayMap.get(dStr) || { steps: 0, distanceKm: 0, calories: 0 };
          chunkSteps += stat.steps;
          chunkDistance += stat.distanceKm;
          chunkCalories += stat.calories;
          cur.setDate(cur.getDate() + 1);
        }
        const weeklyGoal = stepGoal * 7;
        dailyBreakdown.push({
          date: weekStartDateStr,
          label: `W${weekIdx++}`,
          steps: chunkSteps,
          distanceKm: Math.round(chunkDistance * 100) / 100,
          calories: chunkCalories,
          goal: weeklyGoal,
          goalReached: chunkSteps >= weeklyGoal,
        });
      }
    } else {
      // Monthly grouped breakdown for Year view
      const monthMap = new Map<string, { steps: number; distanceKm: number; calories: number }>();
      for (const [dStr, stat] of dayMap.entries()) {
        const ym = dStr.substring(0, 7); // "YYYY-MM"
        const curM = monthMap.get(ym) || { steps: 0, distanceKm: 0, calories: 0 };
        curM.steps += stat.steps;
        curM.distanceKm += stat.distanceKm;
        curM.calories += stat.calories;
        monthMap.set(ym, curM);
      }

      // Generate 12 months in the year of startStr
      const startYear = parseInt(startStr.substring(0, 4), 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let m = 1; m <= 12; m++) {
        const mPad = m < 10 ? `0${m}` : `${m}`;
        const ym = `${startYear}-${mPad}`;
        const stat = monthMap.get(ym) || { steps: 0, distanceKm: 0, calories: 0 };
        const monthlyGoal = stepGoal * 30;
        dailyBreakdown.push({
          date: `${ym}-01`,
          label: monthNames[m - 1],
          steps: stat.steps,
          distanceKm: Math.round(stat.distanceKm * 100) / 100,
          calories: stat.calories,
          goal: monthlyGoal,
          goalReached: stat.steps >= monthlyGoal,
        });
      }
    }

    return {
      startDate: startStr,
      endDate: endStr,
      daysCount: diffDays,
      stepGoal,
      totalSteps,
      totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
      totalActiveMinutes,
      totalCalories,
      avgDailySteps,
      dailyBreakdown,
      records,
    };
  }

  async updateActivity(id: string, userId: string, input: UpdateActivityInput) {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw new Error('Activity record not found');

    const updates: Partial<IActivityRecordDocument> = {};
    if (input.steps !== undefined) {
      updates.steps = input.steps;
      updates.distanceKm = Math.round(input.steps * 0.000762 * 100) / 100;
      updates.activeDurationMinutes = Math.round(input.steps / 100);
      updates.estimatedCalories = Math.round(input.steps * 0.04);
    }
    if (input.distanceKm !== undefined) updates.distanceKm = input.distanceKm;
    if (input.activeDurationMinutes !== undefined)
      updates.activeDurationMinutes = input.activeDurationMinutes;
    if (input.estimatedCalories !== undefined)
      updates.estimatedCalories = input.estimatedCalories;
    if (input.notes !== undefined) updates.notes = input.notes;

    const updated = await this.repo.update(id, userId, updates);
    return updated;
  }

  async deleteActivity(id: string, userId: string) {
    return this.repo.delete(id, userId);
  }
}

