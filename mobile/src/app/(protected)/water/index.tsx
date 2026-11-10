import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Droplets,
  Plus,
  Trash2,
  Clock,
  Coffee,
  TrendingUp,
  X,
  PieChart,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { PeriodFilterBar, FilterMode } from '../../../components/common/PeriodFilterBar';
import { InteractiveCalendarModal } from '../../../components/common/InteractiveCalendarModal';
import { waterService } from '../../../services/wellness/waterService';
import { profileService } from '../../../services/health/profileService';
import {
  WaterLogDto,
  DailyWaterSummaryDto,
  IWaterRangeSummary,
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

// Helper: Format Date object to local YYYY-MM-DD
const toDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getTodayString = (): string => toDateString(new Date());

const parseDateString = (str: string): Date => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const getWeekRange = (dateStr: string) => {
  const date = parseDateString(dateStr);
  const dayOfWeek = date.getDay();
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateString(monday), end: toDateString(sunday) };
};

const getMonthRange = (yearMonthStr: string) => {
  const [y, m] = yearMonthStr.split('-').map(Number);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
};

export default function WaterTrackerScreen() {
  const router = useRouter();
  const todayStr = useMemo(() => getTodayString(), []);

  // Filter Mode & Navigation State
  const [filterMode, setFilterMode] = useState<FilterMode>('DAY');
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [weekAnchor, setWeekAnchor] = useState<string>(todayStr);
  const [monthAnchor, setMonthAnchor] = useState<string>(todayStr.substring(0, 7));
  const [yearAnchor, setYearAnchor] = useState<number>(new Date().getFullYear());
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return toDateString(d);
    })(),
    end: todayStr,
  });

  // Calendar Modal State
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<DailyWaterSummaryDto | null>(null);
  const [rangeSummary, setRangeSummary] = useState<IWaterRangeSummary | null>(null);
  const [profile, setProfile] = useState<HealthProfileDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Custom Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedType, setSelectedType] = useState<BeverageType>(BeverageType.WATER);
  const [beverageName, setBeverageName] = useState('');

  // Active Period Computation
  const activePeriod = useMemo(() => {
    if (filterMode === 'DAY') {
      const isToday = selectedDay === todayStr;
      const isYesterday = (() => {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return selectedDay === toDateString(y);
      })();

      const d = parseDateString(selectedDay);
      let title = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (isToday) title = 'Today';
      else if (isYesterday) title = 'Yesterday';

      return {
        startDate: selectedDay,
        endDate: selectedDay,
        title,
        subtitle: d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
        isCurrent: isToday,
      };
    }

    if (filterMode === 'WEEK') {
      const { start, end } = getWeekRange(weekAnchor);
      const isCurrentWeek = getWeekRange(todayStr).start === start;
      const startD = parseDateString(start);
      const endD = parseDateString(end);
      const title = isCurrentWeek
        ? 'This Week'
        : `${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      return {
        startDate: start,
        endDate: end,
        title,
        subtitle: `${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        isCurrent: isCurrentWeek,
      };
    }

    if (filterMode === 'MONTH') {
      const { start, end } = getMonthRange(monthAnchor);
      const isCurrentMonth = todayStr.substring(0, 7) === monthAnchor;
      const [y, m] = monthAnchor.split('-').map(Number);
      const monthDate = new Date(y, m - 1, 1);
      const title = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return {
        startDate: start,
        endDate: end,
        title,
        subtitle: isCurrentMonth ? 'Current Month' : `${monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
        isCurrent: isCurrentMonth,
      };
    }

    if (filterMode === 'YEAR') {
      const isCurrentYear = new Date().getFullYear() === yearAnchor;
      return {
        startDate: `${yearAnchor}-01-01`,
        endDate: `${yearAnchor}-12-31`,
        title: `Year ${yearAnchor}`,
        subtitle: `Jan 01, ${yearAnchor} – Dec 31, ${yearAnchor}`,
        isCurrent: isCurrentYear,
      };
    }

    // CUSTOM
    const diffDays = Math.max(
      1,
      Math.round(
        (parseDateString(customRange.end).getTime() - parseDateString(customRange.start).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1
    );
    const startD = parseDateString(customRange.start);
    const endD = parseDateString(customRange.end);
    return {
      startDate: customRange.start,
      endDate: customRange.end,
      title: `${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      subtitle: `Custom Filter • ${diffDays} Days Range`,
      isCurrent: customRange.end === todayStr,
    };
  }, [filterMode, selectedDay, weekAnchor, monthAnchor, yearAnchor, customRange, todayStr]);

  // Load Data
  const inFlightRef = React.useRef(false);
  const loadData = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const prof = await profileService.getProfile().catch(() => null);
      if (prof) setProfile(prof);

      if (filterMode === 'DAY') {
        const todaySum = await waterService.getTodaySummary(activePeriod.startDate);
        setSummary(todaySum);
        setRangeSummary(null);
      } else {
        const rangeRes = await waterService.getRangeSummary(activePeriod.startDate, activePeriod.endDate);
        setRangeSummary(rangeRes);
        setSummary(null);
      }
    } catch (err: any) {
      console.warn('Failed to load water data:', err.message);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterMode, activePeriod.startDate, activePeriod.endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Stepper handlers (< and >)
  const handlePrevPeriod = () => {
    if (filterMode === 'DAY') {
      const cur = parseDateString(selectedDay);
      cur.setDate(cur.getDate() - 1);
      setSelectedDay(toDateString(cur));
    } else if (filterMode === 'WEEK') {
      const cur = parseDateString(weekAnchor);
      cur.setDate(cur.getDate() - 7);
      setWeekAnchor(toDateString(cur));
    } else if (filterMode === 'MONTH') {
      const [y, m] = monthAnchor.split('-').map(Number);
      const cur = new Date(y, m - 2, 1);
      setMonthAnchor(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`);
    } else if (filterMode === 'YEAR') {
      setYearAnchor((prev) => prev - 1);
    }
  };

  const handleNextPeriod = () => {
    if (activePeriod.isCurrent) return;

    if (filterMode === 'DAY') {
      const cur = parseDateString(selectedDay);
      cur.setDate(cur.getDate() + 1);
      const nextStr = toDateString(cur);
      if (nextStr <= todayStr) setSelectedDay(nextStr);
    } else if (filterMode === 'WEEK') {
      const cur = parseDateString(weekAnchor);
      cur.setDate(cur.getDate() + 7);
      setWeekAnchor(toDateString(cur));
    } else if (filterMode === 'MONTH') {
      const [y, m] = monthAnchor.split('-').map(Number);
      const cur = new Date(y, m, 1);
      const nextYM = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
      if (nextYM <= todayStr.substring(0, 7)) setMonthAnchor(nextYM);
    } else if (filterMode === 'YEAR') {
      if (yearAnchor < new Date().getFullYear()) setYearAnchor((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    setSelectedDay(todayStr);
    setWeekAnchor(todayStr);
    setMonthAnchor(todayStr.substring(0, 7));
    setYearAnchor(new Date().getFullYear());
  };

  const handleApplyCalendar = (start: string, end: string, mode: 'DAY' | 'WEEK' | 'CUSTOM') => {
    if (mode === 'DAY') {
      setFilterMode('DAY');
      setSelectedDay(start);
    } else if (mode === 'WEEK') {
      setFilterMode('WEEK');
      setWeekAnchor(start);
    } else {
      setFilterMode('CUSTOM');
      setCustomRange({ start, end });
    }
    setCalendarModalVisible(false);
  };

  const handleQuickAdd = async (amountMl: number) => {
    try {
      setSubmitting(true);
      await waterService.logIntake({
        amountMl,
        beverageType: 'WATER',
        beverageName: 'Water',
        dateString: activePeriod.startDate,
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
        dateString: activePeriod.startDate,
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

  // Metrics computation
  const isDayMode = filterMode === 'DAY';
  const targetMl = profile?.preferredWaterIntakeMl || summary?.targetMl || 2500;
  const periodTargetMl = isDayMode ? targetMl : (rangeSummary?.periodTargetMl || targetMl * (rangeSummary?.daysCount || 1));
  const currentMl = isDayMode
    ? (summary?.totalConsumedMl ?? summary?.totalAmountMl ?? 0)
    : (rangeSummary?.totalConsumedMl || 0);
  const progressPct = isDayMode
    ? Math.min(100, Math.round((currentMl / (targetMl || 1)) * 100))
    : (rangeSummary?.progressPercentage || 0);
  const remainingMl = Math.max(0, periodTargetMl - currentMl);
  const isGoalAchieved = isDayMode ? progressPct >= 100 : (rangeSummary?.daysGoalAchieved || 0) > 0;
  const avgDailyMl = isDayMode ? currentMl : (rangeSummary?.avgDailyMl || 0);

  const logsList: WaterLogDto[] = isDayMode ? (summary?.logs || []) : (rangeSummary?.logs || []);

  return (
    <View style={styles.container}>
      <AppHeader title="Water & Hydration" showBack onBackPress={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[WATER_COLOR]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Unified Period Filter Bar */}
        <PeriodFilterBar
          activeMode={filterMode}
          onModeChange={(mode) => {
            setFilterMode(mode);
            if (mode === 'CUSTOM') setCalendarModalVisible(true);
          }}
          title={activePeriod.title}
          subtitle={activePeriod.subtitle}
          isCurrentPeriod={activePeriod.isCurrent}
          onPrev={handlePrevPeriod}
          onNext={handleNextPeriod}
          onOpenCalendar={() => setCalendarModalVisible(true)}
          onGoToday={handleGoToday}
          accentColor={WATER_COLOR}
          accentLightBg={WATER_BG_LIGHT}
          accentBorder={WATER_BORDER}
        />

        {/* Main Hydration Progress Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Droplets size={24} color={WATER_COLOR} />
            </View>
            <View style={styles.heroHeaderText}>
              <Text style={styles.heroTitle}>{isDayMode ? `${activePeriod.title}'s Hydration` : 'Period Hydration'}</Text>
              <Text style={styles.heroSubtitle}>Target: {periodTargetMl.toLocaleString()} ml</Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentBadgeText}>{progressPct}%</Text>
            </View>
          </View>

          {/* Big Number Progress */}
          <View style={styles.bigNumberRow}>
            <Text style={styles.currentNumber}>{currentMl.toLocaleString()}</Text>
            <Text style={styles.totalUnitText}> / {periodTargetMl.toLocaleString()} ml</Text>
          </View>

          {/* Linear Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{isDayMode ? 'Remaining' : 'Daily Avg'}</Text>
              <Text style={styles.statValue}>
                {isDayMode ? `${remainingMl.toLocaleString()} ml` : `${avgDailyMl.toLocaleString()} ml`}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{isDayMode ? 'Plain Water' : 'Goal Met Days'}</Text>
              <Text style={styles.statValue}>
                {isDayMode
                  ? `${summary?.totalWaterMl ?? summary?.plainWaterMl ?? 0} ml`
                  : `${rangeSummary?.daysGoalAchieved || 0} / ${rangeSummary?.daysCount || 1}d`}
              </Text>
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
                {isDayMode ? (isGoalAchieved ? 'Goal Met' : `${progressPct}% Done`) : `${progressPct}% Met`}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Add Presets (Only on Day Mode for Today or past day logging) */}
        {isDayMode && (
          <>
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
          </>
        )}

        {/* Beverage Distribution Card (For Week/Month/Year/Custom) */}
        {!isDayMode && rangeSummary?.beverageBreakdown && (
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <PieChart size={18} color={WATER_COLOR} />
              <Text style={styles.trendTitle}>Beverage Distribution</Text>
            </View>
            <View style={styles.bevGrid}>
              {Object.entries(rangeSummary.beverageBreakdown).map(([bevKey, amount]) => {
                const label = bevKey.replace('_', ' ');
                return (
                  <View key={bevKey} style={styles.bevItem}>
                    <Text style={styles.bevLabel}>{label}</Text>
                    <Text style={styles.bevValue}>{amount.toLocaleString()} ml</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Period Hydration Breakdown Chart */}
        {!isDayMode && rangeSummary?.dailyBreakdown && rangeSummary.dailyBreakdown.length > 0 && (
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <TrendingUp size={18} color={WATER_COLOR} />
              <Text style={styles.trendTitle}>Daily Hydration Breakdown</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
              <View style={styles.chartContainer}>
                {rangeSummary.dailyBreakdown.map((day, idx) => {
                  const consumed = day.totalConsumedMl || 0;
                  const dayTarget = day.targetMl || 2500;
                  const dayPct = Math.min(100, Math.round((consumed / dayTarget) * 100));
                  return (
                    <View key={day.date || idx} style={styles.barCol}>
                      <Text style={styles.barValueText}>{consumed > 0 ? `${(consumed / 1000).toFixed(1)}L` : ''}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${Math.max(8, dayPct)}%` },
                            day.achieved && { backgroundColor: '#16A34A' },
                          ]}
                        />
                      </View>
                      <Text style={styles.barDayText}>{day.label}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Intake Logs List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isDayMode ? `${activePeriod.title}'s Logs` : 'Period Logs'} ({logsList.length})
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={WATER_COLOR} style={{ marginVertical: 20 }} />
        ) : logsList.length === 0 ? (
          <View style={styles.emptyState}>
            <Droplets size={36} color={colors.secondaryText} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No hydration logged for this period</Text>
            <Text style={styles.emptySubtitle}>Tap a quick preset above or select another period</Text>
          </View>
        ) : (
          <View style={styles.logList}>
            {logsList.map((log: WaterLogDto) => {
              const logId = log._id || log.id || Math.random().toString();
              const amount = log.quantityMl || log.amountMl || 0;
              const timeStr = (log.recordedAt || log.loggedAt)
                ? new Date(log.recordedAt || log.loggedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Recorded';
              const dateBadge = log.dateString ? ` • ${log.dateString}` : '';
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
                        <Text style={styles.logTimeText}>{timeStr}{!isDayMode ? dateBadge : ''}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.logRight}>
                    <Text style={styles.logAmount}>+{amount} ml</Text>
                    {isDayMode && (
                      <TouchableOpacity
                        onPress={() => handleDeleteLog(logId)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Interactive Calendar Modal */}
      <InteractiveCalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        initialStartDate={activePeriod.startDate}
        initialEndDate={activePeriod.endDate}
        initialMode={filterMode === 'DAY' ? 'DAY' : filterMode === 'WEEK' ? 'WEEK' : 'RANGE'}
        onApply={handleApplyCalendar}
        accentColor={WATER_COLOR}
        accentLightBg={WATER_BG_LIGHT}
      />

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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconBox: {
    width: 44,
    height: 44,
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
    fontSize: 16,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WATER_BORDER,
  },
  percentBadgeText: {
    fontSize: 13,
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
    fontSize: 15,
    color: colors.secondaryText,
    fontWeight: '500',
    marginLeft: 4,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: WATER_COLOR,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  customAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WATER_BG_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WATER_BORDER,
    gap: 4,
  },
  customAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: WATER_COLOR,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: WATER_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: '500',
    textAlign: 'center',
  },
  quickAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: WATER_COLOR,
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
  bevGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bevItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: WATER_BG_LIGHT,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: WATER_BORDER,
  },
  bevLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  bevValue: {
    fontSize: 15,
    fontWeight: '700',
    color: WATER_COLOR,
  },
  chartScroll: {
    paddingRight: 10,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 12,
    paddingTop: 20,
    paddingBottom: 6,
  },
  barCol: {
    alignItems: 'center',
    minWidth: 32,
  },
  barValueText: {
    fontSize: 10,
    color: colors.secondaryText,
    marginBottom: 4,
    fontWeight: '600',
  },
  barTrack: {
    width: 14,
    height: 90,
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
    fontWeight: '600',
    marginTop: 6,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 4,
    textAlign: 'center',
  },
  logList: {
    gap: 10,
    marginBottom: 20,
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: WATER_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  logMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  logTimeText: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  logRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: WATER_COLOR,
  },
  deleteBtn: {
    padding: 4,
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
    padding: 20,
    paddingBottom: 36,
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
    color: colors.primaryText,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  typePillActive: {
    backgroundColor: WATER_BG_LIGHT,
    borderColor: WATER_COLOR,
  },
  typePillText: {
    fontSize: 13,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  typePillTextActive: {
    color: WATER_COLOR,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: WATER_COLOR,
    height: 48,
    borderRadius: 12,
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
