import { z } from 'zod';
import {
  MedicationType,
  MedicationFrequency,
  DoseStatus,
} from './medication.model.js';

const timeFormatSchema = z.string().transform((val) => {
  const trimmed = val.trim();
  // If single digit hour like 9:00 -> convert to 09:00
  if (/^\d{1}:\d{2}$/.test(trimmed)) {
    return `0${trimmed}`;
  }
  return trimmed;
}).pipe(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format (e.g. 09:00)'));

export const CreateMedicationSchema = z.object({
  name: z.string().trim().min(2, 'Medication name must be at least 2 characters').max(100),
  type: z.nativeEnum(MedicationType).default(MedicationType.TABLET),
  strength: z.string().max(50).optional(),
  instructions: z.string().max(300).optional(),
  frequency: z.nativeEnum(MedicationFrequency).default(MedicationFrequency.ONCE_DAILY),
  scheduledTimes: z.array(timeFormatSchema).min(1, 'Please specify at least one scheduled time'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reminderEnabled: z.boolean().default(true),
  alarmEnabled: z.boolean().default(false).optional(),
  prescriber: z.string().max(100).optional(),
});

export const UpdateMedicationSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  type: z.nativeEnum(MedicationType).optional(),
  strength: z.string().max(50).optional(),
  instructions: z.string().max(300).optional(),
  frequency: z.nativeEnum(MedicationFrequency).optional(),
  scheduledTimes: z.array(timeFormatSchema).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reminderEnabled: z.boolean().optional(),
  alarmEnabled: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const RecordDoseSchema = z.object({
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.nativeEnum(DoseStatus),
  notes: z.string().max(200).optional(),
});

export type CreateMedicationInput = z.infer<typeof CreateMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof UpdateMedicationSchema>;
export type RecordDoseInput = z.infer<typeof RecordDoseSchema>;

