import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react-native';

export type FilterMode = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';

interface PeriodFilterBarProps {
  activeMode: FilterMode;
  onModeChange: (mode: FilterMode) => void;
  title: string;
  subtitle: string;
  isCurrentPeriod: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenCalendar: () => void;
  onGoToday: () => void;
  accentColor?: string;
  accentLightBg?: string;
  accentBorder?: string;
}

export const PeriodFilterBar: React.FC<PeriodFilterBarProps> = ({
  activeMode,
  onModeChange,
  title,
  subtitle,
  isCurrentPeriod,
  onPrev,
  onNext,
  onOpenCalendar,
  onGoToday,
  accentColor = '#064E3B',
  accentLightBg = '#F0FDF4',
  accentBorder = '#DCFCE7',
}) => {
  return (
    <View style={styles.wrapper}>
      {/* Segmented Control Tabs */}
      <View style={styles.pillsRow}>
        {(['DAY', 'WEEK', 'MONTH', 'YEAR', 'CUSTOM'] as FilterMode[]).map((mode) => {
          const isActive = activeMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[
                styles.pill,
                isActive && [styles.pillActive, { backgroundColor: accentColor }],
              ]}
              onPress={() => onModeChange(mode)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillText,
                  isActive && styles.pillTextActive,
                ]}
              >
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

      {/* Date Navigation Bar */}
      <View style={styles.navCard}>
        <TouchableOpacity
          style={[styles.arrowBtn, { backgroundColor: accentLightBg, borderColor: accentBorder }]}
          onPress={onPrev}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={accentColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.centerArea}
          onPress={onOpenCalendar}
          activeOpacity={0.8}
        >
          <View style={styles.titleRow}>
            <CalendarIcon size={15} color={accentColor} style={{ marginRight: 6 }} />
            <Text style={[styles.titleText, { color: accentColor }]}>{title}</Text>
            {!isCurrentPeriod && (
              <View style={styles.historyTag}>
                <Text style={styles.historyTagText}>History</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.arrowBtn,
            { backgroundColor: accentLightBg, borderColor: accentBorder },
            isCurrentPeriod && styles.arrowDisabled,
          ]}
          onPress={onNext}
          disabled={isCurrentPeriod}
          activeOpacity={0.7}
        >
          <ChevronRight
            size={20}
            color={isCurrentPeriod ? '#CBD5E1' : accentColor}
          />
        </TouchableOpacity>
      </View>

      {/* Notice Banner when viewing past records */}
      {!isCurrentPeriod && (
        <View style={styles.historyNotice}>
          <View style={styles.historyNoticeLeft}>
            <RotateCcw size={14} color="#0284C7" />
            <Text style={styles.historyNoticeText}>
              Viewing history for {title}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onGoToday}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>Back to Today →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    padding: 4,
    borderRadius: 14,
    marginBottom: 10,
    gap: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  navCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  arrowDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  centerArea: {
    alignItems: 'center',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  historyTag: {
    marginLeft: 8,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  historyTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  subtitleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  historyNotice: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
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
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#0284C7',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});

