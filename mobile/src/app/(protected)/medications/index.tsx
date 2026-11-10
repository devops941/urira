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
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Pill,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  X,
  Bell,
  BellRing,
  TrendingUp,
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { AppHeader } from '../../../components/common/AppHeader';
import { PeriodFilterBar, FilterMode } from '../../../components/common/PeriodFilterBar';
import { InteractiveCalendarModal } from '../../../components/common/InteractiveCalendarModal';
import { medicationService } from '../../../services/wellness/medicationService';
import { medicationAlarmService } from '../../../services/notifications/medicationAlarmService';
import {
  MedicationDto,
  TodayDoseItemDto,
  IMedicationRangeSummary,
  MedicationType,
  MedicationFrequency,
  FoodInstruction,
} from '../../../types/wellness';
import { colors } from '../../../theme/colors';

const MED_COLOR = '#12372A';
const MED_GREEN = '#16A34A';
const MED_BG_LIGHT = '#E8F3EC';
const MED_BORDER = '#C7E2D1';

const FORM_TYPES: { type: MedicationType; label: string }[] = [
  { type: MedicationType.TABLET, label: 'Tablet' },
  { type: MedicationType.CAPSULE, label: 'Capsule' },
  { type: MedicationType.SYRUP, label: 'Syrup' },
  { type: MedicationType.DROPS, label: 'Drops' },
  { type: MedicationType.INJECTION, label: 'Injection' },
  { type: MedicationType.OTHER, label: 'Other' },
];

const INSTRUCTIONS: { instruction: FoodInstruction; label: string }[] = [
  { instruction: 'AFTER_FOOD', label: 'After Food' },
  { instruction: 'BEFORE_FOOD', label: 'Before Food' },
  { instruction: 'WITH_FOOD', label: 'With Food' },
  { instruction: 'ANYTIME', label: 'Anytime' },
];

interface ActiveAlarmState {
  medicationId: string;
  name: string;
  dosage?: string;
  foodInstruction?: string;
  scheduledTime: string;
  isAlarm: boolean;
}

