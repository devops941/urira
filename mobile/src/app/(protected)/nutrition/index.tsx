import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Utensils,
  Plus,
  Sparkles,
  Flame,
  ChevronRight,
  Trash2,
  Apple,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { BottomNavBar } from '../../../components/common/BottomNavBar';
import { colors } from '../../../theme/colors';
import { foodLogService } from '../../../services/nutrition/foodLogService';
import { nutritionService } from '../../../services/nutrition/nutritionService';
import { profileService } from '../../../services/health/profileService';
import { INutritionSummary, IFoodLog, MealType } from '../../../types/nutrition';
import { HealthProfileDto } from '../../../types/health';

const MEAL_SECTIONS: { type: MealType; title: string; timeHint: string }[] = [
  { type: MealType.BREAKFAST, title: 'Breakfast', timeHint: '7:00 AM - 10:00 AM' },
  { type: MealType.MORNING_SNACK, title: 'Morning Snack', timeHint: '11:00 AM - 12:00 PM' },
  { type: MealType.LUNCH, title: 'Lunch', timeHint: '12:30 PM - 2:30 PM' },
  { type: MealType.EVENING_SNACK, title: 'Evening Snack', timeHint: '4:30 PM - 6:00 PM' },
  { type: MealType.DINNER, title: 'Dinner', timeHint: '7:30 PM - 9:30 PM' },
  { type: MealType.OTHER, title: 'Other / Late Night', timeHint: 'Anytime' },
];

