import { aiProviderService, AiProviderService } from './ai-provider.service.js';
import { aiRecommendationRepository, AIRecommendationRepository } from './ai-recommendations.repository.js';
import { healthProfileRepository } from '../health-profile/health-profile.repository.js';
import { bmiRepository } from '../bmi/bmi.repository.js';
import { calorieRepository } from '../calories/calories.repository.js';
import { healthGoalsRepository } from '../health-goals/health-goals.repository.js';
import {
  AiGoalSuggestionsResponse,
  AiBmiExplanationResponse,
  AiCalorieExplanationResponse,
  AiHealthSummaryResponse,
} from './ai-recommendations.types.js';
import {
  AiGoalSuggestionsResponseSchema,
  AiBmiExplanationResponseSchema,
  AiCalorieExplanationResponseSchema,
  AiHealthSummaryResponseSchema,
} from './ai-recommendations.validation.js';

const SYSTEM_HEALTH_PERSONA = `You are UYIRA AI, a world-class preventative health and lifestyle companion built for the UYIRA Smart Health platform.
Your mission is to provide safe, realistic, empathetic, and evidence-based wellness guidance.

SAFETY AND HEALTHCARE COMPLIANCE RULES:
1. You DO NOT provide medical diagnoses or prescribe medical treatment.
2. You DO NOT recommend rapid, extreme, or starvation calorie deficits. Safe weight loss is 0.25kg to 0.75kg per week.
3. Every response MUST return clean JSON matching the exact requested schema.
4. Emphasize consistency, daily sustainable habits, proper hydration, restorative sleep, and regular movement.
5. Always include an honest medical disclaimer advising clinical consultation for personalized medical conditions.`;

export class AiRecommendationsService {
  constructor(
    private aiProvider: AiProviderService = aiProviderService,
    private repository: AIRecommendationRepository = aiRecommendationRepository
  ) {}

