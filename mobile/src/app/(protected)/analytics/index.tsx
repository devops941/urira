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
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Activity,
  BarChart2,
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Share2,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { BottomNavBar } from '../../../components/common/BottomNavBar';
import { analyticsService } from '../../../services/analytics/analyticsService';
import { HealthDashboardDto, Timeframe, HealthMetricDimension } from '../../../types/analytics';
import { LiquidFillBodyAvatar } from '../../../components/analytics/LiquidFillBodyAvatar';
import { colors } from '../../../theme/colors';

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: 'daily', label: 'Day' },
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
];

export default function AnalyticsDashboardScreen() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<Timeframe>('weekly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<HealthDashboardDto | null>(null);

  const loadDashboard = useCallback(async (tf: Timeframe) => {
    try {
      const data = await analyticsService.getDashboard(tf);
      setDashboard(data);
    } catch (err: any) {
      console.warn('Failed to load health analytics:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard(timeframe);
    }, [loadDashboard, timeframe])
  );

  useEffect(() => {
    loadDashboard(timeframe);
  }, [loadDashboard, timeframe]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard(timeframe);
  };

  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
    setLoading(true);
    loadDashboard(tf);
  };

  const score = dashboard?.overallHealthScore || 70;
  const scoreColor = score >= 80 ? '#16A34A' : score >= 60 ? '#0EA5E9' : '#F59E0B';

  return (
    <View style={styles.container}>
      <AppHeader title="Health Analytics" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Timeframe Toggle Pills */}
        <View style={styles.timeframeContainer}>
          {TIMEFRAMES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.timeframePill, timeframe === t.key && styles.timeframePillActive]}
              onPress={() => handleTimeframeChange(t.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.timeframeText, timeframe === t.key && styles.timeframeTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* Overall Health Score Hero with Living Liquid Fill Avatar */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                {/* 1. Left: Liquid Fill Human Body Avatar (matches user reference) */}
                <View style={styles.avatarCol}>
                  <LiquidFillBodyAvatar
                    percentage={score}
                    timeframe={timeframe}
                    tier={dashboard?.avatarSummary?.statusTier}
                    size={88}
                    showPercentageBadge={true}
                  />
                </View>

                {/* 2. Right: Score & Patient Info */}
                <View style={styles.heroTextCol}>
                  <View style={styles.tagBadge}>
                    <ShieldCheck size={14} color="#16A34A" />
                    <Text style={styles.tagBadgeText}>{dashboard?.statusTag || 'Clinical Health Status'}</Text>
                  </View>

                  <Text style={styles.patientName}>{dashboard?.userSnapshot.fullName}</Text>
                  <Text style={styles.patientSub}>
                    {dashboard?.userSnapshot.age ? `${dashboard.userSnapshot.age} yrs` : 'Age: N/A'} •{' '}
                    {dashboard?.userSnapshot.biologicalSex || 'Sex: N/A'} • BMI:{' '}
                    {dashboard?.userSnapshot.bmi?.toFixed(1) || 'N/A'}
                  </Text>

                  {/* Score Pill Row */}
                  <View style={styles.scorePillRow}>
                    <View style={styles.scoreBadgeBox}>
                      <Text style={[styles.scoreNumber, { color: scoreColor }]}>{score}</Text>
                      <Text style={styles.scoreMax}>/100</Text>
                    </View>
                    <View style={styles.scoreStatusCol}>
                      <Text style={styles.scoreHeading}>
                        {dashboard?.avatarSummary?.statusHeading || (score >= 80 ? 'Optimal Energy' : score >= 60 ? 'Active & Normal' : 'Moderate Wellness')}
                      </Text>
                      <Text style={styles.scoreSublabel}>
                        {timeframe === 'daily' ? 'Today’s Vitality' : timeframe === 'weekly' ? 'Weekly Energy' : 'Monthly Synthesis'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.heroDivider} />

              {/* 3. Bottom: Avatar Period Narrative (Day / Week / Month Epdi Pochu) */}
              <View style={styles.avatarNarrativeBox}>
                <View style={styles.narrativeHeaderRow}>
                  <Sparkles size={16} color={colors.primary} />
                  <Text style={styles.narrativeTitle}>
                    {dashboard?.avatarSummary?.title || (
                      timeframe === 'daily'
                        ? `Today's Health Avatar (${score}% Charged)`
                        : timeframe === 'weekly'
                        ? `7-Day Weekly Vitality Avatar (${score}% Energy)`
                        : `30-Day Monthly Health Avatar (${score}% Synthesis)`
                    )}
                  </Text>
                </View>

                <Text style={styles.narrativeDesc}>
                  {dashboard?.avatarSummary?.description ||
                    `Based on your ${timeframe} tracking, you have completed ${score}% of your overall preventive health targets.`}
                </Text>

                {dashboard?.avatarSummary?.statusMessage ? (
                  <View style={styles.narrativeMetricsChip}>
                    <Activity size={12} color={colors.primary} />
                    <Text style={styles.narrativeMetricsText}>
                      {dashboard.avatarSummary.statusMessage}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Quick Actions Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/(protected)/analytics/charts')}
                activeOpacity={0.8}
              >
                <TrendingUp size={18} color="#0EA5E9" />
                <Text style={styles.actionBtnText}>Historical Charts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/(protected)/analytics/export')}
                activeOpacity={0.8}
              >
                <Download size={18} color="#16A34A" />
                <Text style={styles.actionBtnText}>Export Report</Text>
              </TouchableOpacity>
            </View>

            {/* 6 Dimension Breakdown */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Wellness Dimensions ({dashboard?.dimensions.length || 0})</Text>
            </View>

            <View style={styles.dimensionList}>
              {dashboard?.dimensions.map((dim: HealthMetricDimension) => {
                const statusColor =
                  dim.status === 'OPTIMAL' ? '#16A34A' : dim.status === 'GOOD' ? '#0EA5E9' : '#F59E0B';
                return (
                  <View key={dim.name} style={styles.dimCard}>
                    <View style={styles.dimTopRow}>
                      <View style={[styles.dimDot, { backgroundColor: dim.color }]} />
                      <Text style={styles.dimName}>{dim.name}</Text>
                      <View style={[styles.statusChip, { backgroundColor: `${statusColor}15` }]}>
                        <Text style={[styles.statusChipText, { color: statusColor }]}>
                          {dim.statusLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.dimProgressTrack}>
                      <View
                        style={[
                          styles.dimProgressFill,
                          { width: `${dim.score}%`, backgroundColor: dim.color },
                        ]}
                      />
                    </View>

                    <View style={styles.dimValuesRow}>
                      <Text style={styles.dimCurrent}>{dim.currentValue}</Text>
                      <Text style={styles.dimTarget}>Target: {dim.targetValue}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Clinical Observations & Lifestyle Insights */}
            <View style={styles.clinicalCard}>
              <View style={styles.clinicalHeader}>
                <Sparkles size={18} color={colors.primary} />
                <Text style={styles.clinicalTitle}>Clinical Health Observations</Text>
              </View>

              <View style={styles.obsList}>
                {dashboard?.summaryObservations.map((obs: string, idx: number) => (
                  <View key={idx} style={styles.obsItem}>
                    <View style={styles.obsBullet} />
                    <Text style={styles.obsText}>{obs}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.divider} />

              <Text style={styles.recHeading}>Lifestyle Recommendations</Text>
              <View style={styles.obsList}>
                {dashboard?.recommendations.map((rec: string, idx: number) => (
                  <View key={idx} style={styles.obsItem}>
                    <CheckCircle2 size={14} color="#16A34A" style={{ marginTop: 2 }} />
                    <Text style={styles.obsText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab="analytics" />
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
    paddingBottom: 110,
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  timeframePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  timeframePillActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  timeframeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  timeframeTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8FAFC',
    borderWidth: 3,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryText,
    marginLeft: 1,
  },
  heroTextCol: {
    flex: 1,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F3EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  tagBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#12372A',
  },
  patientName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryText,
  },
  patientSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
    marginBottom: 8,
  },
  scorePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scoreBadgeBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreStatusCol: {
    flex: 1,
  },
  scoreHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
  scoreSublabel: {
    fontSize: 10,
    color: colors.secondaryText,
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  avatarNarrativeBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  narrativeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  narrativeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  narrativeDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.secondaryText,
  },
  narrativeMetricsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  narrativeMetricsText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryText,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  dimensionList: {
    gap: 10,
    marginBottom: 20,
  },
  dimCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dimTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dimDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dimName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dimProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  dimProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  dimValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dimCurrent: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryText,
  },
  dimTarget: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  clinicalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clinicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  clinicalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  obsList: {
    gap: 8,
  },
  obsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  obsBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  obsText: {
    flex: 1,
    fontSize: 12,
    color: colors.primaryText,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  recHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
    marginBottom: 8,
  },
});

