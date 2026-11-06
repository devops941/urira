import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  User,
  Ruler,
  Scale,
  Activity,
  Target,
  Flame,
  Zap,
  Info,
  History,
  RotateCcw,
  ChevronDown,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { calorieService } from '../../../services/health/calorieService';
import { profileService } from '../../../services/health/profileService';
import { aiService } from '../../../services/ai/aiService';
import { AiCalorieExplanationResponse } from '../../../types/ai';
import {
  CalorieRecord,
  CalorieActivityLevel,
  CalorieGoalType,
  BiologicalSex,
} from '../../../types/health';
import { colors } from '../../../theme/colors';

const ACTIVITY_OPTIONS: { label: string; value: CalorieActivityLevel }[] = [
  { label: 'Sedentary', value: 'SEDENTARY' },
  { label: 'Lightly Active', value: 'LIGHTLY_ACTIVE' },
  { label: 'Moderately Active', value: 'MODERATELY_ACTIVE' },
  { label: 'Very Active', value: 'VERY_ACTIVE' },
  { label: 'Extra Active', value: 'EXTRA_ACTIVE' },
];

const GOAL_OPTIONS: { label: string; value: CalorieGoalType }[] = [
  { label: 'Maintain Weight', value: 'MAINTAIN_WEIGHT' },
  { label: 'Lose Weight', value: 'LOSE_WEIGHT' },
  { label: 'Gain Weight', value: 'GAIN_WEIGHT' },
];

