import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Target, Footprints, Droplets, Moon, Flame, Scale, Plus, ChevronRight, Sparkles } from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingState } from '../../../components/common/LoadingState';
import { goalsService } from '../../../services/health/goalsService';
import { HealthGoal, GoalStatus, GoalCategory } from '../../../types/health';
import { colors } from '../../../theme/colors';

const STATUS_FILTERS: { label: string; value: GoalStatus | 'ALL' }[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'All', value: 'ALL' },
];

export default function MyGoalsScreen() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<GoalStatus | 'ALL'>('ACTIVE');
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const data = await goalsService.getGoals(
        selectedStatus === 'ALL' ? undefined : selectedStatus
      );
      setGoals(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    setLoading(true);
    fetchGoals();
  }, [fetchGoals]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  };

  const getCategoryIcon = (category: GoalCategory, color: string) => {
    switch (category) {
      case 'STEPS':
        return <Footprints size={20} color={color} />;
      case 'WATER':
        return <Droplets size={20} color={color} />;
      case 'SLEEP':
        return <Moon size={20} color={color} />;
      case 'CALORIES':
        return <Flame size={20} color={color} />;
      case 'WEIGHT':
      case 'BMI':
        return <Scale size={20} color={color} />;
      default:
        return <Target size={20} color={color} />;
    }
  };

  const renderGoalCard = ({ item }: { item: HealthGoal }) => {
    const barColor = item.categoryColor || '#16A34A';

    return (
      <TouchableOpacity
        style={styles.goalCard}
        onPress={() => router.push(`/(protected)/goals/${item.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.categoryIconCircle, { backgroundColor: `${barColor}15` }]}>
            {getCategoryIcon(item.category, barColor)}
          </View>

          <View style={styles.cardTitleBox}>
            <Text style={styles.goalTitle}>{item.title}</Text>
            <Text style={styles.targetDetail}>
              Target: {item.targetValue} {item.unit}
            </Text>
          </View>

          <Text style={[styles.percentageText, { color: barColor }]}>
            {item.progressPercentage}%
          </Text>
        </View>

        {/* Progress Bar Track */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(item.progressPercentage, 100)}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <AppHeader title="My Goals" />

      {/* Filter Pills matching Mockup */}
      <View style={styles.filterPillsRow}>
        {STATUS_FILTERS.map((filter) => {
          const isActive = selectedStatus === filter.value;
          const count = filter.value === 'ACTIVE' ? ` (${goals.length})` : '';
          return (
            <TouchableOpacity
              key={filter.value}
              style={[styles.pillButton, isActive && styles.pillButtonActive]}
              onPress={() => setSelectedStatus(filter.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {filter.label}
                {isActive && filter.value === 'ACTIVE' ? count : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <LoadingState message="Loading health goals..." />
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          renderItem={renderGoalCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Goals Yet"
              description="Create a personalized daily or monthly health target to track your progress."
              actionLabel="Add Goal"
              onAction={() => router.push('/(protected)/goals/create')}
            />
          }
        />
      )}

      {/* Floating Bottom Action Buttons */}
      <View style={styles.bottomBarContainer}>
        <TouchableOpacity
          style={styles.aiGoalButton}
          onPress={() => router.push('/(protected)/goals/ai-suggestions')}
          activeOpacity={0.85}
        >
          <Sparkles size={18} color="#16A34A" style={styles.addIcon} />
          <Text style={styles.aiGoalButtonText}>AI Goals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addGoalButton}
          onPress={() => router.push('/(protected)/goals/create')}
          activeOpacity={0.85}
        >
          <Plus size={20} color="#FFFFFF" style={styles.addIcon} />
          <Text style={styles.addGoalButtonText}>Add Goal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pillButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  pillButtonActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 90,
    gap: 12,
  },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleBox: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
  },
  targetDetail: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.secondaryText,
    marginTop: 2,
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  aiGoalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F3EC',
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#16A34A',
  },
  aiGoalButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#12372A',
  },
  addGoalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addIcon: {
    marginRight: 6,
  },
  addGoalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
