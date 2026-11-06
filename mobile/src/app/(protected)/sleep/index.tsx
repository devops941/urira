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
  Moon,
  Clock,
  Calendar,
  Sparkles,
  TrendingUp,
  Plus,
  Trash2,
  X,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { sleepService } from '../../../services/wellness/sleepService';
import {
  SleepRecordDto,
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

export default function SleepTrackerScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latestSleep, setLatestSleep] = useState<SleepRecordDto | null>(null);
  const [weeklyHistory, setWeeklyHistory] = useState<SleepRecordDto[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Log Sleep Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [bedtimeStr, setBedtimeStr] = useState('22:30');
  const [wakeTimeStr, setWakeTimeStr] = useState('06:30');
  const [selectedQuality, setSelectedQuality] = useState<SleepQuality>(SleepQuality.GOOD);
  const [sleepNotes, setSleepNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const latest = await sleepService.getLatest();
      setLatestSleep(latest);
      const history = await sleepService.getWeeklyHistory();
      setWeeklyHistory(history);
    } catch (err: any) {
      console.warn('Failed to load sleep data:', err.message);
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

  const handleLogSleep = async () => {
    // Validate HH:mm formats
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(bedtimeStr) || !timeRegex.test(wakeTimeStr)) {
      Alert.alert('Invalid Time', 'Please enter valid times in 24-hour HH:mm format (e.g. 22:30)');
      return;
    }

    try {
      setSubmitting(true);
      const today = new Date();
      const [bHour, bMin] = bedtimeStr.split(':').map(Number);
      const [wHour, wMin] = wakeTimeStr.split(':').map(Number);

      // Bedtime is typically yesterday evening if wake time is morning
      const bedtime = new Date(today);
      bedtime.setHours(bHour, bMin, 0, 0);

      const wakeTime = new Date(today);
      wakeTime.setHours(wHour, wMin, 0, 0);

      // If wake time is earlier than bedtime, bedtime was previous day
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

  const durationHours = latestSleep?.durationMinutes
    ? (latestSleep.durationMinutes / 60).toFixed(1)
    : '0.0';

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Sleep Tracker" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[SLEEP_COLOR]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Sleep Summary Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Moon size={24} color={SLEEP_COLOR} />
            </View>
            <View style={styles.heroHeaderText}>
              <Text style={styles.heroTitle}>Last Night's Sleep</Text>
              <Text style={styles.heroSubtitle}>
                {latestSleep?.date || 'No recent session recorded'}
              </Text>
            </View>
            {latestSleep?.quality && (
              <View style={[styles.qualityBadge, { backgroundColor: SLEEP_BG_LIGHT }]}>
                <Text style={styles.qualityBadgeText}>{latestSleep.quality.replace('_', ' ')}</Text>
              </View>
            )}
          </View>

          {/* Big Duration */}
          <View style={styles.bigNumberRow}>
            <Text style={styles.currentNumber}>{durationHours}</Text>
            <Text style={styles.totalUnitText}> hours slept</Text>
          </View>

          {/* Bedtime & Wakeup times */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Bedtime</Text>
              <Text style={styles.statValue}>{formatTime(latestSleep?.bedtime)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Wake Time</Text>
              <Text style={styles.statValue}>{formatTime(latestSleep?.wakeTime)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Efficiency</Text>
              <Text style={[styles.statValue, { color: '#16A34A' }]}>
                {latestSleep?.efficiencyScore ? `${latestSleep.efficiencyScore}%` : '85%'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.logActionBtn}
          onPress={() => setShowLogModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.logActionBtnText}>Log New Sleep Session</Text>
        </TouchableOpacity>

        {/* Weekly Sleep Bar Chart */}
        {weeklyHistory.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <TrendingUp size={18} color={SLEEP_COLOR} />
              <Text style={styles.chartTitle}>7-Day Sleep Duration</Text>
            </View>
            <View style={styles.chartContainer}>
              {weeklyHistory.map((item, idx) => {
                const hours = item.durationMinutes ? item.durationMinutes / 60 : 0;
                const barHeightPct = Math.min(100, Math.round((hours / 10) * 100));
                const dayLabel = item.date ? new Date(item.date).toLocaleDateString('en-US', { weekday: 'narrow' }) : `${idx + 1}`;
                return (
                  <View key={item.id || idx} style={styles.barCol}>
                    <Text style={styles.barValueText}>{hours > 0 ? `${hours.toFixed(1)}h` : ''}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${Math.max(10, barHeightPct)}%` },
                          hours >= 7 && { backgroundColor: '#16A34A' },
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

        {/* Recent Sleep Logs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sleep History</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={SLEEP_COLOR} style={{ marginVertical: 20 }} />
        ) : weeklyHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Moon size={36} color={colors.secondaryText} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No sleep history logged yet</Text>
            <Text style={styles.emptySubtitle}>Track bedtime and wake up times to unlock restorative sleep analytics.</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {weeklyHistory.map((rec) => {
              const hours = (rec.durationMinutes / 60).toFixed(1);
              const recId = rec._id || rec.id || Math.random().toString();
              return (
                <View key={recId} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <View style={styles.historyIconBox}>
                      <Moon size={18} color={SLEEP_COLOR} />
                    </View>
                    <View>
                      <Text style={styles.historyDate}>{rec.dateString || rec.date}</Text>
                      <Text style={styles.historyTimes}>
                        {formatTime(rec.bedtime)} – {formatTime(rec.wakeTime)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationBadgeText}>{hours} hrs</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(recId)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
              <View style={styles.timeInputCol}>
                <Text style={styles.inputLabel}>Bedtime (HH:mm)</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="22:30"
                  value={bedtimeStr}
                  onChangeText={setBedtimeStr}
                  placeholderTextColor={colors.secondaryText}
                  maxLength={5}
                />
              </View>
              <View style={styles.timeInputCol}>
                <Text style={styles.inputLabel}>Wake Time (HH:mm)</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="06:30"
                  value={wakeTimeStr}
                  onChangeText={setWakeTimeStr}
                  placeholderTextColor={colors.secondaryText}
                  maxLength={5}
                />
              </View>
            </View>

            {/* Quality Picker */}
            <Text style={styles.inputLabel}>Sleep Quality</Text>
            <View style={styles.qualityGrid}>
              {QUALITY_OPTIONS.map((q) => (
                <TouchableOpacity
                  key={q.quality}
                  style={[
                    styles.qualityOption,
                    selectedQuality === q.quality && styles.qualityOptionActive,
                  ]}
                  onPress={() => setSelectedQuality(q.quality)}
                >
                  <Text
                    style={[
                      styles.qualityOptionText,
                      selectedQuality === q.quality && styles.qualityOptionTextActive,
                    ]}
                  >
                    {q.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.timeInput, { height: 44, marginBottom: 20 }]}
              placeholder="e.g. Woke up refreshed, slight headache"
              value={sleepNotes}
              onChangeText={setSleepNotes}
              placeholderTextColor={colors.secondaryText}
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleLogSleep}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Save Sleep Record</Text>
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
    backgroundColor: SLEEP_BG_LIGHT,
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
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SLEEP_BORDER,
  },
  qualityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: SLEEP_COLOR,
  },
  bigNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
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
  logActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: SLEEP_COLOR,
    height: 48,
    borderRadius: 14,
    marginBottom: 20,
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
    fontSize: 10,
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
    backgroundColor: SLEEP_COLOR,
    borderRadius: 7,
  },
  barDayText: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 6,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: SLEEP_BG_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  historyTimes: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationBadge: {
    backgroundColor: SLEEP_BG_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  durationBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: SLEEP_COLOR,
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
  timeInputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
    marginBottom: 8,
  },
  timeInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.primaryText,
  },
  qualityGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  qualityOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qualityOptionActive: {
    backgroundColor: SLEEP_BG_LIGHT,
    borderColor: SLEEP_COLOR,
  },
  qualityOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  qualityOptionTextActive: {
    color: SLEEP_COLOR,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
