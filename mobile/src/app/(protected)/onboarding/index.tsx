import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  UserRound,
  Users,
  Camera,
  Calendar,
  Ruler,
  Scale,
  Target,
  Activity,
  Flame,
  Droplets,
  Moon,
  Footprints,
  Phone,
  FileText,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Heart,
  Coffee,
  Zap,
  Check,
  X,
  AlertCircle,
} from 'lucide-react-native';
import { useAuthStore } from '../../../store/authStore';
import { profileService } from '../../../services/health/profileService';
import {
  BiologicalSex,
  ActivityLevel,
  HealthGoalPreference,
} from '../../../types/health';
import { colors } from '../../../theme/colors';

const TOTAL_STEPS = 5;

interface ActivityOption {
  level: ActivityLevel;
  title: string;
  desc: string;
  iconName: 'coffee' | 'footprints' | 'activity' | 'flame' | 'zap';
  iconColor: string;
}

const ACTIVITY_CHOICES: ActivityOption[] = [
  {
    level: 'SEDENTARY',
    title: 'Sedentary',
    desc: 'Desk job, little or no regular exercise (1.2x)',
    iconName: 'coffee',
    iconColor: '#64748B',
  },
  {
    level: 'LIGHTLY_ACTIVE',
    title: 'Lightly Active',
    desc: 'Light walks or exercise 1–3 days/week (1.375x)',
    iconName: 'footprints',
    iconColor: '#0EA5E9',
  },
  {
    level: 'MODERATELY_ACTIVE',
    title: 'Moderately Active',
    desc: 'Moderate workouts or sports 3–5 days/week (1.55x)',
    iconName: 'activity',
    iconColor: '#16A34A',
  },
  {
    level: 'VERY_ACTIVE',
    title: 'Very Active',
    desc: 'Hard exercise or sports 6–7 days/week (1.725x)',
    iconName: 'flame',
    iconColor: '#F97316',
  },
  {
    level: 'EXTRA_ACTIVE',
    title: 'Extra Active',
    desc: 'Physically demanding labor or athletic training (1.9x)',
    iconName: 'zap',
    iconColor: '#8B5CF6',
  },
];

interface GoalOption {
  goal: HealthGoalPreference;
  title: string;
  desc: string;
  iconName: 'scale' | 'trending-down' | 'trending-up' | 'heart';
  iconColor: string;
}

