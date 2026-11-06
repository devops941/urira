import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Utensils,
  Plus,
  RefreshCw,
  Flame,
  ShieldCheck,
  ChevronRight,
  Info,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Heart,
  ArrowLeftRight,
  Check,
  X,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { colors } from '../../../theme/colors';
import { mealPlanService } from '../../../services/nutrition/mealPlanService';
import { foodService } from '../../../services/nutrition/foodService';
import { IMealPlan, IMealPlanDay, MealType, IFood } from '../../../types/nutrition';

export default function MealPlannerScreen() {
  const router = useRouter();

  const [duration, setDuration] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<IMealPlan[]>([]);
  const [activePlan, setActivePlan] = useState<IMealPlan | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(1);
  const [loggingMeal, setLoggingMeal] = useState<string | null>(null);

  // Substitution Modal State
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{
    dayIndex: number;
    mealType: MealType;
    oldFoodId: string;
    oldFoodName: string;
  } | null>(null);
  const [candidateFoods, setCandidateFoods] = useState<IFood[]>([]);
  const [selectedReplacementFood, setSelectedReplacementFood] = useState<IFood | null>(null);
  const [substitutionDelta, setSubstitutionDelta] = useState<any | null>(null);
  const [calculatingDelta, setCalculatingDelta] = useState(false);
  const [applyingSwap, setApplyingSwap] = useState(false);

  // Template Modal State
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templatesList, setTemplatesList] = useState<IMealPlan[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Load existing user meal plans
  useEffect(() => {
    async function fetchPlans() {
      try {
        const userPlans = await mealPlanService.getMealPlans();
        setPlans(userPlans);
        if (userPlans.length > 0) {
          setActivePlan(userPlans[0]);
        }
      } catch (err) {
        console.warn('Failed to load meal plans:', err);
      }
    }
    fetchPlans();
  }, []);

  const handleOpenSwapModal = async (
    foodId: string,
    foodName: string,
    mealType: MealType,
    dayIndex: number
  ) => {
    setSwapTarget({ dayIndex, mealType, oldFoodId: foodId, oldFoodName: foodName });
    setSelectedReplacementFood(null);
    setSubstitutionDelta(null);
    setShowSwapModal(true);

    try {
      const res = await foodService.searchFoods({ limit: 12 });
      // Exclude current food
      setCandidateFoods(res.foods.filter((f) => f._id !== foodId));
    } catch {
      // Non-blocking
    }
  };

  const handleSelectCandidateFood = async (food: IFood) => {
    if (!activePlan || !swapTarget) return;
    setSelectedReplacementFood(food);
    setCalculatingDelta(true);
    try {
      const delta = await mealPlanService.calculateSubstitutionDelta(activePlan._id, {
        dayIndex: swapTarget.dayIndex,
        mealType: swapTarget.mealType,
        oldFoodId: swapTarget.oldFoodId,
        newFoodId: food._id,
      });
      setSubstitutionDelta(delta);
    } catch (err) {
      console.warn('Error calculating delta:', err);
    } finally {
      setCalculatingDelta(false);
    }
  };

  const handleConfirmSwap = async () => {
    if (!activePlan || !swapTarget || !selectedReplacementFood) return;
    setApplyingSwap(true);
    try {
      const updated = await mealPlanService.swapFood(activePlan._id, {
        dayIndex: swapTarget.dayIndex,
        mealType: swapTarget.mealType,
        oldFoodId: swapTarget.oldFoodId,
        newFoodId: selectedReplacementFood._id,
      });
      setActivePlan(updated);
      setShowSwapModal(false);
      if (Platform.OS === 'web') window.alert('Food substitution applied successfully!');
      else Alert.alert('Success', 'Food substituted and nutritional totals updated.');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to substitute food';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setApplyingSwap(false);
    }
  };

  const handleRateMeal = async (
    mealType: MealType,
    dayIndex: number,
    rating: 'LOVED_IT' | 'GOOD' | 'AVERAGE' | 'NOT_PREFERRED'
  ) => {
    if (!activePlan) return;
    try {
      const updated = await mealPlanService.rateMeal(activePlan._id, {
        dayIndex,
        mealType,
        rating,
      });
      setActivePlan(updated);
    } catch {
      // Non-blocking
    }
  };

  const handleOpenTemplates = async () => {
    setShowTemplatesModal(true);
    setLoadingTemplates(true);
    try {
      const list = await mealPlanService.getTemplates();
      setTemplatesList(list);
    } catch {
      // Non-blocking
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveCurrentAsTemplate = async () => {
    if (!activePlan) return;
    setSavingTemplate(true);
    try {
      const templateName = activePlan.title || 'My Favorite Health Plan';
      await mealPlanService.saveAsTemplate(activePlan._id, templateName);
      if (Platform.OS === 'web') window.alert('Meal plan saved as reusable template!');
      else Alert.alert('Success', 'Meal plan saved to your reusable templates.');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save template';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    try {
      const newActive = await mealPlanService.applyTemplate(templateId);
      setActivePlan(newActive);
      setPlans((prev) => [newActive, ...prev]);
      setShowTemplatesModal(false);
      setActiveDayIndex(1);
      if (Platform.OS === 'web') window.alert('Template activated as current meal plan!');
      else Alert.alert('Success', 'Template activated as your active meal plan.');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to apply template';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const newPlan = await mealPlanService.generateMealPlan({
        duration,
        title: duration === 'DAILY' ? 'Daily Smart Health Meal Plan' : '7-Day Vitality Meal Plan',
      });
      setActivePlan(newPlan);
      setPlans((prev) => [newPlan, ...prev]);
      setActiveDayIndex(1);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to generate meal plan';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Generation Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!activePlan) return;
    try {
      const updated = await mealPlanService.approveMealPlan(activePlan._id);
      setActivePlan(updated);
      if (Platform.OS === 'web') window.alert('Meal plan approved and saved!');
      else Alert.alert('Plan Approved', 'Your meal plan is now active in your nutrition regimen.');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to approve plan';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const handleLogMeal = async (mealType: MealType) => {
    if (!activePlan) return;
    setLoggingMeal(mealType);
    try {
      const res = await mealPlanService.logMeal(activePlan._id, {
        dayIndex: activeDayIndex,
        mealType,
      });

      // Update active plan in state to show marked as logged
      setActivePlan(res.plan);

      if (Platform.OS === 'web') {
        window.alert(`Logged all ${mealType} items to your food log!`);
      } else {
        Alert.alert('Meal Logged', `Successfully logged all ${mealType} items to your food log.`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to log meal';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoggingMeal(null);
    }
  };

  const currentDay: IMealPlanDay | undefined = activePlan?.days?.find(
    (d) => d.dayIndex === activeDayIndex
  ) || activePlan?.days?.[0];

  return (
    <View style={styles.container}>
      <AppHeader title="AI Meal Planner" showBack onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Concept Banner */}
        <View style={styles.conceptBanner}>
          <View style={styles.conceptIcon}>
            <Sparkles size={20} color={colors.primary} />
          </View>
          <View style={styles.conceptTextContainer}>
            <Text style={styles.conceptTitle}>Intelligent Clinical Meal Planning</Text>
            <Text style={styles.conceptSubtitle}>
              Tailored to your daily calories, allergies, and South Indian food preferences. All nutrition is calculated deterministically from verified food records.
            </Text>
          </View>
        </View>

        {/* Duration Selector & Generator Button */}
        <View style={styles.generateSection}>
          <View style={styles.durationTabs}>
            <TouchableOpacity
              style={[
                styles.durationTab,
                duration === 'DAILY' && styles.durationTabActive,
              ]}
              onPress={() => setDuration('DAILY')}
            >
              <Text
                style={[
                  styles.durationTabText,
                  duration === 'DAILY' && styles.durationTabTextActive,
                ]}
              >
                Daily Plan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.durationTab,
                duration === 'WEEKLY' && styles.durationTabActive,
              ]}
              onPress={() => setDuration('WEEKLY')}
            >
              <Text
                style={[
                  styles.durationTabText,
                  duration === 'WEEKLY' && styles.durationTabTextActive,
                ]}
              >
                Weekly Plan
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.generateButton, loading && styles.buttonDisabled]}
            onPress={handleGeneratePlan}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Sparkles size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.generateButtonText}>
                  Generate {duration === 'DAILY' ? 'Daily' : 'Weekly'} Plan
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Plan Display */}
        {activePlan ? (
          <View style={styles.planContainer}>
            {/* Plan Header Card */}
            <View style={styles.planHeaderCard}>
              <View style={styles.planTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitleText}>{activePlan.title}</Text>
                  <Text style={styles.planMetaText}>
                    Duration: {activePlan.duration} • {activePlan.days?.length} day(s)
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    activePlan.status === 'APPROVED'
                      ? styles.statusBadgeApproved
                      : styles.statusBadgeDraft,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      activePlan.status === 'APPROVED'
                        ? styles.statusTextApproved
                        : styles.statusTextDraft,
                    ]}
                  >
                    {activePlan.status}
                  </Text>
                </View>
              </View>

              {/* Day Selector for Weekly Plans */}
              {activePlan.days?.length > 1 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.daysScroll}
                >
                  {activePlan.days.map((d) => (
                    <TouchableOpacity
                      key={d.dayIndex}
                      style={[
                        styles.dayChip,
                        activeDayIndex === d.dayIndex && styles.dayChipActive,
                      ]}
                      onPress={() => setActiveDayIndex(d.dayIndex)}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          activeDayIndex === d.dayIndex && styles.dayChipTextActive,
                        ]}
                      >
                        Day {d.dayIndex}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}

              {/* Day Nutrition Totals */}
              {currentDay ? (
                <View style={styles.dayTotalsBox}>
                  <View style={styles.dayTotalItem}>
                    <Text style={styles.dayTotalLabel}>Daily Calories</Text>
                    <Text style={[styles.dayTotalValue, { color: '#F97316' }]}>
                      {currentDay.totalDayCalories} kcal
                    </Text>
                  </View>
                  <View style={styles.dayTotalDivider} />
                  <View style={styles.dayTotalItem}>
                    <Text style={styles.dayTotalLabel}>Protein</Text>
                    <Text style={[styles.dayTotalValue, { color: '#2563EB' }]}>
                      {currentDay.totalDayProtein}g
                    </Text>
                  </View>
                  <View style={styles.dayTotalDivider} />
                  <View style={styles.dayTotalItem}>
                    <Text style={styles.dayTotalLabel}>Carbs</Text>
                    <Text style={[styles.dayTotalValue, { color: '#D97706' }]}>
                      {currentDay.totalDayCarbs}g
                    </Text>
                  </View>
                  <View style={styles.dayTotalDivider} />
                  <View style={styles.dayTotalItem}>
                    <Text style={styles.dayTotalLabel}>Fat</Text>
                    <Text style={[styles.dayTotalValue, { color: '#8B5CF6' }]}>
                      {currentDay.totalDayFat}g
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Template Actions Row */}
              <View style={styles.templateActionsRow}>
                <TouchableOpacity
                  style={styles.templateActionBtn}
                  onPress={handleSaveCurrentAsTemplate}
                  disabled={savingTemplate}
                >
                  <Bookmark size={14} color={colors.primary} />
                  <Text style={styles.templateActionBtnText}>
                    {savingTemplate ? 'Saving...' : 'Save as Template'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.templateActionBtn, { backgroundColor: '#F0FDF4' }]}
                  onPress={handleOpenTemplates}
                >
                  <Utensils size={14} color="#16A34A" />
                  <Text style={[styles.templateActionBtnText, { color: '#16A34A' }]}>
                    Saved Templates
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Meals in Selected Day */}
            {currentDay?.meals?.map((meal, idx) => (
              <View key={`${meal.mealType}-${idx}`} style={styles.mealPlanCard}>
                <View style={styles.mealPlanHeader}>
                  <View>
                    <Text style={styles.mealPlanTitle}>{meal.mealType}</Text>
                    <Text style={styles.mealPlanReason}>{meal.reason}</Text>
                  </View>
                  <Text style={styles.mealPlanCals}>{meal.totalMealCalories} kcal</Text>
                </View>

                {/* Foods list */}
                <View style={styles.mealFoodsList}>
                  {meal.foods?.map((food, fIdx) => (
                    <View key={`${food.foodId}-${fIdx}`} style={styles.mealFoodRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.mealFoodName}>{food.name}</Text>
                        <Text style={styles.mealFoodPortion}>
                          {food.quantity} {food.unit} ({food.weightGrams}g)
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                        <Text style={styles.mealFoodCals}>{food.calories} kcal</Text>
                        <Text style={styles.mealFoodMacros}>
                          {food.protein}g P • {food.carbohydrates}g C
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.swapFoodIconBtn}
                        onPress={() =>
                          handleOpenSwapModal(
                            food.foodId.toString(),
                            food.name,
                            meal.mealType,
                            currentDay.dayIndex
                          )
                        }
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <ArrowLeftRight size={15} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Meal Feedback Rating Row */}
                <View style={styles.mealRatingSection}>
                  <Text style={styles.mealRatingLabel}>Meal Feedback:</Text>
                  <View style={styles.mealRatingButtonsRow}>
                    {[
                      { key: 'LOVED_IT', label: 'Loved It', icon: Heart, color: '#E11D48' },
                      { key: 'GOOD', label: 'Good', icon: ThumbsUp, color: '#16A34A' },
                      { key: 'AVERAGE', label: 'Average', icon: Check, color: '#D97706' },
                      { key: 'NOT_PREFERRED', label: 'Dislike', icon: ThumbsDown, color: '#64748B' },
                    ].map((r) => {
                      const IconComp = r.icon;
                      const currentRating = activePlan.ratings?.find(
                        (rat: any) =>
                          rat.dayIndex === currentDay.dayIndex && rat.mealType === meal.mealType
                      )?.rating;
                      const isSelected = currentRating === r.key;
                      return (
                        <TouchableOpacity
                          key={r.key}
                          style={[
                            styles.ratingPill,
                            isSelected && { backgroundColor: r.color, borderColor: r.color },
                          ]}
                          onPress={() =>
                            handleRateMeal(meal.mealType, currentDay.dayIndex, r.key as any)
                          }
                        >
                          <IconComp
                            size={12}
                            color={isSelected ? '#FFFFFF' : r.color}
                            style={{ marginRight: 3 }}
                          />
                          <Text
                            style={[styles.ratingPillText, isSelected && { color: '#FFFFFF' }]}
                          >
                            {r.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {meal.preparationNotes ? (
                  <View style={styles.prepNotesBox}>
                    <Info size={14} color={colors.primary} />
                    <Text style={styles.prepNotesText}>{meal.preparationNotes}</Text>
                  </View>
                ) : null}

                {/* Log Meal Action Button */}
                <TouchableOpacity
                  style={[
                    styles.logMealButton,
                    meal.isLogged && styles.logMealButtonCompleted,
                  ]}
                  onPress={() => handleLogMeal(meal.mealType)}
                  disabled={meal.isLogged || loggingMeal === meal.mealType}
                  activeOpacity={0.8}
                >
                  {loggingMeal === meal.mealType ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : meal.isLogged ? (
                    <>
                      <CheckCircle2 size={16} color="#16A34A" style={{ marginRight: 6 }} />
                      <Text style={styles.logMealTextCompleted}>Meal Logged</Text>
                    </>
                  ) : (
                    <>
                      <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.logMealText}>Log This Meal</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ))}

            {/* Approve Button */}
            {activePlan.status === 'DRAFT' ? (
              <TouchableOpacity
                style={styles.approveButton}
                onPress={handleApprovePlan}
                activeOpacity={0.8}
              >
                <ShieldCheck size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.approveButtonText}>Approve & Save Plan</Text>
              </TouchableOpacity>
            ) : null}

            {/* Medical Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>{activePlan.disclaimer}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyPlanBox}>
            <Sparkles size={48} color={colors.textSecondary} />
            <Text style={styles.emptyPlanTitle}>No Active Meal Plan</Text>
            <Text style={styles.emptyPlanSubtitle}>
              Tap "Generate Daily Plan" above to create an AI-curated nutrition regimen tailored to your calorie target.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Food Substitution & Delta Comparison Modal */}
      <Modal
        visible={showSwapModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSwapModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitleText}>Food Substitution</Text>
                <Text style={styles.modalSubText}>
                  Replacing: <Text style={{ fontWeight: '700', color: colors.primary }}>{swapTarget?.oldFoodName}</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSwapModal(false)}>
                <X size={20} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            {/* Substitution Delta Comparison Box */}
            {calculatingDelta ? (
              <View style={styles.deltaLoadingBox}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.deltaLoadingText}>Calculating nutritional delta...</Text>
              </View>
            ) : substitutionDelta ? (
              <View style={styles.deltaBox}>
                <Text style={styles.deltaTitle}>Nutritional Difference (Delta):</Text>
                <View style={styles.deltaGrid}>
                  <View style={styles.deltaItem}>
                    <Text style={styles.deltaLabel}>Calories</Text>
                    <Text
                      style={[
                        styles.deltaValue,
                        { color: substitutionDelta.delta.calories > 0 ? '#F97316' : '#16A34A' },
                      ]}
                    >
                      {substitutionDelta.delta.calories > 0 ? '+' : ''}
                      {substitutionDelta.delta.calories} kcal
                    </Text>
                  </View>
                  <View style={styles.deltaItem}>
                    <Text style={styles.deltaLabel}>Protein</Text>
                    <Text
                      style={[
                        styles.deltaValue,
                        { color: substitutionDelta.delta.protein >= 0 ? '#16A34A' : '#EF4444' },
                      ]}
                    >
                      {substitutionDelta.delta.protein > 0 ? '+' : ''}
                      {substitutionDelta.delta.protein}g
                    </Text>
                  </View>
                  <View style={styles.deltaItem}>
                    <Text style={styles.deltaLabel}>Carbs</Text>
                    <Text style={styles.deltaValue}>
                      {substitutionDelta.delta.carbohydrates > 0 ? '+' : ''}
                      {substitutionDelta.delta.carbohydrates}g
                    </Text>
                  </View>
                  <View style={styles.deltaItem}>
                    <Text style={styles.deltaLabel}>Fat</Text>
                    <Text style={styles.deltaValue}>
                      {substitutionDelta.delta.fat > 0 ? '+' : ''}
                      {substitutionDelta.delta.fat}g
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.confirmSwapBtn}
                  onPress={handleConfirmSwap}
                  disabled={applyingSwap}
                >
                  {applyingSwap ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.confirmSwapBtnText}>Confirm & Apply Substitution</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.selectCandidateHint}>
                Select an alternative food from the verified database to preview nutritional differences:
              </Text>
            )}

            {/* Candidate Foods List */}
            <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
              {candidateFoods.map((f) => (
                <TouchableOpacity
                  key={f._id}
                  style={[
                    styles.candidateFoodCard,
                    selectedReplacementFood?._id === f._id && styles.candidateFoodCardActive,
                  ]}
                  onPress={() => handleSelectCandidateFood(f)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.candidateFoodName}>{f.name}</Text>
                    <Text style={styles.candidateFoodCategory}>{f.category}</Text>
                  </View>
                  <Text style={styles.candidateFoodCals}>
                    {Math.round(f.nutrientsPer100g.calories)} kcal/100g
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Saved Templates Modal */}
      <Modal
        visible={showTemplatesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTemplatesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitleText}>Saved Meal Templates</Text>
                <Text style={styles.modalSubText}>Reusable nutrition regimens</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTemplatesModal(false)}>
                <X size={20} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            {loadingTemplates ? (
              <View style={styles.deltaLoadingBox}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.deltaLoadingText}>Loading saved templates...</Text>
              </View>
            ) : templatesList.length === 0 ? (
              <View style={styles.emptyTemplatesBox}>
                <Bookmark size={36} color="#94A3B8" />
                <Text style={styles.emptyTemplatesTitle}>No Saved Templates</Text>
                <Text style={styles.emptyTemplatesSub}>
                  Save any generated meal plan as a template to quickly re-use it anytime.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {templatesList.map((tpl) => (
                  <View key={tpl._id} style={styles.templateCardRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.templateCardTitle}>
                        {tpl.templateName || tpl.title}
                      </Text>
                      <Text style={styles.templateCardMeta}>
                        {tpl.duration} • {tpl.days?.length} day(s)
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.activateTemplateBtn}
                      onPress={() => handleApplyTemplate(tpl._id)}
                    >
                      <Text style={styles.activateTemplateBtnText}>Activate</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  conceptBanner: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4E9DC',
  },
  conceptIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  conceptTextContainer: {
    flex: 1,
  },
  conceptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  conceptSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 2,
    lineHeight: 17,
  },
  generateSection: {
    marginBottom: 20,
  },
  durationTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  durationTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  durationTabActive: {
    backgroundColor: colors.secondary,
  },
  durationTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  durationTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  planContainer: {
    gap: 14,
  },
  planHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  planMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeDraft: {
    backgroundColor: '#FFF7ED',
  },
  statusBadgeApproved: {
    backgroundColor: '#F0FDF4',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextDraft: {
    color: '#F97316',
  },
  statusTextApproved: {
    color: '#16A34A',
  },
  daysScroll: {
    gap: 8,
    paddingVertical: 6,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  dayChipActive: {
    backgroundColor: colors.primary,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  dayTotalsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  dayTotalItem: {
    flex: 1,
    alignItems: 'center',
  },
  dayTotalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dayTotalValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayTotalDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  mealPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mealPlanHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mealPlanTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  mealPlanReason: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 240,
  },
  mealPlanCals: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F97316',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  mealFoodsList: {
    paddingVertical: 10,
    gap: 8,
  },
  mealFoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealFoodName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mealFoodPortion: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  mealFoodCals: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mealFoodMacros: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  prepNotesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginBottom: 10,
  },
  prepNotesText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  logMealButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logMealButtonCompleted: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  logMealText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logMealTextCompleted: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '700',
  },
  approveButton: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disclaimerBox: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyPlanBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyPlanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 14,
  },
  emptyPlanSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  templateActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  templateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  templateActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  swapFoodIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  mealRatingSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mealRatingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  mealRatingButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  ratingPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingPillActiveLoved: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  ratingPillActiveGood: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0EA5E9',
  },
  ratingPillActiveAvg: {
    backgroundColor: '#FEF9C3',
    borderColor: '#CA8A04',
  },
  ratingPillActiveNot: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  ratingPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deltaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  deltaLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  deltaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  selectCandidateHint: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginVertical: 8,
  },
  candidateFoodCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#E8F3EC',
  },
  candidateFoodName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  candidateFoodCategory: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  candidateFoodCals: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  candidateFoodCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  candidateFoodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  candidateFoodMacros: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deltaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deltaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  deltaItem: {
    alignItems: 'center',
  },
  deltaItemLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  deltaValPos: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  deltaValNeg: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  confirmSwapBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmSwapBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  deltaLoadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  deltaLoadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyTemplatesBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyTemplatesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyTemplatesSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  templateCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  templateCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  templateCardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activateTemplateBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  activateTemplateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

