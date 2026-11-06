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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Sparkles,
  Footprints,
  Droplets,
  Moon,
  Pill,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Flame,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { BottomNavBar } from '../../../components/common/BottomNavBar';
import { activityService } from '../../../services/wellness/activityService';
import { waterService } from '../../../services/wellness/waterService';
import { sleepService } from '../../../services/wellness/sleepService';
import { medicationService } from '../../../services/wellness/medicationService';
import { wellnessInsightService } from '../../../services/wellness/wellnessInsightService';
import {
  DailyStepSummaryDto,
  DailyWaterSummaryDto,
  SleepRecordDto,
  TodayDoseItemDto,
  WellnessInsightDto,
} from '../../../types/wellness';
import { colors } from '../../../theme/colors';

export default function WellnessHubScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [steps, setSteps] = useState<DailyStepSummaryDto | null>(null);
  const [water, setWater] = useState<DailyWaterSummaryDto | null>(null);
  const [sleep, setSleep] = useState<SleepRecordDto | null>(null);
  const [doses, setDoses] = useState<TodayDoseItemDto[]>([]);
  const [aiInsight, setAiInsight] = useState<WellnessInsightDto | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [stepRes, waterRes, sleepRes, doseRes] = await Promise.allSettled([
        activityService.getTodaySummary(),
        waterService.getTodaySummary(),
        sleepService.getLatest(),
        medicationService.getTodayDoses(),
      ]);

      if (stepRes.status === 'fulfilled') setSteps(stepRes.value);
      if (waterRes.status === 'fulfilled') setWater(waterRes.value);
      if (sleepRes.status === 'fulfilled') setSleep(sleepRes.value);
      if (doseRes.status === 'fulfilled') setDoses(doseRes.value);

      // AI insights
      try {
        const insight = await wellnessInsightService.getWeeklyInsight();
        setAiInsight(insight);
      } catch (err: any) {
        console.warn('AI insight fetch error:', err.message);
      }
    } catch (err: any) {
      console.warn('Error loading wellness hub:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto reload every time user returns to Wellness Hub
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const takenDoses = doses.filter((d) => d.status === 'TAKEN').length;
  const adherence = doses.length > 0 ? Math.round((takenDoses / doses.length) * 100) : 100;

  // Defensive Metrics Computation so values never get hidden
  const currentSteps = steps?.totalSteps ?? (steps as any)?.steps ?? 0;
  const goalSteps = steps?.stepGoal || steps?.targetSteps || 7000;
  const currentDistance = steps?.totalDistanceKm || steps?.distanceKm || 0;
  const currentCalories = steps?.totalCalories || steps?.caloriesBurned || 0;

  const currentWater = water?.totalConsumedMl || water?.totalWaterMl || (water as any)?.totalAmountMl || 0;
  const targetWater = water?.targetMl || 2500;
  const remainingWater =
    water?.remainingMl !== undefined
      ? water.remainingMl
      : Math.max(targetWater - currentWater, 0);
  const isWaterGoalAchieved =
    water?.isGoalAchieved ||
    (water?.progressPercentage || 0) >= 100 ||
    currentWater >= targetWater;

  // Dynamic live summary synthesis so user always sees their actual numbers
  const displaySummary =
    aiInsight?.summary && !aiInsight.summary.includes('0 steps and 0 ml')
      ? aiInsight.summary
      : currentSteps > 0 || currentWater > 0
      ? `Your daily wellness metrics show steady progress with ${currentSteps.toLocaleString()} steps and ${currentWater.toLocaleString()} ml water intake recorded.`
      : aiInsight?.summary ||
        'Keep logging your physical activities, hydration, and sleep to generate deep medical wellness evaluations.';

  return (
    <View style={styles.container}>
      <AppHeader title="Wellness Hub" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Holistic Wellness Assessment */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconBox}>
              <Sparkles size={20} color="#12372A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>AI Wellness Assessment</Text>
              <Text style={styles.aiSubtitle}>Personalized daily health synthesis</Text>
            </View>
            {aiInsight?.overallScore !== undefined && (
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreBadgeText}>{aiInsight.overallScore}/100</Text>
              </View>
            )}
          </View>

          <Text style={styles.aiSummaryText}>
            {displaySummary}
          </Text>

          {/* AI Focus Points */}
          {aiInsight?.recommendations && aiInsight.recommendations.length > 0 && (
            <View style={styles.recContainer}>
              {aiInsight.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                <View key={idx} style={styles.recItem}>
                  <View style={styles.recDot} />
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section: 5 Detailed Tracking Modules */}
        <Text style={styles.sectionTitle}>Daily Wellness Modules</Text>

        <View style={styles.modulesList}>
          {/* 1. Steps & Activity */}
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => router.push('/(protected)/activity')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Footprints size={22} color="#0EA5E9" />
            </View>
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>Activity & Steps</Text>
              <Text style={styles.moduleValue}>
                {currentSteps.toLocaleString()} / {goalSteps.toLocaleString()} steps
              </Text>
              <Text style={styles.moduleSub}>
                {currentDistance.toFixed(1)} km • {currentCalories} kcal burned
              </Text>
            </View>
            <ChevronRight size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          {/* 2. Water Intake */}
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => router.push('/(protected)/water')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#ECFEFF' }]}>
              <Droplets size={22} color="#06B6D4" />
            </View>
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>Water & Hydration</Text>
              <Text style={styles.moduleValue}>
                {currentWater.toLocaleString()} / {targetWater.toLocaleString()} ml
              </Text>
              <Text style={styles.moduleSub}>
                {isWaterGoalAchieved ? 'Goal Achieved 💧' : `${remainingWater.toLocaleString()} ml remaining`}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          {/* 3. Sleep Monitoring */}
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => router.push('/(protected)/sleep')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#F5F3FF' }]}>
              <Moon size={22} color="#8B5CF6" />
            </View>
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>Sleep Tracker</Text>
              <Text style={styles.moduleValue}>
                {sleep?.durationMinutes ? `${(sleep.durationMinutes / 60).toFixed(1)} hrs` : 'No log yet'}
              </Text>
              <Text style={styles.moduleSub}>
                {sleep?.sleepQuality ? `Quality: ${sleep.sleepQuality.replace('_', ' ')}` : 'Tap to log last night sleep'}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.secondaryText} />
          </TouchableOpacity>

          {/* 4. Medication Reminders */}
          <TouchableOpacity
            style={styles.moduleCard}
            onPress={() => router.push('/(protected)/medications')}
            activeOpacity={0.8}
          >
            <View style={[styles.moduleIconBox, { backgroundColor: '#E8F3EC' }]}>
              <Pill size={22} color="#12372A" />
            </View>
            <View style={styles.moduleInfo}>
              <Text style={styles.moduleTitle}>Medication Schedule</Text>
              <Text style={styles.moduleValue}>
                {takenDoses} of {doses.length} doses taken ({adherence}%)
              </Text>
              <Text style={styles.moduleSub}>
                {doses.length > 0 ? `${doses.length - takenDoses} pending today` : 'No doses scheduled'}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab="wellness" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  aiCard: {
    backgroundColor: '#E8F3EC',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#C7E2D1',
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#12372A',
  },
  aiSubtitle: {
    fontSize: 12,
    color: '#2D6A4F',
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: '#12372A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  scoreBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  aiSummaryText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#1F2937',
    marginBottom: 12,
  },
  recContainer: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginTop: 6,
  },
  recText: {
    flex: 1,
    fontSize: 12,
    color: '#1F2937',
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 12,
  },
  modulesList: {
    gap: 12,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  moduleIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
  },
  moduleValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
  moduleSub: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
  },
});
