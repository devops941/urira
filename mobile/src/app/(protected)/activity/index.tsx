import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Footprints,
  Flame,
  Clock,
  Compass,
  Plus,
  X,
  TrendingUp,
  Calendar as CalendarIcon,
  CheckCircle2,
  Trash2,
  Smartphone,
  Play,
  Zap,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Filter,
  Check,
  ArrowRight,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { colors } from '../../../theme/colors';
import { activityService } from '../../../services/wellness/activityService';
import {
  stepTrackerNativeService,
  ActiveWalkingState,
} from '../../../services/tracking/stepTrackerNativeService';
import {
  IActivityTodaySummary,
  IWeeklyActivity,
  IActivityRangeSummary,
  IActivityRecord,
  ActivitySource,
} from '../../../types/wellness';

type FilterMode = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';
type CalendarSelectionMode = 'DAY' | 'WEEK' | 'RANGE';

// Helper: Format Date object to local YYYY-MM-DD
const toDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getTodayString = (): string => toDateString(new Date());

// Helper: Parse YYYY-MM-DD into local Date
const parseDateString = (str: string): Date => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Calculate Monday to Sunday of the week containing dateStr
const getWeekRange = (dateStr: string) => {
  const date = parseDateString(dateStr);
  const dayOfWeek = date.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateString(monday), end: toDateString(sunday) };
};

// Calculate Start and End of Month for yearMonthStr ("YYYY-MM")
const getMonthRange = (yearMonthStr: string) => {
  const [y, m] = yearMonthStr.split('-').map(Number);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
};