  /**
   * Generate personalized health goals based on user profile & history
   */
  async suggestGoals(userId: string): Promise<AiGoalSuggestionsResponse> {
    const profile = await healthProfileRepository.findByUserId(userId);
    const latestBmi = await bmiRepository.findLatestByUserId(userId);
    const existingGoals = await healthGoalsRepository.findByUserId(userId, 'ACTIVE');

    // Context minimization (only physiological attributes, zero PII)
    const context = {
      heightCm: profile?.heightCm || 170,
      weightKg: profile?.weightKg || 70,
      targetWeightKg: profile?.targetWeightKg || undefined,
      activityLevel: profile?.activityLevel || 'MODERATELY_ACTIVE',
      primaryHealthGoal: profile?.healthGoal || 'GENERAL_WELLNESS',
      dailyWaterMl: profile?.preferredWaterIntakeMl || 2500,
      dailySteps: profile?.preferredStepGoal || 8000,
      latestBmiCategory: latestBmi?.category || 'Healthy Weight',
      activeGoalsCount: existingGoals.length,
      existingGoalCategories: existingGoals.map((g) => g.category),
    };

    const userPrompt = `Based on the following user health baseline, suggest 3 to 4 achievable, high-impact wellness goals:
${JSON.stringify(context, null, 2)}

Return JSON with this EXACT structure:
{
  "summary": "1-2 sentence motivating summary tailored to the user",
  "suggestions": [
    {
      "title": "Clear action-oriented goal title",
      "category": "WEIGHT" | "BMI" | "STEPS" | "WATER" | "SLEEP" | "CALORIES" | "HABIT",
      "targetValue": number,
      "initialValue": number,
      "unit": "steps" | "kg" | "ml" | "hours" | "kcal" | "days/week",
      "durationDays": number between 14 and 60,
      "reason": "Clear explanation of why this target fits their profile",
      "dailyActions": ["Actionable step 1", "Actionable step 2"],
      "safetyNotes": ["Safety reminder"]
    }
  ],
  "disclaimer": "Informational wellness suggestions only. Consult a physician before starting any rigorous fitness or nutrition regimen."
}`;

    const fallbackGenerator = (): AiGoalSuggestionsResponse => ({
      summary: 'Personalized wellness goals based on your physical baseline and activity level.',
      suggestions: [
        {
          title: 'Daily Hydration Habit',
          category: 'WATER',
          targetValue: Math.max(2500, context.dailyWaterMl),
          initialValue: 1500,
          unit: 'ml',
          durationDays: 30,
          reason: 'Adequate hydration supports cellular recovery, joint health, and sustained energy.',
          dailyActions: ['Drink 500ml water after waking up', 'Keep a reusable water bottle at your workspace'],
          safetyNotes: ['Spread water intake evenly throughout daylight hours'],
        },
        {
          title: 'Consistent Daily Steps',
          category: 'STEPS',
          targetValue: Math.max(8000, context.dailySteps),
          initialValue: 4000,
          unit: 'steps',
          durationDays: 28,
          reason: 'Low-intensity steady state movement optimizes cardiovascular metabolic health.',
          dailyActions: ['Take a 15-minute walk after meals', 'Use stairs whenever practical'],
          safetyNotes: ['Wear comfortable, supportive footwear'],
        },
        {
          title: 'Restorative Sleep Routine',
          category: 'SLEEP',
          targetValue: 8,
          initialValue: 6,
          unit: 'hours',
          durationDays: 21,
          reason: 'Consistent sleep regulates hunger hormones and supports immune defense.',
          dailyActions: ['Disconnect from screens 30 minutes before sleep', 'Maintain a dark, cool sleeping space'],
          safetyNotes: ['Aim for consistent sleep and wake timings'],
        },
      ],
      disclaimer: 'Informational wellness suggestions only. Consult a physician before starting any rigorous fitness or nutrition regimen.',
    });

    const rawResponse = await this.aiProvider.generateStructuredJson<AiGoalSuggestionsResponse>(
      SYSTEM_HEALTH_PERSONA,
      userPrompt,
      fallbackGenerator
    );

    // Validate with Zod
    const parsed = AiGoalSuggestionsResponseSchema.safeParse(rawResponse);
    const result = parsed.success ? parsed.data : fallbackGenerator();

    // Persist recommendation record
    await this.repository.create({
      userId: userId as any,
      recommendationType: 'HEALTH_GOALS',
      structuredSuggestions: result,
      modelIdentifier: this.aiProvider.getModelIdentifier(),
      status: 'ACTIVE',
    });

    return result;
  }

  /**
   * Explain BMI calculation results in compassionate, plain language
   */
  async explainBmi(userId: string, bmiId?: string): Promise<AiBmiExplanationResponse> {
    const record = bmiId
      ? await bmiRepository.findByIdAndUserId(bmiId, userId)
      : await bmiRepository.findLatestByUserId(userId);

    const bmiVal = record?.bmiValue || 22.86;
    const category = record?.category || 'Healthy Weight';
    const heightCm = record?.heightCm || 175;
    const weightKg = record?.weightKg || 70;

    const userPrompt = `Provide a friendly, clinical-guidance explanation for a user whose BMI is ${bmiVal} (${category}) with height ${heightCm} cm and weight ${weightKg} kg.

Return JSON in this format:
{
  "bmiValue": ${bmiVal},
  "category": "${category}",
  "summary": "1-2 sentence empathetic explanation of what this score represents",
  "clinicalContext": "Informative paragraph explaining that BMI is a screening metric, not body fat percentage or definitive metabolic diagnosis",
  "healthyLifestyleTips": ["Tip 1", "Tip 2", "Tip 3"],
  "whenToSeekDoctor": "Guidance on when to consult a medical professional for comprehensive lipid, glucose, and cardiac assessments",
  "disclaimer": "BMI is a screening tool. Only a qualified doctor can diagnose clinical health conditions."
}`;

    const fallbackGenerator = (): AiBmiExplanationResponse => ({
      bmiValue: bmiVal,
      category,
      summary: `Your BMI of ${bmiVal} places you in the ${category} category based on standard WHO benchmarks.`,
      clinicalContext: 'Body Mass Index (BMI) evaluates weight relative to height. While a widely used screening metric, it does not distinguish between lean muscle tissue and adipose fat mass.',
      healthyLifestyleTips: [
        'Focus on nutrient-dense whole foods and balanced macronutrients.',
        'Combine cardiovascular walking with moderate resistance training.',
        'Monitor longitudinal weight trends rather than daily fluid fluctuations.',
      ],
      whenToSeekDoctor: 'Consider scheduling an annual wellness checkup with a licensed healthcare practitioner for lipid panel and blood pressure assessments.',
      disclaimer: 'BMI is a screening tool. Only a qualified doctor can diagnose clinical health conditions.',
    });

    const rawResponse = await this.aiProvider.generateStructuredJson<AiBmiExplanationResponse>(
      SYSTEM_HEALTH_PERSONA,
      userPrompt,
      fallbackGenerator
    );

    const parsed = AiBmiExplanationResponseSchema.safeParse(rawResponse);
    const result = parsed.success ? parsed.data : fallbackGenerator();

    await this.repository.create({
      userId: userId as any,
      recommendationType: 'EXPLAIN_BMI',
      structuredSuggestions: result,
      modelIdentifier: this.aiProvider.getModelIdentifier(),
      status: 'ACTIVE',
    });

    return result;
  }

