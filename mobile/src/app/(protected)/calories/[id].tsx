import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2, Flame, Zap, Target, Info, Calendar } from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';
import { calorieService } from '../../../services/health/calorieService';
import { CalorieRecord } from '../../../types/health';
import { colors } from '../../../theme/colors';

export default function CalorieDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [record, setRecord] = useState<CalorieRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setError(null);
        const data = await calorieService.getById(id);
        setRecord(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to retrieve calorie estimation');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Record', 'Are you sure you want to permanently delete this calorie record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await calorieService.deleteById(id);
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete record.');
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.screenContainer}>
        <AppHeader title="Calorie Result" />
        <LoadingState message="Loading calorie estimation..." />
      </View>
    );
  }

  if (error || !record) {
    return (
      <View style={styles.screenContainer}>
        <AppHeader title="Calorie Result" />
        <ErrorState message={error || 'Record not found'} onRetry={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <AppHeader
        title="Calorie Result"
        rightAction={
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteHeaderBtn}
            disabled={deleting}
          >
            <Trash2 size={20} color="#EF4444" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Card 1: BMR */}
        <View style={styles.resultMetricCard}>
          <View style={[styles.resultMetricIconBox, { backgroundColor: '#FFEDD5' }]}>
            <Flame size={24} color="#F97316" />
          </View>
          <View style={styles.resultMetricContent}>
            <Text style={styles.resultMetricTitle}>BMR</Text>
            <Text style={styles.resultMetricMainValue}>{record.bmr.toLocaleString()} kcal/day</Text>
            <Text style={styles.resultMetricSubText}>(Basal Metabolic Rate)</Text>
          </View>
        </View>

        {/* Card 2: TDEE */}
        <View style={styles.resultMetricCard}>
          <View style={[styles.resultMetricIconBox, { backgroundColor: '#EDE9FE' }]}>
            <Zap size={24} color="#8B5CF6" />
          </View>
          <View style={styles.resultMetricContent}>
            <Text style={styles.resultMetricTitle}>TDEE</Text>
            <Text style={styles.resultMetricMainValue}>{record.tdee.toLocaleString()} kcal/day</Text>
            <Text style={styles.resultMetricSubText}>(Total Daily Energy Expenditure)</Text>
          </View>
        </View>

        {/* Card 3: Daily Calorie Target */}
        <View style={styles.resultMetricCard}>
          <View style={[styles.resultMetricIconBox, { backgroundColor: '#DCFCE7' }]}>
            <Target size={24} color="#16A34A" />
          </View>
          <View style={styles.resultMetricContent}>
            <Text style={styles.resultMetricTitle}>Daily Calorie Target</Text>
            <Text style={[styles.resultMetricMainValue, { color: '#16A34A' }]}>
              {record.estimatedDailyCalories.toLocaleString()} kcal/day
            </Text>
            <Text style={styles.resultMetricSubText}>
              (for{' '}
              {record.goal === 'LOSE_WEIGHT'
                ? 'weight loss'
                : record.goal === 'GAIN_WEIGHT'
                ? 'weight gain'
                : 'maintenance'}
              )
            </Text>
          </View>
        </View>

        {/* Date Card */}
        <View style={styles.dateCard}>
          <Calendar size={18} color={colors.secondaryText} />
          <Text style={styles.dateCardText}>
            Calculated on{' '}
            {new Date(record.calculatedAt).toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Informational Guidance Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Info size={18} color="#0EA5E9" style={styles.disclaimerIcon} />
          <Text style={styles.disclaimerText}>
            {record.disclaimer ||
              'This is an estimated value for general wellness and not a medical recommendation.'}
          </Text>
        </View>

        {/* Delete Record Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.8}
        >
          <Trash2 size={18} color="#EF4444" />
          <Text style={styles.deleteButtonText}>Delete Record</Text>
        </TouchableOpacity>
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
    paddingBottom: 32,
    gap: 12,
  },
  resultMetricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultMetricIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  resultMetricContent: {
    flex: 1,
  },
  resultMetricTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  resultMetricMainValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryText,
    marginTop: 2,
  },
  resultMetricSubText: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  dateCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 4,
  },
  disclaimerIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 18,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 18,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});
