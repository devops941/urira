import { MedicationRepository } from './medication.repository.js';
import {
  CreateMedicationInput,
  UpdateMedicationInput,
  RecordDoseInput,
} from './medication.validation.js';
import { DoseStatus, IMedicationDocument } from './medication.model.js';

export class MedicationService {
  private repo: MedicationRepository;

  constructor() {
    this.repo = new MedicationRepository();
  }

  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  async addMedication(userId: string, input: CreateMedicationInput) {
    const med = await this.repo.create({
      userId: userId as any,
      name: input.name,
      type: input.type,
      strength: input.strength,
      instructions: input.instructions,
      frequency: input.frequency,
      scheduledTimes: input.scheduledTimes,
      startDate: input.startDate,
      endDate: input.endDate,
      reminderEnabled: input.reminderEnabled,
      alarmEnabled: input.alarmEnabled ?? false,
      prescriber: input.prescriber,
      isActive: true,
    });
    return med;
  }

  async getActiveMedications(userId: string) {
    return this.repo.findActiveByUser(userId);
  }

  async getMedicationById(id: string, userId: string) {
    return this.repo.findById(id, userId);
  }

  async updateMedication(id: string, userId: string, input: UpdateMedicationInput) {
    return this.repo.update(id, userId, input);
  }

  async deleteMedication(id: string, userId: string) {
    return this.repo.delete(id, userId);
  }

  async recordDose(id: string, userId: string, input: RecordDoseInput) {
    const med = await this.repo.findById(id, userId);
    if (!med) throw new Error('Medication schedule not found');

    const dateString = input.dateString || this.getTodayString();
    return this.repo.recordDose(
      userId,
      id,
      input.scheduledTime,
      dateString,
      input.status,
      input.notes
    );
  }

  async getTodaySchedule(userId: string) {
    const today = this.getTodayString();
    const activeMeds = await this.repo.findActiveByUser(userId);
    const loggedDoses = await this.repo.getDosesByDate(userId, today);

    // Map existing dose events by `${medicationId}-${scheduledTime}`
    const doseMap = new Map<string, DoseStatus>();
    for (const d of loggedDoses) {
      const key = `${(d.medicationId as any)._id?.toString() || (d.medicationId as any).toString()}-${d.scheduledTime}`;
      doseMap.set(key, d.status);
    }

    const todayDoses: Array<{
      medicationId: string;
      name: string;
      type: string;
      strength?: string;
      instructions?: string;
      scheduledTime: string;
      alarmEnabled?: boolean;
      status: DoseStatus;
    }> = [];

    for (const med of activeMeds) {
      // Check if today falls between startDate and endDate
      if (med.startDate > today) continue;
      if (med.endDate && med.endDate < today) continue;

      for (const time of med.scheduledTimes) {
        const key = `${med._id.toString()}-${time}`;
        const status = doseMap.get(key) || DoseStatus.PENDING;

        todayDoses.push({
          medicationId: med._id.toString(),
          name: med.name,
          type: med.type,
          strength: med.strength,
          instructions: med.instructions,
          scheduledTime: time,
          alarmEnabled: med.alarmEnabled ?? false,
          status,
        });
      }
    }

    // Sort by scheduled time
    todayDoses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    const totalScheduled = todayDoses.length;
    const takenCount = todayDoses.filter((d) => d.status === DoseStatus.TAKEN).length;
    const adherencePercentage =
      totalScheduled > 0 ? Math.round((takenCount / totalScheduled) * 100) : 100;

    return {
      date: today,
      totalScheduled,
      takenCount,
      adherencePercentage,
      doses: todayDoses,
    };
  }

  async getAdherenceSummary(userId: string) {
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 14);

    const startDate = defaultStart.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const history = await this.repo.getAdherenceHistory(userId, startDate, endDate);

