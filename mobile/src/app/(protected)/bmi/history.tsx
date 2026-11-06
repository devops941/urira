import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, ChevronRight, Activity, Plus } from 'lucide-react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { AppHeader } from '../../../components/common/AppHeader';
import { AppCard } from '../../../components/common/AppCard';
import { LoadingState } from '../../../components/common/LoadingState';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { BmiTrendChart } from '../../../features/bmi/components/BmiTrendChart';
import { bmiApiService } from '../../../services/health/bmiService';
import { BmiResultDto } from '../../../types/health';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';

export default function BmiHistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<BmiResultDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const data = await bmiApiService.getHistory();
      setRecords(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load BMI records');
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
    Alert.alert('Delete Record', 'Are you sure you want to delete this BMI calculation record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await bmiApiService.deleteById(id);
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
      <AppHeader title="BMI History" />

      {loading && !refreshing ? (
        <LoadingState message="Loading your BMI records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchHistory} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={<Activity size={32} color={colors.primary} />}
          title="No BMI Records Yet"
          description="Calculate your BMI to start tracking your body mass index progress over time."
          actionTitle="Calculate BMI Now"
          onActionPress={() => router.push('/(protected)/bmi')}
        />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            records.length > 0 ? (
              <View style={styles.chartHeaderWrapper}>
                <BmiTrendChart records={records} />
                <Text style={styles.sectionTitle}>Calculation History ({records.length})</Text>
              </View>
            ) : undefined
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/(protected)/bmi/[id]',
                  params: { id: item.id },
                })
              }
            >
              <AppCard style={styles.historyCard}>
                <View style={styles.cardRow}>
                  <View style={styles.leftInfo}>
                    <View style={styles.topRow}>
                      <Text style={[styles.bmiVal, { color: item.categoryColor }]}>
                        {item.bmiValue.toFixed(2)}
                      </Text>
                      <View
                        style={[
                          styles.catBadge,
                          {
                            backgroundColor: `${item.categoryColor}15`,
                            borderColor: item.categoryColor,
                          },
                        ]}
                      >
                        <Text style={[styles.catText, { color: item.categoryColor }]}>
                          {item.category}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.subText}>
                      {item.weightKg} kg • {item.heightCm} cm
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
  chartHeaderWrapper: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
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
    gap: 10,
    marginBottom: 4,
  },
  bmiVal: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  catText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subText: {
    fontSize: 13,
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

