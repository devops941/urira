import { SleepRepository } from './sleep.repository.js';
import { HealthProfileModel } from '../health-profile/health-profile.model.js';
import {
  CreateSleepInput,
  UpdateSleepInput,
  QuerySleepHistoryInput,
} from './sleep.validation.js';
import { ISleepRecordDocument } from './sleep.model.js';

export class SleepService {
  private repo: SleepRepository;

  constructor() {
    this.repo = new SleepRepository();
  }

  private calculateDurationMinutes(bedtime: Date, wakeTime: Date): number {
    let diffMs = wakeTime.getTime() - bedtime.getTime();
    if (diffMs < 0) {
      // Midnight crossover if entered on the same calendar day
      diffMs += 24 * 60 * 60 * 1000;
    }
    return Math.max(Math.round(diffMs / (1000 * 60)), 10);
  }

  async addSleepRecord(userId: string, input: CreateSleepInput) {
    const bed = new Date(input.bedtime);
    const wake = new Date(input.wakeTime);

    const durationMinutes =
      input.durationMinutes !== undefined
        ? input.durationMinutes
        : this.calculateDurationMinutes(bed, wake);

    const dateString =
      input.dateString || wake.toISOString().split('T')[0];

    const record = await this.repo.create({
      userId: userId as any,
      bedtime: bed,
      wakeTime: wake,
      durationMinutes,
      sleepQuality: input.sleepQuality,
      source: input.source,
      notes: input.notes,
      dateString,
    });

    return record;
  }

  async getLatest(userId: string) {
    const latest = await this.repo.findLatest(userId);
    const profile = await HealthProfileModel.findOne({ userId }).exec();
    const sleepGoalHours = profile?.preferredSleepGoalHours || 8;

    if (!latest) {
      return {
        hasRecord: false,
        sleepGoalHours,
        latest: null,
      };
    }

    const durationHours = Math.round((latest.durationMinutes / 60) * 10) / 10;
    const goalRatio = Math.min(durationHours / sleepGoalHours, 1);

    return {
      hasRecord: true,
      sleepGoalHours,
      durationHours,
      goalPercentage: Math.round(goalRatio * 100),
      latest,
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
    const records = await this.repo.findByDateRange(userId, startDate, endDate);
    const profile = await HealthProfileModel.findOne({ userId }).exec();
    const sleepGoalHours = profile?.preferredSleepGoalHours || 8;

    const dayMap = new Map<string, number>();
    for (const d of days) dayMap.set(d, 0);

    for (const r of records) {
      if (dayMap.has(r.dateString)) {
        dayMap.set(r.dateString, r.durationMinutes);
      }
    }

    const history = days.map((date) => {
      const mins = dayMap.get(date)!;
      const hours = Math.round((mins / 60) * 10) / 10;
      return {
        date,
        durationMinutes: mins,
        durationHours: hours,
        goalHours: sleepGoalHours,
        goalReached: hours >= sleepGoalHours,
      };
    });

    const totalMinutes = records.reduce((sum, r) => sum + r.durationMinutes, 0);
    const avgDurationHours =
      records.length > 0
        ? Math.round((totalMinutes / records.length / 60) * 10) / 10
        : 0;

    return {
      startDate,
      endDate,
      sleepGoalHours,
      avgDurationHours,
      totalRecords: records.length,
      history,
    };
  }

  async getHistory(userId: string, input: QuerySleepHistoryInput) {
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 30);

    const startDate = input.startDate || defaultStart.toISOString().split('T')[0];
    const endDate = input.endDate || today.toISOString().split('T')[0];

    const records = await this.repo.findByDateRange(userId, startDate, endDate);
    return { startDate, endDate, total: records.length, records };
  }

  async updateSleepRecord(id: string, userId: string, input: UpdateSleepInput) {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw new Error('Sleep record not found');

    const updates: Partial<ISleepRecordDocument> = {};
    const bed = input.bedtime ? new Date(input.bedtime) : existing.bedtime;
    const wake = input.wakeTime ? new Date(input.wakeTime) : existing.wakeTime;

    if (input.bedtime || input.wakeTime) {
      updates.bedtime = bed;
      updates.wakeTime = wake;
      updates.durationMinutes =
        input.durationMinutes ?? this.calculateDurationMinutes(bed, wake);
    }
    if (input.sleepQuality) updates.sleepQuality = input.sleepQuality;
    if (input.notes !== undefined) updates.notes = input.notes;

    const updated = await this.repo.update(id, userId, updates);
    return updated;
  }

  async deleteSleepRecord(id: string, userId: string) {
    return this.repo.delete(id, userId);
  }
}

