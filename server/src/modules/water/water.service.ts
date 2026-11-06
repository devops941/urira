import { WaterRepository } from './water.repository.js';
import { HealthProfileModel } from '../health-profile/health-profile.model.js';
import {
  CreateWaterLogInput,
  UpdateWaterGoalInput,
  QueryWaterHistoryInput,
} from './water.validation.js';
import { BeverageType } from './water.model.js';

export class WaterService {
  private repo: WaterRepository;

  constructor() {
    this.repo = new WaterRepository();
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  async getWaterGoal(userId: string): Promise<{
    targetMl: number;
    reminderEnabled: boolean;
    reminderIntervalMinutes: number;
  }> {
    // Check health profile for user-defined hydration target
    const profile = await HealthProfileModel.findOne({ userId }).exec();
    const profileTarget = profile?.preferredWaterIntakeMl;

    const goal = await this.repo.getGoal(userId);
    if (goal) {
      // If health profile has a target that differs from cached goal, keep them synchronized!
      if (profileTarget && profileTarget > 0 && goal.targetMl !== profileTarget) {
        goal.targetMl = profileTarget;
        await goal.save().catch(() => {});
      }
      return {
        targetMl: goal.targetMl,
        reminderEnabled: goal.reminderEnabled,
        reminderIntervalMinutes: goal.reminderIntervalMinutes,
      };
    }

    const defaultTarget = profileTarget || 2500;

    const created = await this.repo.upsertGoal(userId, {
      targetMl: defaultTarget,
      reminderEnabled: true,
      reminderIntervalMinutes: 90,
    });

    return {
      targetMl: created.targetMl,
      reminderEnabled: created.reminderEnabled,
      reminderIntervalMinutes: created.reminderIntervalMinutes,
    };
  }

  async addWater(userId: string, input: CreateWaterLogInput) {
    const recordedAt = input.recordedAt ? new Date(input.recordedAt) : new Date();
    const dateString = input.dateString || this.getTodayString();

    const log = await this.repo.createLog({
      userId: userId as any,
      quantityMl: input.quantityMl,
      beverageType: input.beverageType || BeverageType.WATER,
      dateString,
      recordedAt,
      notes: input.notes,
    });

    const todaySummary = await this.getTodaySummary(userId);
    return { log, todaySummary };
  }

  async getTodaySummary(userId: string) {
    const today = this.getTodayString();
    const logs = await this.repo.findLogsByDate(userId, today);
    const goal = await this.getWaterGoal(userId);

    const totalWaterMl = logs
      .filter((l) => l.beverageType === BeverageType.WATER)
      .reduce((sum, l) => sum + l.quantityMl, 0);

    const otherBeveragesMl = logs
      .filter((l) => l.beverageType !== BeverageType.WATER)
      .reduce((sum, l) => sum + l.quantityMl, 0);

    const totalConsumedMl = totalWaterMl + otherBeveragesMl;
    const remainingMl = goal.targetMl - totalWaterMl;
    const progressRatio = Math.min(totalWaterMl / (goal.targetMl || 1), 1);

    return {
      date: today,
      targetMl: goal.targetMl,
      totalWaterMl,
      otherBeveragesMl,
      totalConsumedMl,
      remainingMl: remainingMl >= 0 ? remainingMl : 0,
      excessMl: remainingMl < 0 ? Math.abs(remainingMl) : 0,
      progressRatio,
      progressPercentage: Math.round(progressRatio * 100),
      reminderEnabled: goal.reminderEnabled,
      reminderIntervalMinutes: goal.reminderIntervalMinutes,
      entriesCount: logs.length,
      logs,
    };
  }

  async getWeeklySummary(userId: string) {
    const today = new Date();
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const startDate = days[0];
    const endDate = days[days.length - 1];
    const logs = await this.repo.findLogsByDateRange(userId, startDate, endDate);
    const goal = await this.getWaterGoal(userId);

    const dayMap = new Map<string, number>();
    for (const d of days) dayMap.set(d, 0);

    for (const log of logs) {
      if (dayMap.has(log.dateString)) {
        dayMap.set(log.dateString, dayMap.get(log.dateString)! + log.quantityMl);
      }
    }

    const history = days.map((date) => {
      const consumed = dayMap.get(date)!;
      return {
        date,
        consumedMl: consumed,
        targetMl: goal.targetMl,
        achieved: consumed >= goal.targetMl,
      };
    });

    const totalConsumed = history.reduce((sum, h) => sum + h.consumedMl, 0);
    const avgDailyMl = Math.round(totalConsumed / 7);

    return {
      startDate,
      endDate,
      targetMl: goal.targetMl,
      totalConsumedMl: totalConsumed,
      avgDailyMl,
      history,
    };
  }

  async getHistory(userId: string, input: QueryWaterHistoryInput) {
    const today = this.getTodayString();
    const startDate = input.startDate || input.date || today;
    const endDate = input.endDate || input.date || today;

    const logs = await this.repo.findLogsByDateRange(userId, startDate, endDate);
    return { startDate, endDate, total: logs.length, logs };
  }

  async updateWaterGoal(userId: string, input: UpdateWaterGoalInput) {
    return this.repo.upsertGoal(userId, input);
  }

  async deleteWaterLog(id: string, userId: string) {
    const deleted = await this.repo.deleteLog(id, userId);
    const summary = await this.getTodaySummary(userId);
    return { success: deleted, summary };
  }
}

