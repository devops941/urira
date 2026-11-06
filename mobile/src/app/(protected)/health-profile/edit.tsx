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
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Calendar,
  User,
  UserRound,
  Users,
  Ruler,
  Scale,
  Activity,
  Heart,
  Droplets,
  Moon,
  Footprints,
  Phone,
  FileText,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Target,
  Flame,
  Coffee,
  Zap,
  Check,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { profileService } from '../../../services/health/profileService';
import { useAuthStore } from '../../../store/authStore';
import {
  BiologicalSex,
  ActivityLevel,
  HealthGoalPreference,
} from '../../../types/health';
import { colors } from '../../../theme/colors';

type SectionKey = 'personal' | 'physical' | 'preferences' | 'emergency';

interface TabItem {
  key: SectionKey;
  label: string;
  icon: any;
  color: string;
  bg: string;
}

const TABS: TabItem[] = [
  { key: 'personal', label: 'Personal', icon: User, color: '#0EA5E9', bg: '#E0F2FE' },
  { key: 'physical', label: 'Physical', icon: Ruler, color: '#16A34A', bg: '#DCFCE7' },
  { key: 'preferences', label: 'Habits & Goals', icon: Heart, color: '#F97316', bg: '#FFEDD5' },
  { key: 'emergency', label: 'Emergency', icon: AlertCircle, color: '#E11D48', bg: '#FEE2E2' },
];

const ACTIVITY_CHOICES: { level: ActivityLevel; title: string; desc: string; icon: any }[] = [
  { level: 'SEDENTARY', title: 'Sedentary', desc: 'Desk job, little/no exercise (1.2x)', icon: Coffee },
  { level: 'LIGHTLY_ACTIVE', title: 'Lightly Active', desc: '1–3 workout days/week (1.375x)', icon: Footprints },
  { level: 'MODERATELY_ACTIVE', title: 'Moderately Active', desc: '3–5 workout days/week (1.55x)', icon: Activity },
  { level: 'VERY_ACTIVE', title: 'Very Active', desc: '6–7 workout days/week (1.725x)', icon: Flame },
  { level: 'EXTRA_ACTIVE', title: 'Extra Active', desc: 'Physical labor or athletic training (1.9x)', icon: Zap },
];

const GOAL_CHOICES: { goal: HealthGoalPreference; title: string; desc: string; icon: any }[] = [
  { goal: 'MAINTAIN_WEIGHT', title: 'Maintain Weight', desc: 'Keep current weight & fitness', icon: Scale },
  { goal: 'LOSE_WEIGHT', title: 'Lose Weight', desc: 'Fat loss & lean metabolism', icon: TrendingDown },
  { goal: 'GAIN_WEIGHT', title: 'Gain Weight', desc: 'Build muscle & strength', icon: TrendingUp },
  { goal: 'GENERAL_WELLNESS', title: 'General Wellness', desc: 'Stamina, fitness & daily energy', icon: Heart },
];

