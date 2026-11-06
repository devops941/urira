import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Footprints,
  Flame,
  Clock,
  Compass,
  Plus,
  X,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Trash2,
  Smartphone,
  Play,
  Zap,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { colors } from '../../../theme/colors';
import { activityService } from '../../../services/wellness/activityService';
import {
  stepTrackerNativeService,
  ActiveWalkingState,
} from '../../../services/tracking/stepTrackerNativeService';
import {
  IActivityTodaySummary,
  IWeeklyActivity,
  ActivitySource,
} from '../../../types/wellness';

export default function ActivityScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<IActivityTodaySummary | null>(null);
  const [weekly, setWeekly] = useState<IWeeklyActivity | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveWalkingState | null>(null);

  // Manual Add Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [stepsInput, setStepsInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sumRes, weekRes, active] = await Promise.all([
        activityService.getTodaySummary(),
        activityService.getWeeklyTrends(),
        stepTrackerNativeService.restoreActiveSession(),
      ]);
      setSummary(sumRes);
      setWeekly(weekRes);
      setActiveSession(active && active.status !== 'IDLE' ? active : null);
    } catch (err: any) {
      console.warn('Failed to load activity metrics:', err.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddManualSteps = async () => {
    const steps = parseInt(stepsInput, 10);
    if (isNaN(steps) || steps <= 0) {
      if (Platform.OS === 'web') window.alert('Please enter a valid step count');
      else Alert.alert('Invalid Input', 'Please enter a valid step count');
      return;
    }

    setSubmitting(true);
    try {
      await activityService.logActivity({
        steps,
        activityType: 'WALKING',
        source: ActivitySource.MANUAL,
        notes: notesInput || undefined,
      });

      setModalVisible(false);
      setStepsInput('');
      setNotesInput('');
      loadData();

      if (Platform.OS === 'web') {
        window.alert(`Logged ${steps.toLocaleString()} steps!`);
      } else {
        Alert.alert('Steps Logged', `Successfully logged ${steps.toLocaleString()} steps.`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to record steps';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const totalSteps = summary?.totalSteps || 0;
  const goal = summary?.stepGoal || 8000;
  const progressRatio = Math.min(totalSteps / (goal || 1), 1);
  const progressPercent = Math.round(progressRatio * 100);

  return (
    <View style={styles.container}>
      <AppHeader title="Activity & Steps" showBack onBackPress={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching step analytics...</Text>
          </View>
        ) : (
          <>
            {/* Main Daily Step Ring Card */}
            <View style={styles.stepCard}>
              <View style={styles.stepCardHeader}>
                <View style={styles.iconCircleBlue}>
                  <Footprints size={22} color="#0EA5E9" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepCardTitle}>Daily Step Count</Text>
                  <Text style={styles.stepCardSubtitle}>
                    Goal: {goal.toLocaleString()} steps
                  </Text>
                </View>
                <View style={styles.progressPercentBadge}>
                  <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                </View>
              </View>

              {/* Big Step Hero */}
              <View style={styles.stepHeroRow}>
                <Text style={styles.stepHeroValue}>{totalSteps.toLocaleString()}</Text>
                <Text style={styles.stepHeroUnit}>steps</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>

              {/* Metric Breakdown Grid */}
              <View style={styles.metricGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Distance</Text>
                  <Text style={[styles.metricValue, { color: '#0EA5E9' }]}>
                    {summary?.totalDistanceKm || 0} km
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Active Time</Text>
                  <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>
                    {summary?.totalActiveMinutes || 0} min
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Calories</Text>
                  <Text style={[styles.metricValue, { color: '#F97316' }]}>
                    {summary?.totalCalories || 0} kcal
                  </Text>
                </View>
              </View>
            </View>

            {/* Live Workout Launcher Banner */}
            {activeSession ? (
              <TouchableOpacity
                style={styles.activeWorkoutBanner}
                onPress={() => router.push('/(protected)/activity/tracker')}
                activeOpacity={0.88}
              >
                <View style={styles.activeWorkoutIconCircle}>
                  <Footprints size={22} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.liveBadgeRow}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.liveActiveBadgeText}>WORKOUT IN PROGRESS</Text>
                  </View>
                  <Text style={styles.activeWorkoutTitle}>
                    {activeSession.steps.toLocaleString()} steps tracked
                  </Text>
                  <Text style={styles.activeWorkoutSubtitle}>
                    Status: {activeSession.status} • Tap to view live workout
                  </Text>
                </View>
                <View style={styles.resumeWorkoutBtn}>
                  <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.resumeWorkoutBtnText}>Resume</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.liveWorkoutBanner}
                onPress={() => router.push('/(protected)/activity/tracker')}
                activeOpacity={0.88}
              >
                <View style={styles.liveWorkoutIconCircle}>
                  <Footprints size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.liveBadgeRow}>
                    <View style={styles.livePill}>
                      <Zap size={10} color="#34D399" />
                      <Text style={styles.liveBadgeText}>REAL-TIME HARDWARE SENSOR</Text>
                    </View>
                  </View>
                  <Text style={styles.liveWorkoutTitle}>Start Live Walking Workout</Text>
                  <Text style={styles.liveWorkoutSubtitle}>
                    Continuous hardware tracking • Screen-locked background mode
                  </Text>
                </View>
                <View style={styles.liveWorkoutStartBtn}>
                  <Play size={16} color="#064E3B" fill="#064E3B" />
                </View>
              </TouchableOpacity>
            )}

            {/* Quick Actions Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.addStepsButton}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
              >
                <Plus size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.addStepsButtonText}>+ Log Steps Manually</Text>
              </TouchableOpacity>
            </View>

            {/* Weekly Trend Section */}
            <Text style={styles.sectionTitle}>7-Day Activity Trends</Text>
            <View style={styles.weeklyCard}>
              <View style={styles.weeklyBarsRow}>
                {weekly?.history.map((day, idx) => {
                  const dayName = new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'narrow',
                  });
                  const barHeight = Math.min(Math.round((day.steps / (goal || 1)) * 100), 100);

                  return (
                    <View key={idx} style={styles.dayBarCol}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${barHeight}%`,
                              backgroundColor: day.goalReached ? '#16A34A' : '#0EA5E9',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.dayBarLabel}>{dayName}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.weeklySummaryRow}>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatLabel}>Daily Average</Text>
                  <Text style={styles.weeklyStatValue}>
                    {weekly?.avgDailySteps.toLocaleString() || 0} steps
                  </Text>
                </View>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatLabel}>Total 7-Day Steps</Text>
                  <Text style={styles.weeklyStatValue}>
                    {weekly?.totalWeeklySteps.toLocaleString() || 0}
                  </Text>
                </View>
              </View>
            </View>

            {/* Today's Logged Entries */}
            <Text style={styles.sectionTitle}>Today's Activity Sessions</Text>
            {summary?.records.length === 0 ? (
              <View style={styles.emptyCard}>
                <Footprints size={36} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>No activity recorded today</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "+ Record Steps" above to log your morning walk or movement.
                </Text>
              </View>
            ) : (
              <View style={styles.recordsList}>
                {summary?.records.map((rec) => (
                  <View key={rec._id} style={styles.recordItem}>
                    <View style={styles.recordLeft}>
                      <Text style={styles.recordTitle}>
                        {rec.steps.toLocaleString()} steps
                      </Text>
                      <Text style={styles.recordMeta}>
                        {rec.distanceKm} km • {rec.activeDurationMinutes} min • {rec.source}
                      </Text>
                    </View>
                    <View style={styles.recordRight}>
                      <Text style={styles.recordCals}>{rec.estimatedCalories} kcal</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Manual Step Entry Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Record Activity</Text>
                <Text style={styles.modalSubtitle}>Enter steps or walking activity</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Step Count</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="e.g. 3500"
                value={stepsInput}
                onChangeText={setStepsInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Evening walk in park"
                value={notesInput}
                onChangeText={setNotesInput}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.buttonDisabled]}
              onPress={handleAddManualSteps}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Save Steps</Text>
              )}
            </TouchableOpacity>
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
  loadingBox: {
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
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircleBlue: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  stepCardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressPercentBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressPercentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0EA5E9',
  },
  stepHeroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  stepHeroValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  stepHeroUnit: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
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
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
  },
  metricGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  liveWorkoutBanner: {
    backgroundColor: '#064E3B',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  liveWorkoutIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  liveActiveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  liveWorkoutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  liveWorkoutSubtitle: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
    lineHeight: 15,
  },
  liveWorkoutStartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  activeWorkoutBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeWorkoutIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  activeWorkoutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  activeWorkoutSubtitle: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  resumeWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  resumeWorkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  actionRow: {
    marginBottom: 20,
  },
  addStepsButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStepsButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 12,
  },
  weeklyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  weeklyBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  dayBarCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 16,
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  dayBarLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '600',
  },
  weeklySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyStat: {
    flex: 1,
  },
  weeklyStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  weeklyStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  recordsList: {
    gap: 10,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recordLeft: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recordMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordCals: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F97316',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

