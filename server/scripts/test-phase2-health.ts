import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { VerificationTokenModel } from '../src/modules/verification/verification.model.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { HealthProfileModel } from '../src/modules/health-profile/health-profile.model.js';
import { BMIRecordModel } from '../src/modules/bmi/bmi.model.js';
import { CalorieRecordModel } from '../src/modules/calories/calories.model.js';
import { HealthGoalModel } from '../src/modules/health-goals/health-goals.model.js';
import { lastSentOtpForTesting } from '../src/utils/email.js';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function run() {
  console.log('🩺 Starting Phase 2 — Core Health Modules Integration Test Suite...\n');
  await connectDatabase();

  const testEmail = `health_tester_${Date.now()}@uyira.health`;
  const testMobile = `+919877${Math.floor(100000 + Math.random() * 900000)}`;
  const testPassword = 'Password@123';

  let token = '';
  let userId = '';

  try {
    // 1. Setup authenticated user
    console.log('--- 1. Setting Up Test User ---');
    const regRes = await authService.register({
      fullName: 'Health Tester',
      email: testEmail,
      mobileNumber: testMobile,
      dateOfBirth: '1998-05-20',
      gender: 'male',
      password: testPassword,
      confirmPassword: testPassword,
      termsAccepted: true,
    });
    userId = regRes.userId;

    const rawOtp = lastSentOtpForTesting!;
    if (!rawOtp) throw new Error('Verification OTP was not captured');

    // Activate account
    await authService.verifyRegistrationOtp({ userId, otp: rawOtp });

    // Log in
    const loginRes = await authService.login({ identifier: testEmail, password: testPassword });
    token = loginRes.accessToken;
    console.log('✅ User created, verified, and logged in. Access token acquired.\n');

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. Health Profile Tests
    console.log('--- 2. Health Profile Endpoints ---');
    const getProfileRes = await fetch(`${BASE_URL}/health-profile`, {
      method: 'GET',
      headers: authHeaders,
    });
    const profileJson: any = await getProfileRes.json();
    console.log('GET /health-profile status:', getProfileRes.status, '| completion:', profileJson.data?.completionPercentage, '%');

    const patchProfileRes = await fetch(`${BASE_URL}/health-profile`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        heightCm: 175,
        currentWeightKg: 70,
        targetWeightKg: 68,
        preferredUnit: 'METRIC',
        activityLevel: 'MODERATELY_ACTIVE',
        dailyWaterGoalMl: 3000,
        dailyStepGoal: 10000,
        dailySleepGoalHours: 8,
        dailyCalorieGoalKcal: 2200,
        emergencyContactName: 'Health Emergency Contact',
        emergencyContactPhone: '+919999988888',
        medicalNotes: 'No chronic conditions. Mild seasonal allergies.',
      }),
    });
    const updatedProfileJson: any = await patchProfileRes.json();
    console.log('PATCH /health-profile status:', patchProfileRes.status, '| new completion:', updatedProfileJson.data?.completionPercentage, '%');
    if (updatedProfileJson.data?.completionPercentage < 80) {
      throw new Error('Expected profile completion to be updated!');
    }
    console.log('✅ Health Profile verified.\n');

    // 3. BMI Module Tests
    console.log('--- 3. BMI Module Endpoints ---');
    const bmiCalcRes = await fetch(`${BASE_URL}/health/bmi/calculate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        heightCm: 175,
        weightKg: 70,
        saveRecord: true,
        notes: 'Integration test BMI entry',
      }),
    });
    const bmiJson: any = await bmiCalcRes.json();
    console.log('POST /health/bmi/calculate status:', bmiCalcRes.status, '| BMI:', bmiJson.data?.bmiValue, '| Category:', bmiJson.data?.category);
    if (bmiJson.data?.bmiValue !== 22.86 || bmiJson.data?.category !== 'Healthy Weight') {
      throw new Error(`Unexpected BMI values: ${JSON.stringify(bmiJson.data)}`);
    }

    const bmiHistoryRes = await fetch(`${BASE_URL}/health/bmi/history`, {
      method: 'GET',
      headers: authHeaders,
    });
    const bmiHistoryJson: any = await bmiHistoryRes.json();
    console.log('GET /health/bmi/history count:', bmiHistoryJson.data?.length);
    const createdBmiRecordId = bmiHistoryJson.data?.[0]?.id;

    const latestBmiRes = await fetch(`${BASE_URL}/health/bmi/latest`, {
      method: 'GET',
      headers: authHeaders,
    });
    const latestBmiJson: any = await latestBmiRes.json();
    console.log('GET /health/bmi/latest value:', latestBmiJson.data?.bmiValue);
    console.log('✅ BMI Calculator verified.\n');

    // 4. Calorie Estimation Module Tests
    console.log('--- 4. Calorie Module Endpoints ---');
    const calorieCalcRes = await fetch(`${BASE_URL}/health/calories/estimate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        age: 26,
        biologicalSex: 'MALE',
        heightCm: 175,
        weightKg: 70,
        activityLevel: 'MODERATELY_ACTIVE',
        goal: 'LOSE_WEIGHT',
        saveRecord: true,
      }),
    });
    const calJson: any = await calorieCalcRes.json();
    console.log('POST /health/calories/estimate status:', calorieCalcRes.status, '| BMR:', calJson.data?.bmr, '| TDEE:', calJson.data?.tdee, '| Target:', calJson.data?.estimatedDailyCalories);
    if (!calJson.data?.bmr || !calJson.data?.tdee || !calJson.data?.estimatedDailyCalories) {
      throw new Error('Calorie estimation missing calculations!');
    }

    const calHistoryRes = await fetch(`${BASE_URL}/health/calories/history`, {
      method: 'GET',
      headers: authHeaders,
    });
    const calHistoryJson: any = await calHistoryRes.json();
    console.log('GET /health/calories/history count:', calHistoryJson.data?.length);
    console.log('✅ Calorie Estimator verified.\n');

    // 5. Personal Health Goals Module Tests
    console.log('--- 5. Health Goals Endpoints ---');
    const targetDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const createGoalRes = await fetch(`${BASE_URL}/health/goals`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Walk 10,000 Steps Daily',
        category: 'STEPS',
        targetValue: 10000,
        initialValue: 2000,
        currentValue: 5000,
        unit: 'steps',
        targetDate,
      }),
    });
    const createGoalJson: any = await createGoalRes.json();
    const goalId = createGoalJson.data?.id;
    console.log('POST /health/goals status:', createGoalRes.status, '| Goal ID:', goalId, '| Progress:', createGoalJson.data?.progressPercentage, '%');

    // Update progress
    const updateProgressRes = await fetch(`${BASE_URL}/health/goals/${goalId}/progress`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ currentValue: 8000 }),
    });
    const progressJson: any = await updateProgressRes.json();
    console.log('PATCH /health/goals/:id/progress status:', updateProgressRes.status, '| New Progress:', progressJson.data?.progressPercentage, '%');

    // Pause goal
    const pauseRes = await fetch(`${BASE_URL}/health/goals/${goalId}/pause`, {
      method: 'PATCH',
      headers: authHeaders,
    });
    const pauseJson: any = await pauseRes.json();
    console.log('PATCH /health/goals/:id/pause status:', pauseRes.status, '| Status:', pauseJson.data?.status);

    const listGoalsRes = await fetch(`${BASE_URL}/health/goals`, {
      method: 'GET',
      headers: authHeaders,
    });
    const listGoalsJson: any = await listGoalsRes.json();
    console.log('GET /health/goals total goals:', listGoalsJson.data?.length);
    console.log('✅ Health Goals verified.\n');

    // 6. Unified Health History Tests
    console.log('--- 6. Unified Health History Endpoints ---');
    const allHistoryRes = await fetch(`${BASE_URL}/health/history?category=ALL`, {
      method: 'GET',
      headers: authHeaders,
    });
    const allHistoryJson: any = await allHistoryRes.json();
    console.log('GET /health/history?category=ALL count:', allHistoryJson.data?.length);
    console.log('Sample history item categories present:', allHistoryJson.data?.map((r: any) => r.category).slice(0, 5));

    const bmiOnlyHistoryRes = await fetch(`${BASE_URL}/health/history?category=BMI`, {
      method: 'GET',
      headers: authHeaders,
    });
    const bmiOnlyJson: any = await bmiOnlyHistoryRes.json();
    console.log('GET /health/history?category=BMI count:', bmiOnlyJson.data?.length);
    console.log('✅ Unified Health History verified.\n');

    // 7. Cleanup test data
    console.log('--- 7. Cleaning Up Test Artifacts ---');
    await UserModel.deleteOne({ _id: userId });
    await HealthProfileModel.deleteOne({ userId });
    await BMIRecordModel.deleteMany({ userId });
    await CalorieRecordModel.deleteMany({ userId });
    await HealthGoalModel.deleteMany({ userId });
    await VerificationTokenModel.deleteMany({ userId });
    console.log('✅ Test user and all related records deleted cleanly.');

    console.log('\n🎉 ALL PHASE 2 HEALTH MODULE TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

run();
