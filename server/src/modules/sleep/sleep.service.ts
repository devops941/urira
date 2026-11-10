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

  async getRangeSummary(userId: string, startDate?: string, endDate?: string) {
    const today = new Date().toISOString().split('T')[0];
    let startStr = startDate || today;
    let endStr = endDate || startStr;

    if (startStr > endStr) {
      const tmp = startStr;
      startStr = endStr;
      endStr = tmp;
    }

    const records = await this.repo.findByDateRange(userId, startStr, endStr);
    const profile = await HealthProfileModel.findOne({ userId }).exec();
    const sleepGoalHours = profile?.preferredSleepGoalHours || 8;

    let totalMinutes = 0;
    const qualityMap: Record<string, number> = {};
    const dayMap = new Map<string, { durationMinutes: number; quality: string }>();

    for (const r of records) {
      totalMinutes += r.durationMinutes;
      const q = r.sleepQuality || 'GOOD';
      qualityMap[q] = (qualityMap[q] || 0) + 1;
      dayMap.set(r.dateString, { durationMinutes: r.durationMinutes, quality: q });
    }

    const startObj = new Date(startStr + 'T00:00:00Z');
    const endObj = new Date(endStr + 'T00:00:00Z');
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.max(1, Math.round((endObj.getTime() - startObj.getTime()) / msPerDay) + 1);

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const avgDurationHours = Math.round((totalMinutes / diffDays / 60) * 10) / 10;
    const optimalGoalNights = records.filter((r) => r.durationMinutes >= sleepGoalHours * 60).length;
    const adherencePercentage = Math.min(100, Math.round((optimalGoalNights / diffDays) * 100));

    const dailyBreakdown: Array<{
      date: string;
      label: string;
      durationMinutes: number;
      durationHours: number;
      goalHours: number;
      goalReached: boolean;
      quality: string;
    }> = [];

    if (diffDays <= 35) {
      const cur = new Date(startObj);
      while (cur <= endObj) {
        const dStr = cur.toISOString().split('T')[0];
        const stat = dayMap.get(dStr) || { durationMinutes: 0, quality: 'NONE' };
        const hrs = Math.round((stat.durationMinutes / 60) * 10) / 10;
        const label = cur.toLocaleDateString('en-US', { weekday: 'narrow' });
        dailyBreakdown.push({
          date: dStr,
          label,
          durationMinutes: stat.durationMinutes,
          durationHours: hrs,
          goalHours: sleepGoalHours,
          goalReached: hrs >= sleepGoalHours,
          quality: stat.quality,
        });
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      const monthMap = new Map<string, { totalMins: number; count: number }>();
      for (const [dStr, stat] of dayMap.entries()) {
        const ym = dStr.substring(0, 7);
        const curM = monthMap.get(ym) || { totalMins: 0, count: 0 };
        curM.totalMins += stat.durationMinutes;
        curM.count += 1;
        monthMap.set(ym, curM);
      }

      const startYear = parseInt(startStr.substring(0, 4), 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let m = 1; m <= 12; m++) {
        const mPad = m < 10 ? `0${m}` : `${m}`;
        const ym = `${startYear}-${mPad}`;
        const curM = monthMap.get(ym) || { totalMins: 0, count: 0 };
        const avgHrs = curM.count > 0 ? Math.round((curM.totalMins / curM.count / 60) * 10) / 10 : 0;
        dailyBreakdown.push({
          date: `${ym}-01`,
          label: monthNames[m - 1],
          durationMinutes: curM.totalMins,
          durationHours: avgHrs,
          goalHours: sleepGoalHours,
          goalReached: avgHrs >= sleepGoalHours,
          quality: 'AVERAGE',
        });
      }
    }

    return {
      startDate: startStr,
      endDate: endStr,
      daysCount: diffDays,
      sleepGoalHours,
      totalMinutes,
      totalHours,
      avgDurationHours,
      optimalGoalNights,
      adherencePercentage,
      qualityDistribution: qualityMap,
      dailyBreakdown,
      records,
    };
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