  /**
   * Explain calorie estimation results (BMR & TDEE) in clear terms
   */
  async explainCalories(userId: string, calorieId?: string): Promise<AiCalorieExplanationResponse> {
    const record = calorieId
      ? await calorieRepository.findByIdAndUserId(calorieId, userId)
      : await calorieRepository.findLatestByUserId(userId);

    const bmr = record?.bmr || 1650;
    const tdee = record?.tdee || 2200;
    const target = record?.estimatedDailyCalories || 1950;
    const goal = record?.goal || 'MAINTAIN_WEIGHT';

    const userPrompt = `Explain caloric energy balance for an adult with BMR = ${bmr} kcal, TDEE = ${tdee} kcal, and Daily Target = ${target} kcal with goal ${goal}.

Return JSON in this format:
{
  "bmr": ${bmr},
  "tdee": ${tdee},
  "goalTarget": ${target},
  "goalType": "${goal}",
  "summary": "1-2 sentence explanation of daily calorie needs",
  "energyBalanceInsight": "Paragraph explaining the difference between basal metabolic rate (resting survival) and total daily energy expenditure",
  "sustainableHabits": ["Actionable nutrition tip 1", "Actionable nutrition tip 2", "Actionable nutrition tip 3"],
  "safetyGuidance": "Important advice warning against eating below BMR without medical supervision",
  "disclaimer": "Caloric calculations are mathematical estimates. Individual metabolic rates vary."
}`;

    const fallbackGenerator = (): AiCalorieExplanationResponse => ({
      bmr,
      tdee,
      goalTarget: target,
      goalType: goal,
      summary: `Your body uses approximately ${bmr} kcal at complete rest, and burns around ${tdee} kcal daily with your current activity level.`,
      energyBalanceInsight: 'Basal Metabolic Rate (BMR) represents the energy your vital organs require simply to keep you alive. Total Daily Energy Expenditure (TDEE) accounts for all daily movement and digestion.',
      sustainableHabits: [
        'Prioritize sufficient dietary protein (1.2–1.6g per kg) to preserve lean muscle mass.',
        'Choose fiber-rich complex carbohydrates to maintain stable blood glucose levels.',
        'Stay adequately hydrated, as mild thirst is often misinterpreted as hunger.',
      ],
      safetyGuidance: 'Never consume fewer calories than your BMR for extended periods without professional clinical guidance.',
      disclaimer: 'Caloric calculations are mathematical estimates. Individual metabolic rates vary.',
    });

    const rawResponse = await this.aiProvider.generateStructuredJson<AiCalorieExplanationResponse>(
      SYSTEM_HEALTH_PERSONA,
      userPrompt,
      fallbackGenerator
    );

    const parsed = AiCalorieExplanationResponseSchema.safeParse(rawResponse);
    const result = parsed.success ? parsed.data : fallbackGenerator();

    await this.repository.create({
      userId: userId as any,
      recommendationType: 'EXPLAIN_CALORIES',
      structuredSuggestions: result,
      modelIdentifier: this.aiProvider.getModelIdentifier(),
      status: 'ACTIVE',
    });

    return result;
  }

