import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Calendar, ChevronDown } from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { goalsService } from '../../../services/health/goalsService';
import { GoalCategory } from '../../../types/health';
import { colors } from '../../../theme/colors';

const CATEGORY_OPTIONS: { label: string; value: GoalCategory; unit: string; placeholder: string }[] = [
  { label: 'Weight', value: 'WEIGHT', unit: 'kg', placeholder: '67' },
  { label: 'Steps', value: 'STEPS', unit: 'steps', placeholder: '10000' },
  { label: 'Water', value: 'WATER', unit: 'ml', placeholder: '3000' },
  { label: 'Sleep', value: 'SLEEP', unit: 'hours', placeholder: '8' },
  { label: 'Calories', value: 'CALORIES', unit: 'kcal', placeholder: '2000' },
  { label: 'Healthy Habit', value: 'HABIT', unit: 'days', placeholder: '30' },
];

export default function CreateGoalScreen() {
  const router = useRouter();

  const [category, setCategory] = useState<GoalCategory>('WEIGHT');
  const [title, setTitle] = useState('Lose 3 kg');
  const [targetValue, setTargetValue] = useState('67');
  const [initialValue, setInitialValue] = useState('70');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Maintain a balanced diet and daily activity.');

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCategoryMeta = CATEGORY_OPTIONS.find((c) => c.value === category)!;

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a goal title.');
      return;
    }
    const target = parseFloat(targetValue);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid numeric target value.');
      return;
    }
    const initial = parseFloat(initialValue) || target;

    setSaving(true);
    try {
      await goalsService.createGoal({
        title: title.trim(),
        category,
        targetValue: target,
        initialValue: initial,
        currentValue: initial,
        unit: selectedCategoryMeta.unit,
        startDate,
        targetDate,
        notes: notes.trim(),
      });

      if (Platform.OS === 'web') {
        router.back();
      } else {
        Alert.alert('Goal Created', 'Your new health goal has been set!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(err?.message || 'Failed to create goal.');
      } else {
        Alert.alert('Error', err?.message || 'Failed to create goal.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <AppHeader title="Create Goal" />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Goal Category Dropdown Card */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Goal Category</Text>
            <TouchableOpacity
              style={styles.pickerInputCard}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              activeOpacity={0.75}
            >
              <Text style={styles.pickerText}>{selectedCategoryMeta.label}</Text>
              <ChevronDown size={18} color={colors.secondaryText} />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.dropdownModal}>
                {CATEGORY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.dropdownItem,
                      category === opt.value && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setCategory(opt.value);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        category === opt.value && styles.dropdownItemTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Goal Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Goal Title</Text>
            <View style={styles.textInputCard}>
              <TextInput
                style={styles.textInputField}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Lose 3 kg"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Target Value */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Target {category === 'WEIGHT' ? 'Weight (kg)' : `Value (${selectedCategoryMeta.unit})`}
            </Text>
            <View style={styles.textInputCard}>
              <TextInput
                style={styles.textInputField}
                keyboardType="numeric"
                value={targetValue}
                onChangeText={setTargetValue}
                placeholder={selectedCategoryMeta.placeholder}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Start Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Start Date</Text>
            <View style={[styles.textInputCard, styles.dateRowCard]}>
              <TextInput
                style={[styles.textInputField, { flex: 1 }]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
              />
              <Calendar size={18} color={colors.secondaryText} />
            </View>
          </View>

          {/* Target Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Target Date</Text>
            <View style={[styles.textInputCard, styles.dateRowCard]}>
              <TextInput
                style={[styles.textInputField, { flex: 1 }]}
                value={targetDate}
                onChangeText={setTargetDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
              />
              <Calendar size={18} color={colors.secondaryText} />
            </View>
          </View>

          {/* Notes (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <View style={[styles.textInputCard, styles.multilineCard]}>
              <TextInput
                style={[styles.textInputField, styles.multilineInput]}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                placeholder="Maintain a balanced diet and daily activity."
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Save Goal Button */}
          <TouchableOpacity
            style={styles.saveGoalButton}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveGoalButtonText}>Save Goal</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36,
  },
  formContainer: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  pickerInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
  },
  dropdownModal: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    marginTop: 4,
  },
  dropdownItem: {
    paddingVertical: 9,
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
  textInputCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInputField: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    padding: 0,
  },
  multilineCard: {
    paddingVertical: 10,
  },
  multilineInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  saveGoalButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
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
  saveGoalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