const GOAL_CHOICES: GoalOption[] = [
  {
    goal: 'MAINTAIN_WEIGHT',
    title: 'Maintain Weight',
    desc: 'Keep current body weight and optimize wellness',
    iconName: 'scale',
    iconColor: '#16A34A',
  },
  {
    goal: 'LOSE_WEIGHT',
    title: 'Lose Weight',
    desc: 'Healthy, sustainable fat loss & active metabolism',
    iconName: 'trending-down',
    iconColor: '#0EA5E9',
  },
  {
    goal: 'GAIN_WEIGHT',
    title: 'Gain Weight',
    desc: 'Build healthy muscle mass and body strength',
    iconName: 'trending-up',
    iconColor: '#F97316',
  },
  {
    goal: 'GENERAL_WELLNESS',
    title: 'General Wellness',
    desc: 'Focus on heart health, stamina, and daily habits',
    iconName: 'heart',
    iconColor: '#8B5CF6',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [tempPhotoUri, setTempPhotoUri] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  // Form State: Populated from user signup or kept clean for genuine metrics
  const rawFirstName = user?.fullName?.split(' ')[0] || '';
  const rawLastName = user?.fullName?.split(' ').slice(1).join(' ') || '';

  const [profilePhoto, setProfilePhoto] = useState<string>(user?.profilePhoto || '');
  const [firstName, setFirstName] = useState(rawFirstName !== 'Health' ? rawFirstName : '');
  const [lastName, setLastName] = useState(rawLastName.toLowerCase() !== 'user' ? rawLastName : '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<BiologicalSex | null>(null);

  // Step 2: Physical Metrics
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');

  // Step 3: Activity (default to MODERATELY_ACTIVE)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('MODERATELY_ACTIVE');

  // Step 4: Health Preferences (default to GENERAL_WELLNESS)
  const [healthGoal, setHealthGoal] = useState<HealthGoalPreference>('GENERAL_WELLNESS');
  const [waterMl, setWaterMl] = useState(2500);
  const [stepGoal, setStepGoal] = useState(8000);
  const [sleepHours, setSleepHours] = useState(8);

  // Step 5: Emergency & Medical
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  // Sync from authenticated user when profile hydrates
  useEffect(() => {
    if (!firstName && user?.fullName) {
      const parts = user.fullName.trim().split(' ');
      if (parts[0] && parts[0] !== 'Health') setFirstName(parts[0]);
      if (parts.length > 1 && parts.slice(1).join(' ').toLowerCase() !== 'user') {
        setLastName(parts.slice(1).join(' '));
      }
    }
    if (!profilePhoto && user?.profilePhoto) {
      setProfilePhoto(user.profilePhoto);
    }
  }, [user]);

  // Pre-load saved details from backend if existing
  useEffect(() => {
    (async () => {
      try {
        const p = await profileService.getProfile();
        if (p) {
          if (p.profilePhoto) setProfilePhoto(p.profilePhoto);
          if (p.firstName && p.firstName !== 'Health') setFirstName(p.firstName);
          if (p.lastName && p.lastName.toLowerCase() !== 'user') setLastName(p.lastName);
          if (p.dateOfBirth) {
            const dobStr =
              typeof p.dateOfBirth === 'string'
                ? p.dateOfBirth.split('T')[0]
                : new Date(p.dateOfBirth).toISOString().split('T')[0];
            setDateOfBirth(dobStr);
          }
          if (p.biologicalSex) setGender(p.biologicalSex);
          if (p.heightCm) setHeightCm(String(p.heightCm));
          if (p.weightKg) setWeightKg(String(p.weightKg));
          if (p.targetWeightKg) setTargetWeightKg(String(p.targetWeightKg));
          if (p.activityLevel) setActivityLevel(p.activityLevel);
          if (p.healthGoal) setHealthGoal(p.healthGoal);
          if (p.preferredWaterIntakeMl) setWaterMl(p.preferredWaterIntakeMl);
          if (p.preferredStepGoal) setStepGoal(p.preferredStepGoal);
          if (p.preferredSleepGoalHours) setSleepHours(p.preferredSleepGoalHours);
          if (p.emergencyContactName) setEmergencyName(p.emergencyContactName);
          if (p.emergencyContactPhone) setEmergencyPhone(p.emergencyContactPhone);
          if (p.medicalNotes) setMedicalNotes(p.medicalNotes);
        }
      } catch {
        // Fallback clean state
      }
    })();
  }, []);

  // Smart Date Parser (handles YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY)
  const parseDateOfBirth = (val: string): Date | null => {
    if (!val) return null;
    const clean = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
        return date;
      }
    }
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split(/[-/]/).map(Number);
      const date = new Date(y, m - 1, d);
      if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
        return date;
      }
    }
    const parsed = new Date(clean);
    return !isNaN(parsed.getTime()) ? parsed : null;
  };

  // Calculate age from date of birth
  const getCalculatedAge = (): number | null => {
    const birthDate = parseDateOfBirth(dateOfBirth);
    if (!birthDate) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 && age < 120 ? age : null;
  };

  // Height parser: auto-converts feet (e.g. 5.9, 5.8) to cm
  const parseHeightCm = (raw: string): number | null => {
    if (!raw || !raw.trim()) return null;
    const clean = raw.trim().replace(/,/g, '.');
    const num = parseFloat(clean);
    if (isNaN(num) || num <= 0) return null;
    if (num <= 8.5) {
      return Math.round(num * 30.48);
    }
    return Math.round(num);
  };

  // Live BMI Preview calculation: ONLY when user actually inputs both height and weight
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

    return {
      val: bmi.toFixed(2),
      category,
      color,
      hCm: h,
      idealRange: `${minIdeal} – ${maxIdeal} kg`,
    };
  };

  // Live TDEE calculation (Mifflin-St Jeor): ONLY when physical data is entered
  const getPreviewCalories = () => {
    const w = parseFloat(weightKg.trim().replace(/,/g, '.'));
    const h = parseHeightCm(heightCm);
    const a = getCalculatedAge();
    if (!w || !h || !a) return null;

    let bmr = 10 * w + 6.25 * h - 5 * a + (gender === 'FEMALE' ? -161 : 5);
    const factors: Record<ActivityLevel, number> = {
      SEDENTARY: 1.2,
      LIGHTLY_ACTIVE: 1.375,
      MODERATELY_ACTIVE: 1.55,
      VERY_ACTIVE: 1.725,
      EXTRA_ACTIVE: 1.9,
    };
    const tdee = Math.round(bmr * (factors[activityLevel || 'MODERATELY_ACTIVE'] || 1.55));
    let target = tdee;
    if (healthGoal === 'LOSE_WEIGHT') target = Math.max(1200, tdee - 400);
    else if (healthGoal === 'GAIN_WEIGHT') target = tdee + 350;
    return { bmr: Math.round(bmr), tdee, target };
  };

  // Photo Picker with Cropping
  const handlePickPhoto = async () => {
    if (Platform.OS === 'web') {
      try {
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.85,
        });
        if (!res.canceled && res.assets[0]?.uri) {
          setTempPhotoUri(res.assets[0].uri);
          setPreviewModalVisible(true);
        }
      } catch (err: any) {
        if (typeof window !== 'undefined') {
          window.alert(err?.message || 'Could not pick image.');
        }
      }
      return;
    }

    Alert.alert('Profile Photo', 'Select your photo source', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required.');
            return;
          }
          const res = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (!res.canceled && res.assets[0]?.uri) {
            setTempPhotoUri(res.assets[0].uri);
            setPreviewModalVisible(true);
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery permission is required.');
            return;
          }
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (!res.canceled && res.assets[0]?.uri) {
            setTempPhotoUri(res.assets[0].uri);
            setPreviewModalVisible(true);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadPhoto = async (uri: string) => {
    setUploadingPhoto(true);
    try {
      const res = await profileService.uploadAvatar(uri);
      if (res.profilePhoto) {
        setProfilePhoto(res.profilePhoto);
        if (user) {
          useAuthStore.getState().setUser({
            ...user,
            profilePhoto: res.profilePhoto,
          });
        }
      }
      setPreviewModalVisible(false);
      setTempPhotoUri(null);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Profile photo saved successfully!');
      } else {
        Alert.alert('Success', 'Profile photo saved successfully!');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Could not upload photo to Cloudinary.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Upload Error', msg);
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const showWarning = (msg: string) => {
    setStepError(msg);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(msg);
    } else {
      Alert.alert('Please Note', msg);
    }
  };

  // Next Step / Finish
  const handleNext = async () => {
    setStepError(null);

    // Validation for Step 1
    if (step === 1) {
      if (!firstName.trim()) {
        showWarning('First name is required to personalize your health profile.');
        return;
      }
      if (!gender) {
        showWarning('Please select your biological sex to calibrate your Living Health Avatar.');
        return;
      }
      if (dateOfBirth && dateOfBirth.trim()) {
        const age = getCalculatedAge();
        if (age === null || age < 5 || age > 115) {
          showWarning('Please enter a valid birth date (YYYY-MM-DD).');
          return;
        }
      }
    }

    // Validation for Step 2
    if (step === 2) {
      if (heightCm.trim()) {
        const h = parseHeightCm(heightCm);
        if (!h || h < 40 || h > 300) {
          showWarning('Please enter a valid height (e.g. 175 cm or 5.9 ft).');
          return;
        }
      }
      if (weightKg.trim()) {
        const w = parseFloat(weightKg.trim().replace(/,/g, '.'));
        if (isNaN(w) || w < 15 || w > 400) {
          showWarning('Please enter a valid weight in kg (e.g. 70 kg).');
          return;
        }
      }
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    // Final Step 5: Save & Complete
    setSaving(true);
    try {
      const payload: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        activityLevel: activityLevel || 'MODERATELY_ACTIVE',
        healthGoal: healthGoal || 'GENERAL_WELLNESS',
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
      if (gender) {
        payload.biologicalSex = gender;
      }
      if (profilePhoto) {
        payload.profilePhoto = profilePhoto;
      }
      const parsedH = parseHeightCm(heightCm);
      if (parsedH) {
        payload.heightCm = parsedH;
      }
      if (weightKg.trim()) {
        const parsedW = parseFloat(weightKg.trim().replace(/,/g, '.'));
        if (!isNaN(parsedW) && parsedW > 0) {
          payload.weightKg = parsedW;
        }
      }
      if (targetWeightKg.trim()) {
        const parsedTW = parseFloat(targetWeightKg.trim().replace(/,/g, '.'));
        if (!isNaN(parsedTW) && parsedTW > 0) {
          payload.targetWeightKg = parsedTW;
        }
      }

      const res = await profileService.completeOnboarding(payload);

      // Also update auth user if photo changed
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          profilePhoto: res.profilePhoto || currentUser.profilePhoto,
        });
      }

      // Transition straight into the protected dashboard
      router.replace('/(protected)/home');
    } catch (err: any) {
      console.error('Onboarding save error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save onboarding data. Please check your connection.';
      showWarning(msg);
    } finally {
      setSaving(false);
    }
  };

  // Skip Onboarding
  const handleSkip = () => {
    if (Platform.OS === 'web') {
      const confirmSkip =
        typeof window !== 'undefined'
          ? window.confirm(
              'Skip Health Setup?\nYou can configure or edit all health preferences anytime under Health Profile.'
            )
          : true;

      if (confirmSkip) {
        (async () => {
          try {
            await profileService.skipOnboarding();
          } catch {
            // Non-blocking
          }
          router.replace('/(protected)/home');
        })();
      }
      return;
    }

    Alert.alert(
      'Skip Health Setup?',
      'You can configure or edit all health preferences anytime under Health Profile.',
      [
        { text: 'Continue Setup', style: 'cancel' },
        {
          text: 'Skip for Now',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileService.skipOnboarding();
            } catch {
              // Non-blocking
            }
            router.replace('/(protected)/home');
          },
        },
      ]
    );
  };

  const topPadding =
    Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight || 28) + 12
      : Math.max(insets.top, 20) + 6;

  const progressPercent = (step / TOTAL_STEPS) * 100;
  const calculatedAge = getCalculatedAge();
  const liveBmi = getPreviewBmi();
  const liveCal = getPreviewCalories();

  // Helper renderer for activity icons
  const renderActivityIcon = (name: string, isSelected: boolean) => {
    const iconColor = isSelected ? colors.primary : '#64748B';
    switch (name) {
      case 'coffee':
        return <Coffee size={22} color={iconColor} />;
      case 'footprints':
        return <Footprints size={22} color={isSelected ? colors.primary : '#0EA5E9'} />;
      case 'activity':
        return <Activity size={22} color={isSelected ? colors.primary : '#16A34A'} />;
      case 'flame':
        return <Flame size={22} color={isSelected ? colors.primary : '#F97316'} />;
      case 'zap':
        return <Zap size={22} color={isSelected ? colors.primary : '#8B5CF6'} />;
      default:
        return <Activity size={22} color={iconColor} />;
    }
  };

  // Helper renderer for goal icons
  const renderGoalIcon = (name: string, isSelected: boolean) => {
    switch (name) {
      case 'scale':
        return <Scale size={22} color={isSelected ? colors.primary : '#16A34A'} />;
      case 'trending-down':
        return <TrendingDown size={22} color={isSelected ? colors.primary : '#0EA5E9'} />;
      case 'trending-up':
        return <TrendingUp size={22} color={isSelected ? colors.primary : '#F97316'} />;
      case 'heart':
        return <Heart size={22} color={isSelected ? colors.primary : '#8B5CF6'} />;
      default:
        return <Target size={22} color={isSelected ? colors.primary : '#16A34A'} />;
    }
  };

  return (
    <View style={[styles.screenContainer, { paddingTop: topPadding }]}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>Step {step} of 5</Text>
        </View>

        <Image
          source={require('../../../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar Track */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>

      {/* Wizard Content Steps */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= STEP 1: PERSONAL & DEMOGRAPHIC ================= */}
        {step === 1 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Personalize Your Profile</Text>
            <Text style={styles.stepSubtitle}>
              Accurate personal demographics ensure medical formulas calculate your health scores correctly.
            </Text>

            {/* Profile Avatar Upload */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={handlePickPhoto}
                style={styles.avatarCircle}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator color={colors.primary} />
                ) : profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
                ) : (
                  <User size={38} color={colors.primary} />
                )}
                <View style={styles.cameraIconBadge}>
                  <Camera size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHintText}>Tap to add your profile photo</Text>
            </View>

            {/* First & Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.inputBox}
                value={firstName}
                onChangeText={(val) => {
                  setFirstName(val);
                  setStepError(null);
                }}
                placeholder="e.g. Gokul"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name (Optional)</Text>
              <TextInput
                style={styles.inputBox}
                value={lastName}
                onChangeText={(val) => {
                  setLastName(val);
                  setStepError(null);
                }}
                placeholder="e.g. Nath"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
              <View style={styles.inputWithIcon}>
                <Calendar size={18} color={colors.primary} style={styles.fieldIcon} />
                <TextInput
                  style={styles.inputBoxWithIcon}
                  value={dateOfBirth}
                  onChangeText={(val) => {
                    setDateOfBirth(val);
                    setStepError(null);
                  }}
                  placeholder="e.g. 2002-05-15"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.helperText}>
                {calculatedAge !== null ? (
                  <>
                    Calculated Age: <Text style={styles.helperHighlight}>{calculatedAge} years</Text>
                  </>
                ) : (
                  'Enter birth date to auto-calculate your age'
                )}
              </Text>
            </View>

            {/* Biological Sex */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Biological Sex</Text>
              <View style={styles.pillsRow}>
                {(['MALE', 'FEMALE', 'OTHER'] as BiologicalSex[]).map((s) => {
                  const isSelected = gender === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.choicePill, isSelected && styles.choicePillActive]}
                      onPress={() => {
                        setGender(s);
                        setStepError(null);
                      }}
                    >
                      {s === 'MALE' ? (
                        <User
                          size={16}
                          color={isSelected ? colors.primary : colors.secondaryText}
                          style={{ marginRight: 6 }}
                        />
                      ) : s === 'FEMALE' ? (
                        <UserRound
                          size={16}
                          color={isSelected ? colors.primary : colors.secondaryText}
                          style={{ marginRight: 6 }}
                        />
                      ) : (
                        <Users
                          size={16}
                          color={isSelected ? colors.primary : colors.secondaryText}
                          style={{ marginRight: 6 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.choicePillText,
                          isSelected && styles.choicePillTextActive,
                        ]}
                      >
                        {s === 'MALE' ? 'Male' : s === 'FEMALE' ? 'Female' : 'Other'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 2: PHYSICAL METRICS ================= */}
        {step === 2 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Physical Baseline</Text>
            <Text style={styles.stepSubtitle}>
              Standard metric measurements (kg and cm) give you precision body mass analytics.
            </Text>

            {/* Height Input */}
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
                  onChangeText={(val) => {
                    setHeightCm(val);
                    setStepError(null);
                  }}
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

            {/* Current Weight Input */}
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
                  onChangeText={(val) => {
                    setWeightKg(val);
                    setStepError(null);
                  }}
                  placeholder="e.g. 70"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.metricUnit}>kg</Text>
            </View>

            {/* Target Weight Input (Optional) */}
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
                  onChangeText={(val) => {
                    setTargetWeightKg(val);
                    setStepError(null);
                  }}
                  placeholder="e.g. 65"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <Text style={styles.metricUnit}>kg</Text>
            </View>

            {/* Live BMI Preview Card: ONLY shows once user types height & weight */}
            {liveBmi ? (
              <View style={styles.livePreviewCard}>
                <View style={styles.livePreviewLeft}>
                  <Text style={styles.livePreviewTitle}>Initial Baseline BMI</Text>
                  <Text style={styles.livePreviewSub}>
                    Calculated from {weightKg} kg & {liveBmi.hCm} cm
                  </Text>
                  <Text style={styles.liveIdealRange}>
                    Normal range: <Text style={{ fontWeight: '700', color: '#16A34A' }}>{liveBmi.idealRange}</Text>
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
            ) : (
              <View style={styles.emptyMetricHint}>
                <Scale size={16} color={colors.secondaryText} style={{ marginRight: 6 }} />
                <Text style={styles.emptyMetricHintText}>
                  Type your height (cm/ft) and weight (kg) above to preview your baseline BMI.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ================= STEP 3: ACTIVITY LEVEL ================= */}
        {step === 3 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Daily Activity & Lifestyle</Text>
            <Text style={styles.stepSubtitle}>
              Select your typical weekly physical exertion level to calculate your energy expenditure.
            </Text>

            <View style={styles.activityList}>
              {ACTIVITY_CHOICES.map((item) => {
                const isSelected = activityLevel === item.level;
                return (
                  <TouchableOpacity
                    key={item.level}
                    style={[styles.activityCard, isSelected && styles.activityCardSelected]}
                    onPress={() => setActivityLevel(item.level)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.iconCircleBox}>
                      {renderActivityIcon(item.iconName, isSelected)}
                    </View>
                    <View style={styles.activityTextWrap}>
                      <Text
                        style={[
                          styles.activityCardTitle,
                          isSelected && styles.activityCardTitleSelected,
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.activityCardDesc}>{item.desc}</Text>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ================= STEP 4: HEALTH GOALS & HABITS ================= */}
        {step === 4 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Health Goals & Habits</Text>
            <Text style={styles.stepSubtitle}>
              Set smart daily targets tailored to your health aspiration.
            </Text>

            {/* Goal Selector Grid */}
            <Text style={styles.subSectionTitle}>Primary Goal</Text>
            <View style={styles.goalGrid}>
              {GOAL_CHOICES.map((item) => {
                const isSelected = healthGoal === item.goal;
                return (
                  <TouchableOpacity
                    key={item.goal}
                    style={[styles.goalGridCard, isSelected && styles.goalGridCardSelected]}
                    onPress={() => setHealthGoal(item.goal)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.goalIconWrap}>
                      {renderGoalIcon(item.iconName, isSelected)}
                    </View>
                    <Text
                      style={[
                        styles.goalGridTitle,
                        isSelected && styles.goalGridTitleSelected,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.goalGridDesc}>{item.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Daily Habit Steppers */}
            <Text style={[styles.subSectionTitle, { marginTop: 16 }]}>Daily Targets</Text>

            {/* Water Target */}
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

            {/* Step Target */}
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

            {/* Sleep Target */}
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

            {/* Energy Target Banner: Only if user entered physical measurements */}
            {liveCal && (
              <View style={styles.energyBanner}>
                <Flame size={20} color="#F97316" />
                <View style={styles.energyContent}>
                  <Text style={styles.energyTitle}>
                    Estimated Daily Energy Burn: {liveCal.tdee} kcal
                  </Text>
                  <Text style={styles.energySub}>
                    Suggested Daily Intake Target: {liveCal.target} kcal/day
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ================= STEP 5: EMERGENCY & MEDICAL NOTES ================= */}
        {step === 5 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>Emergency & Medical Safety</Text>
            <Text style={styles.stepSubtitle}>
              Optional and confidential. Enables quick emergency response and health safety.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Emergency Contact Name (Optional)</Text>
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
              <Text style={styles.inputLabel}>Emergency Phone Number (Optional)</Text>
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
              <Text style={styles.inputLabel}>Private Medical Notes & Allergies (Optional)</Text>
              <View style={[styles.inputWithIcon, { alignItems: 'flex-start' }]}>
                <FileText size={18} color={colors.primary} style={[styles.fieldIcon, { marginTop: 12 }]} />
                <TextInput
                  style={[styles.inputBoxWithIcon, styles.textAreaInput]}
                  multiline
                  numberOfLines={4}
                  value={medicalNotes}
                  onChangeText={setMedicalNotes}
                  placeholder="e.g. Asthma, Penicillin allergy, taking daily vitamins..."
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Celebration Preview */}
            <View style={styles.finishCelebrationCard}>
              <Sparkles size={28} color="#16A34A" />
              <Text style={styles.finishCelebrationTitle}>You're All Set!</Text>
              <Text style={styles.finishCelebrationText}>
                Your personalized smart health dashboard is ready to track your vitality every single day.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Inline Warning Notice */}
      {stepError && (
        <View style={styles.errorNoticeBar}>
          <AlertCircle size={16} color="#DC2626" />
          <Text style={styles.errorNoticeBarText}>{stepError}</Text>
        </View>
      )}

      {/* Bottom Action Footer */}
      <View style={styles.footerRow}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setStepError(null);
              setStep(step - 1);
            }}
            activeOpacity={0.8}
          >
            <ArrowLeft size={18} color={colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, step === 1 && { flex: 1 }]}
          onPress={handleNext}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.nextButtonInner}>
              <Text style={styles.nextButtonText}>
                {step === TOTAL_STEPS ? 'Complete Setup' : 'Continue'}
              </Text>
              {step < TOTAL_STEPS && <ArrowRight size={18} color="#FFFFFF" />}
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Profile Photo Preview & Confirmation Modal */}
      <Modal
        visible={previewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!uploadingPhoto) setPreviewModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Set Profile Photo</Text>
              <TouchableOpacity
                onPress={() => setPreviewModalVisible(false)}
                disabled={uploadingPhoto}
                style={styles.modalCloseBtn}
                accessibilityLabel="Close"
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Preview your photo below. Tap <Text style={{ fontWeight: '700', color: '#16A34A' }}>Save Profile Photo</Text> to confirm and update your avatar.
            </Text>

            {/* Circular Preview */}
            <View style={styles.previewCircleContainer}>
              {tempPhotoUri ? (
                <Image
                  source={{ uri: tempPhotoUri }}
                  style={styles.previewCircleImage}
                  resizeMode="cover"
                />
              ) : null}
              <View style={styles.previewCircleRing} />
            </View>

            {/* Primary Action: Done / Save Button */}
            <TouchableOpacity
              style={styles.savePhotoButton}
              onPress={async () => {
                if (tempPhotoUri) {
                  await uploadPhoto(tempPhotoUri);
                }
              }}
              disabled={uploadingPhoto}
              activeOpacity={0.85}
            >
              {uploadingPhoto ? (
                <View style={styles.buttonInlineRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.savePhotoButtonText}>Saving to Cloudinary...</Text>
                </View>
              ) : (
                <View style={styles.buttonInlineRow}>
                  <Check size={20} color="#FFFFFF" />
                  <Text style={styles.savePhotoButtonText}>Save Profile Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Secondary Action: Choose Another Photo */}
            <TouchableOpacity
              style={styles.chooseAnotherButton}
              onPress={handlePickPhoto}
              disabled={uploadingPhoto}
              activeOpacity={0.8}
            >
              <Camera size={18} color={colors.primary} />
              <Text style={styles.chooseAnotherButtonText}>Choose Another Photo</Text>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setPreviewModalVisible(false)}
              disabled={uploadingPhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  stepBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  logo: {
    width: 100,
    height: 34,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  stepSection: {
    gap: 14,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -0.4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: colors.secondaryText,
    lineHeight: 19,
    marginTop: -4,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#BBF7D0',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
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
    fontSize: 12,
    color: colors.secondaryText,
  },
  helperHighlight: {
    color: colors.primary,
    fontWeight: '700',
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
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#F8FAFC',
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryText,
    paddingVertical: 2,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  fieldConversionHelper: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: -6,
    marginLeft: 4,
    fontWeight: '500',
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
    marginTop: 6,
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
  emptyMetricHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyMetricHintText: {
    fontSize: 12,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  activityList: {
    gap: 10,
    marginTop: 4,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  activityCardSelected: {
    backgroundColor: '#FAFDFB',
    borderColor: colors.primary,
  },
  iconCircleBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityTextWrap: {
    flex: 1,
  },
  activityCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
  },
  activityCardTitleSelected: {
    color: colors.primary,
  },
  activityCardDesc: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
    marginTop: 6,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  goalGridCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
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
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
    lineHeight: 15,
  },
  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
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
  energyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginTop: 14,
  },
  energyContent: {
    flex: 1,
  },
  energyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C2410C',
  },
  energySub: {
    fontSize: 11,
    color: '#EA580C',
    marginTop: 2,
    fontWeight: '600',
  },
  finishCelebrationCard: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginTop: 8,
    gap: 8,
  },
  finishCelebrationTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  finishCelebrationText: {
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  errorNoticeBarText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  modalDescription: {
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  previewCircleContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#E8F3EC',
  },
  previewCircleImage: {
    width: '100%',
    height: '100%',
  },
  previewCircleRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  buttonInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  savePhotoButton: {
    width: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },
  savePhotoButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chooseAnotherButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  chooseAnotherButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  cancelModalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelModalButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
