import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Footprints,
  Flame,
  Droplets,
  Moon,
  Heart,
  TrendingUp,
  ChevronLeft,
  Calendar,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { analyticsService } from '../../../services/analytics/analyticsService';
import { TrendDataPoint } from '../../../types/analytics';
import { colors } from '../../../theme/colors';

const { width } = Dimensions.get('window');

type MetricType = 'steps' | 'calories' | 'water' | 'sleep';

const METRICS: { key: MetricType; label: string; unit: string; color: string; icon: any }[] = [
  { key: 'steps', label: 'Steps', unit: 'steps', color: '#0EA5E9', icon: Footprints },
  { key: 'calories', label: 'Calories', unit: 'kcal', color: '#F97316', icon: Flame },
  { key: 'water', label: 'Water', unit: 'ml', color: '#06B6D4', icon: Droplets },
  { key: 'sleep', label: 'Sleep', unit: 'hrs', color: '#8B5CF6', icon: Moon },
];

export default function HistoricalChartsScreen() {
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('steps');
  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [points, setPoints] = useState<TrendDataPoint[]>([]);

  const activeMeta = METRICS.find((m) => m.key === selectedMetric) || METRICS[0];

  const loadTrends = useCallback(async (metric: MetricType, numDays: number) => {
    try {
      const data = await analyticsService.getTrends(metric, numDays);
      setPoints(data);
    } catch (err: any) {
      console.warn('Failed to load trends:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTrends(selectedMetric, days);
  }, [loadTrends, selectedMetric, days]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTrends(selectedMetric, days);
  };

  const handleMetricChange = (m: MetricType) => {
    setSelectedMetric(m);
    setLoading(true);
    loadTrends(m, days);
  };

  const handleDaysChange = (d: number) => {
    setDays(d);
    setLoading(true);
    loadTrends(selectedMetric, d);
  };

  // Metrics stats calculation
  const values = points.map((p) => p.value);
  const maxVal = Math.max(...values, 1);
  const avgVal = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const highVal = Math.max(...values, 0);
  const lowVal = Math.min(...values.filter((v) => v > 0), highVal);

  return (
    <View style={styles.container}>
      <AppHeader title="Historical Charts" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeMeta.color]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Selector Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricPickerScroll}
        >
          {METRICS.map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMetric === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.metricPill,
                  isSelected && { backgroundColor: m.color, borderColor: m.color },
                ]}
                onPress={() => handleMetricChange(m.key)}
                activeOpacity={0.8}
              >
                <Icon size={16} color={isSelected ? '#FFFFFF' : colors.secondaryText} />
                <Text style={[styles.metricPillText, isSelected && styles.metricPillTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Days Range Toggle */}
        <View style={styles.daysRow}>
          {[7, 14, 30].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayBtn, days === d && styles.dayBtnActive]}
              onPress={() => handleDaysChange(d)}
            >
              <Text style={[styles.dayBtnText, days === d && styles.dayBtnTextActive]}>
                {d} Days
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={activeMeta.color} style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* Main Interactive Chart Card */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={styles.chartTitle}>{activeMeta.label} Trend</Text>
                  <Text style={styles.chartSub}>Last {days} days recorded trajectory</Text>
                </View>
                <View style={[styles.unitBadge, { backgroundColor: `${activeMeta.color}15` }]}>
                  <Text style={[styles.unitBadgeText, { color: activeMeta.color }]}>
                    {activeMeta.unit}
                  </Text>
                </View>
              </View>

              {/* Responsive Bar Chart View */}
              <View style={styles.chartArea}>
                {points.map((pt: TrendDataPoint, idx: number) => {
                  const pct = Math.min(100, Math.round((pt.value / maxVal) * 100));
                  return (
                    <View key={pt.date || idx} style={styles.barColumn}>
                      <Text style={styles.barValText}>
                        {pt.value > 0 ? (selectedMetric === 'sleep' ? pt.value : Math.round(pt.value)) : ''}
                      </Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${Math.max(6, pct)}%`,
                              backgroundColor: activeMeta.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barDateText}>
                        {pt.label.split(' ')[1] || pt.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 3 Analytics Summary Metric Tiles */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>
                  {avgVal.toLocaleString()} <Text style={styles.statUnit}>{activeMeta.unit}</Text>
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Highest</Text>
                <Text style={[styles.statValue, { color: '#16A34A' }]}>
                  {highVal.toLocaleString()} <Text style={styles.statUnit}>{activeMeta.unit}</Text>
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Lowest</Text>
                <Text style={[styles.statValue, { color: '#F97316' }]}>
                  {lowVal.toLocaleString()} <Text style={styles.statUnit}>{activeMeta.unit}</Text>
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  metricPickerScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  metricPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  dayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dayBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  dayBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  dayBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  chartSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  unitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  unitBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 16,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.secondaryText,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 120,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barDateText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.secondaryText,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryText,
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText,
  },
});

