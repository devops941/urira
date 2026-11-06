import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Target,
  CheckCircle2,
  Clock,
  Circle,
  Pause,
  Play,
  Trash2,
  Edit3,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';
import { goalsService } from '../../../services/health/goalsService';
import { HealthGoal } from '../../../types/health';
import { colors } from '../../../theme/colors';

export default function GoalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [goal, setGoal] = useState<HealthGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setError(null);
        const data = await goalsService.getGoalById(id);
        setGoal(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to retrieve goal');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleTogglePause = async () => {
    if (!goal || !id) return;
    setUpdating(true);
    try {
      const updated =
        goal.status === 'PAUSED'
          ? await goalsService.resumeGoal(id)
          : await goalsService.pauseGoal(id);
      setGoal(updated);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update goal status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Goal', 'Are you sure you want to permanently delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await goalsService.deleteGoal(id);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete goal.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.screenContainer}>
        <AppHeader title="Goal Details" />
        <LoadingState message="Loading goal details..." />
      </View>
    );
  }

  if (error || !goal) {
    return (
      <View style={styles.screenContainer}>
        <AppHeader title="Goal Details" />
        <ErrorState message={error || 'Goal not found'} onRetry={() => router.back()} />
      </View>
    );
  }

  const isPaused = goal.status === 'PAUSED';
  const barColor = goal.categoryColor || '#16A34A';

  const startDateStr = new Date(goal.startDate).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const targetDateStr = new Date(goal.targetDate).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.screenContainer}>
      <AppHeader
        title="Goal Details"
        rightAction={
          <TouchableOpacity onPress={handleDelete} style={styles.deleteHeaderBtn}>
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Card matching Mockup */}
        <View style={styles.topCard}>
          <View style={styles.targetIconCircle}>
            <Target size={30} color="#16A34A" />
          </View>
          <Text style={styles.goalTitle}>{goal.title}</Text>

          {/* Progress Bar with Percentage */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(goal.progressPercentage, 100)}%`, backgroundColor: barColor },
                ]}
              />
            </View>
            <Text style={[styles.percentageText, { color: barColor }]}>
              {goal.progressPercentage}%
            </Text>
          </View>

          {/* Metrics Grid 2x2 */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricGridItem}>
              <Text style={styles.metricGridLabel}>Target {goal.category === 'WEIGHT' ? 'Weight' : 'Value'}</Text>
              <Text style={styles.metricGridValue}>
                {goal.targetValue} {goal.unit}
              </Text>
            </View>
            <View style={styles.metricGridItem}>
              <Text style={styles.metricGridLabel}>Current {goal.category === 'WEIGHT' ? 'Weight' : 'Value'}</Text>
              <Text style={styles.metricGridValue}>
                {goal.currentValue} {goal.unit}
              </Text>
            </View>
            <View style={styles.metricGridItem}>
              <Text style={styles.metricGridLabel}>Start Date</Text>
              <Text style={styles.metricGridValue}>{startDateStr}</Text>
            </View>
            <View style={styles.metricGridItem}>
              <Text style={styles.metricGridLabel}>Target Date</Text>
              <Text style={styles.metricGridValue}>{targetDateStr}</Text>
            </View>
          </View>
        </View>

        {/* Milestones Checklist Section matching Mockup */}
        <View style={styles.milestonesCard}>
          <Text style={styles.milestonesHeader}>Milestones</Text>

          {/* Milestone 1: Completed */}
          <View style={styles.milestoneRow}>
            <CheckCircle2 size={20} color="#16A34A" />
            <Text style={styles.milestoneTitle}>
              Milestone 1 ({Math.round(goal.targetValue * 0.33)} {goal.unit})
            </Text>
            <Text style={[styles.milestoneStatus, { color: '#16A34A' }]}>Completed</Text>
          </View>
          <View style={styles.divider} />

          {/* Milestone 2: In Progress */}
          <View style={styles.milestoneRow}>
            <Clock size={20} color="#F97316" />
            <Text style={styles.milestoneTitle}>
              Milestone 2 ({Math.round(goal.targetValue * 0.66)} {goal.unit})
            </Text>
            <Text style={[styles.milestoneStatus, { color: '#F97316' }]}>In Progress</Text>
          </View>
          <View style={styles.divider} />

          {/* Milestone 3: Pending */}
          <View style={styles.milestoneRow}>
            <Circle size={20} color="#94A3B8" />
            <Text style={styles.milestoneTitle}>
              Target Milestone ({goal.targetValue} {goal.unit})
            </Text>
            <Text style={[styles.milestoneStatus, { color: '#94A3B8' }]}>Pending</Text>
          </View>
        </View>

        {/* Action Buttons matching Mockup */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editGoalButton}
            onPress={() => router.push('/(protected)/goals/create')}
            activeOpacity={0.85}
          >
            <Edit3 size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.editGoalButtonText}>Edit Goal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pauseGoalButton}
            onPress={handleTogglePause}
            disabled={updating}
            activeOpacity={0.8}
          >
            {isPaused ? (
              <>
                <Play size={18} color={colors.primary} style={styles.btnIcon} />
                <Text style={styles.pauseGoalButtonText}>Resume Goal</Text>
              </>
            ) : (
              <>
                <Pause size={18} color={colors.primary} style={styles.btnIcon} />
                <Text style={styles.pauseGoalButtonText}>Pause Goal</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  deleteHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 14,
  },
  topCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  targetIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryText,
    marginBottom: 14,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  progressBarTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  metricGridItem: {
    width: '47%',
  },
  metricGridLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  metricGridValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
    marginTop: 2,
  },
  milestonesCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  milestonesHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
    marginBottom: 12,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  milestoneTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
    marginLeft: 10,
  },
  milestoneStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  actionsContainer: {
    gap: 10,
    marginTop: 4,
  },
  editGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 15,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnIcon: {
    marginRight: 8,
  },
  editGoalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pauseGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
  },
  pauseGoalButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
});
