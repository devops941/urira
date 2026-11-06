import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Check,
  Plus,
  RefreshCw,
  Info,
  Footprints,
  Droplets,
  Moon,
  Scale,
  Flame,
  Activity,
  CheckCircle2,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { LoadingState } from '../../../components/common/LoadingState';
import { aiService } from '../../../services/ai/aiService';
import { goalsService } from '../../../services/health/goalsService';
import {
  AiGoalSuggestionsResponse,
  AiGoalSuggestionItem,
  AiGoalCategory,
} from '../../../types/ai';
import { colors } from '../../../theme/colors';

const CATEGORY_COLORS: Record<AiGoalCategory, string> = {
  STEPS: '#0EA5E9',
  SLEEP: '#8B5CF6',
  WATER: '#06B6D4',
  CALORIES: '#F97316',
  WEIGHT: '#12372A',
  BMI: '#16A34A',
  HABIT: '#16A34A',
};

export default function AiGoalSuggestionsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [data, setData] = useState<AiGoalSuggestionsResponse | null>(null);
  const [addedGoals, setAddedGoals] = useState<Record<number, boolean>>({});
  const [addingIndex, setAddingIndex] = useState<number | null>(null);

  const fetchSuggestions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRegenerating(true);
    else setLoading(true);

    try {
      const response = await aiService.suggestGoals();
      setData(response);
      setAddedGoals({});
    } catch (err: any) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(err?.message || 'Unable to generate AI goal suggestions.');
      } else {
        Alert.alert('AI Error', err?.message || 'Unable to generate AI goal suggestions.');
      }
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleAddGoal = async (item: AiGoalSuggestionItem, index: number) => {
    setAddingIndex(index);
    try {
      const now = new Date();
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + item.durationDays);

      await goalsService.createGoal({
        title: item.title,
        category: item.category as any,
        targetValue: item.targetValue,
        initialValue: item.initialValue,
        currentValue: item.initialValue,
        unit: item.unit,
        startDate: now.toISOString(),
        targetDate: targetDate.toISOString(),
        notes: `AI Recommendation: ${item.reason}`,
      });

      setAddedGoals((prev) => ({ ...prev, [index]: true }));

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Non-blocking toast/log
      } else {
        Alert.alert('Goal Added', `"${item.title}" is now active in your health goals!`);
      }
    } catch (err: any) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(err?.message || 'Failed to save goal.');
      } else {
        Alert.alert('Error', err?.message || 'Failed to save goal.');
      }
    } finally {
      setAddingIndex(null);
    }
  };

  const getCategoryIcon = (category: AiGoalCategory) => {
    const iconColor = CATEGORY_COLORS[category] || colors.primary;
    switch (category) {
      case 'STEPS':
        return <Footprints size={20} color={iconColor} />;
      case 'WATER':
        return <Droplets size={20} color={iconColor} />;
      case 'SLEEP':
        return <Moon size={20} color={iconColor} />;
      case 'CALORIES':
        return <Flame size={20} color={iconColor} />;
      case 'WEIGHT':
      case 'BMI':
        return <Scale size={20} color={iconColor} />;
      default:
        return <Activity size={20} color={iconColor} />;
    }
  };

  if (loading) {
    return (
      <View style={styles.screenContainer}>
        <AppHeader title="AI Goal Suggestions" />
        <LoadingState message="Analyzing your health profile & generating personalized goals..." />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <AppHeader
        title="AI Goal Suggestions"
        rightAction={
          <TouchableOpacity
            style={styles.refreshHeaderBtn}
            onPress={() => fetchSuggestions(true)}
            disabled={regenerating}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {regenerating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <RefreshCw size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top AI Intro Banner */}
        <View style={styles.introCard}>
          <View style={styles.sparkleCircle}>
            <Sparkles size={24} color="#16A34A" />
          </View>
          <View style={styles.introContent}>
            <Text style={styles.introTitle}>Personalized For You</Text>
            <Text style={styles.introText}>
              {data?.summary ||
                'Here are intelligent, clinically guided recommendations designed around your current physical metrics.'}
            </Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Suggested Milestones</Text>
          <Text style={styles.sectionSubtitle}>
            {data?.suggestions.length || 0} Targets Available
          </Text>
        </View>

        {/* Suggestion Cards */}
        {data?.suggestions.map((item, index) => {
          const isAdded = !!addedGoals[index];
          const isAdding = addingIndex === index;
          const categoryColor = CATEGORY_COLORS[item.category] || colors.primary;

          return (
            <View key={index} style={styles.goalCard}>
              {/* Card Header Row */}
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.categoryIconWrap,
                    { backgroundColor: `${categoryColor}15` },
                  ]}
                >
                  {getCategoryIcon(item.category)}
                </View>
                <View style={styles.cardHeaderTextWrap}>
                  <Text style={styles.goalTitle}>{item.title}</Text>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: `${categoryColor}20` },
                      ]}
                    >
                      <Text
                        style={[styles.categoryBadgeText, { color: categoryColor }]}
                      >
                        {item.category}
                      </Text>
                    </View>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationBadgeText}>
                        {item.durationDays} Days Duration
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Target Highlight Box */}
              <View style={styles.targetBox}>
                <View style={styles.targetMetricCol}>
                  <Text style={styles.targetMetricLabel}>Starting Point</Text>
                  <Text style={styles.targetMetricVal}>
                    {item.initialValue.toLocaleString()} {item.unit}
                  </Text>
                </View>
                <View style={styles.targetDivider} />
                <View style={styles.targetMetricCol}>
                  <Text style={styles.targetMetricLabel}>Target Goal</Text>
                  <Text
                    style={[
                      styles.targetMetricVal,
                      { color: categoryColor, fontWeight: '800' },
                    ]}
                  >
                    {item.targetValue.toLocaleString()} {item.unit}
                  </Text>
                </View>
              </View>

              {/* Rationale Section */}
              <Text style={styles.sectionLabel}>Why this helps you:</Text>
              <Text style={styles.reasonText}>{item.reason}</Text>

              {/* Daily Actions Checklist */}
              <Text style={[styles.sectionLabel, { marginTop: 10 }]}>
                Daily Action Plan:
              </Text>
              {item.dailyActions.map((action, actionIdx) => (
                <View key={actionIdx} style={styles.actionItemRow}>
                  <CheckCircle2 size={16} color="#16A34A" style={styles.checkIcon} />
                  <Text style={styles.actionText}>{action}</Text>
                </View>
              ))}

              {/* Safety Note if any */}
              {item.safetyNotes.length > 0 && (
                <View style={styles.safetyBox}>
                  <Info size={14} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.safetyText}>
                    {item.safetyNotes.join(' • ')}
                  </Text>
                </View>
              )}

              {/* Add Button */}
              <TouchableOpacity
                style={[
                  styles.addGoalBtn,
                  isAdded && styles.addGoalBtnSuccess,
                  isAdding && { opacity: 0.7 },
                ]}
                onPress={() => !isAdded && handleAddGoal(item, index)}
                disabled={isAdded || isAdding}
                activeOpacity={0.85}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : isAdded ? (
                  <View style={styles.btnInnerRow}>
                    <Check size={18} color="#FFFFFF" />
                    <Text style={styles.addGoalBtnText}>Added to Active Goals</Text>
                  </View>
                ) : (
                  <View style={styles.btnInnerRow}>
                    <Plus size={18} color="#FFFFFF" />
                    <Text style={styles.addGoalBtnText}>Accept & Add to Goals</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Medical Disclaimer Card */}
        <View style={styles.disclaimerCard}>
          <Info size={18} color={colors.secondaryText} style={{ marginTop: 2 }} />
          <Text style={styles.disclaimerText}>
            {data?.disclaimer ||
              'Informational wellness suggestions only. Consult a physician before starting any rigorous fitness or nutrition regimen.'}
          </Text>
        </View>

        {/* Bottom Regenerate CTA */}
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={() => fetchSuggestions(true)}
          disabled={regenerating}
          activeOpacity={0.8}
        >
          {regenerating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.btnInnerRow}>
              <RefreshCw size={18} color={colors.primary} />
              <Text style={styles.regenerateBtnText}>Regenerate New Suggestions</Text>
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
  refreshHeaderBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#E8F3EC',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F3EC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1E7DD',
  },
  sparkleCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#12372A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  introContent: {
    flex: 1,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 3,
  },
  introText: {
    fontSize: 12.5,
    color: colors.primaryText,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryText,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#12372A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.primaryText,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  targetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  targetMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  targetDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  targetMetricLabel: {
    fontSize: 11,
    color: colors.secondaryText,
    marginBottom: 2,
  },
  targetMetricVal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 12.5,
    color: colors.secondaryText,
    lineHeight: 18,
    marginBottom: 4,
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkIcon: {
    marginRight: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.primaryText,
    lineHeight: 17,
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  safetyText: {
    flex: 1,
    fontSize: 11.5,
    color: colors.secondaryText,
    lineHeight: 16,
  },
  addGoalBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  addGoalBtnSuccess: {
    backgroundColor: '#16A34A',
  },
  addGoalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11.5,
    color: colors.secondaryText,
    lineHeight: 17,
  },
  regenerateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginTop: 4,
    marginBottom: 20,
  },
  regenerateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
  },
});

