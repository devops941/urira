import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Droplets,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CupSoda,
  Coffee,
  Sparkles,
  TrendingUp,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { waterService } from '../../../services/wellness/waterService';
import { profileService } from '../../../services/health/profileService';
import {
  WaterLogDto,
  DailyWaterSummaryDto,
  BeverageType,
} from '../../../types/wellness';
import { HealthProfileDto } from '../../../types/health';
import { colors } from '../../../theme/colors';

const WATER_COLOR = '#06B6D4';
const WATER_BG_LIGHT = '#ECFEFF';
const WATER_BORDER = '#A5F3FC';

const QUICK_AMOUNTS = [
  { label: 'Small Cup', amount: 150, desc: '150 ml' },
  { label: 'Glass', amount: 250, desc: '250 ml' },
  { label: 'Mug', amount: 350, desc: '350 ml' },
  { label: 'Bottle', amount: 500, desc: '500 ml' },
];

const BEVERAGE_TYPES: { type: BeverageType; label: string }[] = [
  { type: BeverageType.WATER, label: 'Plain Water' },
  { type: BeverageType.TEA, label: 'Tea' },
  { type: BeverageType.COFFEE, label: 'Coffee' },
  { type: BeverageType.JUICE, label: 'Fresh Juice' },
  { type: BeverageType.ELECTROLYTE, label: 'Electrolyte' },
  { type: BeverageType.OTHER, label: 'Other' },
];

