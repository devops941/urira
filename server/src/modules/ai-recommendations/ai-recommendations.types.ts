export type AiRecommendationType =
  | 'HEALTH_GOALS'
  | 'EXPLAIN_BMI'
  | 'EXPLAIN_CALORIES'
  | 'HEALTH_SUMMARY';

export interface AiGoalSuggestionItem {
  title: string;
  category: 'WEIGHT' | 'BMI' | 'STEPS' | 'WATER' | 'SLEEP' | 'CALORIES' | 'HABIT';
  targetValue: number;
  initialValue: number;
  unit: string;
  durationDays: number;
  reason: string;
  dailyActions: string[];
  safetyNotes: string[];
}

export interface AiGoalSuggestionsResponse {
  summary: string;
  suggestions: AiGoalSuggestionItem[];
  disclaimer: string;
}

export interface AiBmiExplanationResponse {
  bmiValue: number;
  category: string;
  summary: string;
  clinicalContext: string;
  healthyLifestyleTips: string[];
  whenToSeekDoctor: string;
  disclaimer: string;
}

export interface AiCalorieExplanationResponse {
  bmr: number;
  tdee: number;
  goalTarget: number;
  goalType: string;
  summary: string;
  energyBalanceInsight: string;
  sustainableHabits: string[];
  safetyGuidance: string;
  disclaimer: string;
}

export interface AiHealthSummaryResponse {
  greeting: string;
  overallWellnessStatus: string;
  keyHighlights: string[];
  suggestedFocusForToday: string;
  encouragementQuote: string;
  disclaimer: string;
}

