export type Timeframe = 'daily' | 'weekly' | 'monthly';

export interface HealthMetricDimension {
  name: string;
  score: number; // 0-100
  weight: number;
  status: 'OPTIMAL' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL';
  statusLabel: string;
  currentValue: string;
  targetValue: string;
  color: string;
}

export interface HealthDashboardDto {
  overallHealthScore: number;
  statusTag: string;
  timeframe: string;
  avatarSummary?: {
    title: string;
    description: string;
    fillPercentage: number;
    statusTier: 'PEAK' | 'ACTIVE' | 'LOW_ENERGY' | 'RECHARGE';
    statusHeading: string;
    statusMessage: string;
  };
  dimensions: HealthMetricDimension[];
  summaryObservations: string[];
  recommendations: string[];
  userSnapshot: {
    fullName: string;
    age?: number;
    biologicalSex?: string;
    bmi?: number;
    bmiCategory?: string;
  };
}

export interface TrendDataPoint {
  date: string;
  label: string;
  value: number;
  secondaryValue?: number;
}

export type NotificationType =
  | 'MEDICATION_REMINDER'
  | 'WATER_REMINDER'
  | 'GOAL_ACHIEVED'
  | 'HEALTH_ALERT'
  | 'SYSTEM';

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  categoryColor: string;
  actionRoute?: string;
  isRead: boolean;
  createdAt: string;
}

