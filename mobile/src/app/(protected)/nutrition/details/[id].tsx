import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Utensils,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Plus,
  ArrowLeft,
  Sparkles,
} from 'lucide-react-native';
import { AppHeader } from '../../../../components/common/AppHeader';
import { colors } from '../../../../theme/colors';
import { foodService } from '../../../../services/nutrition/foodService';
import { IFood } from '../../../../types/nutrition';

export default function FoodDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [food, setFood] = useState<IFood | null>(null);

  useEffect(() => {
    async function load() {
      if (!id || typeof id !== 'string') return;
      try {
        const item = await foodService.getFoodById(id);
        setFood(item);
      } catch (err) {
        console.warn('Failed to load food details:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Food Details" showBack onBackPress={() => router.back()} />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!food) {
    return (
      <View style={styles.container}>
        <AppHeader title="Food Details" showBack onBackPress={() => router.back()} />
        <View style={styles.centerBox}>
          <Text style={styles.notFoundText}>Food item not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={food.name} showBack onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Title Card */}
        <View style={styles.heroCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{food.category}</Text>
          </View>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodDescription}>{food.description}</Text>

          <View style={styles.sourceRow}>
            <ShieldCheck size={14} color="#16A34A" />
            <Text style={styles.sourceText}>Source: {food.source}</Text>
          </View>
        </View>

        {/* Normalized Nutrition Per 100g Card */}
        <Text style={styles.sectionTitle}>Nutrition Facts (Per 100g)</Text>
        <View style={styles.factsCard}>
          <View style={styles.calorieHero}>
            <Flame size={24} color="#F97316" />
            <Text style={styles.calorieHeroValue}>{food.nutrientsPer100g.calories}</Text>
            <Text style={styles.calorieHeroUnit}>kcal</Text>
          </View>

          <View style={styles.nutrientsTable}>
            <View style={styles.nutrientRow}>
              <Text style={styles.nutrientName}>Protein</Text>
              <Text style={[styles.nutrientValue, { color: '#2563EB' }]}>
                {food.nutrientsPer100g.protein} g
              </Text>
            </View>
            <View style={styles.nutrientRow}>
              <Text style={styles.nutrientName}>Total Carbohydrates</Text>
              <Text style={[styles.nutrientValue, { color: '#D97706' }]}>
                {food.nutrientsPer100g.carbohydrates} g
              </Text>
            </View>
            <View style={styles.nutrientRow}>
              <Text style={styles.nutrientName}>Dietary Fiber</Text>
              <Text style={[styles.nutrientValue, { color: '#16A34A' }]}>
                {food.nutrientsPer100g.fiber || 0} g
              </Text>
            </View>
            <View style={styles.nutrientRow}>
              <Text style={styles.nutrientName}>Total Fat</Text>
              <Text style={[styles.nutrientValue, { color: '#8B5CF6' }]}>
                {food.nutrientsPer100g.fat} g
              </Text>
            </View>
            <View style={styles.nutrientRow}>
              <Text style={styles.nutrientName}>Natural Sugars</Text>
              <Text style={styles.nutrientValue}>{food.nutrientsPer100g.sugar || 0} g</Text>
            </View>
            <View style={styles.nutrientRow}>
              <Text style={styles.nutrientName}>Sodium</Text>
              <Text style={styles.nutrientValue}>{food.nutrientsPer100g.sodium || 0} mg</Text>
            </View>
          </View>
        </View>

        {/* Standard Serving Conversions */}
        <Text style={styles.sectionTitle}>Available Serving Sizes</Text>
        <View style={styles.servingsCard}>
          <Text style={styles.servingDefault}>
            Default: {food.defaultServingSize} {food.defaultServingUnit} = {food.weightPerDefaultServingGrams}g
          </Text>
          {food.availableServings?.map((s, idx) => (
            <View key={idx} style={styles.servingItem}>
              <Text style={styles.servingUnitText}>
                {s.servingSize} {s.unit}
              </Text>
              <Text style={styles.servingGramsText}>{s.weightGrams} grams</Text>
            </View>
          ))}
        </View>

        {/* Ingredients & Allergens */}
        {food.ingredients && food.ingredients.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsCard}>
              <Text style={styles.ingredientsText}>{food.ingredients.join(' • ')}</Text>
            </View>
          </>
        ) : null}

        {food.allergens && food.allergens.length > 0 ? (
          <View style={styles.allergenAlertCard}>
            <ShieldAlert size={18} color="#EF4444" />
            <Text style={styles.allergenAlertText}>
              Contains Allergens: {food.allergens.join(', ')}
            </Text>
          </View>
        ) : (
          <View style={styles.allergenSafeCard}>
            <CheckCircle2 size={16} color="#16A34A" />
            <Text style={styles.allergenSafeText}>No common allergens declared</Text>
          </View>
        )}

        {/* Log Action Button */}
        <TouchableOpacity
          style={styles.logButton}
          onPress={() =>
            router.push(`/(protected)/nutrition/log` as any)
          }
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.logButtonText}>Log This Food</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  foodName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 6,
  },
  foodDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 10,
  },
  factsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  calorieHero: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  calorieHeroValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F97316',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  calorieHeroUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  nutrientsTable: {
    gap: 8,
  },
  nutrientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  nutrientName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  nutrientValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  servingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 6,
  },
  servingDefault: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  servingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  servingUnitText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  servingGramsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ingredientsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  ingredientsText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  allergenAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 24,
  },
  allergenAlertText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
    flex: 1,
  },
  allergenSafeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 24,
  },
  allergenSafeText: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
  },
  logButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

