import { healthGoalsRepository } from './health-goals.repository.js';
import { IHealthGoal, GoalCategory, GoalStatus } from './health-goals.model.js';

export interface CreateGoalDto {
  title: string;
  category: GoalCategory;
  targetValue: number;
  initialValue?: number;
  currentValue?: number;
  unit: string;
  startDate?: string | Date;
  targetDate: string | Date;
  notes?: string;
}

export interface UpdateGoalDto {
  title?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate?: string | Date;
  status?: GoalStatus;
  notes?: string;
}

export interface HealthGoalDto {
  id: string;
  userId: string;
  title: string;
  category: GoalCategory;
  categoryColor: string;
  targetValue: number;
  initialValue: number;
  currentValue: number;
  unit: string;
  startDate: Date;
  targetDate: Date;
  status: GoalStatus;
  progressPercentage: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class HealthGoalsService {
  private getCategoryColor(category: GoalCategory): string {
    switch (category) {
      case 'STEPS':
        return '#0EA5E9';
      case 'SLEEP':
        return '#8B5CF6';
      case 'CALORIES':
        return '#F97316';
      case 'WATER':
        return '#06B6D4';
      case 'WEIGHT':
        return '#E11D48';
      case 'BMI':
      case 'HABIT':
      default:
        return '#16A34A';
    }
  }

  public calculateProgress(initial: number, target: number, current: number): number {
    if (initial === target) {
      return current === target ? 100 : 0;
    }
    let pct: number;
    if (target > initial) {
      pct = ((current - initial) / (target - initial)) * 100;
    } else {
      pct = ((initial - current) / (initial - target)) * 100;
    }
    if (isNaN(pct) || !isFinite(pct)) return 0;
    return Math.max(0, Math.min(100, Math.round(pct * 10) / 10));
  }

  async createGoal(userId: string, input: CreateGoalDto): Promise<HealthGoalDto> {
    const initial = input.initialValue !== undefined ? input.initialValue : 0;
    const current = input.currentValue !== undefined ? input.currentValue : initial;
    const progress = this.calculateProgress(initial, input.targetValue, current);
    const color = this.getCategoryColor(input.category);

    const goal = await healthGoalsRepository.create({
      userId: userId as any,
      title: input.title.trim(),
      category: input.category,
      targetValue: input.targetValue,
      initialValue: initial,
      currentValue: current,
      unit: input.unit.trim(),
      startDate: input.startDate ? new Date(input.startDate) : new Date(),
      targetDate: new Date(input.targetDate),
      status: 'ACTIVE',
      progressPercentage: progress,
      notes: input.notes?.trim() || '',
      categoryColor: color,
    });

    return this.toDto(goal);
  }

  async getGoals(userId: string, status?: GoalStatus): Promise<HealthGoalDto[]> {
    const goals = await healthGoalsRepository.findByUserId(userId, status);
    return goals.map((g) => this.toDto(g));
  }

  async getActiveGoals(userId: string): Promise<HealthGoalDto[]> {
    const goals = await healthGoalsRepository.findActiveByUserId(userId);
    return goals.map((g) => this.toDto(g));
  }

  async getById(id: string, userId: string): Promise<HealthGoalDto | null> {
    const goal = await healthGoalsRepository.findByIdAndUserId(id, userId);
    return goal ? this.toDto(goal) : null;
  }

  async updateGoal(id: string, userId: string, update: UpdateGoalDto): Promise<HealthGoalDto | null> {
    const existing = await healthGoalsRepository.findByIdAndUserId(id, userId);
    if (!existing) return null;

    const initial = existing.initialValue;
    const target = update.targetValue !== undefined ? update.targetValue : existing.targetValue;
    const current = update.currentValue !== undefined ? update.currentValue : existing.currentValue;
    const progress = this.calculateProgress(initial, target, current);

    const updated = await healthGoalsRepository.updateByIdAndUserId(id, userId, {
      ...update,
      targetDate: update.targetDate ? new Date(update.targetDate) : existing.targetDate,
      progressPercentage: progress,
    });

    return updated ? this.toDto(updated) : null;
  }

  async updateProgress(id: string, userId: string, currentValue: number): Promise<HealthGoalDto | null> {
    const existing = await healthGoalsRepository.findByIdAndUserId(id, userId);
    if (!existing) return null;

    const progress = this.calculateProgress(existing.initialValue, existing.targetValue, currentValue);
    const updated = await healthGoalsRepository.updateByIdAndUserId(id, userId, {
      currentValue,
      progressPercentage: progress,
    });

    return updated ? this.toDto(updated) : null;
  }

  async pauseGoal(id: string, userId: string): Promise<HealthGoalDto | null> {
    const updated = await healthGoalsRepository.updateByIdAndUserId(id, userId, {
      status: 'PAUSED',
    });
    return updated ? this.toDto(updated) : null;
  }

  async resumeGoal(id: string, userId: string): Promise<HealthGoalDto | null> {
    const updated = await healthGoalsRepository.updateByIdAndUserId(id, userId, {
      status: 'ACTIVE',
    });
    return updated ? this.toDto(updated) : null;
  }

  async deleteGoal(id: string, userId: string): Promise<boolean> {
    const deleted = await healthGoalsRepository.deleteByIdAndUserId(id, userId);
    return !!deleted;
  }

  private toDto(doc: IHealthGoal): HealthGoalDto {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      title: doc.title,
      category: doc.category,
      categoryColor: doc.categoryColor || this.getCategoryColor(doc.category),
      targetValue: doc.targetValue,
      initialValue: doc.initialValue,
      currentValue: doc.currentValue,
      unit: doc.unit,
      startDate: doc.startDate,
      targetDate: doc.targetDate,
      status: doc.status,
      progressPercentage: doc.progressPercentage,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

export const healthGoalsService = new HealthGoalsService();

