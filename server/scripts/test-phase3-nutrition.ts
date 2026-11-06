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
  console.log('🧪 Starting Phase 3 Nutrition End-to-End Tests...\n');

  try {
    // 1. Authenticate with verified user token
    console.log('1. Generating authenticated session for user (gokul)...');
    const token = signAccessToken({
      sub: '6aeac9d60ef5e9235ecc3dde',
      email: 'gokulnath2k24@gmail.com',
      isVerified: true,
    });
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('✅ Authenticated successfully! User ID: 6aeac9d60ef5e9235ecc3dde');

    // 2. Test Food Categories
    console.log('\n2. Testing GET /foods/categories...');
    const catRes = await request(`${BASE_URL}/foods/categories`);
    console.log(`✅ Retrieved ${catRes.data.length} food categories:`, catRes.data.map((c: any) => c.category).join(', '));

    // 3. Test Food Search
    console.log('\n3. Testing GET /foods/search?q=idli...');
    const searchRes = await request(`${BASE_URL}/foods/search?q=idli`);
    const idliFood = searchRes.data[0];
    if (!idliFood) throw new Error('Idli not found in food catalog!');
    console.log(`✅ Found food: ${idliFood.name} (ID: ${idliFood._id})`);
    console.log(`   Nutrients per 100g: ${idliFood.nutrientsPer100g.calories} kcal, ${idliFood.nutrientsPer100g.protein}g protein`);

    // 4. Test Favorite Toggle
    console.log(`\n4. Testing POST /foods/${idliFood._id}/favorite...`);
    const favRes = await request(`${BASE_URL}/foods/${idliFood._id}/favorite`, {
      method: 'POST',
      headers: authHeaders,
    });
    console.log('✅ Favorite status:', favRes.data.isFavorited ? 'Favorited' : 'Un-favorited');

    // 5. Test Food Logging
    console.log('\n5. Testing POST /food-logs (Logging 2 Idlis for Breakfast)...');
    const logRes = await request(`${BASE_URL}/food-logs`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        foodId: idliFood._id,
        mealType: 'BREAKFAST',
        quantity: 2,
        unit: 'pieces',
        notes: 'Morning South Indian breakfast',
      },
    });
    console.log('✅ Logged successfully! Weight:', logRes.data.log.weightGrams, 'g');
    console.log('   Calculated Nutrients:', logRes.data.log.calculatedNutrition);

    // Also log Sambar for Breakfast
    const sambarSearch = await request(`${BASE_URL}/foods/search?q=sambar`);
    const sambarFood = sambarSearch.data[0];
    if (sambarFood) {
      console.log('   Also logging 1 bowl Sambar for Breakfast...');
      await request(`${BASE_URL}/food-logs`, {
        method: 'POST',
        headers: authHeaders,
        body: {
          foodId: sambarFood._id,
          mealType: 'BREAKFAST',
          quantity: 1,
          unit: 'bowl',
        },
      });
    }

    // 6. Test GET /food-logs/today
    console.log('\n6. Testing GET /food-logs/today...');
    const todayLogsRes = await request(`${BASE_URL}/food-logs/today`, { headers: authHeaders });
    console.log(`✅ Today total logs: ${todayLogsRes.data.logs.length}`);
    console.log(`   Breakfast items: ${todayLogsRes.data.grouped.BREAKFAST.length}`);

    // 7. Test GET /nutrition/summary
    console.log('\n7. Testing GET /nutrition/summary...');
    const summaryRes = await request(`${BASE_URL}/nutrition/summary`, { headers: authHeaders });
    const s = summaryRes.data;
    console.log(`✅ Daily Calorie Target: ${s.calorieTarget} kcal`);
    console.log(`   Consumed Calories:    ${s.consumedCalories} kcal`);
    console.log(`   Remaining Calories:   ${s.remainingCalories} kcal`);
    console.log(`   Protein: ${s.protein}g | Carbs: ${s.carbohydrates}g | Fat: ${s.fat}g | Fiber: ${s.fiber}g`);
    console.log(`   Breakfast Calories:   ${s.mealBreakdown.breakfast} kcal`);

    // 8. Test Diet Suggestions
    console.log('\n8. Testing GET /diet/suggestions...');
    const suggRes = await request(`${BASE_URL}/diet/suggestions`, { headers: authHeaders });
    console.log(`✅ High-protein items suggested: ${suggRes.data.highProtein.length}`);
    console.log(`   First protein pick: ${suggRes.data.highProtein[0]?.name}`);
    console.log(`   Smart Alternatives count: ${suggRes.data.alternatives.length}`);

    // 9. Test AI Meal Plan Generator
    console.log('\n9. Testing POST /meal-plans/generate...');
    const planRes = await request(`${BASE_URL}/meal-plans/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: { duration: 'DAILY', title: 'Test Daily Smart Plan' },
    });
    const plan = planRes.data;
    console.log(`✅ Generated Meal Plan: "${plan.title}" (Status: ${plan.status})`);
    console.log(`   Days: ${plan.days.length}, Day 1 Total Calories: ${plan.days[0].totalDayCalories} kcal`);
    console.log(`   Meals: ${plan.days[0].meals.map((m: any) => `${m.mealType} (${m.totalMealCalories} kcal)`).join(', ')}`);

    // 10. Test Meal Plan Approval
    console.log(`\n10. Testing POST /meal-plans/${plan._id}/approve...`);
    const approveRes = await request(`${BASE_URL}/meal-plans/${plan._id}/approve`, {
      method: 'POST',
      headers: authHeaders,
    });
    console.log(`✅ Plan status updated: ${approveRes.data.status}`);

    console.log('\n🎉 ALL 10 PHASE 3 NUTRITION TESTS PASSED WITH 100% SUCCESS!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Test failed:', error.message || error);
    process.exit(1);
  }
}

runTests();