  /**
   * Generate daily AI Health Summary & Insight for the Dashboard
   */
  async generateHealthSummary(userId: string): Promise<AiHealthSummaryResponse> {
    const profile = await healthProfileRepository.findByUserId(userId);
    const latestBmi = await bmiRepository.findLatestByUserId(userId);
    const latestCalories = await calorieRepository.findLatestByUserId(userId);
    const activeGoals = await healthGoalsRepository.findByUserId(userId, 'ACTIVE');

    const context = {
      name: profile?.firstName || 'Champion',
      bmi: latestBmi?.bmiValue,
      bmiCategory: latestBmi?.category,
      calorieTarget: latestCalories?.estimatedDailyCalories,
      activeGoalsCount: activeGoals.length,
      topGoal: activeGoals[0]?.title,
      goalProgress: activeGoals[0]?.progressPercentage,
    };

    const userPrompt = `Generate an inspiring, supportive daily health overview for ${context.name}.
Context: BMI=${context.bmi || 'Not set'}, Calorie Target=${context.calorieTarget || 'Not set'} kcal, Active Goals=${context.activeGoalsCount}, Top Goal="${context.topGoal || 'Daily Health'} (${context.goalProgress || 0}%)".

Return JSON in this format:
{
  "greeting": "Personalized upbeat greeting",
  "overallWellnessStatus": "1 sentence positive assessment of their current progress",
  "keyHighlights": ["Highlight 1", "Highlight 2"],
  "suggestedFocusForToday": "One practical, high-value habit to focus on today",
  "encouragementQuote": "An inspiring, positive wellness motto",
  "disclaimer": "General health insight generated by UYIRA AI."
}`;

    const fallbackGenerator = (): AiHealthSummaryResponse => ({
      greeting: `Welcome back, ${context.name}!`,
      overallWellnessStatus: 'You are on track with your preventative health metrics.',
      keyHighlights: [
        latestBmi ? `BMI logged at ${latestBmi.bmiValue} (${latestBmi.category})` : 'Keep tracking your physical baselines regularly',
        activeGoals.length > 0 ? `${activeGoals.length} active wellness goal(s) in progress` : 'Set your first health goal to unlock targeted milestones',
      ],
      suggestedFocusForToday: 'Stay hydrated and complete 30 minutes of intentional physical activity.',
      encouragementQuote: 'Small, daily disciplines yield extraordinary long-term vitality.',
      disclaimer: 'General health insight generated by UYIRA AI.',
    });

    const rawResponse = await this.aiProvider.generateStructuredJson<AiHealthSummaryResponse>(
      SYSTEM_HEALTH_PERSONA,
      userPrompt,
      fallbackGenerator
    );

    const parsed = AiHealthSummaryResponseSchema.safeParse(rawResponse);
    const result = parsed.success ? parsed.data : fallbackGenerator();

    await this.repository.create({
      userId: userId as any,
      recommendationType: 'HEALTH_SUMMARY',
      structuredSuggestions: result,
      modelIdentifier: this.aiProvider.getModelIdentifier(),
      status: 'ACTIVE',
    });

    return result;
  }

  /**
   * Retrieve past AI recommendations
   */
  async getRecommendationsHistory(userId: string, limit: number = 20) {
    return this.repository.findByUser(userId, limit);
  }
}

export const aiRecommendationsService = new AiRecommendationsService();

