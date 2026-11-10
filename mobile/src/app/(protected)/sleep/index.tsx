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
  Moon,
  Clock,
  Sparkles,
  TrendingUp,
  Plus,
  Trash2,
  X,
  PieChart,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { PeriodFilterBar, FilterMode } from '../../../components/common/PeriodFilterBar';
import { InteractiveCalendarModal } from '../../../components/common/InteractiveCalendarModal';
import { sleepService } from '../../../services/wellness/sleepService';
import {
  SleepRecordDto,
  ISleepRangeSummary,
  SleepQuality,
} from '../../../types/wellness';
import { colors } from '../../../theme/colors';

const SLEEP_COLOR = '#8B5CF6';
const SLEEP_BG_LIGHT = '#F5F3FF';
const SLEEP_BORDER = '#DDD6FE';

const QUALITY_OPTIONS: { quality: SleepQuality; label: string; color: string }[] = [
  { quality: SleepQuality.VERY_GOOD, label: 'Very Good', color: '#16A34A' },
  { quality: SleepQuality.GOOD, label: 'Good', color: '#0EA5E9' },
  { quality: SleepQuality.AVERAGE, label: 'Average', color: '#F59E0B' },
  { quality: SleepQuality.POOR, label: 'Poor', color: '#EF4444' },
];

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