export default function WaterTrackerScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<DailyWaterSummaryDto | null>(null);
  const [profile, setProfile] = useState<HealthProfileDto | null>(null);
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Custom Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedType, setSelectedType] = useState<BeverageType>(BeverageType.WATER);
  const [beverageName, setBeverageName] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [todaySum, history, prof] = await Promise.all([
        waterService.getTodaySummary(),
        waterService.getWeeklyHistory().catch(() => []),
        profileService.getProfile().catch(() => null),
      ]);
      setSummary(todaySum);
      setWeeklyHistory(history);
      if (prof) setProfile(prof);
    } catch (err: any) {
      console.warn('Failed to load water data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleQuickAdd = async (amountMl: number) => {
    try {
      setSubmitting(true);
      await waterService.logIntake({
        amountMl,
        beverageType: 'WATER',
        beverageName: 'Water',
      });
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to log water intake');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomAdd = async () => {
    const ml = parseInt(customAmount, 10);
    if (isNaN(ml) || ml <= 0 || ml > 3000) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount between 10 and 3000 ml');
      return;
    }

    try {
      setSubmitting(true);
      await waterService.logIntake({
        amountMl: ml,
        beverageType: selectedType,
        beverageName: beverageName.trim() || undefined,
      });
      setShowAddModal(false);
      setCustomAmount('');
      setBeverageName('');
      setSelectedType(BeverageType.WATER);
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to log water');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    Alert.alert('Delete Log', 'Are you sure you want to remove this water log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await waterService.deleteLog(logId);
            await loadData();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete log');
          }
        },
      },
    ]);
  };

  const targetMl = profile?.preferredWaterIntakeMl || summary?.targetMl || 2500;
  const currentMl = summary?.totalConsumedMl ?? summary?.totalAmountMl ?? 0;
  const progressPct = Math.min(100, Math.round((currentMl / targetMl) * 100));
  const remainingMl = Math.max(0, targetMl - currentMl);
  const isGoalAchieved = summary?.isGoalAchieved ?? progressPct >= 100;

  return (
    <View style={styles.container}>
      <AppHeader title="Water & Hydration" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[WATER_COLOR]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Hydration Progress Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Droplets size={24} color={WATER_COLOR} />
            </View>
            <View style={styles.heroHeaderText}>
              <Text style={styles.heroTitle}>Today's Hydration</Text>
              <Text style={styles.heroSubtitle}>Target: {targetMl.toLocaleString()} ml</Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentBadgeText}>{progressPct}%</Text>
            </View>
          </View>

          {/* Big Number Progress */}
          <View style={styles.bigNumberRow}>
            <Text style={styles.currentNumber}>{currentMl.toLocaleString()}</Text>
            <Text style={styles.totalUnitText}> / {targetMl.toLocaleString()} ml</Text>
          </View>

          {/* Linear Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Remaining</Text>
              <Text style={styles.statValue}>{remainingMl.toLocaleString()} ml</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Plain Water</Text>
              <Text style={styles.statValue}>{summary?.totalWaterMl ?? summary?.plainWaterMl ?? 0} ml</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Status</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: isGoalAchieved ? '#16A34A' : WATER_COLOR },
                ]}
              >
                {isGoalAchieved ? 'Goal Met' : `${progressPct}% Done`}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Add Presets */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Add Presets</Text>
          <TouchableOpacity
            style={styles.customAddBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.75}
          >
            <Plus size={15} color={WATER_COLOR} />
            <Text style={styles.customAddBtnText}>Custom</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickGrid}>
          {QUICK_AMOUNTS.map((item) => (
            <TouchableOpacity
              key={item.amount}
              style={styles.quickCard}
              onPress={() => handleQuickAdd(item.amount)}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <View style={styles.quickIconCircle}>
                <Droplets size={20} color={WATER_COLOR} />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
              <Text style={styles.quickAmount}>+{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Hydration Trend */}
        {weeklyHistory.length > 0 && (
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <TrendingUp size={18} color={WATER_COLOR} />
              <Text style={styles.trendTitle}>Weekly Hydration Trend</Text>
            </View>
            <View style={styles.chartContainer}>
              {weeklyHistory.map((day: any, idx: number) => {
                const consumed = day.consumedMl ?? day.totalConsumedMl ?? day.totalAmountMl ?? 0;
                const dayTarget = day.targetMl || 2500;
                const dayPct = Math.min(100, Math.round((consumed / dayTarget) * 100));
                const dayLabel = day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' }) : `${idx + 1}`;
                const achieved = day.achieved ?? day.isGoalAchieved ?? dayPct >= 100;
                return (
                  <View key={day.date || idx} style={styles.barCol}>
                    <Text style={styles.barValueText}>{consumed > 0 ? `${(consumed / 1000).toFixed(1)}L` : ''}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${Math.max(8, dayPct)}%` },
                          achieved && { backgroundColor: '#16A34A' },
                        ]}
                      />
                    </View>
                    <Text style={styles.barDayText}>{dayLabel}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Today's Intake Log */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Logs ({summary?.logs?.length || 0})</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={WATER_COLOR} style={{ marginVertical: 20 }} />
        ) : !summary?.logs || summary.logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Droplets size={36} color={colors.secondaryText} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No water logs recorded today</Text>
            <Text style={styles.emptySubtitle}>Tap a quick preset above to log your first drink!</Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {summary.logs.map((log: WaterLogDto) => {
              const logId = log._id || log.id || Math.random().toString();
              const amount = log.quantityMl || log.amountMl || 0;
              const timeStr = (log.recordedAt || log.loggedAt)
                ? new Date(log.recordedAt || log.loggedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now';
              return (
                <View key={logId} style={styles.logItem}>
                  <View style={styles.logLeft}>
                    <View style={styles.logIconBox}>
                      {log.beverageType === BeverageType.TEA || log.beverageType === BeverageType.COFFEE || log.beverageType === BeverageType.TEA_COFFEE ? (
                        <Coffee size={18} color="#D97706" />
                      ) : (
                        <Droplets size={18} color={WATER_COLOR} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.logName}>
                        {log.beverageName || (log.beverageType === BeverageType.WATER ? 'Plain Water' : log.beverageType)}
                      </Text>
                      <View style={styles.logMetaRow}>
                        <Clock size={12} color={colors.secondaryText} />
                        <Text style={styles.logTimeText}>{timeStr}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.logRight}>
                    <Text style={styles.logAmount}>+{amount} ml</Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteLog(logId)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Custom Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Custom Hydration</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={22} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            {/* Quantity Input */}
            <Text style={styles.inputLabel}>Water / Beverage Volume (ml)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="e.g. 300"
                value={customAmount}
                onChangeText={setCustomAmount}
                placeholderTextColor={colors.secondaryText}
                maxLength={4}
              />
              <Text style={styles.unitSuffix}>ml</Text>
            </View>

            {/* Beverage Type Selection */}
            <Text style={styles.inputLabel}>Beverage Type</Text>
            <View style={styles.typeGrid}>
              {BEVERAGE_TYPES.map((b) => (
                <TouchableOpacity
                  key={b.type}
                  style={[styles.typePill, selectedType === b.type && styles.typePillActive]}
                  onPress={() => setSelectedType(b.type)}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      selectedType === b.type && styles.typePillTextActive,
                    ]}
                  >
                    {b.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Optional Custom Name */}
            {selectedType !== 'WATER' && (
              <>
                <Text style={styles.inputLabel}>Name / Note (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { marginBottom: 16 }]}
                  placeholder="e.g. Green Tea, Orange Juice"
                  value={beverageName}
                  onChangeText={setBeverageName}
                  placeholderTextColor={colors.secondaryText}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCustomAdd}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Save Hydration</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: WATER_BORDER,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: WATER_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heroHeaderText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 2,
  },
  percentBadge: {
    backgroundColor: WATER_BG_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WATER_BORDER,
  },
  percentBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: WATER_COLOR,
  },
  bigNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currentNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primaryText,
  },
  totalUnitText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: WATER_COLOR,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.secondaryText,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  customAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: WATER_BG_LIGHT,
    borderRadius: 8,
  },
  customAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: WATER_COLOR,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WATER_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
  },
  quickAmount: {
    fontSize: 12,
    color: WATER_COLOR,
    fontWeight: '700',
    marginTop: 2,
  },
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValueText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.secondaryText,
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 80,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: WATER_COLOR,
    borderRadius: 7,
  },
  barDayText: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 6,
    fontWeight: '600',
  },
  logList: {
    gap: 10,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: WATER_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  logTimeText: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  logRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: WATER_COLOR,
  },
  deleteBtn: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: colors.primaryText,
  },
  unitSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typePillActive: {
    backgroundColor: WATER_BG_LIGHT,
    borderColor: WATER_COLOR,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  typePillTextActive: {
    color: WATER_COLOR,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
