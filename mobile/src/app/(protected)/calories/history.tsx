import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, ChevronRight, Flame, Plus } from 'lucide-react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { AppHeader } from '../../../components/common/AppHeader';
import { AppCard } from '../../../components/common/AppCard';
import { LoadingState } from '../../../components/common/LoadingState';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { calorieApiService } from '../../../services/health/calorieService';
import { CalorieResultDto } from '../../../types/health';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';

export default function CalorieHistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<CalorieResultDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const data = await calorieApiService.getHistory();
      setRecords(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load calorie history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Record', 'Are you sure you want to delete this calorie estimation record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await calorieApiService.deleteById(id);
            setRecords((prev) => prev.filter((r) => r.id !== id));
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete record.');
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer scrollable={false}>
      <AppHeader title="Calorie History" />

      {loading && !refreshing ? (
        <LoadingState message="Loading your calorie estimation history..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchHistory} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={<Flame size={32} color="#F97316" />}
          title="No Calorie History Yet"
          description="Calculate your Basal Metabolic Rate and Total Daily Energy Expenditure to plan your nutrition."
          actionTitle="Estimate Calories Now"
          onActionPress={() => router.push('/(protected)/calories')}
        />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/(protected)/calories/[id]',
                  params: { id: item.id },
                })
              }
            >
              <AppCard style={styles.historyCard}>
                <View style={styles.cardRow}>
                  <View style={styles.leftInfo}>
                    <View style={styles.topRow}>
                      <Text style={styles.calTarget}>
                        {item.estimatedDailyCalories.toLocaleString()} kcal/day
                      </Text>
                      <View style={styles.goalPill}>
                        <Text style={styles.goalPillText}>{item.goal.replace('_', ' ')}</Text>
                      </View>
                    </View>

                    <Text style={styles.breakdownText}>
                      BMR: {item.bmr} kcal • TDEE: {item.tdee} kcal
                    </Text>
                    <Text style={styles.dateText}>
                      {new Date(item.calculatedAt).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  <View style={styles.rightActions}>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                    <ChevronRight size={18} color="#94A3B8" />
                  </View>
                </View>
              </AppCard>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingBottom: 30,
    paddingHorizontal: 4,
  },
  historyCard: {
    marginVertical: 5,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftInfo: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  calTarget: {
    fontSize: 20,
    fontWeight: '800',
    color: '#C2410C',
    letterSpacing: -0.4,
  },
  goalPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: '#FFEDD5',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  goalPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C2410C',
  },
  breakdownText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteBtn: {
    padding: 6,
  },
});

