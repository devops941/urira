import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Footprints,
  Flame,
  Compass,
  ArrowRight,
  Zap,
  Activity,
  Play,
} from 'lucide-react-native';
import {
  stepTrackerNativeService,
  StepUpdateEvent,
} from '../../services/tracking/stepTrackerNativeService';
import { colors } from '../../theme/colors';

interface HomeLiveWalkingCardProps {
  goalSteps?: number;
  initialSteps?: number;
  initialDistanceKm?: number;
  initialCalories?: number;
  userWeightKg?: number;
  userHeightCm?: number;
  userSex?: string;
  onRefreshNeeded?: () => void;
}

export function HomeLiveWalkingCard({
  goalSteps = 7000,
  initialSteps = 0,
  initialDistanceKm = 0,
  initialCalories = 0,
  userWeightKg = 70,
  userHeightCm = 170,
  userSex = 'MALE',
  onRefreshNeeded,
}: HomeLiveWalkingCardProps) {
  const router = useRouter();

  // Calculate realistic fallback distance and calories based on initial steps
  const initialStride = stepTrackerNativeService.calculateDynamicStride(userHeightCm, userSex, 100);
  
  // Validate if initialDistanceKm is physically plausible for initialSteps (rejects stale/corrupt records like 3,046 steps with 0.04 km)
  const isDistancePlausible = initialSteps > 50
    ? (initialDistanceKm > 0 && (initialDistanceKm * 1000) / initialSteps >= 0.35)
    : initialDistanceKm > 0;
  const fallbackDistMeters = isDistancePlausible
    ? Math.round(initialDistanceKm * 1000)
    : Math.round(initialSteps * initialStride);

  // Validate if initialCalories is plausible
  const isCaloriesPlausible = initialSteps > 50
    ? (initialCalories > 0 && initialCalories / initialSteps >= 0.02)
    : initialCalories > 0;
  const fallbackCalories = isCaloriesPlausible
    ? initialCalories
    : stepTrackerNativeService.calculateAccurateCalories({
        steps: initialSteps,
        distanceMeters: fallbackDistMeters,
        durationSeconds: Math.round((initialSteps / 100) * 60),
        weightKg: userWeightKg,
      });

  const [steps, setSteps] = useState(initialSteps);
  const [distanceMeters, setDistanceMeters] = useState(fallbackDistMeters);
  const [calories, setCalories] = useState(fallbackCalories);
  const [cadenceSpm, setCadenceSpm] = useState(0);
  const [autoTracking, setAutoTracking] = useState(true);
  const [isCadenceLocked, setIsCadenceLocked] = useState(false);

  // Pulse animation for LIVE badge
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initialize auto-tracking setting and active listener
  useEffect(() => {
    (async () => {
      const enabled = await stepTrackerNativeService.isAutoTrackingEnabled();
      setAutoTracking(enabled);
      if (enabled) {
        await stepTrackerNativeService.initAutoTracking({
          heightCm: userHeightCm,
          weightKg: userWeightKg,
          biologicalSex: userSex,
        });
      }
    })();

    // Start breathing animation
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();

    // Subscribe to live step updates
    const unsubscribe = stepTrackerNativeService.subscribeToStepUpdates(
      (event: StepUpdateEvent) => {
        setSteps((prev) => Math.max(prev, event.steps));
        setDistanceMeters((prev) => Math.max(prev, event.distanceMeters));
        setCalories((prev) => Math.max(prev, event.caloriesBurned));
        if (event.cadenceSpm !== undefined) setCadenceSpm(event.cadenceSpm);
        if (event.cadenceLocked !== undefined) setIsCadenceLocked(event.cadenceLocked);
      }
    );

    return () => {
      unsubscribe();
      loop.stop();
    };
  }, [userHeightCm, userWeightKg, userSex, pulseAnim]);

  // Sync with prop updates
  useEffect(() => {
    if (initialSteps > steps) {
      setSteps(initialSteps);
      const stride = stepTrackerNativeService.calculateDynamicStride(userHeightCm, userSex, 100);
      const isDPlausible = initialSteps > 50
        ? (initialDistanceKm > 0 && (initialDistanceKm * 1000) / initialSteps >= 0.35)
        : initialDistanceKm > 0;
      const dMeters = isDPlausible
        ? Math.round(initialDistanceKm * 1000)
        : Math.round(initialSteps * stride);
      setDistanceMeters(dMeters);

      const isCPlausible = initialSteps > 50
        ? (initialCalories > 0 && initialCalories / initialSteps >= 0.02)
        : initialCalories > 0;
      const cals = isCPlausible
        ? initialCalories
        : stepTrackerNativeService.calculateAccurateCalories({
            steps: initialSteps,
            distanceMeters: dMeters,
            durationSeconds: Math.round((initialSteps / 100) * 60),
            weightKg: userWeightKg,
          });
      setCalories(cals);
    }
  }, [initialSteps, initialDistanceKm, initialCalories, userHeightCm, userWeightKg, userSex, steps]);

  const handleToggleAutoTrack = async (value: boolean) => {
    setAutoTracking(value);
    await stepTrackerNativeService.setAutoTrackingEnabled(value);
  };

  const progress = Math.min(steps / Math.max(goalSteps, 1), 1);
  const progressPercent = Math.round(progress * 100);
  const distanceKm = (distanceMeters / 1000).toFixed(2);

  return (
    <View style={styles.cardContainer}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleLeft}>
          <View style={styles.iconCircle}>
            <Footprints size={18} color="#16A34A" />
          </View>
          <View>
            <View style={styles.liveIndicatorRow}>
              <Animated.View
                style={[
                  styles.pulsingDot,
                  {
                    backgroundColor: autoTracking ? '#16A34A' : '#94A3B8',
                    transform: [{ scale: autoTracking ? pulseAnim : 1 }],
                  },
                ]}
              />
              <Text style={[styles.liveText, { color: autoTracking ? '#16A34A' : '#94A3B8' }]}>
                {autoTracking ? (isCadenceLocked ? 'WALKING DETECTED' : 'LIVE PEDOMETER') : 'STANDBY'}
              </Text>
            </View>
            <Text style={styles.cardTitle}>Live Walking Tracker</Text>
          </View>
        </View>

        {/* Auto-Track Setting Switch */}
        <View style={styles.switchWrapper}>
          <Text style={styles.switchLabel}>Auto-Track</Text>
          <Switch
            value={autoTracking}
            onValueChange={handleToggleAutoTrack}
            trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
            thumbColor={autoTracking ? '#16A34A' : '#94A3B8'}
            style={Platform.OS === 'ios' ? { transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] } : undefined}
          />
        </View>
      </View>

      {/* Main Step Metrics Row */}
      <View style={styles.metricRow}>
        <View style={styles.stepInfoCol}>
          <View style={styles.stepNumberRow}>
            <Text style={styles.stepBigNumber}>{steps.toLocaleString()}</Text>
            <Text style={styles.stepUnitText}>steps</Text>
          </View>
          <Text style={styles.stepGoalSubtitle}>
            Goal: {goalSteps.toLocaleString()} steps ({progressPercent}%)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.openTrackerBtn}
          onPress={() => router.push('/(protected)/activity/tracker')}
          activeOpacity={0.85}
        >
          <Play size={12} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.openTrackerBtnText}>Live Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Trio Metric Bar: Distance, Calories, Cadence */}
      <View style={styles.trioBar}>
        <View style={styles.trioItem}>
          <View style={styles.trioIconRow}>
            <Compass size={13} color="#0284C7" />
            <Text style={styles.trioValue}>{distanceKm} km</Text>
          </View>
          <Text style={styles.trioLabel}>Distance</Text>
        </View>

        <View style={styles.trioDivider} />

        <View style={styles.trioItem}>
          <View style={styles.trioIconRow}>
            <Flame size={13} color="#EA580C" />
            <Text style={styles.trioValue}>{calories} kcal</Text>
          </View>
          <Text style={styles.trioLabel}>Calories</Text>
        </View>

        <View style={styles.trioDivider} />

        <View style={styles.trioItem}>
          <View style={styles.trioIconRow}>
            <Activity size={13} color="#7C3AED" />
            <Text style={styles.trioValue}>{cadenceSpm > 0 ? `${cadenceSpm} spm` : isCadenceLocked ? 'Active' : 'Standby'}</Text>
          </View>
          <Text style={styles.trioLabel}>Cadence</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 4,
  },
  switchLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  stepInfoCol: {
    flex: 1,
  },
  stepNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  stepBigNumber: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: -0.5,
  },
  stepUnitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  stepGoalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  openTrackerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  openTrackerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 4,
  },
  trioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  trioItem: {
    flex: 1,
    alignItems: 'center',
  },
  trioIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  trioValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  trioLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  trioDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
});
