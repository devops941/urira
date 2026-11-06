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

  async getTodaySummary(userId: string) {
    const today = this.getTodayString();
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

