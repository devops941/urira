import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  Footprints,
  Flame,
  Clock,
  Compass,
  Play,
  Pause,
  Square,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Award,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { colors } from '../../../theme/colors';
import {
  stepTrackerNativeService,
  ActiveWalkingState,
} from '../../../services/tracking/stepTrackerNativeService';
import { profileService } from '../../../services/health/profileService';
import { activityService } from '../../../services/wellness/activityService';

export default function WalkingTrackerScreen() {
  const router = useRouter();

  const [workoutState, setWorkoutState] = useState<ActiveWalkingState | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'ACTIVE' | 'PAUSED'>('IDLE');
  const [steps, setSteps] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [calories, setCalories] = useState(0);
  const [goalSteps, setGoalSteps] = useState(7000);
  const [isCadenceLocked, setIsCadenceLocked] = useState(false);
  const [cadenceSpm, setCadenceSpm] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);

  // User Profile
  const [userWeightKg, setUserWeightKg] = useState(70);
  const [userHeightCm, setUserHeightCm] = useState(170);
  const [userSex, setUserSex] = useState('MALE');

  // Summary Modal State
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [completedStats, setCompletedStats] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pulse animation for active tracking indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);
  const stepsRef = useRef(steps);
  const distRef = useRef(distanceMeters);

  useEffect(() => {
    stepsRef.current = steps;
    distRef.current = distanceMeters;
  }, [steps, distanceMeters]);

  // Load Profile & Check for Existing Session
  useEffect(() => {
    (async () => {
      try {
        const prof = await profileService.getProfile();
        if (prof) {
          if (prof.weightKg) setUserWeightKg(prof.weightKg);
          if (prof.heightCm) setUserHeightCm(prof.heightCm);
          if (prof.biologicalSex) setUserSex(prof.biologicalSex);
        }
        const todaySum = await activityService.getTodaySummary();
        if (todaySum?.stepGoal) setGoalSteps(todaySum.stepGoal);
      } catch {}

      // Check if session was already active (e.g. app reopened)
      const existing = await stepTrackerNativeService.restoreActiveSession();
      if (existing && existing.status !== 'IDLE') {
        setWorkoutState(existing);
        setStatus(existing.status);
        setSteps(existing.steps);
        setDistanceMeters(existing.distanceMeters);
        setDurationSeconds(existing.durationSeconds);
        setCalories(existing.caloriesBurned);
      }
    })();
  }, []);

  // Live Timer Interval
  useEffect(() => {
    if (status === 'ACTIVE') {
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => {
          const next = prev + 1;
          const nextCals = stepTrackerNativeService.calculateAccurateCalories({
            steps: stepsRef.current,
            distanceMeters: distRef.current,
            durationSeconds: next,
            weightKg: userWeightKg,
          });
          setCalories(nextCals);
          if (workoutState) {
            workoutState.durationSeconds = next;
            workoutState.caloriesBurned = nextCals;
          }
          return next;
        });
      }, 1000);

      // Start Pulse Animation
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      loop.start();

      return () => {
        clearInterval(timerRef.current);
        loop.stop();
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [status, userWeightKg, workoutState, pulseAnim]);

  // Subscribe to Live Step Events from Dual-Engine SensorManager
  useEffect(() => {
    const unsubscribe = stepTrackerNativeService.subscribeToStepUpdates((event) => {
      setSteps(event.steps);
      setDistanceMeters(event.distanceMeters);
      setCalories(event.caloriesBurned);
      if (event.cadenceLocked !== undefined) {
        setIsCadenceLocked(event.cadenceLocked);
      }
      if (event.cadenceSpm !== undefined) {
        setCadenceSpm(event.cadenceSpm);
      }
      if (event.speedKmh !== undefined) {
        setSpeedKmh(event.speedKmh);
      }
    });
    return () => unsubscribe();
  }, []);

  // Start Workout Handler
  const handleStart = async () => {
    try {
      const state = await stepTrackerNativeService.startWorkout({
        heightCm: userHeightCm,
        weightKg: userWeightKg,
        biologicalSex: userSex,
      });
      setWorkoutState(state);
      setStatus('ACTIVE');
      setSteps(0);
      setDistanceMeters(0);
      setDurationSeconds(0);
      setCalories(0);
      setIsCadenceLocked(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to start walking workout');
    }
  };

  // Pause Workout Handler
  const handlePause = async () => {
    try {
      await stepTrackerNativeService.pauseWorkout();
      setStatus('PAUSED');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to pause workout');
    }
  };

  // Resume Workout Handler
  const handleResume = async () => {
    try {
      await stepTrackerNativeService.resumeWorkout();
      setStatus('ACTIVE');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to resume workout');
    }
  };

  // Finish Workout Handler
  const handleFinish = async () => {
    Alert.alert('Finish Workout?', 'Are you sure you want to complete this walking session?', [
      { text: 'Keep Walking', style: 'cancel' },
      {
        text: 'Finish & Save',
        style: 'default',
        onPress: async () => {
          setIsSubmitting(true);
          try {
            const currentSteps = Math.max(steps, workoutState?.steps || 0);
            const currentDist = Math.max(distanceMeters, workoutState?.distanceMeters || 0);
            const currentCals = Math.max(calories, workoutState?.caloriesBurned || 0);

            if (workoutState) {
              workoutState.steps = currentSteps;
              workoutState.distanceMeters = currentDist;
              workoutState.durationSeconds = durationSeconds;
              workoutState.caloriesBurned = currentCals;
            }

            await stepTrackerNativeService.finishWorkout();
            setStatus('IDLE');
            setCompletedStats({
              steps: currentSteps,
              distanceKm: (currentDist / 1000).toFixed(2),
              durationFormatted: formatDuration(durationSeconds),
              calories: currentCals,
            });
            setSummaryModalVisible(true);
          } catch (err: any) {
            Alert.alert('Notice', 'Workout saved locally. Syncing will finalize in background.');
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  // Format Seconds to HH:MM:SS
  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    return `${pad(minutes)}:${pad(secs)}`;
  };

  // SVG Circular Ring Measurements
  const ringSize = 240;
  const strokeWidth = 14;
  const center = ringSize / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.min(steps / Math.max(goalSteps, 1), 1);
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <View style={styles.container}>
      <AppHeader
        title="Live Walking Tracker"
        showBack
        onBackPress={() => {
          if (status === 'ACTIVE') {
            Alert.alert(
              'Workout in Progress',
              'Walking is running in background. You can return anytime!',
              [
                { text: 'Keep In Background', onPress: () => router.back() },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          } else {
            router.back();
          }
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={styles.statusBar}>
          <Animated.View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  status === 'ACTIVE'
                    ? isCadenceLocked
                      ? '#16A34A'
                      : '#3B82F6'
                    : status === 'PAUSED'
                    ? '#F59E0B'
                    : '#94A3B8',
                transform: status === 'ACTIVE' ? [{ scale: pulseAnim }] : [],
              },
            ]}
          />
          <Text style={styles.statusText}>
            {status === 'ACTIVE'
              ? isCadenceLocked
                ? 'Walking Verified • Cadence Locked'
                : 'Walk 3-4 steps to lock cadence'
              : status === 'PAUSED'
              ? 'Workout Paused'
              : 'Ready to Walk'}
          </Text>
        </View>

        {/* Animated Circular Progress Ring */}
        <View style={styles.ringWrapper}>
          <Svg width={ringSize} height={ringSize}>
            <Defs>
              <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#22C55E" />
                <Stop offset="100%" stopColor="#16A34A" />
              </LinearGradient>
            </Defs>

            {/* Background Track */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Animated Active Ring */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="url(#ringGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform={`rotate(-90 ${center} ${center})`}
            />
          </Svg>

          {/* Central Live Step Display */}
          <View style={styles.ringCenterContent}>
            <View style={styles.footprintIconBox}>
              <Footprints size={24} color="#16A34A" />
            </View>
            <Text style={styles.stepCounterText}>{steps.toLocaleString()}</Text>
            <Text style={styles.stepGoalSub}>
              of {goalSteps.toLocaleString()} steps ({Math.round(progressRatio * 100)}%)
            </Text>
          </View>
        </View>

        {/* Live Metrics Trio Bar */}
        <View style={styles.metricsCard}>
          {/* Duration */}
          <View style={styles.metricItem}>
            <Clock size={18} color="#0EA5E9" />
            <Text style={styles.metricValue}>{formatDuration(durationSeconds)}</Text>
            <Text style={styles.metricLabel}>Duration</Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Distance */}
          <View style={styles.metricItem}>
            <Compass size={18} color="#16A34A" />
            <Text style={styles.metricValue}>{(distanceMeters / 1000).toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Distance (km)</Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Calories */}
          <View style={styles.metricItem}>
            <Flame size={18} color="#F97316" />
            <Text style={styles.metricValue}>{calories}</Text>
            <Text style={styles.metricLabel}>ACSM Calories</Text>
          </View>
        </View>

        {/* Live Cadence & Velocity Strip */}
        <View style={styles.cadenceStrip}>
          <View style={styles.cadenceStripItem}>
            <Text style={styles.cadenceStripLabel}>Cadence:</Text>
            <Text style={styles.cadenceStripValue}>
              {cadenceSpm > 0 ? `${cadenceSpm} SPM` : isCadenceLocked ? 'Active' : '--'}
            </Text>
          </View>
          <View style={styles.cadenceStripDivider} />
          <View style={styles.cadenceStripItem}>
            <Text style={styles.cadenceStripLabel}>Speed:</Text>
            <Text style={styles.cadenceStripValue}>
              {speedKmh > 0 ? `${speedKmh} km/h` : '--'}
            </Text>
          </View>
        </View>

        {/* Foreground Health Service Notice */}
        <View style={styles.infoBanner}>
          <ShieldCheck size={16} color="#16A34A" />
          <Text style={styles.infoBannerText}>
            Steps are tracked using Android hardware sensors. You can lock your phone or switch apps without losing steps!
          </Text>
        </View>

        {/* Workout Control Buttons */}
        <View style={styles.controlsRow}>
          {status === 'IDLE' && (
            <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.8}>
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startBtnText}>Start Walking</Text>
            </TouchableOpacity>
          )}

          {status === 'ACTIVE' && (
            <>
              <TouchableOpacity style={styles.pauseBtn} onPress={handlePause} activeOpacity={0.8}>
                <Pause size={18} color="#B45309" fill="#B45309" />
                <Text style={styles.pauseBtnText}>Pause</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.8}>
                <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.finishBtnText}>Finish</Text>
              </TouchableOpacity>
            </>
          )}

          {status === 'PAUSED' && (
            <>
              <TouchableOpacity style={styles.resumeBtn} onPress={handleResume} activeOpacity={0.8}>
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.resumeBtnText}>Resume</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.8}>
                <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.finishBtnText}>Finish</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Workout Complete Summary Modal */}
      <Modal visible={summaryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryBadge}>
              <Award size={36} color="#16A34A" />
            </View>

            <Text style={styles.summaryTitle}>Walking Workout Complete!</Text>
            <Text style={styles.summarySubtitle}>
              Great job! Your walking activity was saved and synchronized to your UYIRA Dashboard.
            </Text>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCell}>
                <Footprints size={18} color="#16A34A" />
                <Text style={styles.summaryCellValue}>{completedStats?.steps?.toLocaleString() || 0}</Text>
                <Text style={styles.summaryCellLabel}>Steps Walked</Text>
              </View>

              <View style={styles.summaryCell}>
                <Compass size={18} color="#0EA5E9" />
                <Text style={styles.summaryCellValue}>{completedStats?.distanceKm || 0} km</Text>
                <Text style={styles.summaryCellLabel}>Distance</Text>
              </View>

              <View style={styles.summaryCell}>
                <Clock size={18} color="#8B5CF6" />
                <Text style={styles.summaryCellValue}>{completedStats?.durationFormatted || '00:00'}</Text>
                <Text style={styles.summaryCellLabel}>Total Time</Text>
              </View>

              <View style={styles.summaryCell}>
                <Flame size={18} color="#F97316" />
                <Text style={styles.summaryCellValue}>{completedStats?.calories || 0} kcal</Text>
                <Text style={styles.summaryCellLabel}>Calories Burned</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                setSummaryModalVisible(false);
                router.replace('/(protected)/activity');
              }}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.doneBtnText}>View Activity Dashboard</Text>
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
    padding: 20,
    alignItems: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  ringWrapper: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ringCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footprintIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepCounterText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  stepGoalSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  metricsCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  metricDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  cadenceStrip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  cadenceStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cadenceStripLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cadenceStripValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  cadenceStripDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
  },
  infoBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F3EC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#C7E2D1',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#12372A',
    fontWeight: '500',
  },
  controlsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  startBtn: {
    flex: 1,
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pauseBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pauseBtnText: {
    color: '#B45309',
    fontSize: 15,
    fontWeight: '700',
  },
  resumeBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#16A34A',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  finishBtn: {
    flex: 1,
    height: 52,
    backgroundColor: '#DC2626',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  summaryBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  summarySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  summaryGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  summaryCell: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  summaryCellValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryCellLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  doneBtn: {
    width: '100%',
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

