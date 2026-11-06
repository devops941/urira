import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Scale,
  Ruler,
  Calendar,
  User,
  Info,
  RotateCcw,
  TrendingUp,
  History,
  Trash2,
  ChevronRight,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { BmiGauge } from '../../../features/bmi/components/BmiGauge';
import { BmiTrendChart } from '../../../features/bmi/components/BmiTrendChart';
import { bmiService } from '../../../services/health/bmiService';
import { profileService } from '../../../services/health/profileService';
import { aiService } from '../../../services/ai/aiService';
import { BmiResultDto, BiologicalSex } from '../../../types/health';
import { AiBmiExplanationResponse } from '../../../types/ai';
import { colors } from '../../../theme/colors';

export default function BmiScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'CALCULATOR' | 'TRENDS'>('CALCULATOR');

  // Input states: start EMPTY so user can type freely without backspacing pre-built values
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<BiologicalSex>('MALE');
  const [focusedField, setFocusedField] = useState<'weight' | 'height' | 'age' | null>(null);

  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<BmiResultDto | null>(null);
  const [latestSaved, setLatestSaved] = useState<BmiResultDto | null>(null);
  const [hasProfileData, setHasProfileData] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<AiBmiExplanationResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // History & trends state
  const [historyRecords, setHistoryRecords] = useState<BmiResultDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load dynamic data from MongoDB (Health Profile + Latest BMI + Trend History)
  const loadInitialData = useCallback(async () => {
    try {
      const [prof, latest, history] = await Promise.allSettled([
        profileService.getProfile(),
        bmiService.getLatest(),
        bmiService.getHistory(30),
      ]);

      if (prof.status === 'fulfilled' && prof.value) {
        const p = prof.value;
        if (p.weightKg || p.heightCm || p.age) {
          setHasProfileData(true);
          // Pre-fill dynamically from MongoDB health profile
          if (p.weightKg) setWeightKg(String(p.weightKg));
          if (p.heightCm) setHeightCm(String(p.heightCm));
          if (p.age) setAge(String(p.age));
          if (p.biologicalSex) setGender(p.biologicalSex);
        }
      }

      if (latest.status === 'fulfilled' && latest.value) {
        setLatestSaved(latest.value);
        // Note: We keep result = null initially so the user is directly greeted by the
        // typable BMI Calculator Form, with a quick card to view their latest result!
      }

      if (history.status === 'fulfilled' && history.value) {
        setHistoryRecords(history.value);
      }
    } catch {
      // Non-blocking fallback
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const data = await bmiService.getHistory(30);
      setHistoryRecords(data);
    } catch {
      // Non-blocking
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleCalculate = async () => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    const a = parseInt(age, 10);

    if (isNaN(w) || w < 2 || w > 500) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kilograms (2 - 500 kg).');
      return;
    }
    if (isNaN(h) || h < 30 || h > 300) {
      Alert.alert('Invalid Height', 'Please enter a valid height in centimeters (30 - 300 cm).');
      return;
    }
    if (isNaN(a) || a < 1 || a > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 120.');
      return;
    }

    setCalculating(true);
    try {
      const data = await bmiService.calculateBmi({
        weightKg: w,
        heightCm: h,
        userAge: a,
        unitSystem: 'METRIC',
      });
      setResult(data);
      setAiExplanation(null);
      // Prepend to history records immediately
      setHistoryRecords((prev) => [data, ...prev.filter((r) => r.id !== data.id)]);
      setActiveTab('CALCULATOR');
    } catch (err: any) {
      Alert.alert('Calculation Failed', err?.message || 'Unable to calculate and save BMI.');
    } finally {
      setCalculating(false);
    }
  };

  const fetchAiExplanation = async (bmiId?: string) => {
    setLoadingAi(true);
    try {
      const res = await aiService.explainBmi(bmiId);
      setAiExplanation(res);
    } catch {
      // Non-blocking
    } finally {
      setLoadingAi(false);
    }
  };

  const handleDeleteRecord = (recordId: string) => {
    Alert.alert('Delete Record', 'Are you sure you want to delete this historical reading?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await bmiService.deleteById(recordId);
            setHistoryRecords((prev) => prev.filter((r) => r.id !== recordId));
            if (result?.id === recordId) {
              setResult(historyRecords.find((r) => r.id !== recordId) || null);
            }
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete record.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screenContainer}>
      {/* Universal Top Header */}
      <AppHeader
        title={activeTab === 'CALCULATOR' ? (result ? 'BMI Result' : 'BMI Calculator') : 'BMI Trends'}
      />

      {/* Segmented Mode Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'CALCULATOR' && styles.tabButtonActive]}
          onPress={() => setActiveTab('CALCULATOR')}
          activeOpacity={0.8}
        >
          <Scale
            size={16}
            color={activeTab === 'CALCULATOR' ? '#FFFFFF' : colors.secondaryText}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'CALCULATOR' && styles.tabButtonTextActive,
            ]}
          >
            Calculate & Result
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'TRENDS' && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab('TRENDS');
            loadHistory();
          }}
          activeOpacity={0.8}
        >
          <TrendingUp
            size={16}
            color={activeTab === 'TRENDS' ? '#FFFFFF' : colors.secondaryText}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'TRENDS' && styles.tabButtonTextActive,
            ]}
          >
            Trends & History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {activeTab === 'CALCULATOR' ? (
          /* ================= TAB 1: CALCULATOR & RESULT ================= */
          <View>
            {!result ? (
              /* INPUT FORM (METRIC ONLY + AGE & GENDER) */
              <View style={styles.formContainer}>
                {/* Latest Calculation Quick-Card if exists */}
                {latestSaved && (
                  <View style={styles.lastSavedBanner}>
                    <View style={styles.lastSavedInfo}>
                      <Text style={styles.lastSavedLabel}>Last Calculated Record</Text>
                      <View style={styles.lastSavedRow}>
                        <Text
                          style={[
                            styles.lastSavedBmi,
                            { color: latestSaved.categoryColor || '#16A34A' },
                          ]}
                        >
                          {latestSaved.bmiValue.toFixed(2)} BMI
                        </Text>
                        <View
                          style={[
                            styles.lastSavedBadge,
                            { backgroundColor: `${latestSaved.categoryColor || '#16A34A'}15` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.lastSavedCategoryText,
                              { color: latestSaved.categoryColor || '#16A34A' },
                            ]}
                          >
                            {latestSaved.category}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.lastSavedDate}>
                        {latestSaved.weightKg} kg • {latestSaved.heightCm} cm —{' '}
                        {new Date(latestSaved.calculatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewLastBtn}
                      onPress={() => setResult(latestSaved)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewLastBtnText}>View</Text>
                      <ChevronRight size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Profile Sync Notification / Clear Bar */}
                {hasProfileData && (
                  <View style={styles.profileSyncBar}>
                    <View style={styles.profileSyncLeft}>
                      <Sparkles size={14} color={colors.primary} />
                      <Text style={styles.profileSyncText}>Synced from your Health Profile</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setWeightKg('');
                        setHeightCm('');
                        setAge('');
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.clearAllText}>Clear Values</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 1. Weight Input Card */}
                <View
                  style={[
                    styles.inputCard,
                    focusedField === 'weight' && styles.inputCardFocused,
                  ]}
                >
                  <View style={styles.inputIconBox}>
                    <Scale size={20} color={colors.primary} />
                  </View>
                  <View style={styles.inputFieldContainer}>
                    <Text style={styles.inputFieldLabel}>Weight</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="decimal-pad"
                      value={weightKg}
                      onChangeText={setWeightKg}
                      onFocus={() => setFocusedField('weight')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g. 70"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  {weightKg.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setWeightKg('')}
                      style={styles.clearFieldBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={15} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                  <Text style={styles.unitSuffix}>kg</Text>
                </View>

                {/* 2. Height Input Card */}
                <View
                  style={[
                    styles.inputCard,
                    focusedField === 'height' && styles.inputCardFocused,
                  ]}
                >
                  <View style={styles.inputIconBox}>
                    <Ruler size={20} color={colors.primary} />
                  </View>
                  <View style={styles.inputFieldContainer}>
                    <Text style={styles.inputFieldLabel}>Height</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="decimal-pad"
                      value={heightCm}
                      onChangeText={setHeightCm}
                      onFocus={() => setFocusedField('height')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g. 175"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  {heightCm.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setHeightCm('')}
                      style={styles.clearFieldBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={15} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                  <Text style={styles.unitSuffix}>cm</Text>
                </View>

                {/* 3. Age Input Card */}
                <View
                  style={[
                    styles.inputCard,
                    focusedField === 'age' && styles.inputCardFocused,
                  ]}
                >
                  <View style={styles.inputIconBox}>
                    <Calendar size={20} color={colors.primary} />
                  </View>
                  <View style={styles.inputFieldContainer}>
                    <Text style={styles.inputFieldLabel}>Age</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="number-pad"
                      value={age}
                      onChangeText={setAge}
                      onFocus={() => setFocusedField('age')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="e.g. 23"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  {age.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setAge('')}
                      style={styles.clearFieldBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={15} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                  <Text style={styles.unitSuffix}>years</Text>
                </View>

                {/* 4. Gender Selector Card */}
                <View style={styles.inputCard}>
                  <View style={styles.inputIconBox}>
                    <User size={20} color={colors.primary} />
                  </View>
                  <View style={styles.inputFieldContainer}>
                    <Text style={styles.inputFieldLabel}>Gender</Text>
                    <View style={styles.genderRow}>
                      <TouchableOpacity
                        style={[
                          styles.genderPill,
                          gender === 'MALE' && styles.genderPillActive,
                        ]}
                        onPress={() => setGender('MALE')}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.genderPillText,
                            gender === 'MALE' && styles.genderPillTextActive,
                          ]}
                        >
                          Male
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.genderPill,
                          gender === 'FEMALE' && styles.genderPillActive,
                        ]}
                        onPress={() => setGender('FEMALE')}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.genderPillText,
                            gender === 'FEMALE' && styles.genderPillTextActive,
                          ]}
                        >
                          Female
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Calculate Button */}
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleCalculate}
                  disabled={calculating}
                  activeOpacity={0.85}
                >
                  {calculating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryActionButtonText}>Calculate & Save BMI</Text>
                  )}
                </TouchableOpacity>

                {/* Info Card */}
                <View style={styles.infoBanner}>
                  <Info size={16} color="#0EA5E9" style={styles.infoBannerIcon} />
                  <Text style={styles.infoBannerText}>
                    Standard metric units (kg and cm). Each reading is auto-saved with date, time, and synced with your health profile.
                  </Text>
                </View>
              </View>
            ) : (
              /* RESULT VIEW MATCHING MOCKUP */
              <View style={styles.resultContainer}>
                {/* Visual Semicircle Arc Speedometer */}
                <View style={styles.gaugeCard}>
                  <BmiGauge
                    bmi={result.bmiValue}
                    category={result.category}
                    categoryColor={result.categoryColor}
                  />
                </View>

                {/* 4 Biometric Stat Mini-Cards */}
                <View style={styles.statsGrid}>
                  <View style={styles.statMiniCard}>
                    <Scale size={18} color={colors.primary} />
                    <View style={styles.statMiniContent}>
                      <Text style={styles.statMiniLabel}>Weight</Text>
                      <Text style={styles.statMiniValue}>{result.weightKg} kg</Text>
                    </View>
                  </View>

                  <View style={styles.statMiniCard}>
                    <Ruler size={18} color={colors.primary} />
                    <View style={styles.statMiniContent}>
                      <Text style={styles.statMiniLabel}>Height</Text>
                      <Text style={styles.statMiniValue}>{result.heightCm} cm</Text>
                    </View>
                  </View>

                  <View style={styles.statMiniCard}>
                    <Calendar size={18} color={colors.primary} />
                    <View style={styles.statMiniContent}>
                      <Text style={styles.statMiniLabel}>Age</Text>
                      <Text style={styles.statMiniValue}>{result.userAge || age} yrs</Text>
                    </View>
                  </View>

                  <View style={styles.statMiniCard}>
                    <User size={18} color={colors.primary} />
                    <View style={styles.statMiniContent}>
                      <Text style={styles.statMiniLabel}>Gender</Text>
                      <Text style={styles.statMiniValue}>
                        {gender === 'MALE' ? 'Male' : 'Female'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Timestamp Date Card */}
                <View style={styles.timestampCard}>
                  <Calendar size={16} color="#16A34A" />
                  <Text style={styles.timestampCardText}>
                    Calculated on{' '}
                    {new Date(result.calculatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                {/* AI Explanation Card */}
                {aiExplanation ? (
                  <View style={styles.aiExplanationCard}>
                    <View style={styles.aiExplanationHeader}>
                      <Sparkles size={18} color="#16A34A" />
                      <Text style={styles.aiExplanationTitle}>AI Clinical & Lifestyle Insight</Text>
                    </View>
                    <Text style={styles.aiExplanationSummary}>{aiExplanation.summary}</Text>
                    <Text style={styles.aiExplanationContext}>{aiExplanation.clinicalContext}</Text>
                    <Text style={styles.aiExplanationTipsHeader}>Healthy Lifestyle Recommendations:</Text>
                    {aiExplanation.healthyLifestyleTips.map((tip, idx) => (
                      <View key={idx} style={styles.aiTipRow}>
                        <CheckCircle2 size={14} color="#16A34A" style={{ marginRight: 6, marginTop: 2 }} />
                        <Text style={styles.aiTipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.getAiExplanationBtn}
                    onPress={() => fetchAiExplanation(result.id)}
                    disabled={loadingAi}
                    activeOpacity={0.85}
                  >
                    {loadingAi ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Sparkles size={16} color="#16A34A" style={{ marginRight: 8 }} />
                        <Text style={styles.getAiExplanationBtnText}>✨ Explain Result with UYIRA AI</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}

                {/* Informational Guidance Disclaimer */}
                <View style={styles.disclaimerCard}>
                  <Info size={18} color="#0EA5E9" style={styles.disclaimerIcon} />
                  <Text style={styles.disclaimerText}>
                    {result.disclaimer ||
                      'Informational Guidance: BMI is a general screening indicator for adults (≥ 20 years) and does not diagnose clinical health.'}
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.resultActionsRow}>
                  <TouchableOpacity
                    style={styles.recalculateButton}
                    onPress={() => setResult(null)}
                    activeOpacity={0.8}
                  >
                    <RotateCcw size={18} color={colors.primary} />
                    <Text style={styles.recalculateButtonText}>Recalculate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewTrendsButton}
                    onPress={() => {
                      setActiveTab('TRENDS');
                      loadHistory();
                    }}
                    activeOpacity={0.8}
                  >
                    <TrendingUp size={18} color="#FFFFFF" />
                    <Text style={styles.viewTrendsButtonText}>View Trends</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          /* ================= TAB 2: TRENDS & HISTORY ================= */
          <View style={styles.trendsContainer}>
            <Text style={styles.sectionHeaderTitle}>BMI & Weight Progress Trend</Text>

            {/* Visual SVG Trend Graph */}
            <BmiTrendChart records={historyRecords} />

            {/* Chronological Calculation History Header */}
            <View style={styles.historySectionHeader}>
              <Text style={styles.sectionHeaderTitle}>Calculation History</Text>
              <Text style={styles.historyCountBadge}>{historyRecords.length} records</Text>
            </View>

            {loadingHistory ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : historyRecords.length === 0 ? (
              <View style={styles.emptyHistoryBox}>
                <Text style={styles.emptyHistoryText}>No records saved yet.</Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {historyRecords.map((item) => (
                  <View key={item.id} style={styles.historyCardItem}>
                    <View
                      style={[
                        styles.historyIconCircle,
                        { backgroundColor: item.categoryColor || '#16A34A' },
                      ]}
                    >
                      <Scale size={18} color="#FFFFFF" />
                    </View>

                    <View style={styles.historyContent}>
                      <View style={styles.historyTopLine}>
                        <Text style={styles.historyBmiValue}>{item.bmiValue.toFixed(2)} BMI</Text>
                        <Text
                          style={[
                            styles.historyCategoryBadge,
                            { color: item.categoryColor || '#16A34A' },
                          ]}
                        >
                          {item.category}
                        </Text>
                      </View>

                      <Text style={styles.historySubLine}>
                        {item.weightKg} kg • {item.heightCm} cm
                      </Text>

                      <Text style={styles.historyDateLine}>
                        {new Date(item.calculatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteRecordBtn}
                      onPress={() => handleDeleteRecord(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerTabToggle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 24,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },
  formContainer: {
    gap: 12,
    marginTop: 4,
  },
  lastSavedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  lastSavedInfo: {
    flex: 1,
  },
  lastSavedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lastSavedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  lastSavedBmi: {
    fontSize: 18,
    fontWeight: '800',
  },
  lastSavedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  lastSavedCategoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lastSavedDate: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 3,
  },
  viewLastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  viewLastBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  profileSyncBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  profileSyncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileSyncText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  inputCardFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FAFDFB',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  clearFieldBtn: {
    padding: 6,
    marginRight: 4,
  },
  inputIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  inputFieldContainer: {
    flex: 1,
  },
  inputFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
    marginBottom: 2,
  },
  textInput: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryText,
    paddingVertical: 2,
  },
  unitSuffix: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
    marginLeft: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  genderPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  genderPillActive: {
    backgroundColor: colors.primary,
  },
  genderPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  genderPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  infoBannerIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 18,
    fontWeight: '500',
  },
  resultContainer: {
    marginTop: 4,
  },
  gaugeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  statMiniCard: {
    width: '48.3%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statMiniContent: {
    marginLeft: 10,
  },
  statMiniLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.secondaryText,
  },
  statMiniValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
    marginTop: 1,
  },
  timestampCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  timestampCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  aiExplanationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#D1E7DD',
    marginBottom: 16,
    shadowColor: '#12372A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  aiExplanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiExplanationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  aiExplanationSummary: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryText,
    lineHeight: 18,
    marginBottom: 6,
  },
  aiExplanationContext: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 17,
    marginBottom: 10,
  },
  aiExplanationTipsHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 6,
  },
  aiTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  aiTipText: {
    flex: 1,
    fontSize: 12,
    color: colors.primaryText,
    lineHeight: 16,
  },
  getAiExplanationBtn: {
    backgroundColor: '#E8F3EC',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    marginBottom: 16,
  },
  getAiExplanationBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#12372A',
  },
  disclaimerIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 18,
    fontWeight: '500',
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  recalculateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    gap: 6,
  },
  recalculateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  viewTrendsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  viewTrendsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trendsContainer: {
    marginTop: 4,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
    marginBottom: 10,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  historyCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  emptyHistoryBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  historyList: {
    gap: 10,
  },
  historyCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  historyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyBmiValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
  },
  historyCategoryBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  historySubLine: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  historyDateLine: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
  },
  deleteRecordBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