    const total = history.length;
    const taken = history.filter((h) => h.status === DoseStatus.TAKEN).length;
    const skipped = history.filter((h) => h.status === DoseStatus.SKIPPED).length;
    const missed = history.filter((h) => h.status === DoseStatus.MISSED).length;

    const rate = total > 0 ? Math.round((taken / total) * 100) : 100;

    return {
      startDate,
      endDate,
      totalRecordedDoses: total,
      takenCount: taken,
      skippedCount: skipped,
      missedCount: missed,
      adherenceRate: rate,
      history,
    };
  }

  async getRangeSummary(userId: string, startDate?: string, endDate?: string) {
    const today = this.getTodayString();
    let startStr = startDate || today;
    let endStr = endDate || startStr;

    if (startStr > endStr) {
      const tmp = startStr;
      startStr = endStr;
      endStr = tmp;
    }

    const history = await this.repo.getAdherenceHistory(userId, startStr, endStr);
    const activeMeds = await this.repo.findActiveByUser(userId);

    const totalDoses = history.length;
    const takenCount = history.filter((h) => h.status === DoseStatus.TAKEN).length;
    const skippedCount = history.filter((h) => h.status === DoseStatus.SKIPPED).length;
    const missedCount = history.filter((h) => h.status === DoseStatus.MISSED).length;
    const adherenceRate = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 100;

    const startObj = new Date(startStr + 'T00:00:00Z');
    const endObj = new Date(endStr + 'T00:00:00Z');
    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.max(1, Math.round((endObj.getTime() - startObj.getTime()) / msPerDay) + 1);

    const dayMap = new Map<string, { total: number; taken: number }>();
    for (const h of history) {
      const cur = dayMap.get(h.dateString) || { total: 0, taken: 0 };
      cur.total += 1;
      if (h.status === DoseStatus.TAKEN) cur.taken += 1;
      dayMap.set(h.dateString, cur);
    }

    const dailyBreakdown: Array<{
      date: string;
      label: string;
      totalScheduled: number;
      takenCount: number;
      adherenceRate: number;
    }> = [];

    if (diffDays <= 35) {
      const cur = new Date(startObj);
      while (cur <= endObj) {
        const dStr = cur.toISOString().split('T')[0];
        const stat = dayMap.get(dStr) || { total: 0, taken: 0 };
        const rate = stat.total > 0 ? Math.round((stat.taken / stat.total) * 100) : 100;
        const label = cur.toLocaleDateString('en-US', { weekday: 'narrow' });
        dailyBreakdown.push({
          date: dStr,
          label,
          totalScheduled: stat.total,
          takenCount: stat.taken,
          adherenceRate: rate,
        });
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      const monthMap = new Map<string, { total: number; taken: number }>();
      for (const [dStr, stat] of dayMap.entries()) {
        const ym = dStr.substring(0, 7);
        const curM = monthMap.get(ym) || { total: 0, taken: 0 };
        curM.total += stat.total;
        curM.taken += stat.taken;
        monthMap.set(ym, curM);
      }

      const startYear = parseInt(startStr.substring(0, 4), 10);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let m = 1; m <= 12; m++) {
        const mPad = m < 10 ? `0${m}` : `${m}`;
        const ym = `${startYear}-${mPad}`;
        const curM = monthMap.get(ym) || { total: 0, taken: 0 };
        const rate = curM.total > 0 ? Math.round((curM.taken / curM.total) * 100) : 100;
        dailyBreakdown.push({
          date: `${ym}-01`,
          label: monthNames[m - 1],
          totalScheduled: curM.total,
          takenCount: curM.taken,
          adherenceRate: rate,
        });
      }
    }

    return {
      startDate: startStr,
      endDate: endStr,
      daysCount: diffDays,
      activeMedicationsCount: activeMeds.length,
      totalDoses,
      takenCount,
      skippedCount,
      missedCount,
      adherenceRate,
      dailyBreakdown,
      history,
    };
  }
}

