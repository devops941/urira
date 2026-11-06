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
import { Scale, Flame, Activity, Shield, ChevronRight } from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { EmptyState } from '../../../components/common/EmptyState';
import { LoadingState } from '../../../components/common/LoadingState';
import { historyService } from '../../../services/health/historyService';
import { UnifiedHistoryItem } from '../../../types/health';
import { colors } from '../../../theme/colors';

const FILTER_PILLS = [
  { label: 'All', value: 'ALL' },
  { label: 'BMI', value: 'BMI' },
  { label: 'Calories', value: 'CALORIES' },
  { label: 'Weight', value: 'WEIGHT' },
];

export default function HealthHistoryScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [items, setItems] = useState<UnifiedHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await historyService.getUnifiedHistory(selectedFilter);
      setItems(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    setLoading(true);
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const getSourceIcon = (sourceType: string, categoryColor?: string) => {
    switch (sourceType) {
      case 'BMI':
      case 'WEIGHT':
        return <Scale size={18} color={categoryColor || '#16A34A'} />;
      case 'CALORIES':
        return <Flame size={18} color={categoryColor || '#F97316'} />;
      case 'GOAL':
        return <Activity size={18} color={categoryColor || '#0EA5E9'} />;
      default:
        return <Shield size={18} color={categoryColor || '#8B5CF6'} />;
    }
  };

  const getSourceBackground = (sourceType: string) => {
    switch (sourceType) {
      case 'BMI':
        return '#DCFCE7';
      case 'CALORIES':
        return '#FFEDD5';
      case 'WEIGHT':
        return '#EDE9FE';
      case 'GOAL':
        return '#E0F2FE';
      default:
        return '#F1F5F9';
    }
  };

  const renderHistoryItem = ({ item }: { item: UnifiedHistoryItem }) => {
    const formattedDate = new Date(item.timestamp).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => router.push(`/(protected)/history/${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View
          style={[
            styles.historyIconBox,
            { backgroundColor: getSourceBackground(item.sourceType) },
          ]}
        >
          {getSourceIcon(item.sourceType, item.categoryColor)}
        </View>

        <View style={styles.historyCardContent}>
          <Text style={styles.historyTitleText}>{item.title}</Text>
          <Text style={styles.historyMainValueText}>{item.mainValue}</Text>
          <Text style={styles.historyTimestampText}>{formattedDate}</Text>
        </View>

        <ChevronRight size={18} color={colors.secondaryText} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screenContainer}>
      <AppHeader title="Health History" />

      {/* Filter Pills matching Mockup */}
      <View style={styles.filterPillsRow}>
        {FILTER_PILLS.map((pill) => {
          const isActive = selectedFilter === pill.value;
          return (
            <TouchableOpacity
              key={pill.value}
              style={[styles.pillButton, isActive && styles.pillButtonActive]}
              onPress={() => setSelectedFilter(pill.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {pill.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <LoadingState message="Loading health history..." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
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
              title="No History Yet"
              description="Your calculated BMI, calorie targets, and goal updates will appear here."
              actionLabel="Calculate BMI"
              onAction={() => router.push('/(protected)/bmi')}
            />
          }
        />
      )}
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
    paddingBottom: 32,
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  historyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  historyCardContent: {
    flex: 1,
  },
  historyTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  historyMainValueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 2,
  },
  historyTimestampText: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 3,
  },
});
