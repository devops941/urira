import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { UserModel } from '../src/modules/users/user.model.js';
import { aiRecommendationsService } from '../src/modules/ai-recommendations/ai-recommendations.service.js';

async function testAi() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI!);

  // Find any existing user
  const user = await UserModel.findOne({});
  if (!user) {
    console.log('No user found in DB, skipping direct test');
    await mongoose.disconnect();
    return;
  }

  const userId = user._id.toString();
  console.log(`👤 Testing with user: ${user.fullName} (${user.email}, ID: ${userId})`);

  console.log('\n--- 1. Testing AI Goal Suggestions ---');
  try {
    const goalsRes = await aiRecommendationsService.suggestGoals(userId);
    console.log('✅ Goal Suggestions Summary:', goalsRes.summary);
    console.log(`Generated ${goalsRes.suggestions.length} goals:`);
    goalsRes.suggestions.forEach((g, i) => {
      console.log(`  ${i + 1}. [${g.category}] ${g.title} -> Target: ${g.targetValue} ${g.unit} (${g.durationDays} days)`);
    });
  } catch (err: any) {
    console.error('❌ Error suggesting goals:', err);
  }

  console.log('\n--- 2. Testing AI BMI Explanation ---');
  try {
    const bmiRes = await aiRecommendationsService.explainBmi(userId);
    console.log(`✅ BMI Explanation (${bmiRes.bmiValue} - ${bmiRes.category}):`);
    console.log('  Summary:', bmiRes.summary);
    console.log('  Tips:', bmiRes.healthyLifestyleTips);
  } catch (err: any) {
    console.error('❌ Error explaining BMI:', err);
  }

  console.log('\n--- 3. Testing AI Calorie Explanation ---');
  try {
    const calRes = await aiRecommendationsService.explainCalories(userId);
    console.log(`✅ Calorie Explanation (BMR: ${calRes.bmr}, TDEE: ${calRes.tdee}):`);
    console.log('  Summary:', calRes.summary);
    console.log('  Energy Insight:', calRes.energyBalanceInsight.slice(0, 100) + '...');
  } catch (err: any) {
    console.error('❌ Error explaining calories:', err);
  }

  console.log('\n--- 4. Testing AI Daily Health Summary ---');
  try {
    const sumRes = await aiRecommendationsService.generateHealthSummary(userId);
    console.log('✅ Health Summary:');
    console.log('  Greeting:', sumRes.greeting);
    console.log('  Quote:', sumRes.encouragementQuote);
  } catch (err: any) {
    console.error('❌ Error generating health summary:', err);
  }

  await mongoose.disconnect();
  console.log('\n✨ AI Endpoints Test Completed Successfully!\n');
}

testAi().catch(console.error);






























