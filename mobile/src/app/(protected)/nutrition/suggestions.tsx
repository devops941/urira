import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Compass,
  ArrowRight,
  Flame,
  Dumbbell,
  Leaf,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { colors } from '../../../theme/colors';
import { dietService } from '../../../services/nutrition/dietService';
import { IDietSuggestionsResponse } from '../../../types/nutrition';

export default function DietSuggestionsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IDietSuggestionsResponse | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await dietService.getSuggestions();
        setData(res);
      } catch (err) {
        console.warn('Failed to load diet suggestions:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <View style={styles.container}>
      <AppHeader title="Diet Suggestions" showBack onBackPress={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Curating personalized diet recommendations...</Text>
          </View>
        ) : (
          <>
            {/* Preference & Allergy Guard Banner */}
            <View style={styles.guardBanner}>
              <View style={styles.guardHeader}>
                <Compass size={18} color={colors.primary} />
                <Text style={styles.guardTitle}>Tailored To Your Profile</Text>
              </View>
              <Text style={styles.guardMeta}>
                Diet Preference: <Text style={{ fontWeight: '700' }}>{data?.dietaryPreference || 'Any'}</Text>
              </Text>
              {data?.activeAllergens && data.activeAllergens.length > 0 ? (
                <View style={styles.allergenAlertRow}>
                  <ShieldAlert size={14} color="#EF4444" />
                  <Text style={styles.allergenAlertText}>
                    Strictly avoiding allergens: {data.activeAllergens.join(', ')}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Smart Healthy Alternatives (Food Swaps) */}
            <Text style={styles.sectionHeader}>Smart Healthy Alternatives</Text>
            <View style={styles.alternativesList}>
              {data?.alternatives.map((alt, idx) => (
                <View key={idx} style={styles.alternativeCard}>
                  <View style={styles.swapVisualRow}>
                    <View style={styles.swapFoodBox}>
                      <Text style={styles.swapFoodOld}>{alt.original}</Text>
                      <Text style={styles.swapTagOld}>Current</Text>
                    </View>
                    <ArrowRight size={18} color={colors.textSecondary} style={{ marginHorizontal: 8 }} />
                    <View style={styles.swapFoodBox}>
                      <Text style={styles.swapFoodNew}>{alt.substitute}</Text>
                      <Text style={styles.swapTagNew}>Smart Swap</Text>
                    </View>
                  </View>

                  <View style={styles.swapBenefitBox}>
                    <Text style={styles.swapBenefitValue}>{alt.caloriesDiff}</Text>
                    <Text style={styles.swapBenefitText}>{alt.fiberBenefit}</Text>
                  </View>
                  <Text style={styles.swapReason}>{alt.reason}</Text>
                </View>
              ))}
            </View>

            {/* High Protein Recommendations */}
            <Text style={styles.sectionHeader}>High-Protein Picks</Text>
            <View style={styles.picksGrid}>
              {data?.highProtein.map((item) => (
                <View key={item.foodId} style={styles.pickCard}>
                  <View style={styles.pickCardHeader}>
                    <View style={[styles.pickIconCircle, { backgroundColor: '#EFF6FF' }]}>
                      <Dumbbell size={16} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.pickFoodName}>{item.name}</Text>
                      <Text style={styles.pickServing}>{item.serving}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.pickCals, { color: '#2563EB' }]}>{item.protein}g P</Text>
                      <Text style={styles.pickSecCals}>{item.calories} kcal</Text>
                    </View>
                  </View>
                  <Text style={styles.pickReason}>{item.reason}</Text>
                </View>
              ))}
            </View>

            {/* High Fiber & Gut Health */}
            <Text style={styles.sectionHeader}>Fiber & Digestive Health</Text>
            <View style={styles.picksGrid}>
              {data?.highFiber.map((item) => (
                <View key={item.foodId} style={styles.pickCard}>
                  <View style={styles.pickCardHeader}>
                    <View style={[styles.pickIconCircle, { backgroundColor: '#F0FDF4' }]}>
                      <Leaf size={16} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.pickFoodName}>{item.name}</Text>
                      <Text style={styles.pickServing}>{item.serving}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.pickCals, { color: '#16A34A' }]}>{item.fiber}g Fiber</Text>
                      <Text style={styles.pickSecCals}>{item.calories} kcal</Text>
                    </View>
                  </View>
                  <Text style={styles.pickReason}>{item.reason}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  guardBanner: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4E9DC',
    marginBottom: 20,
  },
  guardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  guardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  guardMeta: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  allergenAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
  },
  allergenAlertText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 12,
  },
  alternativesList: {
    gap: 12,
    marginBottom: 24,
  },
  alternativeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  swapVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  swapFoodBox: {
    flex: 1,
  },
  swapFoodOld: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  swapTagOld: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  swapFoodNew: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  swapTagNew: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '700',
    marginTop: 2,
  },
  swapBenefitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  swapBenefitValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F97316',
  },
  swapBenefitText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    flex: 1,
  },
  swapReason: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  picksGrid: {
    gap: 10,
    marginBottom: 24,
  },
  pickCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickFoodName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pickServing: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  pickCals: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickSecCals: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  pickReason: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
});

