import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Trash2,
  Clock,
  Compass,
  TrendingUp,
  PieChart,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { BottomNavBar } from '../../../components/common/BottomNavBar';
import { PeriodFilterBar, FilterMode } from '../../../components/common/PeriodFilterBar';
import { InteractiveCalendarModal } from '../../../components/common/InteractiveCalendarModal';
import { colors } from '../../../theme/colors';
import { foodLogService } from '../../../services/nutrition/foodLogService';
import { profileService } from '../../../services/health/profileService';
import {
  INutritionSummary,
  IFoodLog,
  IFoodLogRangeSummary,
  MealType,
} from '../../../types/nutrition';
import { HealthProfileDto } from '../../../types/health';

const NUTRITION_COLOR = '#F97316';
const NUTRITION_BG_LIGHT = '#FFF7ED';
const NUTRITION_BORDER = '#FED7AA';

const MEAL_SECTIONS: { type: MealType; title: string; timeHint: string }[] = [
  { type: MealType.BREAKFAST, title: 'Breakfast', timeHint: '7:00 AM - 10:00 AM' },
  { type: MealType.MORNING_SNACK, title: 'Morning Snack', timeHint: '11:00 AM - 12:00 PM' },
  { type: MealType.LUNCH, title: 'Lunch', timeHint: '12:30 PM - 2:30 PM' },
  { type: MealType.EVENING_SNACK, title: 'Evening Snack', timeHint: '4:30 PM - 6:00 PM' },
  { type: MealType.DINNER, title: 'Dinner', timeHint: '7:30 PM - 9:30 PM' },
  { type: MealType.OTHER, title: 'Other / Late Night', timeHint: 'Anytime' },
];

const toDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getTodayString = (): string => toDateString(new Date());

const parseDateString = (str: string): Date => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const getWeekRange = (dateStr: string) => {
  const date = parseDateString(dateStr);
  const dayOfWeek = date.getDay();
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateString(monday), end: toDateString(sunday) };
};

const getMonthRange = (yearMonthStr: string) => {
  const [y, m] = yearMonthStr.split('-').map(Number);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
};

