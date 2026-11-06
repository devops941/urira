import { bmiRepository } from '../bmi/bmi.repository.js';
import { calorieRepository } from '../calories/calories.repository.js';
import { healthGoalsRepository } from '../health-goals/health-goals.repository.js';
import { healthProfileRepository } from '../health-profile/health-profile.repository.js';

export interface UnifiedHistoryItemDto {
  id: string;
  sourceType: 'BMI' | 'CALORIES' | 'GOAL' | 'PROFILE';
  title: string;
  category: string;
  categoryColor: string;
  mainValue: string;
  secondaryDetails: string;
  status?: string;
  timestamp: Date;
  rawId: string;
}

export class HealthHistoryService {
  async getUnifiedHistory(
    userId: string,
    categoryFilter: string = 'ALL',
    limit: number = 50
  ): Promise<UnifiedHistoryItemDto[]> {
    const items: UnifiedHistoryItemDto[] = [];
    const filter = (categoryFilter || 'ALL').toUpperCase();

    // 1. BMI Records
    if (filter === 'ALL' || filter === 'BMI' || filter === 'WEIGHT') {
      const bmis = await bmiRepository.findByUserId(userId, limit);
      for (const b of bmis) {
        items.push({
          id: `bmi_${b._id}`,
          sourceType: 'BMI',
          title: 'BMI Calculation',
          category: 'BMI & Body Mass',
          categoryColor: b.categoryColor || '#16A34A',
          mainValue: `${b.bmiValue} BMI`,
          secondaryDetails: `${b.category} • ${b.weightKg} kg / ${b.heightCm} cm`,
          status: b.category,
          timestamp: b.calculatedAt,
          rawId: b._id.toString(),
        });
      }
    }

    // 2. Calorie Records
    if (filter === 'ALL' || filter === 'CALORIES') {
      const calories = await calorieRepository.findByUserId(userId, limit);
      for (const c of calories) {
        const goalLabel = c.goal.replace('_', ' ');
        items.push({
          id: `cal_${c._id}`,
          sourceType: 'CALORIES',
          title: 'Daily Calorie Target',
          category: 'Nutrition & Energy',
          categoryColor: '#F97316',
          mainValue: `${c.estimatedDailyCalories} kcal/day`,
          secondaryDetails: `BMR: ${c.bmr} kcal • TDEE: ${c.tdee} kcal • ${goalLabel}`,
          status: c.goal,
          timestamp: c.calculatedAt,
          rawId: c._id.toString(),
        });
      }
    }

    // 3. Health Goals
    if (filter === 'ALL' || filter === 'GOALS' || filter === 'WEIGHT') {
      const goals = await healthGoalsRepository.findByUserId(userId);
      for (const g of goals) {
        if (filter === 'WEIGHT' && g.category !== 'WEIGHT') continue;
        items.push({
          id: `goal_${g._id}`,
          sourceType: 'GOAL',
          title: `Goal: ${g.title}`,
          category: `Goal • ${g.category}`,
          categoryColor: g.categoryColor || '#16A34A',
          mainValue: `${g.currentValue} / ${g.targetValue} ${g.unit}`,
          secondaryDetails: `${g.progressPercentage}% progress • Target: ${new Date(g.targetDate).toLocaleDateString()}`,
          status: g.status,
          timestamp: g.updatedAt || g.createdAt,
          rawId: g._id.toString(),
        });
      }
    }

    // 4. Profile Updates (if exists)
    if (filter === 'ALL' || filter === 'PROFILE') {
      const profile = await healthProfileRepository.findByUserId(userId);
      if (profile) {
        items.push({
          id: `prof_${profile._id}`,
          sourceType: 'PROFILE',
          title: 'Health Profile Active',
          category: 'Personal Profile',
          categoryColor: '#12372A',
          mainValue: `${profile.completionPercentage}% Complete`,
          secondaryDetails: `Goal: ${profile.healthGoal.replace('_', ' ')} • Water: ${profile.preferredWaterIntakeMl} ml`,
          status: 'ACTIVE',
          timestamp: profile.updatedAt,
          rawId: profile._id.toString(),
        });
      }
    }

    // Sort descending by timestamp
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return items.slice(0, limit);
  }

  async getHistoryDetail(id: string, userId: string): Promise<any | null> {
    if (id.startsWith('bmi_')) {
      const rawId = id.replace('bmi_', '');
      return bmiRepository.findByIdAndUserId(rawId, userId);
    }
    if (id.startsWith('cal_')) {
      const rawId = id.replace('cal_', '');
      return calorieRepository.findByIdAndUserId(rawId, userId);
    }
    if (id.startsWith('goal_')) {
      const rawId = id.replace('goal_', '');
      return healthGoalsRepository.findByIdAndUserId(rawId, userId);
    }
    if (id.startsWith('prof_')) {
      return healthProfileRepository.findByUserId(userId);
    }
    // Try finding by rawId across BMI or Calorie or Goal
    const bmi = await bmiRepository.findByIdAndUserId(id, userId);
    if (bmi) return bmi;
    const cal = await calorieRepository.findByIdAndUserId(id, userId);
    if (cal) return cal;
    const goal = await healthGoalsRepository.findByIdAndUserId(id, userId);
    if (goal) return goal;
    return null;
  }

  async deleteHistoryItem(id: string, userId: string): Promise<boolean> {
    if (id.startsWith('bmi_')) {
      const rawId = id.replace('bmi_', '');
      return !!(await bmiRepository.deleteByIdAndUserId(rawId, userId));
    }
    if (id.startsWith('cal_')) {
      const rawId = id.replace('cal_', '');
      return !!(await calorieRepository.deleteByIdAndUserId(rawId, userId));
    }
    if (id.startsWith('goal_')) {
      const rawId = id.replace('goal_', '');
      return !!(await healthGoalsRepository.deleteByIdAndUserId(rawId, userId));
    }
    // Raw ID fallbacks
    const deletedBmi = await bmiRepository.deleteByIdAndUserId(id, userId);
    if (deletedBmi) return true;
    const deletedCal = await calorieRepository.deleteByIdAndUserId(id, userId);
    if (deletedCal) return true;
    const deletedGoal = await healthGoalsRepository.deleteByIdAndUserId(id, userId);
    if (deletedGoal) return true;
    return false;
  }
}

export const healthHistoryService = new HealthHistoryService();

