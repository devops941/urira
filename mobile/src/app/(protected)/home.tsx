import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sun,
  Zap,
  Droplets,
  Utensils,
  Footprints,
  Bot,
  Sparkles,
  Calendar,
  Moon,
  Scale,
  Heart,
  ChevronRight,
  ArrowRight,
  Activity,
  Flame,
  FileText,
  Leaf,
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme/colors';
import { profileService } from '../../services/health/profileService';
import { bmiService } from '../../services/health/bmiService';
import { calorieService } from '../../services/health/calorieService';
import { goalsService } from '../../services/health/goalsService';
import { historyService } from '../../services/health/historyService';
import { aiService } from '../../services/ai/aiService';
import { nutritionService } from '../../services/nutrition/nutritionService';
import { activityService } from '../../services/wellness/activityService';
import { waterService } from '../../services/wellness/waterService';
import { sleepService } from '../../services/wellness/sleepService';
import { vitalityService } from '../../services/wellness/vitalityService';
import { SideDrawer } from '../../components/common/SideDrawer';
import { BottomNavBar } from '../../components/common/BottomNavBar';
import { FloatingAIChatButton } from '../../components/common/FloatingAIChatButton';
import { AppHeader } from '../../components/common/AppHeader';
import { LivingAvatarCard } from '../../components/home/LivingAvatarCard';
import { HomeLiveWalkingCard } from '../../components/home/HomeLiveWalkingCard';
import { stepTrackerNativeService } from '../../services/tracking/stepTrackerNativeService';
import { UserHealthProfile, HealthGoal, UnifiedHistoryItem } from '../../types/health';
import { AiHealthSummaryResponse } from '../../types/ai';
import { INutritionSummary } from '../../types/nutrition';
import { DailyVitalityScore } from '../../types/vitality';
import {
  DailyStepSummaryDto,
  DailyWaterSummaryDto,
  SleepRecordDto,
} from '../../types/wellness';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<UserHealthProfile | null>(null);
  const [latestBmi, setLatestBmi] = useState<any>(null);
  const [latestCalories, setLatestCalories] = useState<any>(null);
  const [activeGoals, setActiveGoals] = useState<HealthGoal[]>([]);
  const [recentHistory, setRecentHistory] = useState<UnifiedHistoryItem[]>([]);
  const [aiSummary, setAiSummary] = useState<AiHealthSummaryResponse | null>(null);
  const [nutritionSummary, setNutritionSummary] = useState<INutritionSummary | null>(null);
  const [stepsSummary, setStepsSummary] = useState<DailyStepSummaryDto | null>(null);
  const [waterSummary, setWaterSummary] = useState<DailyWaterSummaryDto | null>(null);
  const [sleepRecord, setSleepRecord] = useState<SleepRecordDto | null>(null);
  const [vitality, setVitality] = useState<DailyVitalityScore | null>(null);
  const [isLoggingWater, setIsLoggingWater] = useState(false);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Formatted date string
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  const loadData = useCallback(async () => {
    try {
      const [
        profRes,
        bmiRes,
        calRes,
        goalsRes,
        histRes,
        aiRes,
        nutRes,
        stepsRes,
        waterRes,
        sleepRes,
        vitRes,
      ] = await Promise.allSettled([
        profileService.getProfile(),
        bmiService.getLatest(),
        calorieService.getLatest(),
        goalsService.getGoals('ACTIVE'),
        historyService.getUnifiedHistory('ALL', 5),
        aiService.getHealthSummary(),
        nutritionService.getTodaySummary(),
        activityService.getTodaySummary(),
        waterService.getTodaySummary(),
        sleepService.getLatest(),
        vitalityService.getDailyVitality(),
      ]);

      if (profRes.status === 'fulfilled' && profRes.value) {
        setProfile(profRes.value);
        if (profRes.value.profilePhoto) {
          useAuthStore.getState().updateUser({ profilePhoto: profRes.value.profilePhoto });
        }
      }
      if (bmiRes.status === 'fulfilled' && bmiRes.value) setLatestBmi(bmiRes.value);
      if (calRes.status === 'fulfilled' && calRes.value) setLatestCalories(calRes.value);
      if (goalsRes.status === 'fulfilled' && goalsRes.value) setActiveGoals(goalsRes.value);
      if (histRes.status === 'fulfilled' && histRes.value) setRecentHistory(histRes.value);
      if (aiRes.status === 'fulfilled' && aiRes.value) setAiSummary(aiRes.value);
      if (nutRes.status === 'fulfilled' && nutRes.value) setNutritionSummary(nutRes.value);
      if (stepsRes.status === 'fulfilled' && stepsRes.value) setStepsSummary(stepsRes.value);
      if (waterRes.status === 'fulfilled' && waterRes.value) setWaterSummary(waterRes.value);
      if (sleepRes.status === 'fulfilled' && sleepRes.value) setSleepRecord(sleepRes.value);
      if (vitRes.status === 'fulfilled' && vitRes.value) setVitality(vitRes.value);
    } catch {
      // Non-blocking on initial dashboard load
    }
  }, []);

  // Auto-refresh dashboard metrics every time user views or returns to HomeScreen
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Quick 1-Tap Water Booster
  const handleQuickWaterBoost = async () => {
    if (isLoggingWater) return;
    try {
      setIsLoggingWater(true);
      await waterService.logWater({
        quantityMl: 500,
        beverageType: 'WATER',
        notes: 'Instant Vitality Boost (+500ml)',
      });
      await loadData();
    } catch {
      // Non-blocking
    } finally {
      setIsLoggingWater(false);
    }
  };

  const userName = profile?.fullName || user?.fullName || 'Health Champion';
  const firstName = profile?.firstName || userName.split(' ')[0] || 'Gokul';

  // Real data calculations for 3x2 grid progress bars
  const stepTarget = stepsSummary?.targetSteps || profile?.preferredStepGoal || 8000;
  const currentSteps = stepsSummary?.totalSteps || 0;
  const stepsRatio = Math.min(1.0, currentSteps / Math.max(stepTarget, 1));

  const calTarget = profile?.preferredDailyCalorieGoal || nutritionSummary?.calorieTarget || 2096;
  const currentCals = nutritionSummary?.consumedCalories || 0;
  const calRatio = Math.min(1.0, currentCals / Math.max(calTarget, 1));

  const waterTarget = profile?.preferredWaterIntakeMl || waterSummary?.targetMl || 2500;
  const currentWater = (waterSummary as any)?.totalConsumedMl || waterSummary?.totalAmountMl || 0;
  const waterRatio = Math.min(1.0, currentWater / Math.max(waterTarget, 1));

  const currentSleep = sleepRecord?.durationMinutes ? sleepRecord.durationMinutes / 60 : 7.8;
  const sleepRatio = Math.min(1.0, currentSleep / 8.0);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Side Drawer Off-Canvas Menu */}
      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Universal Top Header Bar */}
      <AppHeader
        isDrawerTrigger
        onBackPress={() => setDrawerOpen(true)}
        profilePhoto={profile?.profilePhoto}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* 1. Deep Forest Green Banner (Greeting & Weather) */}
        <View style={styles.topGreenBanner}>
          <View style={styles.bannerGreetingCol}>
            <Text style={styles.bannerGreetingTitle}>
              {getGreeting()}, {firstName} 👋
            </Text>
            <Text style={styles.bannerGreetingSubtitle}>
              Stay consistent, stay healthier!
            </Text>
          </View>

          <View style={styles.bannerDivider} />

          <View style={styles.bannerWeatherCol}>
            <View style={styles.weatherIconRow}>
              <Sun size={17} color="#FBBF24" />
              <Text style={styles.weatherTempText}>28°C</Text>
            </View>
            <Text style={styles.weatherCityText}>Madurai</Text>
          </View>
        </View>

        {/* 2. Dynamic Living Health Avatar Hero Showcase */}
        <LivingAvatarCard
          vitality={vitality}
          userName={firstName}
          stepsSummary={stepsSummary}
          waterSummary={waterSummary}
          nutritionSummary={nutritionSummary}
          sleepRecord={sleepRecord}
          onBoostApplied={loadData}
          profileWaterTarget={waterTarget}
          profileCalTarget={calTarget}
        />

        {/* 3. Live Walking Pedometer Widget */}
        <HomeLiveWalkingCard
          goalSteps={stepsSummary?.stepGoal || stepsSummary?.targetSteps || 7000}
          initialSteps={stepsSummary?.totalSteps || 0}
          initialDistanceKm={stepsSummary?.totalDistanceKm || 0}
          initialCalories={stepsSummary?.totalCalories || 0}
          userWeightKg={profile?.weightKg || 70}
          userHeightCm={profile?.heightCm || 170}
          userSex={profile?.biologicalSex || 'MALE'}
          onRefreshNeeded={loadData}
        />

        {/* 4. Instant Vitality Boosters Section */}
        <View style={styles.boostersSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleLeft}>
              <Zap size={18} color="#16A34A" />
              <Text style={styles.sectionTitle}>Instant Vitality Boosters</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(protected)/wellness')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllGreenText}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.boostersRow}>
            {/* Booster 1: +500 ml Water */}
            <TouchableOpacity
              style={styles.boosterCard}
              onPress={handleQuickWaterBoost}
              activeOpacity={0.75}
              disabled={isLoggingWater}
            >
              <View style={[styles.boosterIconCircle, { backgroundColor: '#E0F2FE' }]}>
                {isLoggingWater ? (
                  <ActivityIndicator size="small" color="#0284C7" />
                ) : (
                  <Droplets size={14} color="#0284C7" />
                )}
              </View>
              <View style={styles.boosterContent}>
                <Text style={styles.boosterTitle} numberOfLines={1}>+500ml Water</Text>
                <Text style={styles.boosterSubtitle}>+12% Vitality</Text>
              </View>
              <ChevronRight size={10} color="#94A3B8" />
            </TouchableOpacity>

            {/* Booster 2: Log Meal */}
            <TouchableOpacity
              style={styles.boosterCard}
              onPress={() => router.push('/(protected)/nutrition/log')}
              activeOpacity={0.75}
            >
              <View style={[styles.boosterIconCircle, { backgroundColor: '#FFEDD5' }]}>
                <Utensils size={14} color="#EA580C" />
              </View>
              <View style={styles.boosterContent}>
                <Text style={styles.boosterTitle} numberOfLines={1}>Log Meal</Text>
                <Text style={styles.boosterSubtitle}>+15% Fuel</Text>
              </View>
              <ChevronRight size={10} color="#94A3B8" />
            </TouchableOpacity>

            {/* Booster 3: Walk */}
            <TouchableOpacity
              style={styles.boosterCard}
              onPress={() => router.push('/(protected)/activity')}
              activeOpacity={0.75}
            >
              <View style={[styles.boosterIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Footprints size={14} color="#16A34A" />
              </View>
              <View style={styles.boosterContent}>
                <Text style={styles.boosterTitle} numberOfLines={1}>Walk</Text>
                <Text style={styles.boosterSubtitle}>+10% Energy</Text>
              </View>
              <ChevronRight size={10} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Today's Summary Section (3x2 Grid) */}
        <View style={styles.summarySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Today's Summary</Text>
            <View style={styles.dateChip}>
              <Calendar size={12} color="#64748B" />
              <Text style={styles.dateChipText}>{getFormattedDate()}</Text>
            </View>
          </View>

          <View style={styles.summaryGrid3x2}>
            {/* Card 1: Steps */}
            <TouchableOpacity
              style={styles.metricCard3Col}
              onPress={() => router.push('/(protected)/activity')}
              activeOpacity={0.8}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <Footprints size={15} color="#0EA5E9" />
              </View>
              <Text style={styles.metricCardLabel}>Steps</Text>
              <Text style={styles.metricCardValue}>
                {stepsSummary?.totalSteps !== undefined
                  ? stepsSummary.totalSteps.toLocaleString()
                  : '4,250'}
                <Text style={styles.metricCardTarget}> / {stepTarget >= 1000 ? `${(stepTarget / 1000).toFixed(0)}k` : stepTarget}</Text>
              </Text>
              <View style={styles.metricProgressBarTrack}>
                <View style={[styles.metricProgressBarFill, { width: `${Math.round(stepsRatio * 100)}%`, backgroundColor: '#0EA5E9' }]} />
              </View>
            </TouchableOpacity>

            {/* Card 2: Nutrition */}
            <TouchableOpacity
              style={styles.metricCard3Col}
              onPress={() => router.push('/(protected)/nutrition')}
              activeOpacity={0.8}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: '#FFEDD5' }]}>
                <Utensils size={15} color="#F97316" />
              </View>
              <Text style={styles.metricCardLabel}>Nutrition</Text>
              <Text style={styles.metricCardValue}>
                {nutritionSummary ? `${nutritionSummary.consumedCalories}` : '496'}
                <Text style={styles.metricCardTarget}> / {calTarget} kcal</Text>
              </Text>
              <View style={styles.metricProgressBarTrack}>
                <View style={[styles.metricProgressBarFill, { width: `${Math.round(calRatio * 100)}%`, backgroundColor: '#F97316' }]} />
              </View>
            </TouchableOpacity>

            {/* Card 3: Water */}
            <TouchableOpacity
              style={styles.metricCard3Col}
              onPress={() => router.push('/(protected)/water')}
              activeOpacity={0.8}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: '#CFFAFE' }]}>
                <Droplets size={15} color="#06B6D4" />
              </View>
              <Text style={styles.metricCardLabel}>Water</Text>
              <Text style={styles.metricCardValue}>
                {waterSummary?.totalAmountMl !== undefined
                  ? `${(waterSummary.totalAmountMl / 1000).toFixed(1)} L`
                  : '0.0 L'}
                <Text style={styles.metricCardTarget}> / {(waterTarget / 1000).toFixed(1)} L</Text>
              </Text>
              <View style={styles.metricProgressBarTrack}>
                <View style={[styles.metricProgressBarFill, { width: `${Math.round(waterRatio * 100)}%`, backgroundColor: '#06B6D4' }]} />
              </View>
            </TouchableOpacity>

            {/* Card 4: Sleep */}
            <TouchableOpacity
              style={styles.metricCard3Col}
              onPress={() => router.push('/(protected)/sleep')}
              activeOpacity={0.8}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: '#EDE9FE' }]}>
                <Moon size={15} color="#8B5CF6" />
              </View>
              <Text style={styles.metricCardLabel}>Sleep</Text>
              <Text style={styles.metricCardValue}>{currentSleep.toFixed(1)} h</Text>
              <Text style={styles.metricSubtitleBadge}>Target: 8 h</Text>
              <View style={styles.metricProgressBarTrack}>
                <View style={[styles.metricProgressBarFill, { width: `${Math.round(sleepRatio * 100)}%`, backgroundColor: '#8B5CF6' }]} />
              </View>
            </TouchableOpacity>

            {/* Card 5: BMI */}
            <TouchableOpacity
              style={styles.metricCard3Col}
              onPress={() => router.push('/(protected)/bmi')}
              activeOpacity={0.8}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <Scale size={15} color="#16A34A" />
              </View>
              <Text style={styles.metricCardLabel}>BMI</Text>
              <Text style={styles.metricCardValue}>
                {latestBmi ? `${Number(latestBmi.bmiValue).toFixed(2)}` : '24.46'}
              </Text>
              <Text style={[styles.metricSubtitleBadge, { color: '#16A34A' }]}>
                {latestBmi?.category || 'Healthy Weight'}
              </Text>
            </TouchableOpacity>

            {/* Card 6: Calorie Burn */}
            <TouchableOpacity
              style={styles.metricCard3Col}
              onPress={() => router.push('/(protected)/calories')}
              activeOpacity={0.8}
            >
              <View style={[styles.metricIconWrap, { backgroundColor: '#FFEDD5' }]}>
                <Flame size={15} color="#EA580C" />
              </View>
              <Text style={styles.metricCardLabel}>Calorie Burn</Text>
              <Text style={styles.metricCardValue}>
                {stepsSummary?.totalCalories ? `${stepsSummary.totalCalories}` : '185'}
                <Text style={styles.metricCardTarget}> kcal</Text>
              </Text>
              <Text style={[styles.metricSubtitleBadge, { color: '#EA580C' }]}>
                Daily Active
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. Quick Actions Section (5 Columns) */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.quickActionsRow}>
            {/* 1: BMI Calculator */}
            <TouchableOpacity
              style={styles.quickActionCol}
              onPress={() => router.push('/(protected)/bmi')}
              activeOpacity={0.75}
            >
              <View style={[styles.quickActionBox, { backgroundColor: '#E8F3EC' }]}>
                <Scale size={20} color={colors.primary} />
              </View>
              <Text style={styles.quickActionLabel}>BMI{'\n'}Calculator</Text>
            </TouchableOpacity>

            {/* 2: Calorie Estimate */}
            <TouchableOpacity
              style={styles.quickActionCol}
              onPress={() => router.push('/(protected)/calories')}
              activeOpacity={0.75}
            >
              <View style={[styles.quickActionBox, { backgroundColor: '#FFEDD5' }]}>
                <Flame size={20} color="#F97316" />
              </View>
              <Text style={styles.quickActionLabel}>Calorie{'\n'}Estimate</Text>
            </TouchableOpacity>

            {/* 3: Log Food */}
            <TouchableOpacity
              style={styles.quickActionCol}
              onPress={() => router.push('/(protected)/nutrition/log')}
              activeOpacity={0.75}
            >
              <View style={[styles.quickActionBox, { backgroundColor: '#E8F3EC' }]}>
                <Utensils size={20} color="#16A34A" />
              </View>
              <Text style={styles.quickActionLabel}>Log{'\n'}Food</Text>
            </TouchableOpacity>

            {/* 4: Activity & Steps */}
            <TouchableOpacity
              style={styles.quickActionCol}
              onPress={() => router.push('/(protected)/activity')}
              activeOpacity={0.75}
            >
              <View style={[styles.quickActionBox, { backgroundColor: '#E0F2FE' }]}>
                <Activity size={20} color="#0284C7" />
              </View>
              <Text style={styles.quickActionLabel}>Activity{'\n'}& Steps</Text>
            </TouchableOpacity>

            {/* 5: Reports & Insights */}
            <TouchableOpacity
              style={styles.quickActionCol}
              onPress={() => router.push('/(protected)/analytics')}
              activeOpacity={0.75}
            >
              <View style={[styles.quickActionBox, { backgroundColor: '#E8F3EC' }]}>
                <FileText size={20} color="#16A34A" />
              </View>
              <Text style={styles.quickActionLabel}>Reports{'\n'}& Insights</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating AI Health Assistant Chatbot Button on Bottom Right */}
      <FloatingAIChatButton bottomOffset={104} rightOffset={16} />

      {/* Fixed Bottom Navigation Bar (Home, Nutrition, Wellness, Analytics, Profile) */}
      <BottomNavBar activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 115,
  },
  /* Top Forest Green Banner */
  topGreenBanner: {
    backgroundColor: '#12372A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  bannerGreetingCol: {
    flex: 1,
    paddingRight: 10,
  },
  bannerGreetingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  bannerGreetingSubtitle: {
    fontSize: 11.5,
    color: '#A7F3D0',
    marginTop: 2,
    fontWeight: '400',
  },
  bannerDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 10,
  },
  bannerWeatherCol: {
    alignItems: 'flex-end',
  },
  weatherIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  weatherTempText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  weatherCityText: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 1,
  },
  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  viewAllGreenText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  /* Instant Boosters Section */
  boostersSection: {
    marginBottom: 14,
  },
  boostersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  boosterCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  boosterIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boosterContent: {
    flex: 1,
  },
  boosterTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  boosterSubtitle: {
    fontSize: 8,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  /* UYIRA AI Health Assistant Banner */
  aiAssistantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  aiAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F3EC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  aiLeafDot: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  aiTextContent: {
    flex: 1,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  aiMainTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  aiReadyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  aiReadyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  aiReadyLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  aiDescription: {
    fontSize: 10.5,
    color: '#64748B',
    lineHeight: 14,
  },
  askAiButton: {
    backgroundColor: '#12372A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  askAiButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  /* Today's Summary Section (3x2 Grid) */
  summarySection: {
    marginBottom: 16,
  },
  summaryGrid3x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  metricCard3Col: {
    width: '31.3%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricCardLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  metricCardValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricCardTarget: {
    fontSize: 9,
    fontWeight: '500',
    color: '#94A3B8',
  },
  metricSubtitleBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  metricProgressBarTrack: {
    width: '100%',
    height: 3.5,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  metricProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  /* Quick Actions Section (5 Columns) */
  quickActionsSection: {
    marginBottom: 14,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  quickActionCol: {
    width: '18%',
    alignItems: 'center',
  },
  quickActionBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  quickActionLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 12.5,
  },
});