export default function NutritionDashboardScreen() {
  const router = useRouter();
  const todayStr = useMemo(() => getTodayString(), []);

  // Filter Mode State
  const [filterMode, setFilterMode] = useState<FilterMode>('DAY');
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [weekAnchor, setWeekAnchor] = useState<string>(todayStr);
  const [monthAnchor, setMonthAnchor] = useState<string>(todayStr.substring(0, 7));
  const [yearAnchor, setYearAnchor] = useState<number>(new Date().getFullYear());
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return toDateString(d);
    })(),
    end: todayStr,
  });

  // Calendar Modal State
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<INutritionSummary | null>(null);
  const [rangeSummary, setRangeSummary] = useState<IFoodLogRangeSummary | null>(null);
  const [profile, setProfile] = useState<HealthProfileDto | null>(null);
  const [groupedLogs, setGroupedLogs] = useState<Record<MealType, IFoodLog[]>>({
    [MealType.BREAKFAST]: [],
    [MealType.MORNING_SNACK]: [],
    [MealType.LUNCH]: [],
    [MealType.EVENING_SNACK]: [],
    [MealType.DINNER]: [],
    [MealType.OTHER]: [],
  });

  // Active Period Computation
  const activePeriod = useMemo(() => {
    if (filterMode === 'DAY') {
      const isToday = selectedDay === todayStr;
      const isYesterday = (() => {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return selectedDay === toDateString(y);
      })();

      const d = parseDateString(selectedDay);
      let title = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (isToday) title = 'Today';
      else if (isYesterday) title = 'Yesterday';

      return {
        startDate: selectedDay,
        endDate: selectedDay,
        title,
        subtitle: d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
        isCurrent: isToday,
      };
    }

    if (filterMode === 'WEEK') {
      const { start, end } = getWeekRange(weekAnchor);
      const isCurrentWeek = getWeekRange(todayStr).start === start;
      const startD = parseDateString(start);
      const endD = parseDateString(end);
      const title = isCurrentWeek
        ? 'This Week'
        : `${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      return {
        startDate: start,
        endDate: end,
        title,
        subtitle: `${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        isCurrent: isCurrentWeek,
      };
    }

    if (filterMode === 'MONTH') {
      const { start, end } = getMonthRange(monthAnchor);
      const isCurrentMonth = todayStr.substring(0, 7) === monthAnchor;
      const [y, m] = monthAnchor.split('-').map(Number);
      const monthDate = new Date(y, m - 1, 1);
      const title = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return {
        startDate: start,
        endDate: end,
        title,
        subtitle: isCurrentMonth ? 'Current Month' : `${monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
        isCurrent: isCurrentMonth,
      };
    }

    if (filterMode === 'YEAR') {
      const isCurrentYear = new Date().getFullYear() === yearAnchor;
      return {
        startDate: `${yearAnchor}-01-01`,
        endDate: `${yearAnchor}-12-31`,
        title: `Year ${yearAnchor}`,
        subtitle: `Jan 01, ${yearAnchor} – Dec 31, ${yearAnchor}`,
        isCurrent: isCurrentYear,
      };
    }

    // CUSTOM
    const diffDays = Math.max(
      1,
      Math.round(
        (parseDateString(customRange.end).getTime() - parseDateString(customRange.start).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
    const startD = parseDateString(customRange.start);
    const endD = parseDateString(customRange.end);
    return {
      startDate: customRange.start,
      endDate: customRange.end,
      title: `${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      subtitle: `Custom Filter • ${diffDays} Days Range`,
      isCurrent: customRange.end === todayStr,
    };
  }, [filterMode, selectedDay, weekAnchor, monthAnchor, yearAnchor, customRange, todayStr]);

  const inFlightRef = React.useRef(false);
  const loadData = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const prof = await profileService.getProfile().catch(() => null);
      if (prof) setProfile(prof);

      if (filterMode === 'DAY') {
        const historyRes = await foodLogService.getHistory({ date: activePeriod.startDate });
        setSummary(historyRes.summary || null);

        // Group day logs
        const grouped: Record<MealType, IFoodLog[]> = {
          [MealType.BREAKFAST]: [],
          [MealType.MORNING_SNACK]: [],
          [MealType.LUNCH]: [],
          [MealType.EVENING_SNACK]: [],
          [MealType.DINNER]: [],
          [MealType.OTHER]: [],
        };
        for (const log of (historyRes.logs || [])) {
          if (grouped[log.mealType]) grouped[log.mealType].push(log);
        }
        setGroupedLogs(grouped);
        setRangeSummary(null);
      } else {
        const rangeRes = await foodLogService.getRangeSummary(activePeriod.startDate, activePeriod.endDate);
        setRangeSummary(rangeRes);
        setSummary(null);
      }
    } catch (err: any) {
      console.warn('Failed to load nutrition data:', err.message || err);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterMode, activePeriod.startDate, activePeriod.endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Stepper handlers (< and >)
  const handlePrevPeriod = () => {
    if (filterMode === 'DAY') {
      const cur = parseDateString(selectedDay);
      cur.setDate(cur.getDate() - 1);
      setSelectedDay(toDateString(cur));
    } else if (filterMode === 'WEEK') {
      const cur = parseDateString(weekAnchor);
      cur.setDate(cur.getDate() - 7);
      setWeekAnchor(toDateString(cur));
    } else if (filterMode === 'MONTH') {
      const [y, m] = monthAnchor.split('-').map(Number);
      const cur = new Date(y, m - 2, 1);
      setMonthAnchor(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`);
    } else if (filterMode === 'YEAR') {
      setYearAnchor((prev) => prev - 1);
    }
  };

  const handleNextPeriod = () => {
    if (activePeriod.isCurrent) return;

    if (filterMode === 'DAY') {
      const cur = parseDateString(selectedDay);
      cur.setDate(cur.getDate() + 1);
      const nextStr = toDateString(cur);
      if (nextStr <= todayStr) setSelectedDay(nextStr);
    } else if (filterMode === 'WEEK') {
      const cur = parseDateString(weekAnchor);
      cur.setDate(cur.getDate() + 7);
      setWeekAnchor(toDateString(cur));
    } else if (filterMode === 'MONTH') {
      const [y, m] = monthAnchor.split('-').map(Number);
      const cur = new Date(y, m, 1);
      const nextYM = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
      if (nextYM <= todayStr.substring(0, 7)) setMonthAnchor(nextYM);
    } else if (filterMode === 'YEAR') {
      if (yearAnchor < new Date().getFullYear()) setYearAnchor((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setSelectedDay(todayStr);
    setWeekAnchor(todayStr);
    setMonthAnchor(todayStr.substring(0, 7));
    setYearAnchor(new Date().getFullYear());
  };

  const handleApplyCalendar = (start: string, end: string, mode: 'DAY' | 'WEEK' | 'CUSTOM') => {
    if (mode === 'DAY') {
      setFilterMode('DAY');
      setSelectedDay(start);
    } else if (mode === 'WEEK') {
      setFilterMode('WEEK');
      setWeekAnchor(start);
    } else {
      setFilterMode('CUSTOM');
      setCustomRange({ start, end });
    }
    setCalendarModalVisible(false);
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

  // Metrics computation
  const isDayMode = filterMode === 'DAY';
  const baseTarget = profile?.preferredDailyCalorieGoal || summary?.calorieTarget || 2000;
  const daysCount = isDayMode ? 1 : (rangeSummary?.daysCount || 1);
  const periodTarget = isDayMode ? baseTarget : baseTarget * daysCount;
  const totalCalories = isDayMode ? (summary?.consumedCalories || 0) : (rangeSummary?.totalCalories || 0);
  const avgCalories = isDayMode ? totalCalories : (rangeSummary?.avgDailyCalories || 0);
  const remainingCalories = periodTarget - totalCalories;
  const progressRatio = Math.min(totalCalories / (periodTarget || 1), 1);

  const protein = isDayMode ? (summary?.protein || 0) : (rangeSummary?.avgDailyProtein || 0);
  const carbs = isDayMode ? (summary?.carbohydrates || 0) : (rangeSummary?.avgDailyCarbs || 0);
  const fat = isDayMode ? (summary?.fat || 0) : (rangeSummary?.avgDailyFat || 0);
  const fiber = isDayMode ? (summary?.fiber || 0) : (rangeSummary?.totalFiberGrams ? Math.round((rangeSummary.totalFiberGrams / daysCount) * 10) / 10 : 0);

  const allLogsList: IFoodLog[] = isDayMode
    ? Object.values(groupedLogs).flat()
    : (rangeSummary?.logs || []);

  return (
    <View style={styles.container}>
      <AppHeader title="Nutrition & Diet" showBack onBackPress={() => router.replace('/(protected)/home')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Unified Period Filter Bar */}
        <PeriodFilterBar
          activeMode={filterMode}
          onModeChange={(mode) => {
            setFilterMode(mode);
            if (mode === 'CUSTOM') setCalendarModalVisible(true);
          }}
          title={activePeriod.title}
          subtitle={activePeriod.subtitle}
          isCurrentPeriod={activePeriod.isCurrent}
          onPrev={handlePrevPeriod}
          onNext={handleNextPeriod}
          onOpenCalendar={() => setCalendarModalVisible(true)}
          onGoToday={handleGoToday}
          accentColor={NUTRITION_COLOR}
          accentLightBg={NUTRITION_BG_LIGHT}
          accentBorder={NUTRITION_BORDER}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={NUTRITION_COLOR} />
            <Text style={styles.loadingText}>Loading nutrition metrics...</Text>
          </View>
        ) : (
          <>
            {/* Calorie Target Hero Card */}
            <View style={styles.calorieCard}>
              <View style={styles.calorieCardHeader}>
                <View style={styles.iconCircleOrange}>
                  <Flame size={20} color={NUTRITION_COLOR} />
                </View>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.cardHeaderTitle}>
                    {isDayMode ? `${activePeriod.title}'s Calorie Target` : 'Period Calorie Target'}
                  </Text>
                  <Text style={styles.cardHeaderSubtitle}>
                    {totalCalories} of {periodTarget} kcal consumed
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
                      backgroundColor: remainingCalories >= 0 ? NUTRITION_COLOR : '#EF4444',
                    },
                  ]}
                />
              </View>

              {/* Macronutrient Pills */}
              <View style={styles.macroGrid}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>{isDayMode ? 'Protein' : 'Avg Protein'}</Text>
                  <Text style={[styles.macroValue, { color: '#2563EB' }]}>{protein}g</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>{isDayMode ? 'Carbs' : 'Avg Carbs'}</Text>
                  <Text style={[styles.macroValue, { color: '#D97706' }]}>{carbs}g</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>{isDayMode ? 'Fat' : 'Avg Fat'}</Text>
                  <Text style={[styles.macroValue, { color: '#8B5CF6' }]}>{fat}g</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>{isDayMode ? 'Fiber' : 'Avg Fiber'}</Text>
                  <Text style={[styles.macroValue, { color: '#16A34A' }]}>{fiber}g</Text>
                </View>
              </View>
            </View>

            {/* Quick Action Buttons */}
            {isDayMode && (
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
                    <Compass size={18} color={NUTRITION_COLOR} />
                  </View>
                  <Text style={styles.actionTextOrange}>Diet Tips</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Meal Breakdown Card (For Week/Month/Year/Custom) */}
            {!isDayMode && rangeSummary?.mealBreakdown && (
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <PieChart size={18} color={NUTRITION_COLOR} />
                  <Text style={styles.chartTitle}>Meal Distribution</Text>
                </View>
                <View style={styles.mealDistGrid}>
                  {Object.entries(rangeSummary.mealBreakdown).map(([mealKey, stat]) => (
                    <View key={mealKey} style={styles.mealDistItem}>
                      <Text style={styles.mealDistLabel}>{mealKey.replace('_', ' ')}</Text>
                      <Text style={styles.mealDistValue}>{stat.calories} kcal</Text>
                      <Text style={styles.mealDistCount}>{stat.count} logged</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Period Daily Calorie Breakdown Chart */}
            {!isDayMode && rangeSummary?.dailyBreakdown && rangeSummary.dailyBreakdown.length > 0 && (
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <TrendingUp size={18} color={NUTRITION_COLOR} />
                  <Text style={styles.chartTitle}>Daily Calorie Intake</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
                  <View style={styles.chartContainer}>
                    {rangeSummary.dailyBreakdown.map((item, idx) => {
                      const cals = item.calories || 0;
                      const barHeightPct = Math.min(100, Math.round((cals / (baseTarget || 2000)) * 100));
                      return (
                        <View key={item.date || idx} style={styles.barCol}>
                          <Text style={styles.barValueText}>{cals > 0 ? `${cals}` : ''}</Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                { height: `${Math.max(8, barHeightPct)}%` },
                                cals > baseTarget * 1.1 && { backgroundColor: '#EF4444' },
                              ]}
                            />
                          </View>
                          <Text style={styles.barDayText}>{item.label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Day Mode: Meal Sections */}
            {isDayMode ? (
              <>
                <Text style={styles.sectionHeaderTitle}>{activePeriod.title}'s Meals</Text>
                {MEAL_SECTIONS.map((section) => {
                  const items = groupedLogs[section.type] || [];
                  const sectionCals = items.reduce(
                    (sum, log) => sum + (log.calculatedNutrition?.calories || 0),
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
                                  {log.foodId?.name || log.manualFoodName || 'Logged Food'}
                                </Text>
                                <Text style={styles.foodItemMeta}>
                                  {log.quantity} {log.unit} • {log.weightGrams}g • {log.calculatedNutrition?.protein || 0}g protein
                                </Text>
                              </View>
                              <View style={styles.foodItemRight}>
                                <Text style={styles.foodItemCals}>
                                  {log.calculatedNutrition?.calories || 0} kcal
                                </Text>
                                <TouchableOpacity
                                  onPress={() =>
                                    handleDeleteFoodLog(log._id, log.foodId?.name || log.manualFoodName || 'Food')
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
            ) : (
              /* Range Mode: All Period Meals List */
              <>
                <Text style={styles.sectionHeaderTitle}>Period Meals ({allLogsList.length})</Text>
                {allLogsList.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Utensils size={36} color={colors.secondaryText} style={{ opacity: 0.5 }} />
                    <Text style={styles.emptyCardTitle}>No meals logged for this period</Text>
                    <Text style={styles.emptyCardSubtitle}>Select another period or switch to Day to log food</Text>
                  </View>
                ) : (
                  <View style={styles.rangeLogsList}>
                    {allLogsList.map((log) => (
                      <View key={log._id} style={styles.rangeLogItem}>
                        <View style={styles.foodItemInfo}>
                          <Text style={styles.foodItemName}>{log.foodId?.name || 'Logged Meal'}</Text>
                          <Text style={styles.foodItemMeta}>
                            {log.mealType.replace('_', ' ')} • {log.quantity} {log.unit} • {log.dateString || ''}
                          </Text>
                        </View>
                        <Text style={styles.foodItemCals}>
                          {log.calculatedNutrition?.calories || 0} kcal
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Interactive Calendar Modal */}
      <InteractiveCalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        initialStartDate={activePeriod.startDate}
        initialEndDate={activePeriod.endDate}
        initialMode={filterMode === 'DAY' ? 'DAY' : filterMode === 'WEEK' ? 'WEEK' : 'RANGE'}
        onApply={handleApplyCalendar}
        accentColor={NUTRITION_COLOR}
        accentLightBg={NUTRITION_BG_LIGHT}
      />

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
    paddingHorizontal: 16,
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
    borderColor: NUTRITION_BORDER,
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
    backgroundColor: NUTRITION_BG_LIGHT,
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
    color: NUTRITION_COLOR,
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
    backgroundColor: NUTRITION_BG_LIGHT,
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
    color: NUTRITION_COLOR,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mealDistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealDistItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: NUTRITION_BG_LIGHT,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NUTRITION_BORDER,
  },
  mealDistLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  mealDistValue: {
    fontSize: 14,
    fontWeight: '700',
    color: NUTRITION_COLOR,
  },
  mealDistCount: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chartScroll: {
    paddingRight: 10,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 12,
    paddingTop: 20,
    paddingBottom: 6,
  },
  barCol: {
    alignItems: 'center',
    minWidth: 32,
  },
  barValueText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  barTrack: {
    width: 14,
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: NUTRITION_COLOR,
    borderRadius: 7,
  },
  barDayText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 6,
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
    color: NUTRITION_COLOR,
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
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptyCardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  rangeLogsList: {
    gap: 10,
    marginBottom: 20,
  },
  rangeLogItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