export default function NutritionDashboardScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<INutritionSummary | null>(null);
  const [profile, setProfile] = useState<HealthProfileDto | null>(null);
  const [groupedLogs, setGroupedLogs] = useState<Record<MealType, IFoodLog[]>>({
    [MealType.BREAKFAST]: [],
    [MealType.MORNING_SNACK]: [],
    [MealType.LUNCH]: [],
    [MealType.EVENING_SNACK]: [],
    [MealType.DINNER]: [],
    [MealType.OTHER]: [],
  });

  const loadData = useCallback(async () => {
    try {
      const [data, prof] = await Promise.all([
        foodLogService.getTodayLogs(),
        profileService.getProfile().catch(() => null),
      ]);
      setSummary(data.summary);
      setGroupedLogs(data.grouped);
      if (prof) setProfile(prof);
    } catch (err: any) {
      console.warn('Failed to load today nutrition data:', err.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeleteFoodLog = (id: string, name: string) => {
    const doDelete = async () => {
      try {
        const res = await foodLogService.deleteFoodLog(id);
        setSummary(res.summary);
        loadData();
      } catch (err: any) {
        if (Platform.OS === 'web') {
          window.alert(err.message || 'Failed to remove food item');
        } else {
          Alert.alert('Error', err.message || 'Failed to remove food item');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${name} from your food log?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Remove Food', `Remove ${name} from your food log?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const calorieTarget = profile?.preferredDailyCalorieGoal || summary?.calorieTarget || 2000;
  const consumedCalories = summary?.consumedCalories || 0;
  const remainingCalories = summary?.remainingCalories ?? (calorieTarget - consumedCalories);
  const progressRatio = Math.min(consumedCalories / (calorieTarget || 1), 1);

  return (
    <View style={styles.container}>
      <AppHeader title="Nutrition & Diet" showBack onBackPress={() => router.replace('/(protected)/home')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading nutrition metrics...</Text>
          </View>
        ) : (
          <>
            {/* Daily Calorie Summary Card */}
            <View style={styles.calorieCard}>
              <View style={styles.calorieCardHeader}>
                <View style={styles.iconCircleOrange}>
                  <Flame size={20} color="#F97316" />
                </View>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.cardHeaderTitle}>Daily Calorie Target</Text>
                  <Text style={styles.cardHeaderSubtitle}>
                    {consumedCalories} of {calorieTarget} kcal consumed
                  </Text>
                </View>
                <View style={styles.remainingBadge}>
                  <Text style={styles.remainingValue}>
                    {remainingCalories >= 0 ? `${remainingCalories}` : `+${Math.abs(remainingCalories)}`}
                  </Text>
                  <Text style={styles.remainingLabel}>
                    {remainingCalories >= 0 ? 'kcal left' : 'kcal over'}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.round(progressRatio * 100)}%`,
                      backgroundColor: remainingCalories >= 0 ? '#F97316' : '#EF4444',
                    },
                  ]}
                />
              </View>

              {/* Macronutrient Pills */}
              <View style={styles.macroGrid}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={[styles.macroValue, { color: '#2563EB' }]}>
                    {summary?.protein || 0}g
                  </Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={[styles.macroValue, { color: '#D97706' }]}>
                    {summary?.carbohydrates || 0}g
                  </Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={[styles.macroValue, { color: '#8B5CF6' }]}>
                    {summary?.fat || 0}g
                  </Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Fiber</Text>
                  <Text style={[styles.macroValue, { color: '#16A34A' }]}>
                    {summary?.fiber || 0}g
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Action Navigation Buttons */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionCardPrimary}
                onPress={() => router.push('/(protected)/nutrition/log' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconPrimary}>
                  <Plus size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.actionTextPrimary}>Log Food</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCardMint}
                onPress={() => router.push('/(protected)/nutrition/meal-planner' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconMint}>
                  <Sparkles size={18} color={colors.primary} />
                </View>
                <Text style={styles.actionTextMint}>AI Planner</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCardOrange}
                onPress={() => router.push('/(protected)/nutrition/suggestions' as any)}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconOrange}>
                  <Compass size={18} color="#F97316" />
                </View>
                <Text style={styles.actionTextOrange}>Diet Tips</Text>
              </TouchableOpacity>
            </View>

            {/* Meal Sections Breakdown */}
            <Text style={styles.sectionHeaderTitle}>Today's Meals</Text>

            {MEAL_SECTIONS.map((section) => {
              const items = groupedLogs[section.type] || [];
              const sectionCals = items.reduce(
                (sum, log) => sum + (log.calculatedNutrition.calories || 0),
                0
              );

              return (
                <View key={section.type} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTitleBox}>
                      <Text style={styles.mealTitle}>{section.title}</Text>
                      <Text style={styles.mealTimeHint}>{section.timeHint}</Text>
                    </View>
                    <View style={styles.mealRightHeader}>
                      <Text style={styles.mealCalsText}>{sectionCals} kcal</Text>
                      <TouchableOpacity
                        style={styles.addFoodMiniButton}
                        onPress={() =>
                          router.push(
                            `/(protected)/nutrition/log?mealType=${section.type}` as any
                          )
                        }
                        activeOpacity={0.7}
                      >
                        <Plus size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {items.length === 0 ? (
                    <TouchableOpacity
                      style={styles.emptyMealBox}
                      onPress={() =>
                        router.push(
                          `/(protected)/nutrition/log?mealType=${section.type}` as any
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emptyMealText}>No food logged for {section.title.toLowerCase()}</Text>
                      <Text style={styles.emptyMealAction}>+ Tap to add</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.foodItemList}>
                      {items.map((log) => (
                        <View key={log._id} style={styles.foodItemRow}>
                          <View style={styles.foodItemInfo}>
                            <Text style={styles.foodItemName}>
                              {log.foodId?.name || 'Logged Food'}
                            </Text>
                            <Text style={styles.foodItemMeta}>
                              {log.quantity} {log.unit} • {log.weightGrams}g • {log.calculatedNutrition.protein}g protein
                            </Text>
                          </View>
                          <View style={styles.foodItemRight}>
                            <Text style={styles.foodItemCals}>
                              {log.calculatedNutrition.calories} kcal
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                handleDeleteFoodLog(log._id, log.foodId?.name || 'Food')
                              }
                              style={styles.deleteButton}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Trash2 size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab="nutrition" />
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
    paddingBottom: 110,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  calorieCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  calorieCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircleOrange: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  cardHeaderSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 2,
  },
  remainingBadge: {
    alignItems: 'flex-end',
  },
  remainingValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F97316',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  remainingLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 8,
  },
  macroGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  macroDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickActionCardPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionIconPrimary: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextPrimary: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  quickActionCardMint: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionIconMint: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextMint: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  quickActionCardOrange: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionIconOrange: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextOrange: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mealTitleBox: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  mealTimeHint: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 2,
  },
  mealRightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealCalsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  addFoodMiniButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMealBox: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMealText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  emptyMealAction: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginTop: 4,
  },
  foodItemList: {
    paddingTop: 8,
  },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  foodItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  foodItemMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 2,
  },
  foodItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  foodItemCals: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  deleteButton: {
    padding: 4,
  },
});

