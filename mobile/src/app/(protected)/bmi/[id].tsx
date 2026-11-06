import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2, Calendar, Scale, Ruler, Info } from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { BmiGauge } from '../../../features/bmi/components/BmiGauge';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';
import { bmiService } from '../../../services/health/bmiService';
import { BmiRecord } from '../../../types/health';
import { colors } from '../../../theme/colors';

export default function BmiDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [record, setRecord] = useState<BmiRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setError(null);
        const data = await bmiService.getById(id);
        setRecord(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to retrieve record');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Record', 'Are you sure you want to permanently delete this BMI record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await bmiService.deleteById(id);
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
        <AppHeader title="BMI Result" />
        <LoadingState message="Loading BMI record..." />
      </View>
    );
  }

  if (error || !record) {
    return (
      <View style={styles.screenContainer}>
        <AppHeader title="BMI Result" />
        <ErrorState message={error || 'Record not found'} onRetry={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <AppHeader
        title="BMI Result"
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
        {/* Visual Arc Gauge */}
        <View style={styles.gaugeCard}>
          <BmiGauge
            bmi={record.bmiValue}
            category={record.category}
            categoryColor={record.categoryColor}
          />
        </View>

        {/* Stat Cards Row */}
        <View style={styles.statsRow}>
          <View style={styles.statMiniCard}>
            <Scale size={18} color={colors.primary} />
            <View style={styles.statMiniContent}>
              <Text style={styles.statMiniLabel}>Weight</Text>
              <Text style={styles.statMiniValue}>{record.weightKg} kg</Text>
            </View>
          </View>

          <View style={styles.statMiniCard}>
            <Ruler size={18} color={colors.primary} />
            <View style={styles.statMiniContent}>
              <Text style={styles.statMiniLabel}>Height</Text>
              <Text style={styles.statMiniValue}>{record.heightCm} cm</Text>
            </View>
          </View>
        </View>

        {/* Calculation Date Card */}
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

        {/* Informational Disclaimer Card */}
        <View style={styles.disclaimerCard}>
          <Info size={18} color="#0EA5E9" style={styles.disclaimerIcon} />
          <Text style={styles.disclaimerText}>
            {record.disclaimer ||
              'This is a general indicator for adults (≥ 20 years) and not a medical diagnosis.'}
          </Text>
        </View>

        {/* Delete Record Button at Bottom */}
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
  },
  gaugeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statMiniCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statMiniContent: {
    marginLeft: 10,
  },
  statMiniLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.secondaryText,
  },
  statMiniValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
    marginTop: 1,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 14,
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
    marginBottom: 20,
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
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});
