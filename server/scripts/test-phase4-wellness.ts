import { signAccessToken } from '../src/utils/jwt.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function request(url: string, options: any = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const body = options.body ? JSON.stringify(options.body) : undefined;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function runTests() {
  console.log('🧪 Starting Phase 4 Activity & Wellness End-to-End Tests...\n');

  try {
    // 1. Authenticate with verified user token
    console.log('1. Authenticating test user (gokul)...');
    const token = signAccessToken({
      sub: '6aeac9d60ef5e9235ecc3dde',
      email: 'gokulnath2k24@gmail.com',
      isVerified: true,
    });
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('✅ Authenticated successfully! User ID: 6aeac9d60ef5e9235ecc3dde');

    // 2. Test Activity & Steps
    console.log('\n2. Testing POST /activity (Logging 4,250 steps)...');
    const actRes = await request(`${BASE_URL}/activity`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        steps: 4250,
        activityType: 'WALKING',
        source: 'MANUAL',
        notes: 'Morning brisk walk',
      },
    });
    console.log(`✅ Logged steps: ${actRes.data.record.steps}, distance: ${actRes.data.record.distanceKm} km, calories: ${actRes.data.record.estimatedCalories} kcal`);

    const actTodayRes = await request(`${BASE_URL}/activity/today`, { headers: authHeaders });
    console.log(`   Today's Total Steps: ${actTodayRes.data.totalSteps} / ${actTodayRes.data.stepGoal} goal (${actTodayRes.data.progressPercentage}%)`);

    // 3. Test Water Intake Tracking
    console.log('\n3. Testing POST /water (Logging 250ml water + 350ml electrolyte)...');
    await request(`${BASE_URL}/water`, {
      method: 'POST',
      headers: authHeaders,
      body: { quantityMl: 250, beverageType: 'WATER' },
    });
    await request(`${BASE_URL}/water`, {
      method: 'POST',
      headers: authHeaders,
      body: { quantityMl: 350, beverageType: 'ELECTROLYTE' },
    });
    const waterTodayRes = await request(`${BASE_URL}/water/today`, { headers: authHeaders });
    console.log(`✅ Total Water: ${waterTodayRes.data.totalWaterMl} ml, Other: ${waterTodayRes.data.otherBeveragesMl} ml`);
    console.log(`   Hydration Progress: ${waterTodayRes.data.totalConsumedMl} / ${waterTodayRes.data.targetMl} ml (${waterTodayRes.data.progressPercentage}%)`);

    // 4. Test Sleep Monitoring
    console.log('\n4. Testing POST /sleep (Logging 23:15 to 07:00 session)...');
    const bedDate = new Date();
    bedDate.setDate(bedDate.getDate() - 1);
    bedDate.setHours(23, 15, 0, 0);

    const wakeDate = new Date();
    wakeDate.setHours(7, 0, 0, 0);

    const sleepRes = await request(`${BASE_URL}/sleep`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        bedtime: bedDate.toISOString(),
        wakeTime: wakeDate.toISOString(),
        sleepQuality: 'GOOD',
        source: 'MANUAL',
        notes: 'Restful sleep session',
      },
    });
    console.log(`✅ Logged sleep session: ${sleepRes.data.durationMinutes} minutes (${(sleepRes.data.durationMinutes / 60).toFixed(1)} hrs)`);
    const sleepLatestRes = await request(`${BASE_URL}/sleep/latest`, { headers: authHeaders });
    console.log(`   Latest Sleep Recorded: ${sleepLatestRes.data.durationHours} hrs (Goal: ${sleepLatestRes.data.sleepGoalHours} hrs)`);

    // 5. Test Medication Scheduling
    console.log('\n5. Testing POST /medications (Scheduling Daily Vitamin & Mineral)...');
    const todayStr = new Date().toISOString().split('T')[0];
    const medRes = await request(`${BASE_URL}/medications`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: 'Multivitamin Complex',
        type: 'TABLET',
        strength: '1 tab',
        instructions: 'Take after breakfast with water',
        frequency: 'ONCE_DAILY',
        scheduledTimes: ['08:30'],
        startDate: todayStr,
      },
    });
    const med = medRes.data;
    console.log(`✅ Created Medication: "${med.name}" (${med.type}) at ${med.scheduledTimes.join(', ')}`);

    // 6. Test Dose Adherence
    console.log('\n6. Testing POST /medications/:id/doses/record (Marking dose as TAKEN)...');
    const doseRes = await request(`${BASE_URL}/medications/${med._id}/doses/record`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        scheduledTime: '08:30',
        status: 'TAKEN',
        notes: 'Taken on time',
      },
    });
    console.log(`✅ Dose status recorded: ${doseRes.data.status} for ${doseRes.data.scheduledTime}`);

    const scheduleRes = await request(`${BASE_URL}/medications/today`, { headers: authHeaders });
    console.log(`   Today Medication Adherence: ${scheduleRes.data.takenCount}/${scheduleRes.data.totalScheduled} taken (${scheduleRes.data.adherencePercentage}%)`);

    // 7. Test Vital Signs Monitoring
    console.log('\n7. Testing POST /vitals (Recording Heart Rate & Blood Pressure)...');
    await request(`${BASE_URL}/vitals`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        metricType: 'HEART_RATE',
        value: 72,
        source: 'MANUAL',
      },
    });
    await request(`${BASE_URL}/vitals`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        metricType: 'BLOOD_PRESSURE',
        systolic: 120,
        diastolic: 80,
        source: 'MANUAL',
      },
    });
    await request(`${BASE_URL}/vitals`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        metricType: 'BLOOD_OXYGEN',
        value: 99,
        source: 'MANUAL',
      },
    });

    const vitalsRes = await request(`${BASE_URL}/vitals/latest`, { headers: authHeaders });
    console.log(`✅ Latest Vitals Snapshot:`);
    console.log(`   Heart Rate:     ${vitalsRes.data.heartRate?.value} ${vitalsRes.data.heartRate?.unit}`);
    console.log(`   Blood Pressure: ${vitalsRes.data.bloodPressure?.systolic}/${vitalsRes.data.bloodPressure?.diastolic} ${vitalsRes.data.bloodPressure?.unit}`);
    console.log(`   Blood Oxygen:   ${vitalsRes.data.bloodOxygen?.value} ${vitalsRes.data.bloodOxygen?.unit}`);

    // 8. Test AI Wellness Insights
    console.log('\n8. Testing GET /wellness/today (Generating holistic AI wellness summary)...');
    const wellnessRes = await request(`${BASE_URL}/wellness/today`, { headers: authHeaders });
    console.log(`✅ AI Wellness Summary: "${wellnessRes.data.summary}"`);
    console.log(`   Observations: ${wellnessRes.data.observations.map((o: any) => `[${o.category}] ${o.message}`).join(' | ')}`);
    console.log(`   Top Suggestion: "${wellnessRes.data.suggestions[0]?.title}": ${wellnessRes.data.suggestions[0]?.description}`);

    console.log('\n🎉 ALL 8 PHASE 4 WELLNESS BACKEND TESTS PASSED WITH 100% SUCCESS!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Test failed:', error.message || error);
    process.exit(1);
  }
}

runTests();