export default function SleepTrackerScreen() {
  const router = useRouter();
  const todayStr = useMemo(() => getTodayString(), []);

  // Filter Mode State
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
  const [latestSleep, setLatestSleep] = useState<SleepRecordDto | null>(null);
  const [rangeSummary, setRangeSummary] = useState<ISleepRangeSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Log Sleep Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [bedtimeStr, setBedtimeStr] = useState('22:30');
  const [wakeTimeStr, setWakeTimeStr] = useState('06:30');
  const [selectedQuality, setSelectedQuality] = useState<SleepQuality>(SleepQuality.GOOD);
  const [sleepNotes, setSleepNotes] = useState('');

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

  const inFlightRef = React.useRef(false);
  const loadData = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      if (filterMode === 'DAY') {
        const history = await sleepService.getHistory({
          startDate: activePeriod.startDate,
          endDate: activePeriod.endDate,
        });
        setLatestSleep(history.length > 0 ? history[0] : null);
        setRangeSummary(null);
      } else {
        const rngRes = await sleepService.getRangeSummary(activePeriod.startDate, activePeriod.endDate);
        setRangeSummary(rngRes);
        setLatestSleep(null);
      }
    } catch (err: any) {
      console.warn('Failed to load sleep data:', err.message);
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

  const handleLogSleep = async () => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(bedtimeStr) || !timeRegex.test(wakeTimeStr)) {
      Alert.alert('Invalid Time', 'Please enter valid times in 24-hour HH:mm format (e.g. 22:30)');
      return;
    }

    try {
      setSubmitting(true);
      const targetDate = parseDateString(activePeriod.startDate);
      const [bHour, bMin] = bedtimeStr.split(':').map(Number);
      const [wHour, wMin] = wakeTimeStr.split(':').map(Number);

      const bedtime = new Date(targetDate);
      bedtime.setHours(bHour, bMin, 0, 0);

      const wakeTime = new Date(targetDate);
      wakeTime.setHours(wHour, wMin, 0, 0);

      if (wakeTime.getTime() <= bedtime.getTime()) {
        bedtime.setDate(bedtime.getDate() - 1);
      }

      await sleepService.logSleep({
        bedtime: bedtime.toISOString(),
        wakeTime: wakeTime.toISOString(),
        quality: selectedQuality,
        notes: sleepNotes.trim() || undefined,
      });

      setShowLogModal(false);
      setSleepNotes('');
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save sleep log');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Record', 'Are you sure you want to remove this sleep session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await sleepService.deleteSleep(id);
            await loadData();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete sleep session');
          }
        },
      },
    ]);
  };

  // Metrics computation
  const isDayMode = filterMode === 'DAY';
  const durationHours = latestSleep?.durationMinutes
    ? (latestSleep.durationMinutes / 60).toFixed(1)
    : '0.0';
  const totalHours = isDayMode ? parseFloat(durationHours) : (rangeSummary?.totalHours || 0);
  const avgHours = isDayMode ? parseFloat(durationHours) : (rangeSummary?.avgDurationHours || 0);
  const optimalNights = isDayMode ? (parseFloat(durationHours) >= 7 ? 1 : 0) : (rangeSummary?.optimalGoalNights || 0);
  const adherencePct = isDayMode ? (parseFloat(durationHours) >= 7 ? 100 : Math.round((parseFloat(durationHours) / 8) * 100)) : (rangeSummary?.adherencePercentage || 0);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sleepRecordsList: SleepRecordDto[] = isDayMode
    ? (latestSleep ? [latestSleep] : [])
    : (rangeSummary?.records || []);

  return (
    <View style={styles.container}>
      <AppHeader title="Sleep Tracker" showBack onBackPress={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[SLEEP_COLOR]} />}
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
          accentColor={SLEEP_COLOR}
          accentLightBg={SLEEP_BG_LIGHT}
          accentBorder={SLEEP_BORDER}
        />

        {/* Main Sleep Summary Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Moon size={24} color={SLEEP_COLOR} />
            </View>
            <View style={styles.heroHeaderText}>
              <Text style={styles.heroTitle}>{isDayMode ? `${activePeriod.title}'s Sleep` : 'Period Sleep'}</Text>
              <Text style={styles.heroSubtitle}>Goal: 8.0 hrs / night</Text>
            </View>
            <View style={[styles.qualityBadge, { backgroundColor: SLEEP_BG_LIGHT }]}>
              <Text style={styles.qualityBadgeText}>
                {isDayMode
                  ? (latestSleep?.sleepQuality || latestSleep?.quality || 'No Log').toString().replace('_', ' ')
                  : `${adherencePct}% Goal Met`}
              </Text>
            </View>
          </View>

          {/* Big Duration */}
          <View style={styles.bigNumberRow}>
            <Text style={styles.currentNumber}>{isDayMode ? durationHours : avgHours.toFixed(1)}</Text>
            <Text style={styles.totalUnitText}>{isDayMode ? ' hours slept' : ' hrs/night avg'}</Text>
          </View>

          {/* Bedtime, Wake, and Adherence stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{isDayMode ? 'Bedtime' : 'Total Hours'}</Text>
              <Text style={styles.statValue}>
                {isDayMode ? formatTime(latestSleep?.bedtime) : `${totalHours.toFixed(1)} hrs`}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{isDayMode ? 'Wake Time' : 'Optimal (8h) Nights'}</Text>
              <Text style={styles.statValue}>
                {isDayMode
                  ? formatTime(latestSleep?.wakeTime)
                  : `${optimalNights} / ${rangeSummary?.daysCount || 1}d`}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Adherence</Text>
              <Text style={[styles.statValue, { color: adherencePct >= 80 ? '#16A34A' : SLEEP_COLOR }]}>
                {adherencePct}%
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button: Log New Sleep Session */}
        <TouchableOpacity
          style={styles.logActionBtn}
          onPress={() => setShowLogModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.logActionBtnText}>
            {isDayMode ? `Log Sleep for ${activePeriod.title}` : 'Log New Sleep Session'}
          </Text>
        </TouchableOpacity>

        {/* Sleep Quality Breakdown (For Week/Month/Year/Custom) */}
        {!isDayMode && rangeSummary?.qualityDistribution && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <PieChart size={18} color={SLEEP_COLOR} />
              <Text style={styles.chartTitle}>Sleep Quality Distribution</Text>
            </View>
            <View style={styles.qualGrid}>
              {QUALITY_OPTIONS.map((opt) => {
                const count = rangeSummary.qualityDistribution[opt.quality] || 0;
                return (
                  <View key={opt.quality} style={styles.qualItem}>
                    <Text style={styles.qualLabel}>{opt.label}</Text>
                    <Text style={[styles.qualValue, { color: opt.color }]}>{count} nights</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Daily Sleep Duration Chart (For Week/Month/Year/Custom) */}
        {!isDayMode && rangeSummary?.dailyBreakdown && rangeSummary.dailyBreakdown.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <TrendingUp size={18} color={SLEEP_COLOR} />
              <Text style={styles.chartTitle}>Daily Sleep Duration</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
              <View style={styles.chartContainer}>
                {rangeSummary.dailyBreakdown.map((item, idx) => {
                  const hours = item.durationHours || 0;
                  const barHeightPct = Math.min(100, Math.round((hours / 10) * 100));
                  return (
                    <View key={item.date || idx} style={styles.barCol}>
                      <Text style={styles.barValueText}>{hours > 0 ? `${hours.toFixed(1)}h` : ''}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${Math.max(8, barHeightPct)}%` },
                            item.goalReached && { backgroundColor: '#16A34A' },
                          ]}
                        />
                      </View>
                      <Text style={styles.barDayText}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Sleep History Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isDayMode ? `${activePeriod.title}'s Session` : 'Sleep History'} ({sleepRecordsList.length})
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={SLEEP_COLOR} style={{ marginVertical: 20 }} />
        ) : sleepRecordsList.length === 0 ? (
          <View style={styles.emptyState}>
            <Moon size={36} color={colors.secondaryText} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No sleep sessions recorded</Text>
            <Text style={styles.emptySubtitle}>Tap the button above to log your sleep duration and quality</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {sleepRecordsList.map((item) => {
              const recId = item._id || item.id || Math.random().toString();
              const hrs = item.durationMinutes ? (item.durationMinutes / 60).toFixed(1) : '0.0';
              const qual = (item.sleepQuality || item.quality || 'GOOD').toString().replace('_', ' ');
              return (
                <View key={recId} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <View style={styles.historyIconBox}>
                      <Moon size={18} color={SLEEP_COLOR} />
                    </View>
                    <View>
                      <Text style={styles.historyDate}>{item.dateString || item.date || 'Sleep Record'}</Text>
                      <Text style={styles.historyTimes}>
                        {formatTime(item.bedtime)} – {formatTime(item.wakeTime)}
                      </Text>
                      {item.notes ? <Text style={styles.historyNotes}>"{item.notes}"</Text> : null}
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyHours}>{hrs} hrs</Text>
                    <Text style={styles.historyQuality}>{qual}</Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(recId)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

      {/* Interactive Calendar Modal */}
      <InteractiveCalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        initialStartDate={activePeriod.startDate}
        initialEndDate={activePeriod.endDate}
        initialMode={filterMode === 'DAY' ? 'DAY' : filterMode === 'WEEK' ? 'WEEK' : 'RANGE'}
        onApply={handleApplyCalendar}
        accentColor={SLEEP_COLOR}
        accentLightBg={SLEEP_BG_LIGHT}
      />

      {/* Log Sleep Modal */}
      <Modal visible={showLogModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Sleep Session</Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)}>
                <X size={22} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeInputsRow}>
              <View style={styles.timeCol}>
                <Text style={styles.inputLabel}>Bedtime (HH:mm)</Text>
                <TextInput
                  style={styles.timeInput}
                  value={bedtimeStr}
                  onChangeText={setBedtimeStr}
                  placeholder="22:30"
                  maxLength={5}
                />
              </View>
              <View style={styles.timeCol}>
                <Text style={styles.inputLabel}>Wake Time (HH:mm)</Text>
                <TextInput
                  style={styles.timeInput}
                  value={wakeTimeStr}
                  onChangeText={setWakeTimeStr}
                  placeholder="06:30"
                  maxLength={5}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Sleep Quality</Text>
            <View style={styles.qualityGrid}>
              {QUALITY_OPTIONS.map((q) => (
                <TouchableOpacity
                  key={q.quality}
                  style={[
                    styles.qualityPill,
                    selectedQuality === q.quality && {
                      backgroundColor: SLEEP_BG_LIGHT,
                      borderColor: SLEEP_COLOR,
                    },
                  ]}
                  onPress={() => setSelectedQuality(q.quality)}
                >
                  <Text
                    style={[
                      styles.qualityPillText,
                      selectedQuality === q.quality && { color: SLEEP_COLOR, fontWeight: '700' },
                    ]}
                  >
                    {q.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.timeInput, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
              value={sleepNotes}
              onChangeText={setSleepNotes}
              placeholder="e.g. Woke up refreshed, drank chamomile tea"
              multiline
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleLogSleep} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Save Sleep Session</Text>
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
    borderColor: SLEEP_BORDER,
    marginBottom: 16,
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
    backgroundColor: SLEEP_BG_LIGHT,
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
  qualityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SLEEP_BORDER,
  },
  qualityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: SLEEP_COLOR,
    textTransform: 'capitalize',
  },
  bigNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
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
  logActionBtn: {
    flexDirection: 'row',
    backgroundColor: SLEEP_COLOR,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    elevation: 2,
  },
  logActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  qualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  qualItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: SLEEP_BG_LIGHT,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SLEEP_BORDER,
  },
  qualLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  qualValue: {
    fontSize: 15,
    fontWeight: '700',
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
    backgroundColor: SLEEP_COLOR,
    borderRadius: 7,
  },
  barDayText: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: '600',
    marginTop: 6,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  historyList: {
    gap: 10,
    marginBottom: 20,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SLEEP_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
  },
  historyTimes: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  historyNotes: {
    fontSize: 12,
    color: colors.secondaryText,
    fontStyle: 'italic',
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyHours: {
    fontSize: 15,
    fontWeight: '700',
    color: SLEEP_COLOR,
  },
  historyQuality: {
    fontSize: 11,
    color: colors.secondaryText,
    textTransform: 'capitalize',
  },
  deleteBtn: {
    padding: 2,
    marginTop: 2,
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
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timeCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 8,
  },
  timeInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.primaryText,
    marginBottom: 16,
  },
  qualityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  qualityPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  qualityPillText: {
    fontSize: 13,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: SLEEP_COLOR,
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
