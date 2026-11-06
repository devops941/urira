import { VitalRepository } from './vital.repository.js';
import {
  CreateVitalInput,
  QueryVitalHistoryInput,
} from './vital.validation.js';
import { VitalMetricType, IVitalRecordDocument } from './vital.model.js';

export class VitalService {
  private repo: VitalRepository;

  constructor() {
    this.repo = new VitalRepository();
  }

  private getDefaultUnit(type: VitalMetricType): string {
    switch (type) {
      case VitalMetricType.HEART_RATE:
        return 'bpm';
      case VitalMetricType.BLOOD_PRESSURE:
        return 'mmHg';
      case VitalMetricType.BLOOD_OXYGEN:
        return '%';
      case VitalMetricType.BODY_TEMPERATURE:
        return '°C';
    }
  }

  async addVitalRecord(userId: string, input: CreateVitalInput) {
    const measuredAt = input.measuredAt ? new Date(input.measuredAt) : new Date();
    const dateString = measuredAt.toISOString().split('T')[0];
    const unit = input.unit || this.getDefaultUnit(input.metricType);

    const record = await this.repo.create({
      userId: userId as any,
      metricType: input.metricType,
      value: input.value,
      systolic: input.systolic,
      diastolic: input.diastolic,
      unit,
      source: input.source,
      deviceIdentifier: input.deviceIdentifier,
      measuredAt,
      dateString,
      notes: input.notes,
    });

    return record;
  }

  async getLatestSnapshot(userId: string) {
    const [heartRate, bloodPressure, bloodOxygen, temperature] = await Promise.all([
      this.repo.findLatestByMetric(userId, VitalMetricType.HEART_RATE),
      this.repo.findLatestByMetric(userId, VitalMetricType.BLOOD_PRESSURE),
      this.repo.findLatestByMetric(userId, VitalMetricType.BLOOD_OXYGEN),
      this.repo.findLatestByMetric(userId, VitalMetricType.BODY_TEMPERATURE),
    ]);

    return {
      heartRate: heartRate
        ? {
            value: heartRate.value,
            unit: heartRate.unit,
            measuredAt: heartRate.measuredAt,
            source: heartRate.source,
          }
        : null,
      bloodPressure: bloodPressure
        ? {
            systolic: bloodPressure.systolic,
            diastolic: bloodPressure.diastolic,
            unit: bloodPressure.unit,
            measuredAt: bloodPressure.measuredAt,
            source: bloodPressure.source,
          }
        : null,
      bloodOxygen: bloodOxygen
        ? {
            value: bloodOxygen.value,
            unit: bloodOxygen.unit,
            measuredAt: bloodOxygen.measuredAt,
            source: bloodOxygen.source,
          }
        : null,
      temperature: temperature
        ? {
            value: temperature.value,
            unit: temperature.unit,
            measuredAt: temperature.measuredAt,
            source: temperature.source,
          }
        : null,
    };
  }

  async getHistory(userId: string, input: QueryVitalHistoryInput) {
    return this.repo.findHistory(userId, {
      metricType: input.metricType,
      startDate: input.startDate,
      endDate: input.endDate,
      limit: input.limit || 30,
    });
  }

  async deleteRecord(id: string, userId: string) {
    return this.repo.delete(id, userId);
  }
}