export const formatTo12Hour = (time24: string): string => {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const hour = parseInt(parts[0], 10);
  const min = parts[1].padStart(2, '0');
  if (isNaN(hour)) return time24;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12.toString().padStart(2, '0')}:${min} ${ampm}`;
};

export const formatDateTo24Hour = (date: Date): string => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

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

export default function MedicationsScreen() {
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
  const [todayDoses, setTodayDoses] = useState<TodayDoseItemDto[]>([]);
  const [activeMeds, setActiveMeds] = useState<MedicationDto[]>([]);
  const [rangeSummary, setRangeSummary] = useState<IMedicationRangeSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add Medication Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [formType, setFormType] = useState<MedicationType>(MedicationType.TABLET);
  const [frequency, setFrequency] = useState<MedicationFrequency>('ONCE_DAILY');
  const [instruction, setInstruction] = useState<FoodInstruction>('AFTER_FOOD');
  const [scheduledTimes, setScheduledTimes] = useState<string[]>(['09:00']);
  const [alarmEnabled, setAlarmEnabled] = useState(false);

  // DateTimePicker State
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());

  // Active Alarm / Notification Trigger State
  const [activeAlarmDose, setActiveAlarmDose] = useState<ActiveAlarmState | null>(null);

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
      const meds = await medicationService.getMedications();
      setActiveMeds(meds);

      if (filterMode === 'DAY') {
        const doses = await medicationService.getTodayDoses();
        setTodayDoses(doses);
        setRangeSummary(null);
      } else {
        const rngRes = await medicationService.getRangeSummary(activePeriod.startDate, activePeriod.endDate);
        setRangeSummary(rngRes);
      }
    } catch (err: any) {
      console.warn('Failed to load medication data:', err.message);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterMode, activePeriod.startDate, activePeriod.endDate]);

  useEffect(() => {
    loadData();

    // Initialize notification channels & permissions
    medicationAlarmService.init();

    let notifListener: any = null;
    let responseListener: any = null;

    try {
      notifListener = Notifications.addNotificationReceivedListener((notification) => {
        const data: any = notification.request.content.data;
        if (data?.type === 'MEDICATION_REMINDER') {
          if (data?.isAlarm) {
            medicationAlarmService.playAlarmSound();
          }
          setActiveAlarmDose({
            medicationId: data.medicationId,
            name: data.name || notification.request.content.title || 'Medication',
            dosage: data.dosage,
            foodInstruction: data.foodInstruction,
            scheduledTime: data.scheduledTime || 'Now',
            isAlarm: !!data.isAlarm,
          });
        }
      });

      responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        const data: any = response.notification.request.content.data;
        if (data?.type === 'MEDICATION_REMINDER') {
          if (data?.isAlarm) {
            medicationAlarmService.playAlarmSound();
          }
          setActiveAlarmDose({
            medicationId: data.medicationId,
            name: data.name || response.notification.request.content.title || 'Medication',
            dosage: data.dosage,
            foodInstruction: data.foodInstruction,
            scheduledTime: data.scheduledTime || 'Now',
            isAlarm: !!data.isAlarm,
          });
        }
      });
    } catch (err: any) {
      console.warn('Notification listener error:', err?.message);
    }

    return () => {
      notifListener?.remove();
      responseListener?.remove();
      medicationAlarmService.stopAlarmSound();
    };
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

  const handleLogStatus = async (medicationId: string, scheduledTime: string, status: 'TAKEN' | 'SKIPPED') => {
    try {
      await medicationService.recordDoseEvent(medicationId, {
        scheduledTime,
        status,
      });
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record dose action');
    }
  };

  const handleTimePickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      const time24 = formatDateTo24Hour(selectedDate);
      if (!scheduledTimes.includes(time24)) {
        setScheduledTimes((prev) => [...prev, time24].sort());
      } else {
        Alert.alert('Notice', `Time ${formatTo12Hour(time24)} is already added.`);
      }
      setPickerDate(selectedDate);
    }
  };

  const handleTogglePresetTime = (preset24: string) => {
    if (scheduledTimes.includes(preset24)) {
      if (scheduledTimes.length <= 1) {
        Alert.alert('Required Time', 'At least one scheduled dose time is required.');
        return;
      }
      setScheduledTimes((prev) => prev.filter((t) => t !== preset24));
    } else {
      setScheduledTimes((prev) => [...prev, preset24].sort());
    }
  };

  const handleRemoveTime = (timeToRemove: string) => {
    if (scheduledTimes.length <= 1) {
      Alert.alert('Required Time', 'At least one scheduled dose time is required.');
      return;
    }
    setScheduledTimes((prev) => prev.filter((t) => t !== timeToRemove));
  };

  const performSave = async (shouldSetAlarm: boolean, times: string[]) => {
    try {
      setSubmitting(true);
      const createdMed = await medicationService.createMedication({
        name: medName.trim(),
        dosage: dosage.trim(),
        formType,
        frequency,
        scheduledTimes: times,
        foodInstruction: instruction,
        startDate: new Date().toISOString().split('T')[0],
        reminderEnabled: true,
        alarmEnabled: shouldSetAlarm,
      });

      const medId = (createdMed as any)?._id || (createdMed as any)?.id || Math.random().toString();
      await medicationAlarmService.scheduleMedicationDoses({
        id: medId,
        name: medName.trim(),
        dosage: dosage.trim(),
        foodInstruction: instruction,
        scheduledTimes: times,
        alarmEnabled: shouldSetAlarm,
      });

      setShowAddModal(false);
      setMedName('');
      setDosage('');
      setScheduledTimes(['09:00']);
      setAlarmEnabled(false);
      await loadData();

      const readableTimes = times.map(formatTo12Hour).join(', ');
      Alert.alert(
        'Medication Scheduled',
        shouldSetAlarm
          ? `⏰ Loud Alarm & Popup Notification set for ${readableTimes}.`
          : `🔔 Popup Notification scheduled for ${readableTimes}.`
      );
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.[0]?.message ||
        err?.message ||
        'Failed to add medication schedule.';
      Alert.alert('Cannot Save Medication', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMedication = async () => {
    if (!medName.trim()) {
      Alert.alert('Required Field', 'Please enter the medication name');
      return;
    }
    if (!dosage.trim()) {
      Alert.alert('Required Field', 'Please enter dosage (e.g. 500mg, 1 tablet)');
      return;
    }

    if (scheduledTimes.length === 0) {
      Alert.alert('Required Time', 'Please select at least one scheduled time');
      return;
    }

    const times = scheduledTimes;
    const readableTimes = times.map(formatTo12Hour).join(', ');

    if (!alarmEnabled) {
      Alert.alert(
        'Set Alarm? (அலாரம் செட் பண்ணவா?)',
        `Would you like to set a ringing alarm for ${medName.trim()} at ${readableTimes}?`,
        [
          { text: 'Notification Only 🔔', onPress: () => performSave(false, times) },
          { text: 'Yes, Set Alarm ⏰', onPress: () => performSave(true, times) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      await performSave(true, times);
    }
  };

  const handleDeleteMedication = async (id: string, name: string) => {
    Alert.alert('Delete Medication', `Are you sure you want to stop tracking ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await medicationService.deleteMedication(id);
            await medicationAlarmService.cancelMedicationDoses(id);
            await loadData();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete medication');
          }
        },
      },
    ]);
  };

  const handleTestAlarm = async () => {
    await medicationAlarmService.init();
    Alert.alert(
      'Test Alert Initiated',
      'A test medication popup notification & alarm will trigger in 3 seconds. Watch for the popup!',
      [{ text: 'OK' }]
    );

    setTimeout(async () => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ ALARM: Time for Paracetamol',
          body: 'Take 500 mg (After Food) scheduled now. Tap to record or snooze.',
          sound: 'alaram.wav',
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: {
            type: 'MEDICATION_REMINDER',
            medicationId: 'test_demo_id',
            name: 'Paracetamol',
            dosage: '500 mg',
            foodInstruction: 'After Food',
            scheduledTime: 'Now',
            isAlarm: true,
          },
        },
        trigger: {
          channelId: 'medication-alarms',
        },
      });
    }, 3000);
  };

  // Metrics computation
  const isDayMode = filterMode === 'DAY';
  const totalDosesToday = todayDoses.length;
  const takenDosesToday = todayDoses.filter((d) => d.status === 'TAKEN').length;
  const skippedDosesToday = todayDoses.filter((d) => d.status === 'SKIPPED').length;
  const adherencePct = isDayMode
    ? (totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 100)
    : (rangeSummary?.adherenceRate || 100);

  return (
    <View style={styles.container}>
      <AppHeader title="Medication Schedule" showBack onBackPress={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
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
          accentColor={colors.primary}
          accentLightBg={MED_BG_LIGHT}
          accentBorder={MED_BORDER}
        />

        {/* Adherence Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Pill size={24} color={colors.primary} />
            </View>
            <View style={styles.heroHeaderText}>
              <Text style={styles.heroTitle}>
                {isDayMode ? `${activePeriod.title}'s Adherence` : 'Period Adherence'}
              </Text>
              <Text style={styles.heroSubtitle}>
                {isDayMode
                  ? `${takenDosesToday} of ${totalDosesToday} doses taken`
                  : `${rangeSummary?.takenCount || 0} of ${rangeSummary?.totalDoses || 0} total doses taken`}
              </Text>
            </View>
            <View style={styles.adherenceBadge}>
              <Text style={styles.adherenceBadgeText}>{adherencePct}%</Text>
            </View>
          </View>

          {/* Linear Progress */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${adherencePct}%` }]} />
          </View>

          {/* Summary Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Taken</Text>
              <Text style={[styles.statValue, { color: MED_GREEN }]}>
                {isDayMode ? takenDosesToday : (rangeSummary?.takenCount || 0)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Skipped</Text>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>
                {isDayMode ? skippedDosesToday : (rangeSummary?.skippedCount || 0)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Scheduled</Text>
              <Text style={styles.statValue}>
                {isDayMode ? totalDosesToday : (rangeSummary?.totalDoses || 0)}
              </Text>
            </View>
          </View>

          {isDayMode && (
            <TouchableOpacity
              style={styles.testAlarmBtn}
              onPress={handleTestAlarm}
              activeOpacity={0.7}
            >
              <BellRing size={14} color={colors.primary} />
              <Text style={styles.testAlarmBtnText}>Test Popup Notification & Alarm (3s)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Button: Add Medication */}
        <TouchableOpacity
          style={styles.addActionBtn}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addActionBtnText}>Add New Medication</Text>
        </TouchableOpacity>

        {/* Daily Adherence Trend Chart (For Week/Month/Year/Custom) */}
        {!isDayMode && rangeSummary?.dailyBreakdown && rangeSummary.dailyBreakdown.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <TrendingUp size={18} color={colors.primary} />
              <Text style={styles.chartTitle}>Daily Adherence Breakdown</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
              <View style={styles.chartContainer}>
                {rangeSummary.dailyBreakdown.map((item, idx) => {
                  const rate = item.adherenceRate || 0;
                  return (
                    <View key={item.date || idx} style={styles.barCol}>
                      <Text style={styles.barValueText}>{item.totalScheduled > 0 ? `${rate}%` : ''}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${Math.max(8, rate)}%` },
                            rate >= 80 && { backgroundColor: MED_GREEN },
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

        {/* Day Mode Checklist */}
        {isDayMode && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{activePeriod.title}'s Doses ({todayDoses.length})</Text>
            </View>

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : todayDoses.length === 0 ? (
              <View style={styles.emptyCard}>
                <Pill size={36} color={colors.secondaryText} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyTitle}>No medications scheduled for {activePeriod.title.toLowerCase()}</Text>
                <Text style={styles.emptySubtitle}>Tap "Add New Medication" to register your prescription plan.</Text>
              </View>
            ) : (
              <View style={styles.doseList}>
                {todayDoses.map((dose, idx) => {
                  const isTaken = dose.status === 'TAKEN';
                  const isSkipped = dose.status === 'SKIPPED';
                  const parentMed = activeMeds.find((m) => (m._id || m.id) === dose.medicationId);
                  const hasAlarm = dose.alarmEnabled ?? parentMed?.alarmEnabled ?? false;

                  return (
                    <View key={`${dose.medicationId}-${dose.scheduledTime}-${idx}`} style={styles.doseCard}>
                      <View style={styles.doseLeft}>
                        <View
                          style={[
                            styles.doseStatusIcon,
                            isTaken && { backgroundColor: '#DCFCE7' },
                            isSkipped && { backgroundColor: '#FEE2E2' },
                          ]}
                        >
                          <Pill size={20} color={isTaken ? MED_GREEN : isSkipped ? '#EF4444' : colors.primary} />
                        </View>
                        <View style={styles.doseInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.medNameText}>{dose.name}</Text>
                            {hasAlarm && (
                              <View style={styles.alarmBadgeSmall}>
                                <BellRing size={11} color="#EF4444" />
                                <Text style={styles.alarmBadgeSmallText}>Alarm</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.medDosageText}>
                            {dose.strength || dose.dosage} • {(dose.foodInstruction || dose.instructions || 'Anytime').replace('_', ' ')}
                          </Text>
                          <View style={styles.timeTag}>
                            <Clock size={12} color={colors.secondaryText} />
                            <Text style={styles.timeTagText}>{formatTo12Hour(dose.scheduledTime)}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={styles.doseActions}>
                        {isTaken ? (
                          <View style={styles.statusDoneBadge}>
                            <CheckCircle2 size={16} color={MED_GREEN} />
                            <Text style={styles.statusDoneText}>Taken</Text>
                          </View>
                        ) : isSkipped ? (
                          <View style={styles.statusSkippedBadge}>
                            <XCircle size={16} color="#EF4444" />
                            <Text style={styles.statusSkippedText}>Skipped</Text>
                          </View>
                        ) : (
                          <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                              style={styles.takeBtn}
                              onPress={() => handleLogStatus(dose.medicationId, dose.scheduledTime, 'TAKEN')}
                            >
                              <Text style={styles.takeBtnText}>Take</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.skipBtn}
                              onPress={() => handleLogStatus(dose.medicationId, dose.scheduledTime, 'SKIPPED')}
                            >
                              <Text style={styles.skipBtnText}>Skip</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Active Prescriptions List */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Active Medications ({activeMeds.length})</Text>
        </View>

        <View style={styles.activeMedsList}>
          {activeMeds.map((med) => {
            const medId = med._id || med.id || Math.random().toString();
            return (
              <View key={medId} style={styles.medItemCard}>
                <View style={styles.medItemLeft}>
                  <View style={styles.medTypeBox}>
                    <Text style={styles.medTypeLetter}>{(med.type || 'MED').slice(0, 3)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.medItemName}>{med.name}</Text>
                      {med.alarmEnabled ? (
                        <View style={styles.alarmBadgeSmall}>
                          <BellRing size={10} color="#EF4444" />
                          <Text style={styles.alarmBadgeSmallText}>Alarm On</Text>
                        </View>
                      ) : (
                        <View style={[styles.alarmBadgeSmall, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
                          <Bell size={10} color={colors.secondaryText} />
                          <Text style={[styles.alarmBadgeSmallText, { color: colors.secondaryText }]}>Notif</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.medItemSub}>
                      {med.strength || med.dosage} • {med.frequency.replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.medItemTimes}>
                      Times: {med.scheduledTimes?.map(formatTo12Hour).join(', ') || '09:00 AM'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteMedication(medId, med.name)}
                  style={styles.medDeleteBtn}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Interactive Calendar Modal */}
      <InteractiveCalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        initialStartDate={activePeriod.startDate}
        initialEndDate={activePeriod.endDate}
        initialMode={filterMode === 'DAY' ? 'DAY' : filterMode === 'WEEK' ? 'WEEK' : 'RANGE'}
        onApply={handleApplyCalendar}
        accentColor={colors.primary}
        accentLightBg={MED_BG_LIGHT}
      />

      {/* Add Medication Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medication</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={22} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
              <Text style={styles.inputLabel}>Medication Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Paracetamol, Metformin"
                value={medName}
                onChangeText={setMedName}
                placeholderTextColor={colors.secondaryText}
              />

              <Text style={styles.inputLabel}>Dosage & Strength</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 500 mg, 1 tablet, 5 ml"
                value={dosage}
                onChangeText={setDosage}
                placeholderTextColor={colors.secondaryText}
              />

              <Text style={styles.inputLabel}>Form Type</Text>
              <View style={styles.pillsWrap}>
                {FORM_TYPES.map((f) => (
                  <TouchableOpacity
                    key={f.type}
                    style={[styles.pill, formType === f.type && styles.pillActive]}
                    onPress={() => setFormType(f.type)}
                  >
                    <Text style={[styles.pillText, formType === f.type && styles.pillTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Dose Times Card */}
              <View style={styles.doseScheduleCard}>
                <View style={styles.doseScheduleHeader}>
                  <View style={styles.doseScheduleTitleRow}>
                    <View style={styles.doseIconBadge}>
                      <Clock size={15} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.doseScheduleTitle}>Dose Times (அளவீட்டு நேரம்)</Text>
                      <Text style={styles.doseScheduleSubtitle}>Select dosage times with AM / PM</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.addTimeBtn}
                    onPress={() => {
                      setPickerDate(new Date());
                      setShowTimePicker(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color="#FFFFFF" />
                    <Text style={styles.addTimeBtnText}>Pick Time</Text>
                  </TouchableOpacity>
                </View>

                {/* Selected Times List */}
                <View style={styles.selectedTimesSection}>
                  <Text style={styles.selectedTimesLabel}>Selected Dose Schedule:</Text>
                  <View style={styles.timeChipsWrap}>
                    {scheduledTimes.map((time, idx) => (
                      <View key={`${time}-${idx}`} style={styles.timeChip}>
                        <Clock size={13} color={colors.primary} />
                        <Text style={styles.timeChipText}>{formatTo12Hour(time)}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveTime(time)}
                          style={styles.timeChipClose}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={12} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.doseScheduleDivider} />

                {/* Quick Presets Section */}
                <View style={styles.quickPresetsSection}>
                  <Text style={styles.presetsLabel}>Quick Presets (1-Tap Toggle):</Text>
                  <View style={styles.presetButtonsRow}>
                    {[
                      { time: '09:00', icon: '🌅', label: 'Morning', time12: '09:00 AM' },
                      { time: '13:00', icon: '☀️', label: 'Afternoon', time12: '01:00 PM' },
                      { time: '20:30', icon: '🌙', label: 'Night', time12: '08:30 PM' },
                    ].map((p) => {
                      const isSelected = scheduledTimes.includes(p.time);
                      return (
                        <TouchableOpacity
                          key={p.time}
                          style={[
                            styles.presetChip,
                            isSelected && styles.presetChipActive,
                          ]}
                          onPress={() => handleTogglePresetTime(p.time)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.presetIcon}>{p.icon}</Text>
                          <View style={styles.presetTextCol}>
                            <Text
                              style={[
                                styles.presetChipLabel,
                                isSelected && styles.presetChipLabelActive,
                              ]}
                            >
                              {p.label}
                            </Text>
                            <Text
                              style={[
                                styles.presetChipTime,
                                isSelected && styles.presetChipTimeActive,
                              ]}
                            >
                              {p.time12}
                            </Text>
                          </View>
                          {isSelected && (
                            <View style={styles.presetCheckmark}>
                              <CheckCircle2 size={12} color={colors.primary} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {showTimePicker && (
                <DateTimePicker
                  value={pickerDate}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'android' ? 'default' : 'spinner'}
                  onChange={handleTimePickerChange}
                />
              )}

              <Text style={styles.inputLabel}>Food Instruction</Text>
              <View style={styles.pillsWrap}>
                {INSTRUCTIONS.map((i) => (
                  <TouchableOpacity
                    key={i.instruction}
                    style={[styles.pill, instruction === i.instruction && styles.pillActive]}
                    onPress={() => setInstruction(i.instruction)}
                  >
                    <Text style={[styles.pillText, instruction === i.instruction && styles.pillTextActive]}>
                      {i.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.alarmSwitchRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={[styles.alarmIconBadge, alarmEnabled && styles.alarmIconBadgeActive]}>
                    <BellRing size={20} color={alarmEnabled ? '#EF4444' : colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alarmSwitchTitle}>Set Loud Alarm (ஒலிக்கும் அலாரம்)</Text>
                    <Text style={styles.alarmSwitchSub}>Rings with sound & vibration at dose time</Text>
                  </View>
                </View>
                <Switch
                  value={alarmEnabled}
                  onValueChange={setAlarmEnabled}
                  trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
                  thumbColor={alarmEnabled ? colors.primary : '#F1F5F9'}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddMedication}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Save Medication</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Active Alarm Dialog */}
      <Modal visible={!!activeAlarmDose} transparent animationType="fade">
        <View style={styles.alarmModalOverlay}>
          <View style={styles.alarmModalCard}>
            <View style={styles.alarmHeaderIconBox}>
              <BellRing size={36} color="#DC2626" />
            </View>
            <Text style={styles.alarmModalTitle}>Medication Time!</Text>
            <Text style={styles.alarmModalMedName}>{activeAlarmDose?.name}</Text>
            <Text style={styles.alarmModalDetails}>
              {activeAlarmDose?.dosage} • {activeAlarmDose?.foodInstruction}
            </Text>
            <View style={styles.alarmTimeBadge}>
              <Clock size={14} color="#DC2626" />
              <Text style={styles.alarmTimeBadgeText}>Scheduled: {formatTo12Hour(activeAlarmDose?.scheduledTime || '')}</Text>
            </View>

            <View style={styles.alarmModalActions}>
              <TouchableOpacity
                style={styles.alarmTakeBtn}
                onPress={async () => {
                  if (activeAlarmDose?.medicationId) {
                    await handleLogStatus(activeAlarmDose.medicationId, activeAlarmDose.scheduledTime, 'TAKEN');
                  }
                  medicationAlarmService.stopAlarmSound();
                  setActiveAlarmDose(null);
                }}
              >
                <CheckCircle2 size={18} color="#FFFFFF" />
                <Text style={styles.alarmTakeBtnText}>Take Medicine Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.alarmSnoozeBtn}
                onPress={async () => {
                  if (activeAlarmDose) {
                    const snoozeMinutes = 15;
                    const snoozeDate = new Date(Date.now() + snoozeMinutes * 60 * 1000);
                    const snoozeTimeStr = `${snoozeDate.getHours().toString().padStart(2, '0')}:${snoozeDate.getMinutes().toString().padStart(2, '0')}`;

                    await medicationAlarmService.snoozeDose(
                      {
                        medicationId: activeAlarmDose.medicationId,
                        name: activeAlarmDose.name,
                        dosage: activeAlarmDose.dosage,
                        foodInstruction: activeAlarmDose.foodInstruction,
                        scheduledTime: activeAlarmDose.scheduledTime || snoozeTimeStr,
                      },
                      snoozeMinutes
                    );

                    Alert.alert(
                      'Alarm Snoozed (15 Mins)',
                      `Alarm snoozed for 15 minutes. It will ring again at ${formatTo12Hour(snoozeTimeStr)}.`
                    );
                  }
                  medicationAlarmService.stopAlarmSound();
                  setActiveAlarmDose(null);
                }}
              >
                <Clock size={16} color="#B45309" />
                <Text style={styles.alarmSnoozeBtnText}>Snooze (15 mins)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.alarmDismissBtn}
                onPress={async () => {
                  medicationAlarmService.stopAlarmSound();
                  setActiveAlarmDose(null);
                }}
              >
                <Text style={styles.alarmDismissBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
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
    borderColor: MED_BORDER,
    marginBottom: 16,
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
    backgroundColor: MED_BG_LIGHT,
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
  adherenceBadge: {
    backgroundColor: MED_BG_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MED_BORDER,
  },
  adherenceBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: MED_GREEN,
    borderRadius: 5,
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
  },
  testAlarmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: MED_BG_LIGHT,
    borderWidth: 1,
    borderColor: MED_BORDER,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  testAlarmBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  addActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 14,
    marginBottom: 20,
  },
  addActionBtnText: {
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
    backgroundColor: colors.primary,
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
  doseList: {
    gap: 12,
  },
  doseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  doseStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: MED_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doseInfo: {
    flex: 1,
  },
  medNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
  },
  alarmBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  alarmBadgeSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  medDosageText: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  doseActions: {
    marginLeft: 10,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  takeBtn: {
    backgroundColor: MED_GREEN,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  takeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  skipBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  skipBtnText: {
    color: colors.secondaryText,
    fontSize: 13,
    fontWeight: '600',
  },
  statusDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusDoneText: {
    color: MED_GREEN,
    fontSize: 12,
    fontWeight: '700',
  },
  statusSkippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusSkippedText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  activeMedsList: {
    gap: 10,
    marginBottom: 20,
  },
  medItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  medItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  medTypeBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: MED_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medTypeLetter: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  medItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  medItemSub: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  medItemTimes: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  medDeleteBtn: {
    padding: 6,
  },
  emptyCard: {
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 6,
    marginTop: 10,
  },
  doseScheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  doseScheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  doseScheduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  doseIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: MED_BG_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doseScheduleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  doseScheduleSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addTimeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedTimesSection: {
    marginBottom: 6,
  },
  selectedTimesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  timeChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: MED_BG_LIGHT,
    borderWidth: 1,
    borderColor: MED_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  timeChipClose: {
    marginLeft: 2,
    padding: 2,
  },
  doseScheduleDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  quickPresetsSection: {
    gap: 6,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 8,
    gap: 4,
  },
  presetChipActive: {
    backgroundColor: MED_BG_LIGHT,
    borderColor: MED_GREEN,
  },
  presetIcon: {
    fontSize: 14,
  },
  presetTextCol: {
    flex: 1,
  },
  presetChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  presetChipLabelActive: {
    color: '#12372A',
    fontWeight: '700',
  },
  presetChipTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  presetChipTimeActive: {
    color: MED_GREEN,
  },
  presetCheckmark: {
    marginLeft: 2,
  },
  textInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.primaryText,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: MED_BG_LIGHT,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  pillTextActive: {
    color: colors.primary,
  },
  alarmSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    marginBottom: 4,
  },
  alarmIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: MED_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alarmIconBadgeActive: {
    backgroundColor: '#FEE2E2',
  },
  alarmSwitchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  alarmSwitchSub: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  alarmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alarmModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  alarmHeaderIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  alarmModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 6,
  },
  alarmModalMedName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
  },
  alarmModalDetails: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: 4,
    textAlign: 'center',
  },
  alarmTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 12,
    marginBottom: 20,
  },
  alarmTimeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  alarmModalActions: {
    width: '100%',
    gap: 10,
  },
  alarmTakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: MED_GREEN,
    height: 50,
    borderRadius: 14,
  },
  alarmTakeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  alarmSnoozeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    height: 46,
    borderRadius: 14,
  },
  alarmSnoozeBtnText: {
    color: '#B45309',
    fontSize: 14,
    fontWeight: '700',
  },
  alarmDismissBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  alarmDismissBtnText: {
    color: colors.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
});
