import { apiClient } from '../api/axiosInstance';
import {
  IMedication,
  ITodayMedicationSchedule,
  DoseStatus,
  MedicationType,
} from '../../types/wellness';

export const medicationService = {
  async addMedication(data: {
    name: string;
    type?: MedicationType;
    formType?: MedicationType;
    dosage?: string;
    strength?: string;
    instructions?: string;
    foodInstruction?: string;
    frequency?: string;
    scheduledTimes: string[];
    startDate: string;
    endDate?: string;
    reminderEnabled?: boolean;
    alarmEnabled?: boolean;
    prescriber?: string;
  }): Promise<IMedication> {
    const payload = {
      name: data.name,
      type: data.formType || data.type || MedicationType.TABLET,
      strength: data.dosage || data.strength || '1 tablet',
      instructions: data.foodInstruction || data.instructions,
      frequency: data.frequency || 'ONCE_DAILY',
      scheduledTimes: data.scheduledTimes,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      reminderEnabled: data.reminderEnabled ?? true,
      alarmEnabled: data.alarmEnabled ?? false,
    };
    const res = await apiClient.post('/medications', payload);
    return res.data.data;
  },

  async createMedication(data: any): Promise<IMedication> {
    return this.addMedication(data);
  },

  async getActiveMedications(): Promise<IMedication[]> {
    const res = await apiClient.get('/medications');
    return res.data.data;
  },

  async getMedications(): Promise<IMedication[]> {
    return this.getActiveMedications();
  },

  async getTodaySchedule(): Promise<ITodayMedicationSchedule> {
    const res = await apiClient.get('/medications/today');
    return res.data.data;
  },

  async getTodayDoses(): Promise<any[]> {
    const sched = await this.getTodaySchedule();
    return sched?.doses || [];
  },

  async recordDose(
    medicationId: string,
    scheduledTime: string,
    status: DoseStatus,
    notes?: string
  ): Promise<any> {
    const res = await apiClient.post(`/medications/${medicationId}/doses/record`, {
      scheduledTime,
      status,
      notes,
    });
    return res.data.data;
  },

  async recordDoseEvent(medicationId: string, data: { scheduledTime: string; status: any }): Promise<any> {
    return this.recordDose(medicationId, data.scheduledTime, data.status);
  },

  async deleteMedication(id: string): Promise<boolean> {
    const res = await apiClient.delete(`/medications/${id}`);
    return res.data.success;
  },
};
