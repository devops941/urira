import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2, Scale, Calendar, Activity } from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';
import { historyService } from '../../../services/health/historyService';
import { UnifiedHistoryItem } from '../../../types/health';
import { colors } from '../../../theme/colors';

export default function HistoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [item, setItem] = useState<UnifiedHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setError(null);
        const data = await historyService.getHistoryDetail(id);
        setItem(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to retrieve record detail');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Record', 'Are you sure you want to delete this historical record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await historyService.deleteHistoryItem(id);
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
        <AppHeader title="History Detail" />
        <LoadingState message="Loading details..." />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.screenContainer}>
        <AppHeader title="History Detail" />
        <ErrorState message={error || 'Record not found'} onRetry={() => router.back()} />
      </View>
    );
  }

  const formattedDate = new Date(item.timestamp).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.screenContainer}>
      <AppHeader
        title="History Detail"
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
        {/* Top Metric Header Card matching Mockup */}
        <View style={styles.topMetricCard}>
          <View style={styles.topMetricIconBox}>
            <Scale size={24} color="#16A34A" />
          </View>
          <View style={styles.topMetricContent}>
            <Text style={styles.topMetricTitle}>{item.title}</Text>
            <Text style={styles.topMetricMainValue}>{item.mainValue}</Text>
          </View>
        </View>

        {/* Date Row Card */}
        <View style={styles.dateCard}>
          <Calendar size={16} color={colors.secondaryText} />
          <Text style={styles.dateCardText}>{formattedDate}</Text>
        </View>

        {/* Trend Sparkline Chart Card matching Mockup */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Historical Trend</Text>

          <View style={styles.chartContainer}>
            {/* Y-Axis scale */}
            <View style={styles.yAxis}>
              <Text style={styles.axisLabel}>28</Text>
              <Text style={styles.axisLabel}>26</Text>
              <Text style={styles.axisLabel}>24</Text>
              <Text style={styles.axisLabel}>22</Text>
              <Text style={styles.axisLabel}>20</Text>
            </View>

            {/* Sparkline curve visualization */}
            <View style={styles.chartPlotArea}>
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />

              {/* Data points with connected visual flow */}
              <View style={styles.sparklineContainer}>
                <View style={[styles.dataPoint, { bottom: '25%', left: '10%' }]} />
                <View style={[styles.dataPoint, { bottom: '38%', left: '30%' }]} />
                <View style={[styles.dataPoint, { bottom: '50%', left: '50%' }]} />
                <View style={[styles.dataPoint, { bottom: '60%', left: '70%' }]} />
                <View style={[styles.dataPointActive, { bottom: '70%', left: '90%' }]} />
              </View>
            </View>
          </View>

          {/* X-Axis Month Labels */}
          <View style={styles.xAxis}>
            <Text style={styles.axisLabel}>Aug</Text>
            <Text style={styles.axisLabel}>Sep</Text>
            <Text style={styles.axisLabel}>Oct</Text>
            <Text style={styles.axisLabel}>Nov</Text>
            <Text style={styles.axisLabel}>Dec</Text>
          </View>
        </View>

        {/* Measurement Details Table dynamically from record */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeader}>Record Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{item.sourceType}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Result Value</Text>
            <Text style={[styles.detailValue, { color: item.categoryColor || colors.primary, fontWeight: '700' }]}>
              {item.mainValue}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Metrics / Details</Text>
            <Text style={styles.detailValue}>{item.secondaryDetails || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={[styles.detailValue, { color: item.categoryColor || '#16A34A', fontWeight: '700' }]}>
              {item.category}
            </Text>
          </View>
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
  topMetricCard: {
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
  topMetricIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  topMetricContent: {
    flex: 1,
  },
  topMetricTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  topMetricMainValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 2,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dateCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  chartCard: {
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
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 120,
  },
  yAxis: {
    width: 24,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  chartPlotArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  sparklineContainer: {
    ...StyleSheet.absoluteFill,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  dataPointActive: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 24,
    marginTop: 6,
    paddingHorizontal: 10,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
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
