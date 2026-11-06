import { z } from 'zod';

// Zod schema for validating OpenAI Goal Suggestions output
export const AiGoalSuggestionItemSchema = z.object({
  title: z.string().min(3),
  category: z.enum([
    'WEIGHT',
    'BMI',
    'STEPS',
    'WATER',
    'SLEEP',
    'CALORIES',
    'HABIT',
  ]),
  targetValue: z.number().positive(),
  initialValue: z.number().nonnegative(),
  unit: z.string().min(1),
  durationDays: z.number().int().min(7).max(365),
  reason: z.string().min(5),
  dailyActions: z.array(z.string().min(3)).min(1),
  safetyNotes: z.array(z.string()).default([]),
});

export const AiGoalSuggestionsResponseSchema = z.object({
  summary: z.string().min(5),
  suggestions: z.array(AiGoalSuggestionItemSchema).min(1).max(5),
  disclaimer: z.string().min(5),
});

// Zod schema for validating OpenAI BMI Explanation output
export const AiBmiExplanationResponseSchema = z.object({
  bmiValue: z.number(),
  category: z.string(),
  summary: z.string().min(5),
  clinicalContext: z.string().min(5),
  healthyLifestyleTips: z.array(z.string().min(3)).min(1),
  whenToSeekDoctor: z.string().min(5),
  disclaimer: z.string().min(5),
});

// Zod schema for validating OpenAI Calorie Explanation output
export const AiCalorieExplanationResponseSchema = z.object({
  bmr: z.number(),
  tdee: z.number(),
  goalTarget: z.number(),
  goalType: z.string(),
  summary: z.string().min(5),
  energyBalanceInsight: z.string().min(5),
  sustainableHabits: z.array(z.string().min(3)).min(1),
  safetyGuidance: z.string().min(5),
  disclaimer: z.string().min(5),
});

// Zod schema for validating OpenAI Health Summary output
export const AiHealthSummaryResponseSchema = z.object({
  greeting: z.string().min(2),
  overallWellnessStatus: z.string().min(5),
  keyHighlights: z.array(z.string().min(3)).min(1),
  suggestedFocusForToday: z.string().min(5),
  encouragementQuote: z.string().min(5),
  disclaimer: z.string().min(5),
});

// Request body schemas
export const explainBmiRequestSchema = z.object({
  bmiId: z.string().optional(),
});

export const explainCaloriesRequestSchema = z.object({
  calorieId: z.string().optional(),
});

