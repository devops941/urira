import { apiClient } from '../api/axiosInstance';
import {
  IVitalRecord,
  IVitalsLatestSnapshot,
  VitalMetricType,
} from '../../types/wellness';

export const vitalService = {
  async addVital(data: {
    metricType?: VitalMetricType | string;
    type?: VitalMetricType | string;
    value?: number;
    heartRate?: number;
    systolic?: number;
    bloodPressureSystolic?: number;
    diastolic?: number;
    bloodPressureDiastolic?: number;
    bloodOxygen?: number;
    bodyTemperatureCelsius?: number;
    unit?: string;
    source?: string;
    notes?: string;
  }): Promise<IVitalRecord> {
    const metricType = (data.metricType || data.type || VitalMetricType.HEART_RATE) as VitalMetricType;
    let val = data.value;
    let unit = data.unit || '';
    if (metricType === VitalMetricType.HEART_RATE) {
      val = data.heartRate || data.value;
      unit = 'bpm';
    } else if (metricType === VitalMetricType.BLOOD_OXYGEN) {
      val = data.bloodOxygen || data.value;
      unit = '%';
    } else if (metricType === VitalMetricType.BODY_TEMPERATURE) {
      val = data.bodyTemperatureCelsius || data.value;
      unit = '°C';
    } else if (metricType === VitalMetricType.BLOOD_PRESSURE) {
      unit = 'mmHg';
    }

    const payload = {
      metricType,
      value: val,
      systolic: data.systolic || data.bloodPressureSystolic,
      diastolic: data.diastolic || data.bloodPressureDiastolic,
      unit,
      source: data.source || 'MANUAL',
      notes: data.notes,
    };
    const res = await apiClient.post('/vitals', payload);
    return res.data.data;
  },

  async recordVital(data: any): Promise<IVitalRecord> {
    return this.addVital(data);
  },

  async getLatestSnapshot(): Promise<IVitalsLatestSnapshot> {
    const res = await apiClient.get('/vitals/latest');
    return res.data.data;
  },

  async getHistory(params?: {
    metricType?: VitalMetricType;
    startDate?: string;
    endDate?: string;
  }): Promise<IVitalRecord[]> {
    const res = await apiClient.get('/vitals/history', { params });
    return res.data.data;
  },

  async deleteVital(id: string): Promise<boolean> {
    const res = await apiClient.delete(`/vitals/${id}`);
    return res.data.success;
  },

  async deleteRecord(id: string): Promise<boolean> {
    return this.deleteVital(id);
  },
};
