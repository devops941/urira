import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  ArrowRight,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';

export type CalendarSelectionMode = 'DAY' | 'WEEK' | 'RANGE';

interface InteractiveCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  initialStartDate: string;
  initialEndDate: string;
  initialMode?: CalendarSelectionMode;
  onApply: (start: string, end: string, mode: 'DAY' | 'WEEK' | 'CUSTOM') => void;
  accentColor?: string;
  accentLightBg?: string;
}

// Helpers
const toDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseDateString = (str: string): Date => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

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

const getMonthRange = (yearMonthStr: string) => {
  const [y, m] = yearMonthStr.split('-').map(Number);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
};

export const InteractiveCalendarModal: React.FC<InteractiveCalendarModalProps> = ({
  visible,
  onClose,
  initialStartDate,
  initialEndDate,
  initialMode = 'DAY',
  onApply,
  accentColor = '#064E3B',
  accentLightBg = '#DCFCE7',
}) => {
  const todayStr = useMemo(() => toDateString(new Date()), []);

  const [calendarMode, setCalendarMode] = useState<CalendarSelectionMode>(initialMode);
  const [calStart, setCalStart] = useState<string>(initialStartDate || todayStr);
  const [calEnd, setCalEnd] = useState<string>(initialEndDate || initialStartDate || todayStr);

  const anchorDate = useMemo(() => {
    return initialStartDate ? parseDateString(initialStartDate) : new Date();
  }, [initialStartDate]);

  const [calViewYear, setCalViewYear] = useState<number>(anchorDate.getFullYear());
  const [calViewMonth, setCalViewMonth] = useState<number>(anchorDate.getMonth());

  useEffect(() => {
    if (visible) {
      setCalendarMode(initialMode);
      setCalStart(initialStartDate || todayStr);
      setCalEnd(initialEndDate || initialStartDate || todayStr);
      const parsed = initialStartDate ? parseDateString(initialStartDate) : new Date();
      setCalViewYear(parsed.getFullYear());
      setCalViewMonth(parsed.getMonth());
    }
  }, [visible, initialStartDate, initialEndDate, initialMode, todayStr]);

  const handleDayPress = (dStr: string) => {
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

  const handlePreset = (preset: 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_7' | 'THIS_MONTH' | 'THIS_YEAR') => {
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
      setCalViewYear(today.getFullYear());
      setCalViewMonth(today.getMonth());
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

  const handleApply = () => {
    if (calendarMode === 'DAY') {
      onApply(calStart, calStart, 'DAY');
    } else if (calendarMode === 'WEEK') {
      onApply(calStart, calEnd || calStart, 'WEEK');
    } else {
      onApply(calStart, calEnd || calStart, 'CUSTOM');
    }
    onClose();
  };

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
      return;
    }
    if (calViewMonth === 11) {
      setCalViewYear((prev) => prev + 1);
      setCalViewMonth(0);
    } else {
      setCalViewMonth((prev) => prev + 1);
    }
  };

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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Calendar & Date Filter</Text>
              <Text style={styles.subtitle}>
                Filter by Single Day, Full Week, or Custom Range
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Mode Selector */}
          <View style={styles.modeRow}>
            {(['DAY', 'WEEK', 'RANGE'] as CalendarSelectionMode[]).map((mode) => {
              const isActive = calendarMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modePill, isActive && styles.modePillActive]}
                  onPress={() => setCalendarMode(mode)}
                >
                  <Text
                    style={[
                      styles.modePillText,
                      isActive && [styles.modePillTextActive, { color: accentColor }],
                    ]}
                  >
                    {mode === 'DAY'
                      ? 'Single Day'
                      : mode === 'WEEK'
                      ? 'Select Week'
                      : 'Custom Range'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Presets Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsRow}
          >
            <TouchableOpacity style={styles.chip} onPress={() => handlePreset('TODAY')}>
              <Text style={styles.chipText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handlePreset('YESTERDAY')}>
              <Text style={styles.chipText}>Yesterday</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handlePreset('THIS_WEEK')}>
              <Text style={styles.chipText}>This Week</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handlePreset('LAST_7')}>
              <Text style={styles.chipText}>Last 7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handlePreset('THIS_MONTH')}>
              <Text style={styles.chipText}>This Month</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip} onPress={() => handlePreset('THIS_YEAR')}>
              <Text style={styles.chipText}>This Year</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Range Preview Box */}
          <View style={[styles.previewBox, { backgroundColor: accentLightBg }]}>
            <View style={styles.previewItem}>
              <Text style={[styles.previewLabel, { color: accentColor }]}>Start Date</Text>
              <Text style={[styles.previewDate, { color: accentColor }]}>{calStart || 'Select'}</Text>
            </View>
            <ArrowRight size={18} color={accentColor} />
            <View style={styles.previewItem}>
              <Text style={[styles.previewLabel, { color: accentColor }]}>End Date</Text>
              <Text style={[styles.previewDate, { color: accentColor }]}>{calEnd || calStart || 'Select'}</Text>
            </View>
          </View>

          {/* Month Switcher Header */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={handlePrevCalMonth} style={styles.monthNavBtn}>
              <ChevronLeft size={18} color={accentColor} />
            </TouchableOpacity>
            <Text style={[styles.monthNavTitle, { color: accentColor }]}>{calMonthTitle}</Text>
            <TouchableOpacity onPress={handleNextCalMonth} style={styles.monthNavBtn}>
              <ChevronRight size={18} color={accentColor} />
            </TouchableOpacity>
          </View>

          {/* Weekdays Row */}
          <View style={styles.weekdaysRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w, idx) => (
              <Text key={idx} style={styles.weekdayText}>
                {w}
              </Text>
            ))}
          </View>

          {/* Day Grid */}
          <View style={styles.grid}>
            {calendarGrid.map((cell, idx) => {
              if (!cell.dayNumber) {
                return <View key={idx} style={styles.emptyCell} />;
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
                    styles.dayCell,
                    isInRange && [styles.dayInRange, { backgroundColor: accentLightBg }],
                    (isSelectedStart || isSelectedEnd) && [
                      styles.daySelected,
                      { backgroundColor: accentColor },
                    ],
                  ]}
                  onPress={() => handleDayPress(dStr)}
                  disabled={isFuture}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isFuture && styles.dayTextDisabled,
                      (isSelectedStart || isSelectedEnd) && styles.dayTextSelected,
                      isInRange && [styles.dayTextInRange, { color: accentColor }],
                    ]}
                  >
                    {cell.dayNumber}
                  </Text>
                  {isDayToday && !isSelectedStart && !isSelectedEnd && (
                    <View style={[styles.todayDot, { backgroundColor: accentColor }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: accentColor }]}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 12,
    marginBottom: 12,
  },
  modePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  modePillTextActive: {
    fontWeight: '800',
  },
  presetsRow: {
    gap: 6,
    paddingBottom: 10,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },
  previewItem: {
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  previewDate: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    paddingVertical: 4,
  },
  weekdayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  emptyCell: {
    width: 36,
    height: 36,
    marginVertical: 2,
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayInRange: {
    borderRadius: 6,
  },
  daySelected: {
    borderRadius: 18,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextInRange: {
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: '#CBD5E1',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  applyBtn: {
    flex: 2,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