export default function EditHealthProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: SectionKey }>();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<SectionKey>('personal');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Section 1: Personal
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<BiologicalSex>('MALE');

  // Section 2: Physical
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('MODERATELY_ACTIVE');

  // Section 3: Preferences
  const [healthGoal, setHealthGoal] = useState<HealthGoalPreference>('GENERAL_WELLNESS');
  const [waterMl, setWaterMl] = useState(2500);
  const [stepGoal, setStepGoal] = useState(8000);
  const [sleepHours, setSleepHours] = useState(8);

  // Section 4: Emergency
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  // Handle URL param section when arriving
  useEffect(() => {
    if (params.section && ['personal', 'physical', 'preferences', 'emergency'].includes(params.section)) {
      setActiveTab(params.section);
    }
  }, [params.section]);

  // Load existing profile from backend
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await profileService.getProfile();
        if (p) {
          if (p.firstName) setFirstName(p.firstName);
          if (p.lastName) setLastName(p.lastName);
          if (!p.firstName && user?.fullName) {
            const parts = user.fullName.trim().split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
          }
          if (p.dateOfBirth) {
            setDateOfBirth(String(p.dateOfBirth).split('T')[0]);
          }
          if (p.biologicalSex) setGender(p.biologicalSex);
          if (p.heightCm) setHeightCm(String(p.heightCm));
          if (p.weightKg) setWeightKg(String(p.weightKg));
          if (p.targetWeightKg) setTargetWeightKg(String(p.targetWeightKg));
          if (p.activityLevel) setActivityLevel(p.activityLevel as ActivityLevel);
          if (p.healthGoal) setHealthGoal(p.healthGoal as HealthGoalPreference);
          if (p.preferredWaterIntakeMl) setWaterMl(p.preferredWaterIntakeMl);
          if (p.preferredStepGoal) setStepGoal(p.preferredStepGoal);
          if (p.preferredSleepGoalHours) setSleepHours(p.preferredSleepGoalHours);
          if (p.emergencyContactName) setEmergencyName(p.emergencyContactName);
          if (p.emergencyContactPhone) setEmergencyPhone(p.emergencyContactPhone);
          if (p.medicalNotes) setMedicalNotes(p.medicalNotes);
        }
      } catch {
        // Fallback defaults
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Date and Age calculation
  const parseDateOfBirth = (val: string): Date | null => {
    if (!val) return null;
    const clean = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
    }
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split(/[-/]/).map(Number);
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) return date;
    }
    const parsed = new Date(clean);
    return !isNaN(parsed.getTime()) ? parsed : null;
  };

  const getCalculatedAge = (): number | null => {
    const birthDate = parseDateOfBirth(dateOfBirth);
    if (!birthDate) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 0 && age < 120 ? age : null;
  };

  // Height parser (supports feet auto conversion)
  const parseHeightCm = (raw: string): number | null => {
    if (!raw || !raw.trim()) return null;
    const clean = raw.trim().replace(/,/g, '.');
    const num = parseFloat(clean);
    if (isNaN(num) || num <= 0) return null;
    if (num <= 8.5) return Math.round(num * 30.48);
    return Math.round(num);
  };

  // Live BMI preview
  const getPreviewBmi = () => {
    const w = parseFloat(weightKg.trim().replace(/,/g, '.'));
    const h = parseHeightCm(heightCm);
    if (!w || !h || h < 40 || h > 300 || w < 10 || w > 400) return null;
    const hM = h / 100;
    const bmi = w / (hM * hM);
    let category = 'Healthy Weight';
    let color = '#16A34A';
    if (bmi < 18.5) {
      category = 'Underweight';
      color = '#0EA5E9';
    } else if (bmi <= 24.9) {
      category = 'Healthy Weight';
      color = '#16A34A';
    } else if (bmi <= 29.9) {
      category = 'Overweight';
      color = '#F59E0B';
    } else {
      category = 'Obesity';
      color = '#EF4444';
    }
    const minIdeal = (18.5 * hM * hM).toFixed(1);
    const maxIdeal = (24.9 * hM * hM).toFixed(1);
    return { val: bmi.toFixed(2), category, color, hCm: h, idealRange: `${minIdeal} – ${maxIdeal} kg` };
  };

  const liveBmi = getPreviewBmi();
  const calculatedAge = getCalculatedAge();

  const handleSave = async () => {
    // Basic validation
    if (!firstName.trim()) {
      showAlert('Required Field', 'Please enter your first name.');
      setActiveTab('personal');
      return;
    }

    const parsedH = parseHeightCm(heightCm);
    if (heightCm.trim() && (!parsedH || parsedH < 40 || parsedH > 300)) {
      showAlert('Invalid Height', 'Please enter a valid height in cm or ft.');
      setActiveTab('physical');
      return;
    }

    const parsedW = parseFloat(weightKg.trim().replace(/,/g, '.'));
    if (weightKg.trim() && (isNaN(parsedW) || parsedW < 15 || parsedW > 400)) {
      showAlert('Invalid Weight', 'Please enter a valid weight in kg.');
      setActiveTab('physical');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        biologicalSex: gender,
        activityLevel,
        healthGoal,
        preferredWaterIntakeMl: Number(waterMl) || 2500,
        preferredStepGoal: Number(stepGoal) || 8000,
        preferredSleepGoalHours: Number(sleepHours) || 8,
        emergencyContactName: emergencyName.trim(),
        emergencyContactPhone: emergencyPhone.trim(),
        medicalNotes: medicalNotes.trim(),
      };

      const birthDate = parseDateOfBirth(dateOfBirth);
      if (birthDate) {
        payload.dateOfBirth = birthDate.toISOString().split('T')[0];
      }
      if (parsedH) {
        payload.heightCm = parsedH;
      }
      if (!isNaN(parsedW) && parsedW > 0) {
        payload.weightKg = parsedW;
      }
      if (targetWeightKg.trim()) {
        const parsedTW = parseFloat(targetWeightKg.trim().replace(/,/g, '.'));
        if (!isNaN(parsedTW) && parsedTW > 0) {
          payload.targetWeightKg = parsedTW;
        }
      }

      const updated = await profileService.updateProfile(payload);

      // Update auth store user name if modified
      const currentAuthUser = useAuthStore.getState().user;
      if (currentAuthUser) {
        const newFullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        useAuthStore.getState().setUser({
          ...currentAuthUser,
          fullName: newFullName || currentAuthUser.fullName,
          profilePhoto: updated.profilePhoto || currentAuthUser.profilePhoto,
        });
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Health profile updated successfully!');
        router.back();
      } else {
        Alert.alert('Success', 'Health profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Unable to update health profile.';
      showAlert('Update Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  if (loading) {
    return (
      <View style={styles.screenContainer}>
        <AppHeader title="Edit Health Profile" />
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <AppHeader title="Edit Health Profile" />

      {/* 4-Tab Header Pill Selector */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const IconComp = tab.icon;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabPill, isActive && styles.tabPillActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.tabIconCircle,
                    { backgroundColor: isActive ? '#FFFFFF' : tab.bg },
                  ]}
                >
                  <IconComp size={15} color={isActive ? '#12372A' : tab.color} />
                </View>
                <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= TAB 1: PERSONAL INFORMATION ================= */}
        {activeTab === 'personal' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderCard}>
              <View style={[styles.sectionHeroIcon, { backgroundColor: '#E0F2FE' }]}>
                <User size={22} color="#0EA5E9" />
              </View>
              <View style={styles.sectionHeroText}>
                <Text style={styles.sectionHeroTitle}>Personal Demographics</Text>
                <Text style={styles.sectionHeroSub}>
                  Core identifiers used for personalized health analytics.
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.inputBox}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="e.g. Gokul"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name (Optional)</Text>
              <TextInput
                style={styles.inputBox}
                value={lastName}
                onChangeText={setLastName}
                placeholder="e.g. Nath"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
              <View style={styles.inputWithIcon}>
                <Calendar size={18} color={colors.primary} style={styles.fieldIcon} />
                <TextInput
                  style={styles.inputBoxWithIcon}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="e.g. 2002-05-15"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.helperText}>
                {calculatedAge !== null ? (
                  <>
                    Age: <Text style={styles.helperHighlight}>{calculatedAge} years</Text>
                  </>
                ) : (
                  'Enter birth date to auto-calculate your age'
                )}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Biological Sex</Text>
              <View style={styles.pillsRow}>
                {(['MALE', 'FEMALE', 'OTHER'] as BiologicalSex[]).map((s) => {
                  const isSelected = gender === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.choicePill, isSelected && styles.choicePillActive]}
                      onPress={() => setGender(s)}
                    >
                      {s === 'MALE' ? (
                        <User size={16} color={isSelected ? colors.primary : colors.secondaryText} style={{ marginRight: 6 }} />
                      ) : s === 'FEMALE' ? (
                        <UserRound size={16} color={isSelected ? colors.primary : colors.secondaryText} style={{ marginRight: 6 }} />
                      ) : (
                        <Users size={16} color={isSelected ? colors.primary : colors.secondaryText} style={{ marginRight: 6 }} />
                      )}
                      <Text style={[styles.choicePillText, isSelected && styles.choicePillTextActive]}>
                        {s === 'MALE' ? 'Male' : s === 'FEMALE' ? 'Female' : 'Other'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ================= TAB 2: PHYSICAL METRICS ================= */}
        {activeTab === 'physical' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderCard}>
              <View style={[styles.sectionHeroIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ruler size={22} color="#16A34A" />
              </View>
              <View style={styles.sectionHeroText}>
                <Text style={styles.sectionHeroTitle}>Physical Baseline</Text>
                <Text style={styles.sectionHeroSub}>
                  Biometric measurements used for BMI and daily energy calculations.
                </Text>
              </View>
            </View>

            {/* Height */}
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <Ruler size={22} color={colors.primary} />
              </View>
              <View style={styles.metricInputArea}>
                <Text style={styles.inputLabel}>Height (cm or ft)</Text>
                <TextInput
                  style={styles.metricTextInput}
                  keyboardType="decimal-pad"
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="e.g. 175 or 5.9"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.metricUnit}>
                {heightCm.trim() && parseHeightCm(heightCm) && parseFloat(heightCm.replace(/,/g, '.')) <= 8.5 ? 'ft' : 'cm'}
              </Text>
            </View>
            {heightCm.trim() && parseHeightCm(heightCm) ? (
              <Text style={styles.fieldConversionHelper}>
                📐 Standard Height: <Text style={styles.helperHighlight}>{parseHeightCm(heightCm)} cm</Text> ({((parseHeightCm(heightCm) || 0) / 30.48).toFixed(1)} ft)
              </Text>
            ) : null}

            {/* Weight */}
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <Scale size={22} color={colors.primary} />
              </View>
              <View style={styles.metricInputArea}>
                <Text style={styles.inputLabel}>Current Weight</Text>
                <TextInput
                  style={styles.metricTextInput}
                  keyboardType="decimal-pad"
                  value={weightKg}
                  onChangeText={setWeightKg}
                  placeholder="e.g. 70"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.metricUnit}>kg</Text>
            </View>

            {/* Target Weight */}
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <Target size={22} color="#16A34A" />
              </View>
              <View style={styles.metricInputArea}>
                <Text style={styles.inputLabel}>Target Weight (Optional)</Text>
                <TextInput
                  style={styles.metricTextInput}
                  keyboardType="decimal-pad"
                  value={targetWeightKg}
                  onChangeText={setTargetWeightKg}
                  placeholder="e.g. 65"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.metricUnit}>kg</Text>
            </View>

            {/* Live BMI Preview Card */}
            {liveBmi ? (
              <View style={styles.livePreviewCard}>
                <View style={styles.livePreviewLeft}>
                  <Text style={styles.livePreviewTitle}>Current Baseline BMI</Text>
                  <Text style={styles.livePreviewSub}>
                    Calculated from {weightKg} kg & {liveBmi.hCm} cm
                  </Text>
                  <Text style={styles.liveIdealRange}>
                    Healthy range: <Text style={{ fontWeight: '700', color: '#16A34A' }}>{liveBmi.idealRange}</Text>
                  </Text>
                </View>
                <View style={styles.livePreviewRight}>
                  <Text style={[styles.liveBmiValue, { color: liveBmi.color }]}>
                    {liveBmi.val}
                  </Text>
                  <View style={[styles.liveBmiBadge, { backgroundColor: `${liveBmi.color}15` }]}>
                    <Text style={[styles.liveBmiBadgeText, { color: liveBmi.color }]}>
                      {liveBmi.category}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Activity Level */}
            <Text style={[styles.subSectionTitle, { marginTop: 14 }]}>Daily Activity Level</Text>
            <View style={styles.activityList}>
              {ACTIVITY_CHOICES.map((item) => {
                const isSelected = activityLevel === item.level;
                const IconComp = item.icon;
                return (
                  <TouchableOpacity
                    key={item.level}
                    style={[styles.activityCard, isSelected && styles.activityCardSelected]}
                    onPress={() => setActivityLevel(item.level)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.activityIconCircle}>
                      <IconComp size={20} color={isSelected ? colors.primary : '#64748B'} />
                    </View>
                    <View style={styles.activityTextWrap}>
                      <Text style={[styles.activityCardTitle, isSelected && styles.activityCardTitleSelected]}>
                        {item.title}
                      </Text>
                      <Text style={styles.activityCardDesc}>{item.desc}</Text>
                    </View>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ================= TAB 3: HEALTH PREFERENCES ================= */}
        {activeTab === 'preferences' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderCard}>
              <View style={[styles.sectionHeroIcon, { backgroundColor: '#FFEDD5' }]}>
                <Heart size={22} color="#F97316" />
              </View>
              <View style={styles.sectionHeroText}>
                <Text style={styles.sectionHeroTitle}>Habits & Daily Targets</Text>
                <Text style={styles.sectionHeroSub}>
                  Configure your primary goals and daily lifestyle targets.
                </Text>
              </View>
            </View>

            {/* Goal Grid */}
            <Text style={styles.subSectionTitle}>Primary Health Goal</Text>
            <View style={styles.goalGrid}>
              {GOAL_CHOICES.map((item) => {
                const isSelected = healthGoal === item.goal;
                const IconComp = item.icon;
                return (
                  <TouchableOpacity
                    key={item.goal}
                    style={[styles.goalGridCard, isSelected && styles.goalGridCardSelected]}
                    onPress={() => setHealthGoal(item.goal)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.goalIconWrap}>
                      <IconComp size={20} color={isSelected ? colors.primary : '#64748B'} />
                    </View>
                    <Text style={[styles.goalGridTitle, isSelected && styles.goalGridTitleSelected]}>
                      {item.title}
                    </Text>
                    <Text style={styles.goalGridDesc}>{item.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Daily Habit Steppers */}
            <Text style={[styles.subSectionTitle, { marginTop: 16 }]}>Daily Targets</Text>

            {/* Water Stepper */}
            <View style={styles.stepperCard}>
              <View style={styles.stepperLeft}>
                <Droplets size={20} color="#06B6D4" />
                <View>
                  <Text style={styles.stepperLabel}>Daily Water</Text>
                  <Text style={styles.stepperValue}>{(waterMl / 1000).toFixed(1)} Liters</Text>
                </View>
              </View>
              <View style={styles.stepperActions}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setWaterMl(Math.max(1000, waterMl - 250))}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperCountText}>{waterMl} ml</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setWaterMl(Math.min(6000, waterMl + 250))}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Steps Stepper */}
            <View style={styles.stepperCard}>
              <View style={styles.stepperLeft}>
                <Footprints size={20} color="#0EA5E9" />
                <View>
                  <Text style={styles.stepperLabel}>Daily Steps</Text>
                  <Text style={styles.stepperValue}>{stepGoal.toLocaleString()} steps</Text>
                </View>
              </View>
              <View style={styles.stepperActions}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setStepGoal(Math.max(2000, stepGoal - 1000))}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperCountText}>{stepGoal / 1000}k</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setStepGoal(Math.min(30000, stepGoal + 1000))}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sleep Stepper */}
            <View style={styles.stepperCard}>
              <View style={styles.stepperLeft}>
                <Moon size={20} color="#8B5CF6" />
                <View>
                  <Text style={styles.stepperLabel}>Sleep Duration</Text>
                  <Text style={styles.stepperValue}>{sleepHours} hours/night</Text>
                </View>
              </View>
              <View style={styles.stepperActions}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setSleepHours(Math.max(5, sleepHours - 1))}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.stepperCountText}>{sleepHours} h</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setSleepHours(Math.min(12, sleepHours + 1))}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ================= TAB 4: MEDICAL & EMERGENCY ================= */}
        {activeTab === 'emergency' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderCard}>
              <View style={[styles.sectionHeroIcon, { backgroundColor: '#FEE2E2' }]}>
                <AlertCircle size={22} color="#E11D48" />
              </View>
              <View style={styles.sectionHeroText}>
                <Text style={styles.sectionHeroTitle}>Medical Safety & Contacts</Text>
                <Text style={styles.sectionHeroSub}>
                  Optional emergency details and private medical notes.
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Emergency Contact Name</Text>
              <View style={styles.inputWithIcon}>
                <User size={18} color="#EF4444" style={styles.fieldIcon} />
                <TextInput
                  style={styles.inputBoxWithIcon}
                  value={emergencyName}
                  onChangeText={setEmergencyName}
                  placeholder="e.g. Parent / Spouse / Guardian"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Emergency Contact Phone</Text>
              <View style={styles.inputWithIcon}>
                <Phone size={18} color="#EF4444" style={styles.fieldIcon} />
                <TextInput
                  style={styles.inputBoxWithIcon}
                  keyboardType="phone-pad"
                  value={emergencyPhone}
                  onChangeText={setEmergencyPhone}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Private Medical Notes & Allergies</Text>
              <View style={[styles.inputWithIcon, { alignItems: 'flex-start' }]}>
                <FileText size={18} color={colors.primary} style={[styles.fieldIcon, { marginTop: 12 }]} />
                <TextInput
                  style={[styles.inputBoxWithIcon, styles.textAreaInput]}
                  multiline
                  numberOfLines={4}
                  value={medicalNotes}
                  onChangeText={setMedicalNotes}
                  placeholder="e.g. Asthma, Penicillin allergy, taking vitamins..."
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>
        )}

        {/* Save Changes Button */}
        <TouchableOpacity
          style={styles.saveChangesButton}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.saveBtnInner}>
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.saveChangesButtonText}>Save Changes</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '600',
  },
  tabBarContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  tabBarScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabPillActive: {
    backgroundColor: '#12372A',
  },
  tabIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  sectionWrap: {
    gap: 12,
  },
  sectionHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginBottom: 4,
  },
  sectionHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeroText: {
    flex: 1,
  },
  sectionHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#12372A',
  },
  sectionHeroSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  fieldIcon: {
    marginRight: 8,
  },
  inputBoxWithIcon: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
  },
  textAreaInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11.5,
    color: colors.secondaryText,
    marginLeft: 2,
  },
  helperHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
  fieldConversionHelper: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: -4,
    marginLeft: 4,
    fontWeight: '500',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choicePill: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choicePillActive: {
    backgroundColor: '#F0FDF4',
    borderColor: colors.primary,
  },
  choicePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  choicePillTextActive: {
    color: colors.primary,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  metricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricInputArea: {
    flex: 1,
  },
  metricTextInput: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primaryText,
    paddingVertical: 2,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  livePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 4,
  },
  livePreviewLeft: {
    flex: 1,
  },
  livePreviewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryText,
  },
  livePreviewSub: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
  },
  liveIdealRange: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 4,
  },
  livePreviewRight: {
    alignItems: 'flex-end',
  },
  liveBmiValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  liveBmiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  liveBmiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryText,
    marginTop: 6,
  },
  activityList: {
    gap: 8,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  activityCardSelected: {
    backgroundColor: '#FAFDFB',
    borderColor: colors.primary,
  },
  activityIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityTextWrap: {
    flex: 1,
  },
  activityCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryText,
  },
  activityCardTitleSelected: {
    color: colors.primary,
  },
  activityCardDesc: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  goalGridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  goalGridCardSelected: {
    backgroundColor: '#FAFDFB',
    borderColor: colors.primary,
  },
  goalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  goalGridTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryText,
  },
  goalGridTitleSelected: {
    color: colors.primary,
  },
  goalGridDesc: {
    fontSize: 10.5,
    color: colors.secondaryText,
    marginTop: 2,
    lineHeight: 14,
  },
  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  stepperLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    fontWeight: '600',
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryText,
  },
  stepperActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  stepperCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
    minWidth: 44,
    textAlign: 'center',
  },
  saveChangesButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveChangesButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