export default function CaloriesScreen() {
  const router = useRouter();

  const [age, setAge] = useState('');
  const [sex, setSex] = useState<BiologicalSex>('MALE');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activity, setActivity] = useState<CalorieActivityLevel>('MODERATELY_ACTIVE');
  const [goal, setGoal] = useState<CalorieGoalType>('MAINTAIN_WEIGHT');

  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showSexPicker, setShowSexPicker] = useState(false);

  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CalorieRecord | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AiCalorieExplanationResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Auto-fill from genuine profile if available
  useEffect(() => {
    (async () => {
      try {
        const profile = await profileService.getProfile();
        if (profile?.age) setAge(String(profile.age));
        if (profile?.heightCm) setHeightCm(String(profile.heightCm));
        if (profile?.weightKg) setWeightKg(String(profile.weightKg));
        if (profile?.biologicalSex) setSex(profile.biologicalSex);
        if (profile?.activityLevel) {
          setActivity(profile.activityLevel as CalorieActivityLevel);
        }
        if (profile?.healthGoal) {
          const mapGoal: Record<string, CalorieGoalType> = {
            LOSE_WEIGHT: 'LOSE_WEIGHT',
            GAIN_WEIGHT: 'GAIN_WEIGHT',
            MAINTAIN_WEIGHT: 'MAINTAIN_WEIGHT',
            GENERAL_WELLNESS: 'MAINTAIN_WEIGHT',
          };
          if (mapGoal[profile.healthGoal]) setGoal(mapGoal[profile.healthGoal]);
        }
      } catch {
        // Fallback clean state
      }
    })();
  }, []);

  const handleEstimate = async () => {
    const ageNum = parseInt(age, 10);
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);

    if (isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age between 10 and 120.');
      return;
    }
    if (isNaN(h) || h < 40 || h > 260) {
      Alert.alert('Invalid Height', 'Please enter height in cm (40-260).');
      return;
    }
    if (isNaN(w) || w < 20 || w > 350) {
      Alert.alert('Invalid Weight', 'Please enter weight in kg (20-350).');
      return;
    }

    setCalculating(true);
    try {
      const data = await calorieService.estimateCalories({
        age: ageNum,
        biologicalSex: sex,
        heightCm: h,
        weightKg: w,
        activityLevel: activity,
        goal,
        saveRecord: true,
      });
      setResult(data);
      setAiExplanation(null);
    } catch (err: any) {
      Alert.alert('Calculation Failed', err?.message || 'Unable to calculate calories.');
    } finally {
      setCalculating(false);
    }
  };

  const fetchAiExplanation = async (calorieId?: string) => {
    setLoadingAi(true);
    try {
      const res = await aiService.explainCalories(calorieId);
      setAiExplanation(res);
    } catch {
      // Non-blocking
    } finally {
      setLoadingAi(false);
    }
  };

  const getActivityLabel = (val: CalorieActivityLevel) =>
    ACTIVITY_OPTIONS.find((a) => a.value === val)?.label || val;

  const getGoalLabel = (val: CalorieGoalType) =>
    GOAL_OPTIONS.find((g) => g.value === val)?.label || val;

  return (
    <View style={styles.screenContainer}>
      <AppHeader
        title={result ? 'Calorie Result' : 'Calorie Estimation'}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!result ? (
          /* ================= CALORIE ESTIMATION SCREEN (Column 4) ================= */
          <View style={styles.formSection}>
            {/* Age Input Card */}
            <View style={styles.inputCard}>
              <View style={styles.inputIconBox}>
                <Calendar size={20} color={colors.primary} />
              </View>
              <View style={styles.inputFieldContainer}>
                <Text style={styles.inputFieldLabel}>Age</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                  placeholder="e.g. 23"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.unitSuffix}>years</Text>
            </View>

            {/* Gender Card */}
            <TouchableOpacity
              style={styles.inputCard}
              onPress={() => setShowSexPicker(!showSexPicker)}
              activeOpacity={0.8}
            >
              <View style={styles.inputIconBox}>
                <User size={20} color={colors.primary} />
              </View>
              <View style={styles.inputFieldContainer}>
                <Text style={styles.inputFieldLabel}>Gender</Text>
                <Text style={styles.pickerValueText}>{sex === 'MALE' ? 'Male' : 'Female'}</Text>
              </View>
              <ChevronDown size={18} color={colors.secondaryText} />
            </TouchableOpacity>

            {showSexPicker && (
              <View style={styles.dropdownModal}>
                {(['MALE', 'FEMALE'] as BiologicalSex[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.dropdownItem, sex === s && styles.dropdownItemActive]}
                    onPress={() => {
                      setSex(s);
                      setShowSexPicker(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, sex === s && styles.dropdownItemTextActive]}>
                      {s === 'MALE' ? 'Male' : 'Female'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Height Card */}
            <View style={styles.inputCard}>
              <View style={styles.inputIconBox}>
                <Ruler size={20} color={colors.primary} />
              </View>
              <View style={styles.inputFieldContainer}>
                <Text style={styles.inputFieldLabel}>Height</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="e.g. 175"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.unitSuffix}>cm</Text>
            </View>

            {/* Weight Card */}
            <View style={styles.inputCard}>
              <View style={styles.inputIconBox}>
                <Scale size={20} color={colors.primary} />
              </View>
              <View style={styles.inputFieldContainer}>
                <Text style={styles.inputFieldLabel}>Weight</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={weightKg}
                  onChangeText={setWeightKg}
                  placeholder="e.g. 70"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.unitSuffix}>kg</Text>
            </View>

            {/* Activity Level Card */}
            <TouchableOpacity
              style={styles.inputCard}
              onPress={() => setShowActivityPicker(!showActivityPicker)}
              activeOpacity={0.8}
            >
              <View style={styles.inputIconBox}>
                <Activity size={20} color={colors.primary} />
              </View>
              <View style={styles.inputFieldContainer}>
                <Text style={styles.inputFieldLabel}>Activity Level</Text>
                <Text style={styles.pickerValueText}>{getActivityLabel(activity)}</Text>
              </View>
              <ChevronDown size={18} color={colors.secondaryText} />
            </TouchableOpacity>

            {showActivityPicker && (
              <View style={styles.dropdownModal}>
                {ACTIVITY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.dropdownItem, activity === opt.value && styles.dropdownItemActive]}
                    onPress={() => {
                      setActivity(opt.value);
                      setShowActivityPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        activity === opt.value && styles.dropdownItemTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Goal Card */}
            <TouchableOpacity
              style={styles.inputCard}
              onPress={() => setShowGoalPicker(!showGoalPicker)}
              activeOpacity={0.8}
            >
              <View style={styles.inputIconBox}>
                <Target size={20} color={colors.primary} />
              </View>
              <View style={styles.inputFieldContainer}>
                <Text style={styles.inputFieldLabel}>Goal</Text>
                <Text style={styles.pickerValueText}>{getGoalLabel(goal)}</Text>
              </View>
              <ChevronDown size={18} color={colors.secondaryText} />
            </TouchableOpacity>

            {showGoalPicker && (
              <View style={styles.dropdownModal}>
                {GOAL_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.dropdownItem, goal === opt.value && styles.dropdownItemActive]}
                    onPress={() => {
                      setGoal(opt.value);
                      setShowGoalPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        goal === opt.value && styles.dropdownItemTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Estimate Button */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleEstimate}
              disabled={calculating}
              activeOpacity={0.85}
            >
              {calculating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryActionButtonText}>Estimate Calories</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* ================= CALORIE RESULT SCREEN (Column 5) ================= */
          <View style={styles.resultSection}>
            {/* Card 1: BMR */}
            <View style={styles.resultMetricCard}>
              <View style={[styles.resultMetricIconBox, { backgroundColor: '#FFEDD5' }]}>
                <Flame size={24} color="#F97316" />
              </View>
              <View style={styles.resultMetricContent}>
                <Text style={styles.resultMetricTitle}>BMR</Text>
                <Text style={styles.resultMetricMainValue}>{result.bmr.toLocaleString()} kcal/day</Text>
                <Text style={styles.resultMetricSubText}>(Basal Metabolic Rate)</Text>
              </View>
            </View>

            {/* Card 2: TDEE */}
            <View style={styles.resultMetricCard}>
              <View style={[styles.resultMetricIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Zap size={24} color="#8B5CF6" />
              </View>
              <View style={styles.resultMetricContent}>
                <Text style={styles.resultMetricTitle}>TDEE</Text>
                <Text style={styles.resultMetricMainValue}>
                  {result.tdee.toLocaleString()} kcal/day
                </Text>
                <Text style={styles.resultMetricSubText}>(Total Daily Energy Expenditure)</Text>
              </View>
            </View>

            {/* Card 3: Daily Calorie Target */}
            <View style={styles.resultMetricCard}>
              <View style={[styles.resultMetricIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Target size={24} color="#16A34A" />
              </View>
              <View style={styles.resultMetricContent}>
                <Text style={styles.resultMetricTitle}>Daily Calorie Target</Text>
                <Text style={[styles.resultMetricMainValue, { color: '#16A34A' }]}>
                  {result.estimatedDailyCalories.toLocaleString()} kcal/day
                </Text>
                <Text style={styles.resultMetricSubText}>
                  (for {result.goal === 'LOSE_WEIGHT' ? 'weight loss' : result.goal === 'GAIN_WEIGHT' ? 'weight gain' : 'maintenance'})
                </Text>
              </View>
            </View>

            {/* AI Calorie Explanation Card */}
            {aiExplanation ? (
              <View style={styles.aiExplanationCard}>
                <View style={styles.aiExplanationHeader}>
                  <Sparkles size={18} color="#F97316" />
                  <Text style={styles.aiExplanationTitle}>AI Nutrition & Energy Insight</Text>
                </View>
                <Text style={styles.aiExplanationSummary}>{aiExplanation.summary}</Text>
                <Text style={styles.aiExplanationContext}>{aiExplanation.energyBalanceInsight}</Text>
                <Text style={styles.aiExplanationTipsHeader}>Sustainable Nutritional Habits:</Text>
                {aiExplanation.sustainableHabits.map((habit, idx) => (
                  <View key={idx} style={styles.aiTipRow}>
                    <CheckCircle2 size={14} color="#16A34A" style={{ marginRight: 6, marginTop: 2 }} />
                    <Text style={styles.aiTipText}>{habit}</Text>
                  </View>
                ))}
                <View style={styles.safetyBox}>
                  <Info size={14} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.safetyText}>{aiExplanation.safetyGuidance}</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.getAiExplanationBtn}
                onPress={() => fetchAiExplanation(result.id)}
                disabled={loadingAi}
                activeOpacity={0.85}
              >
                {loadingAi ? (
                  <ActivityIndicator size="small" color="#F97316" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Sparkles size={16} color="#F97316" style={{ marginRight: 8 }} />
                    <Text style={styles.getAiExplanationBtnText}>✨ Explain Metabolism with UYIRA AI</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Informational Guidance Disclaimer */}
            <View style={styles.disclaimerCard}>
              <Info size={18} color="#0EA5E9" style={styles.disclaimerIcon} />
              <Text style={styles.disclaimerText}>
                {result.disclaimer ||
                  'This is an estimated value for general wellness and not a medical recommendation.'}
              </Text>
            </View>

            {/* Save to History Button */}
            <TouchableOpacity
              style={styles.saveHistoryButton}
              onPress={() => {
                Alert.alert('Saved', 'Your calorie estimation has been recorded in your health history!');
                router.push('/(protected)/calories/history');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.saveHistoryButtonText}>Save to History</Text>
            </TouchableOpacity>

            {/* Recalculate Button */}
            <TouchableOpacity
              style={styles.recalculateButton}
              onPress={() => setResult(null)}
              activeOpacity={0.8}
            >
              <RotateCcw size={18} color={colors.primary} />
              <Text style={styles.recalculateButtonText}>Recalculate</Text>
            </TouchableOpacity>
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
  historyBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  formSection: {
    gap: 12,
    marginTop: 6,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
    paddingVertical: 2,
  },
  pickerValueText: {
    fontSize: 16,
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
  dropdownModal: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    marginTop: -6,
    marginBottom: 6,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: colors.secondary,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
  resultSection: {
    gap: 14,
    marginTop: 6,
  },
  resultMetricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultMetricIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  resultMetricContent: {
    flex: 1,
  },
  resultMetricTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  resultMetricMainValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryText,
    marginTop: 2,
  },
  resultMetricSubText: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 4,
  },
  aiExplanationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    marginVertical: 4,
    shadowColor: '#F97316',
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
    color: '#EA580C',
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
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  safetyText: {
    flex: 1,
    fontSize: 11.5,
    color: '#9A3412',
    lineHeight: 16,
  },
  getAiExplanationBtn: {
    backgroundColor: '#FFEDD5',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F97316',
    marginVertical: 4,
  },
  getAiExplanationBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#C2410C',
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
  saveHistoryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveHistoryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recalculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    gap: 8,
  },
  recalculateButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
});