export default function ActivityScreen() {
  const router = useRouter();

  const todayStr = useMemo(() => getTodayString(), []);

  // Filter Mode State
  const [filterMode, setFilterMode] = useState<FilterMode>('DAY');

  // Date Anchors for each filter mode
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);
  const [weekAnchor, setWeekAnchor] = useState<string>(todayStr);
  const [monthAnchor, setMonthAnchor] = useState<string>(todayStr.substring(0, 7)); // "YYYY-MM"
  const [yearAnchor, setYearAnchor] = useState<number>(new Date().getFullYear());
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return toDateString(d);
    })(),
    end: todayStr,
  });

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todaySummary, setTodaySummary] = useState<IActivityTodaySummary | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<IWeeklyActivity | null>(null);
  const [rangeSummary, setRangeSummary] = useState<IActivityRangeSummary | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveWalkingState | null>(null);

  // Manual Add Modal State
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [stepsInput, setStepsInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [submittingManual, setSubmittingManual] = useState(false);

  // Interactive Calendar & Range Picker Modal State
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarMode, setCalendarMode] = useState<CalendarSelectionMode>('DAY');
  const [calViewYear, setCalViewYear] = useState<number>(new Date().getFullYear());
  const [calViewMonth, setCalViewMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [calStart, setCalStart] = useState<string>(todayStr);
  const [calEnd, setCalEnd] = useState<string>(todayStr);

  // Determine Active Date Range from current filterMode
  const activePeriod = useMemo(() => {
    if (filterMode === 'DAY') {
      const isToday = selectedDay === todayStr;
      const isYesterday = (() => {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return selectedDay === toDateString(y);
      })();

      let title = formatDisplayDate(selectedDay);
      if (isToday) title = 'Today';
      else if (isYesterday) title = 'Yesterday';

      return {
        startDate: selectedDay,
        endDate: selectedDay,
        title,
        subtitle: formatFullDate(selectedDay),
        isCurrent: isToday,
      };
    }

    if (filterMode === 'WEEK') {
      const { start, end } = getWeekRange(weekAnchor);
      const isCurrentWeek = getWeekRange(todayStr).start === start;
      const title = isCurrentWeek
        ? 'This Week'
        : `${formatShortMonthDay(start)} – ${formatShortMonthDay(end)}`;
      return {
        startDate: start,
        endDate: end,
        title,
        subtitle: `${formatFullDate(start)} to ${formatFullDate(end)}`,
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
        subtitle: isCurrentMonth ? 'Current Month' : `${formatShortMonthDay(start)} – ${formatShortMonthDay(end)}`,
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
    return {
      startDate: customRange.start,
      endDate: customRange.end,
      title: `${formatShortMonthDay(customRange.start)} – ${formatShortMonthDay(customRange.end)}`,
      subtitle: `Custom Filter • ${diffDays} Days Range`,
      isCurrent: customRange.end === todayStr,
    };
  }, [filterMode, selectedDay, weekAnchor, monthAnchor, yearAnchor, customRange, todayStr]);

  // Format date utilities
  function formatDisplayDate(dStr: string) {
    const d = parseDateString(dStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function formatFullDate(dStr: string) {
    const d = parseDateString(dStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatShortMonthDay(dStr: string) {
    const d = parseDateString(dStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // In-flight guard to prevent duplicate concurrent network calls
  const inFlightRef = React.useRef(false);

  // Load Activity Data from Backend
  const loadData = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      if (filterMode === 'DAY') {
        const [sumRes, weekRes, active] = await Promise.all([
          activityService.getTodaySummary(activePeriod.startDate),
          activityService.getWeeklyTrends(),
          stepTrackerNativeService.restoreActiveSession(),
        ]);
        setTodaySummary(sumRes);
        setWeeklyTrends(weekRes);
        setRangeSummary(null);
        setActiveSession(active && active.status !== 'IDLE' ? active : null);
      } else {
        const [rngRes, active] = await Promise.all([
          activityService.getRangeSummary(activePeriod.startDate, activePeriod.endDate),
          stepTrackerNativeService.restoreActiveSession(),
        ]);
        setRangeSummary(rngRes);
        setTodaySummary(null);
        setActiveSession(active && active.status !== 'IDLE' ? active : null);
      }
    } catch (err: any) {
      console.warn('Failed to load activity metrics:', err.message || err);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterMode, activePeriod.startDate, activePeriod.endDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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
      const nextY = cur.getFullYear();
      const nextM = String(cur.getMonth() + 1).padStart(2, '0');
      setMonthAnchor(`${nextY}-${nextM}`);
    } else if (filterMode === 'YEAR') {
      setYearAnchor((prev) => prev - 1);
    } else if (filterMode === 'CUSTOM') {
      const s = parseDateString(customRange.start);
      const e = parseDateString(customRange.end);
      const diffMs = e.getTime() - s.getTime();
      const shiftDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
      s.setDate(s.getDate() - shiftDays);
      e.setDate(e.getDate() - shiftDays);
      setCustomRange({ start: toDateString(s), end: toDateString(e) });
    }
  };

  const handleNextPeriod = () => {
    if (activePeriod.isCurrent) return;

    if (filterMode === 'DAY') {
      const cur = parseDateString(selectedDay);
      cur.setDate(cur.getDate() + 1);
      if (toDateString(cur) <= todayStr) {
        setSelectedDay(toDateString(cur));
      }
    } else if (filterMode === 'WEEK') {
      const cur = parseDateString(weekAnchor);
      cur.setDate(cur.getDate() + 7);
      setWeekAnchor(toDateString(cur));
    } else if (filterMode === 'MONTH') {
      const [y, m] = monthAnchor.split('-').map(Number);
      const cur = new Date(y, m, 1);
      const nextY = cur.getFullYear();
      const nextM = String(cur.getMonth() + 1).padStart(2, '0');
      if (`${nextY}-${nextM}` <= todayStr.substring(0, 7)) {
        setMonthAnchor(`${nextY}-${nextM}`);
      }
    } else if (filterMode === 'YEAR') {
      if (yearAnchor < new Date().getFullYear()) {
        setYearAnchor((prev) => prev + 1);
      }
    } else if (filterMode === 'CUSTOM') {
      const s = parseDateString(customRange.start);
      const e = parseDateString(customRange.end);
      const diffMs = e.getTime() - s.getTime();
      const shiftDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
      s.setDate(s.getDate() + shiftDays);
      e.setDate(e.getDate() + shiftDays);
      if (toDateString(e) > todayStr) {
        const offset = Math.round((parseDateString(todayStr).getTime() - e.getTime()) / (1000 * 60 * 60 * 24));
        s.setDate(s.getDate() + offset);
        e.setDate(e.getDate() + offset);
      }
      setCustomRange({ start: toDateString(s), end: toDateString(e) });
    }
  };

  const handleGoToday = () => {
    if (filterMode === 'DAY') {
      setSelectedDay(todayStr);
    } else if (filterMode === 'WEEK') {
      setWeekAnchor(todayStr);
    } else if (filterMode === 'MONTH') {
      setMonthAnchor(todayStr.substring(0, 7));
    } else if (filterMode === 'YEAR') {
      setYearAnchor(new Date().getFullYear());
    } else if (filterMode === 'CUSTOM') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      setCustomRange({ start: toDateString(d), end: todayStr });
    }
  };

  // Open Calendar Modal with proper initial state
  const openCalendarModal = () => {
    let mode: CalendarSelectionMode = 'DAY';
    if (filterMode === 'WEEK') mode = 'WEEK';
    else if (filterMode === 'CUSTOM' || filterMode === 'MONTH' || filterMode === 'YEAR') mode = 'RANGE';

    setCalendarMode(mode);
    setCalStart(activePeriod.startDate);
    setCalEnd(activePeriod.endDate);

    const anchorDate = parseDateString(activePeriod.startDate);
    setCalViewYear(anchorDate.getFullYear());
    setCalViewMonth(anchorDate.getMonth());
    setCalendarModalVisible(true);
  };

  // Calendar Day Click Handler
  const handleCalendarDayPress = (dStr: string) => {
    if (dStr > todayStr) return; // Disallow future dates

    if (calendarMode === 'DAY') {
      setCalStart(dStr);
      setCalEnd(dStr);
    } else if (calendarMode === 'WEEK') {
      const { start, end } = getWeekRange(dStr);
      setCalStart(start);
      setCalEnd(end);
    } else {
      // RANGE mode
      if (calStart && calEnd && calStart !== calEnd) {
        // Reset and set new start
        setCalStart(dStr);
        setCalEnd(dStr);
      } else if (calStart && (!calEnd || calStart === calEnd)) {
        if (dStr < calStart) {
          setCalEnd(calStart);
          setCalStart(dStr);
        } else {
          setCalEnd(dStr);
        }
      } else {
        setCalStart(dStr);
        setCalEnd(dStr);
      }
    }
  };

  // Quick Preset Selection in Calendar
  const handleCalendarPreset = (preset: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_7' | 'THIS_MONTH' | 'THIS_YEAR') => {
    const today = new Date();
    if (preset === 'TODAY') {
      setCalendarMode('DAY');
      setCalStart(todayStr);
      setCalEnd(todayStr);
      setCalViewYear(today.getFullYear());
      setCalViewMonth(today.getMonth());
    } else if (preset === 'YESTERDAY') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = toDateString(y);
      setCalendarMode('DAY');
      setCalStart(yStr);
      setCalEnd(yStr);
      setCalViewYear(y.getFullYear());
      setCalViewMonth(y.getMonth());
    } else if (preset === 'THIS_WEEK') {
      const { start, end } = getWeekRange(todayStr);
      setCalendarMode('WEEK');
      setCalStart(start);
      setCalEnd(end);
      setCalViewYear(today.getFullYear());
      setCalViewMonth(today.getMonth());
    } else if (preset === 'LAST_7') {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      setCalendarMode('RANGE');
      setCalStart(toDateString(s));
      setCalEnd(todayStr);
      setCalViewYear(today.getFullYear());
      setCalViewMonth(today.getMonth());
    } else if (preset === 'THIS_MONTH') {
      const { start, end } = getMonthRange(todayStr.substring(0, 7));
      setCalendarMode('RANGE');
      setCalStart(start);
      setCalEnd(end);
      setCalViewYear(today.getFullYear());
      setCalViewMonth(today.getMonth());
    } else if (preset === 'THIS_YEAR') {
      const yr = today.getFullYear();
      setCalendarMode('RANGE');
      setCalStart(`${yr}-01-01`);
      setCalEnd(`${yr}-12-31`);
      setCalViewYear(yr);
      setCalViewMonth(today.getMonth());
    }
  };

  // Apply Calendar Filter
  const handleApplyCalendar = () => {
    if (calendarMode === 'DAY') {
      setFilterMode('DAY');
      setSelectedDay(calStart);
    } else if (calendarMode === 'WEEK') {
      setFilterMode('WEEK');
      setWeekAnchor(calStart);
    } else {
      // Range mode
      setFilterMode('CUSTOM');
      setCustomRange({ start: calStart, end: calEnd || calStart });
    }
    setCalendarModalVisible(false);
  };

  // Calendar Month Navigation (< and >)
  const handlePrevCalMonth = () => {
    if (calViewMonth === 0) {
      setCalViewYear((prev) => prev - 1);
      setCalViewMonth(11);
    } else {
      setCalViewMonth((prev) => prev - 1);
    }
  };

  const handleNextCalMonth = () => {
    const curNow = new Date();
    if (calViewYear === curNow.getFullYear() && calViewMonth >= curNow.getMonth()) {
      return; // Can't go to future month
    }
    if (calViewMonth === 11) {
      setCalViewYear((prev) => prev + 1);
      setCalViewMonth(0);
    } else {
      setCalViewMonth((prev) => prev + 1);
    }
  };

  // Manual Step Addition
  const handleAddManualSteps = async () => {
    const steps = parseInt(stepsInput, 10);
    if (isNaN(steps) || steps <= 0) {
      if (Platform.OS === 'web') window.alert('Please enter a valid step count');
      else Alert.alert('Invalid Input', 'Please enter a valid step count');
      return;
    }

    setSubmittingManual(true);
    try {
      await activityService.logActivity({
        steps,
        activityType: 'WALKING',
        source: ActivitySource.MANUAL,
        notes: notesInput || undefined,
        dateString: activePeriod.startDate,
      });

      setManualModalVisible(false);
      setStepsInput('');
      setNotesInput('');
      loadData();

      const dayName = activePeriod.title;
      if (Platform.OS === 'web') {
        window.alert(`Logged ${steps.toLocaleString()} steps for ${dayName}!`);
      } else {
        Alert.alert('Steps Logged', `Successfully logged ${steps.toLocaleString()} steps for ${dayName}.`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to record steps';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSubmittingManual(false);
    }
  };

  // Compute Active Metrics
  const isDayMode = filterMode === 'DAY';
  const totalSteps = isDayMode ? todaySummary?.totalSteps || 0 : rangeSummary?.totalSteps || 0;
  const stepGoal = isDayMode ? todaySummary?.stepGoal || 8000 : rangeSummary?.stepGoal || 8000;
  const daysCount = isDayMode ? 1 : rangeSummary?.daysCount || 1;
  const periodGoal = isDayMode ? stepGoal : stepGoal * daysCount;
  const progressRatio = Math.min(totalSteps / (periodGoal || 1), 1);
  const progressPercent = Math.round(progressRatio * 100);

  const totalDistance = isDayMode
    ? todaySummary?.totalDistanceKm || 0
    : rangeSummary?.totalDistanceKm || 0;
  const totalActiveMinutes = isDayMode
    ? todaySummary?.totalActiveMinutes || 0
    : rangeSummary?.totalActiveMinutes || 0;
  const totalCalories = isDayMode
    ? todaySummary?.totalCalories || 0
    : rangeSummary?.totalCalories || 0;
  const avgDailySteps = isDayMode ? totalSteps : rangeSummary?.avgDailySteps || 0;

  // Records List
  const recordsList: IActivityRecord[] = isDayMode
    ? todaySummary?.records || []
    : rangeSummary?.records || [];

  // Generate Calendar Days for Modal Grid
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(calViewYear, calViewMonth, 1).getDay(); // 0 is Sun
    const totalDays = new Date(calViewYear, calViewMonth + 1, 0).getDate();

    const cells: Array<{ dayNumber: number | null; dateStr: string }> = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dayNumber: null, dateStr: '' });
    }
    for (let d = 1; d <= totalDays; d++) {
      const mPad = String(calViewMonth + 1).padStart(2, '0');
      const dPad = String(d).padStart(2, '0');
      cells.push({
        dayNumber: d,
        dateStr: `${calViewYear}-${mPad}-${dPad}`,
      });
    }
    return cells;
  }, [calViewYear, calViewMonth]);

  const calMonthTitle = new Date(calViewYear, calViewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <AppHeader title="Activity & Steps" showBack onBackPress={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Filter Segmented Control Tabs */}
        <View style={styles.filterPillsRow}>
          {(['DAY', 'WEEK', 'MONTH', 'YEAR', 'CUSTOM'] as FilterMode[]).map((mode) => {
            const isActive = filterMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => {
                  setFilterMode(mode);
                  if (mode === 'CUSTOM') {
                    openCalendarModal();
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {mode === 'DAY'
                    ? 'Day'
                    : mode === 'WEEK'
                    ? 'Week'
                    : mode === 'MONTH'
                    ? 'Month'
                    : mode === 'YEAR'
                    ? 'Year'
                    : 'Custom'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching step analytics...</Text>
          </View>
        ) : (
          <>
            {/* Interactive Period Nav Card */}
            <View style={styles.dateNavCard}>
              <TouchableOpacity
                style={styles.dateNavArrowBtn}
                onPress={handlePrevPeriod}
                activeOpacity={0.7}
              >
                <ChevronLeft size={20} color="#064E3B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateNavCenter}
                onPress={openCalendarModal}
                activeOpacity={0.8}
              >
                <View style={styles.dateNavTitleRow}>
                  <CalendarIcon size={15} color="#064E3B" style={{ marginRight: 6 }} />
                  <Text style={styles.dateNavTitleText}>{activePeriod.title}</Text>
                  {!activePeriod.isCurrent && (
                    <View style={styles.pastDateTag}>
                      <Text style={styles.pastDateTagText}>History</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dateNavSubtitleText}>{activePeriod.subtitle}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dateNavArrowBtn,
                  activePeriod.isCurrent && styles.dateNavArrowDisabled,
                ]}
                onPress={handleNextPeriod}
                disabled={activePeriod.isCurrent}
                activeOpacity={0.7}
              >
                <ChevronRight
                  size={20}
                  color={activePeriod.isCurrent ? '#CBD5E1' : '#064E3B'}
                />
              </TouchableOpacity>
            </View>

            {/* Jump to Today / Current Period Notice */}
            {!activePeriod.isCurrent && (
              <View style={styles.historyNoticeBanner}>
                <View style={styles.historyNoticeLeft}>
                  <RotateCcw size={14} color="#0284C7" />
                  <Text style={styles.historyNoticeText}>
                    Viewing history for {activePeriod.title}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.backToTodayBtn}
                  onPress={handleGoToday}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backToTodayText}>Back to Today →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step Hero Summary Card */}
            <View style={styles.stepCard}>
              <View style={styles.stepCardHeader}>
                <View style={styles.iconCircleBlue}>
                  <Footprints size={22} color="#0EA5E9" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepCardTitle}>
                    {isDayMode
                      ? activePeriod.isCurrent
                        ? 'Daily Step Count'
                        : `Step Count • ${activePeriod.title}`
                      : `${activePeriod.title} Steps`}
                  </Text>
                  <Text style={styles.stepCardSubtitle}>
                    {isDayMode
                      ? `Goal: ${stepGoal.toLocaleString()} steps`
                      : `Daily Avg: ${avgDailySteps.toLocaleString()} steps • ${daysCount} Days`}
                  </Text>
                </View>
                <View style={styles.progressPercentBadge}>
                  <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                </View>
              </View>

              {/* Big Step Hero Value */}
              <View style={styles.stepHeroRow}>
                <Text style={styles.stepHeroValue}>{totalSteps.toLocaleString()}</Text>
                <Text style={styles.stepHeroUnit}>steps</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>

              {/* Metric Breakdown Grid */}
              <View style={styles.metricGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Distance</Text>
                  <Text style={[styles.metricValue, { color: '#0EA5E9' }]}>
                    {totalDistance} km
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Active Time</Text>
                  <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>
                    {totalActiveMinutes} min
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Calories</Text>
                  <Text style={[styles.metricValue, { color: '#F97316' }]}>
                    {totalCalories} kcal
                  </Text>
                </View>
                {!isDayMode && (
                  <>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricLabel}>Daily Avg</Text>
                      <Text style={[styles.metricValue, { color: '#10B981' }]}>
                        {avgDailySteps.toLocaleString()}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Live Workout Launcher Banner */}
            {activeSession ? (
              <TouchableOpacity
                style={styles.activeWorkoutBanner}
                onPress={() => router.push('/(protected)/activity/tracker')}
                activeOpacity={0.88}
              >
                <View style={styles.activeWorkoutIconCircle}>
                  <Footprints size={22} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.liveBadgeRow}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.liveActiveBadgeText}>WORKOUT IN PROGRESS</Text>
                  </View>
                  <Text style={styles.activeWorkoutTitle}>
                    {activeSession.steps.toLocaleString()} steps tracked
                  </Text>
                  <Text style={styles.activeWorkoutSubtitle}>
                    Status: {activeSession.status} • Tap to view live workout
                  </Text>
                </View>
                <View style={styles.resumeWorkoutBtn}>
                  <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.resumeWorkoutBtnText}>Resume</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.liveWorkoutBanner}
                onPress={() => router.push('/(protected)/activity/tracker')}
                activeOpacity={0.88}
              >
                <View style={styles.liveWorkoutIconCircle}>
                  <Footprints size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.liveBadgeRow}>
                    <View style={styles.livePill}>
                      <Zap size={10} color="#34D399" />
                      <Text style={styles.liveBadgeText}>REAL-TIME HARDWARE SENSOR</Text>
                    </View>
                  </View>
                  <Text style={styles.liveWorkoutTitle}>Start Live Walking Workout</Text>
                  <Text style={styles.liveWorkoutSubtitle}>
                    Continuous hardware tracking • Screen-locked background mode
                  </Text>
                </View>
                <View style={styles.liveWorkoutStartBtn}>
                  <Play size={16} color="#064E3B" fill="#064E3B" />
                </View>
              </TouchableOpacity>
            )}

            {/* Quick Actions Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.addStepsButton}
                onPress={() => setManualModalVisible(true)}
                activeOpacity={0.8}
              >
                <Plus size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.addStepsButtonText}>Log Steps Manually</Text>
              </TouchableOpacity>
            </View>

            {/* Breakdown & Trends Chart Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {isDayMode
                  ? '7-Day Activity Trends'
                  : filterMode === 'WEEK'
                  ? 'Daily Breakdown • This Week'
                  : filterMode === 'MONTH'
                  ? 'Daily Breakdown • This Month'
                  : filterMode === 'YEAR'
                  ? 'Monthly Breakdown • 12 Months'
                  : `Period Breakdown • ${daysCount} Days`}
              </Text>
              <Text style={styles.sectionHint}>
                {isDayMode ? 'Tap day to select' : `${daysCount} segments`}
              </Text>
            </View>

            <View style={styles.weeklyCard}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.weeklyBarsRow,
                  (isDayMode || filterMode === 'WEEK') && { justifyContent: 'space-between', width: '100%' },
                ]}
              >
                {isDayMode
                  ? weeklyTrends?.history.map((day, idx) => {
                      const isSelected = day.date === selectedDay;
                      const isDayToday = day.date === todayStr;
                      const dayName = new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'narrow',
                      });
                      const barHeight = Math.min(Math.round((day.steps / (stepGoal || 1)) * 100), 100);

                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.dayBarCol, isSelected && styles.dayBarColSelected]}
                          onPress={() => setSelectedDay(day.date)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.barTrack, isSelected && styles.barTrackSelected]}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  height: `${Math.max(barHeight, 6)}%`,
                                  backgroundColor: isSelected
                                    ? '#0284C7'
                                    : day.goalReached
                                    ? '#16A34A'
                                    : '#0EA5E9',
                                },
                              ]}
                            />
                          </View>
                          <Text
                            style={[
                              styles.dayBarLabel,
                              isSelected && styles.dayBarLabelSelected,
                              isDayToday && styles.todayBarLabel,
                            ]}
                          >
                            {dayName}
                          </Text>
                          {isSelected && <View style={styles.selectedDayIndicatorDot} />}
                        </TouchableOpacity>
                      );
                    })
                  : rangeSummary?.dailyBreakdown.map((item, idx) => {
                      const maxSteps = Math.max(
                        ...rangeSummary.dailyBreakdown.map((b) => b.steps),
                        item.goal,
                        1
                      );
                      const barHeight = Math.min(Math.round((item.steps / maxSteps) * 100), 100);

                      return (
                        <View key={idx} style={styles.dayBarCol}>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  height: `${Math.max(barHeight, 6)}%`,
                                  backgroundColor: item.goalReached ? '#16A34A' : '#0EA5E9',
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.dayBarLabel}>{item.label}</Text>
                        </View>
                      );
                    })}
              </ScrollView>

              <View style={styles.weeklySummaryRow}>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatLabel}>Daily Average</Text>
                  <Text style={styles.weeklyStatValue}>
                    {avgDailySteps.toLocaleString()} steps
                  </Text>
                </View>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatLabel}>Total Period Steps</Text>
                  <Text style={styles.weeklyStatValue}>
                    {totalSteps.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Activity Sessions List */}
            <Text style={styles.sectionTitle}>
              {isDayMode
                ? activePeriod.isCurrent
                  ? "Today's Activity Sessions"
                  : `Activity Sessions • ${activePeriod.title}`
                : `Activity Sessions • ${activePeriod.title}`}
            </Text>

            {recordsList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Footprints size={36} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>No activity recorded in this period</Text>
                <Text style={styles.emptySubtitle}>
                  {activePeriod.isCurrent
                    ? 'Tap "Log Steps Manually" above or start a live walking workout.'
                    : `No recorded walking sessions found between ${activePeriod.startDate} and ${activePeriod.endDate}.`}
                </Text>
              </View>
            ) : (
              <View style={styles.recordsList}>
                {recordsList.map((rec) => {
                  const recTime = new Date(rec.recordedAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  });
                  return (
                    <View key={rec._id} style={styles.recordItem}>
                      <View style={styles.recordLeft}>
                        <Text style={styles.recordTitle}>
                          {rec.steps.toLocaleString()} steps
                        </Text>
                        <Text style={styles.recordMeta}>
                          {rec.dateString} • {recTime} • {rec.distanceKm} km • {rec.activeDurationMinutes} min • {rec.source}
                        </Text>
                      </View>
                      <View style={styles.recordRight}>
                        <Text style={styles.recordCals}>{rec.estimatedCalories} kcal</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Interactive Calendar & Date Range Filter Modal */}
      <Modal
        visible={calendarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Calendar & Date Filter</Text>
                <Text style={styles.modalSubtitle}>
                  Filter by Single Day, Full Week, or Custom Range
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCalendarModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Selection Mode Pills */}
            <View style={styles.calModeRow}>
              {(['DAY', 'WEEK', 'RANGE'] as CalendarSelectionMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.calModePill, calendarMode === mode && styles.calModePillActive]}
                  onPress={() => setCalendarMode(mode)}
                >
                  <Text
                    style={[
                      styles.calModePillText,
                      calendarMode === mode && styles.calModePillTextActive,
                    ]}
                  >
                    {mode === 'DAY'
                      ? 'Single Day'
                      : mode === 'WEEK'
                      ? 'Select Week'
                      : 'Custom Range'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Fast Presets Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calPresetsRow}
            >
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleCalendarPreset('TODAY')}
              >
                <Text style={styles.presetChipText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleCalendarPreset('YESTERDAY')}
              >
                <Text style={styles.presetChipText}>Yesterday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleCalendarPreset('THIS_WEEK')}
              >
                <Text style={styles.presetChipText}>This Week</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleCalendarPreset('LAST_7')}
              >
                <Text style={styles.presetChipText}>Last 7 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleCalendarPreset('THIS_MONTH')}
              >
                <Text style={styles.presetChipText}>This Month</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleCalendarPreset('THIS_YEAR')}
              >
                <Text style={styles.presetChipText}>This Year</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Range Preview Box */}
            <View style={styles.rangePreviewBox}>
              <View style={styles.rangePreviewItem}>
                <Text style={styles.rangePreviewLabel}>Start Date</Text>
                <Text style={styles.rangePreviewDate}>{calStart || 'Select'}</Text>
              </View>
              <ArrowRight size={18} color="#064E3B" />
              <View style={styles.rangePreviewItem}>
                <Text style={styles.rangePreviewLabel}>End Date</Text>
                <Text style={styles.rangePreviewDate}>{calEnd || calStart || 'Select'}</Text>
              </View>
            </View>

            {/* Month Switcher Header */}
            <View style={styles.calMonthNavRow}>
              <TouchableOpacity onPress={handlePrevCalMonth} style={styles.calMonthNavBtn}>
                <ChevronLeft size={18} color="#064E3B" />
              </TouchableOpacity>
              <Text style={styles.calMonthNavTitle}>{calMonthTitle}</Text>
              <TouchableOpacity onPress={handleNextCalMonth} style={styles.calMonthNavBtn}>
                <ChevronRight size={18} color="#064E3B" />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={styles.calWeekdaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w, idx) => (
                <Text key={idx} style={styles.calWeekdayText}>
                  {w}
                </Text>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.calGrid}>
              {calendarGrid.map((cell, idx) => {
                if (!cell.dayNumber) {
                  return <View key={idx} style={styles.calEmptyCell} />;
                }

                const dStr = cell.dateStr;
                const isFuture = dStr > todayStr;
                const isSelectedStart = dStr === calStart;
                const isSelectedEnd = dStr === (calEnd || calStart);
                const isInRange =
                  calStart && calEnd && dStr > calStart && dStr < calEnd;
                const isDayToday = dStr === todayStr;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.calDayCell,
                      isInRange && styles.calDayInRange,
                      isSelectedStart && styles.calDaySelectedStart,
                      isSelectedEnd && styles.calDaySelectedEnd,
                    ]}
                    onPress={() => handleCalendarDayPress(dStr)}
                    disabled={isFuture}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        isFuture && styles.calDayTextDisabled,
                        (isSelectedStart || isSelectedEnd) && styles.calDayTextSelected,
                        isInRange && styles.calDayTextInRange,
                      ]}
                    >
                      {cell.dayNumber}
                    </Text>
                    {isDayToday && !isSelectedStart && !isSelectedEnd && (
                      <View style={styles.calTodayDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.calModalActionsRow}>
              <TouchableOpacity
                style={styles.calCancelBtn}
                onPress={() => setCalendarModalVisible(false)}
              >
                <Text style={styles.calCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calApplyBtn}
                onPress={handleApplyCalendar}
                activeOpacity={0.8}
              >
                <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.calApplyBtnText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manual Step Entry Modal */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setManualModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.manualModalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Record Activity</Text>
                <Text style={styles.modalSubtitle}>
                  Enter steps for {activePeriod.title}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Step Count</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder="e.g. 3500"
                value={stepsInput}
                onChangeText={setStepsInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Morning park walk"
                value={notesInput}
                onChangeText={setNotesInput}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submittingManual && styles.buttonDisabled]}
              onPress={handleAddManualSteps}
              disabled={submittingManual}
              activeOpacity={0.8}
            >
              {submittingManual ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Save Steps</Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  // Segmented Control Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 4,
    borderRadius: 14,
    marginBottom: 12,
    gap: 4,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#064E3B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  // Date Nav Filter Bar
  dateNavCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dateNavArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  dateNavArrowDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  dateNavCenter: {
    alignItems: 'center',
    flex: 1,
  },
  dateNavTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064E3B',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  pastDateTag: {
    marginLeft: 8,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pastDateTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  dateNavSubtitleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  historyNoticeBanner: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  historyNoticeText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  backToTodayBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#0284C7',
    borderRadius: 8,
  },
  backToTodayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircleBlue: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  stepCardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressPercentBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressPercentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0EA5E9',
  },
  stepHeroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  stepHeroValue: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  stepHeroUnit: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
    borderRadius: 8,
  },
  metricGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  liveWorkoutBanner: {
    backgroundColor: '#064E3B',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  liveWorkoutIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  liveActiveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  liveWorkoutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  liveWorkoutSubtitle: {
    fontSize: 11,
    color: '#A7F3D0',
    marginTop: 2,
    lineHeight: 15,
  },
  liveWorkoutStartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34D399',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  activeWorkoutBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeWorkoutIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  activeWorkoutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  activeWorkoutSubtitle: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  resumeWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  resumeWorkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  actionRow: {
    marginBottom: 20,
  },
  addStepsButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStepsButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  sectionHint: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  weeklyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  weeklyBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 120,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
    gap: 8,
  },
  dayBarCol: {
    alignItems: 'center',
    minWidth: 32,
    height: '100%',
    justifyContent: 'flex-end',
  },
  dayBarColSelected: {
    transform: [{ scale: 1.05 }],
  },
  barTrack: {
    width: 16,
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barTrackSelected: {
    borderWidth: 2,
    borderColor: '#0284C7',
    backgroundColor: '#E0F2FE',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  dayBarLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '600',
  },
  dayBarLabelSelected: {
    color: '#0284C7',
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  todayBarLabel: {
    color: '#064E3B',
    fontWeight: '800',
  },
  selectedDayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0284C7',
    marginTop: 3,
  },
  weeklySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyStat: {
    flex: 1,
  },
  weeklyStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  weeklyStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  recordsList: {
    gap: 10,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recordLeft: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recordMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordCals: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F97316',
  },
  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  closeModalBtn: {
    padding: 4,
  },
  // Calendar Modal Sheet
  calendarModalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  modalSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  calModeRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 12,
    marginBottom: 12,
  },
  calModePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calModePillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  calModePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  calModePillTextActive: {
    color: '#064E3B',
    fontWeight: '800',
  },
  calPresetsRow: {
    gap: 6,
    paddingBottom: 10,
    marginBottom: 4,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  rangePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
  },
  rangePreviewItem: {
    alignItems: 'center',
  },
  rangePreviewLabel: {
    fontSize: 9,
    color: '#15803D',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rangePreviewDate: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B',
    marginTop: 1,
  },
  calMonthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  calMonthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthNavTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#064E3B',
  },
  calWeekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    paddingVertical: 4,
  },
  calWeekdayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  calEmptyCell: {
    width: 36,
    height: 36,
    marginVertical: 2,
  },
  calDayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  calDayInRange: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
  },
  calDaySelectedStart: {
    backgroundColor: '#064E3B',
    borderRadius: 18,
  },
  calDaySelectedEnd: {
    backgroundColor: '#064E3B',
    borderRadius: 18,
  },
  calDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  calDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calDayTextInRange: {
    color: '#064E3B',
    fontWeight: '700',
  },
  calDayTextDisabled: {
    color: '#CBD5E1',
  },
  calTodayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#064E3B',
    position: 'absolute',
    bottom: 3,
  },
  calModalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  calCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  calApplyBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#064E3B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calApplyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Manual Step Sheet
  manualModalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
