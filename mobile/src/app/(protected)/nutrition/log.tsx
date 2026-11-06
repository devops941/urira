import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Search,
  X,
  Plus,
  Flame,
  Check,
  Utensils,
  ChevronDown,
  Sparkles,
} from 'lucide-react-native';
import { AppHeader } from '../../../components/common/AppHeader';
import { colors } from '../../../theme/colors';
import { foodService } from '../../../services/nutrition/foodService';
import { foodLogService } from '../../../services/nutrition/foodLogService';
import { IFood, MealType, FoodCategory } from '../../../types/nutrition';

const MEALS: { label: string; value: MealType }[] = [
  { label: 'Breakfast', value: MealType.BREAKFAST },
  { label: 'Morning Snack', value: MealType.MORNING_SNACK },
  { label: 'Lunch', value: MealType.LUNCH },
  { label: 'Evening Snack', value: MealType.EVENING_SNACK },
  { label: 'Dinner', value: MealType.DINNER },
  { label: 'Other', value: MealType.OTHER },
];

export default function LogFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [selectedMeal, setSelectedMeal] = useState<MealType>(
    (params.mealType as MealType) || MealType.BREAKFAST
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [foods, setFoods] = useState<IFood[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Food for Portion Logging Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFood, setActiveFood] = useState<IFood | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [selectedUnit, setSelectedUnit] = useState('piece');
  const [submitting, setSubmitting] = useState(false);

  // Load Categories & Initial Foods
  useEffect(() => {
    async function init() {
      try {
        const [cats, searchRes] = await Promise.all([
          foodService.getCategories(),
          foodService.searchFoods({ limit: 40 }),
        ]);
        setCategories(cats);
        setFoods(searchRes.foods);
      } catch (err) {
        console.warn('Failed to load foods:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Filter foods by search query and category
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchCat =
        selectedCategory === 'ALL' || food.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        food.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [foods, selectedCategory, searchQuery]);

  const handleOpenPortionModal = (food: IFood) => {
    setActiveFood(food);
    setQuantity(String(food.defaultServingSize || 1));
    setSelectedUnit(food.defaultServingUnit || 'serving');
    setModalVisible(true);
  };

  // Compute live estimate preview in modal
  const liveNutritionEstimate = useMemo(() => {
    if (!activeFood) return { cals: 0, protein: 0, grams: 0 };
    const q = parseFloat(quantity) || 0;
    if (q <= 0) return { cals: 0, protein: 0, grams: 0 };

    let weightGrams = activeFood.weightPerDefaultServingGrams || 100;
    if (selectedUnit.toLowerCase() === 'g' || selectedUnit.toLowerCase() === 'grams') {
      weightGrams = q;
    } else if (activeFood.availableServings && activeFood.availableServings.length > 0) {
      const match = activeFood.availableServings.find(
        (s) => s.unit.toLowerCase() === selectedUnit.toLowerCase()
      );
      if (match) {
        weightGrams = (match.weightGrams / (match.servingSize || 1)) * q;
      } else {
        weightGrams = (activeFood.weightPerDefaultServingGrams || 100) * q;
      }
    } else {
      weightGrams = (activeFood.weightPerDefaultServingGrams || 100) * q;
    }

    const factor = weightGrams / 100;
    const cals = Math.round(activeFood.nutrientsPer100g.calories * factor);
    const protein = Math.round(activeFood.nutrientsPer100g.protein * factor * 10) / 10;

    return { cals, protein, grams: Math.round(weightGrams) };
  }, [activeFood, quantity, selectedUnit]);

  const handleConfirmLogFood = async () => {
    if (!activeFood) return;
    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      if (Platform.OS === 'web') window.alert('Please enter a valid quantity');
      else Alert.alert('Invalid', 'Please enter a valid quantity');
      return;
    }

    setSubmitting(true);
    try {
      await foodLogService.addFoodLog({
        foodId: activeFood._id,
        mealType: selectedMeal,
        quantity: parsedQty,
        unit: selectedUnit,
      });

      setModalVisible(false);
      if (Platform.OS === 'web') {
        window.alert(`Logged ${parsedQty} ${selectedUnit} of ${activeFood.name} to ${selectedMeal}!`);
        router.replace('/(protected)/nutrition');
      } else {
        Alert.alert(
          'Food Logged',
          `Added ${activeFood.name} (${liveNutritionEstimate.cals} kcal) to ${selectedMeal}`,
          [
            {
              text: 'View Dashboard',
              onPress: () => router.replace('/(protected)/nutrition'),
            },
            { text: 'Add More', style: 'cancel' },
          ]
        );
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to log food';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Log Food" showBack onBackPress={() => router.back()} />

      <View style={styles.content}>
        {/* Meal Selector Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mealScrollContainer}
          contentContainerStyle={styles.mealSelectorRow}
        >
          {MEALS.map((meal) => {
            const isSelected = selectedMeal === meal.value;
            return (
              <TouchableOpacity
                key={meal.value}
                style={[
                  styles.mealSelectorChip,
                  isSelected && styles.mealSelectorChipActive,
                ]}
                onPress={() => setSelectedMeal(meal.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.mealSelectorText,
                    isSelected && styles.mealSelectorTextActive,
                  ]}
                >
                  {meal.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Search size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search verified Indian & health foods..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollContainer}
          contentContainerStyle={styles.categoryChipsRow}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'ALL' && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory('ALL')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === 'ALL' && styles.categoryChipTextActive,
              ]}
            >
              All Foods
            </Text>
          </TouchableOpacity>

          {categories.map((c) => {
            const isSelected = selectedCategory === c.category;
            const formatName = c.category
              .toLowerCase()
              .replace('_', ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());
            return (
              <TouchableOpacity
                key={c.category}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(c.category)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {formatName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Food List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingLabel}>Searching verified nutrition catalog...</Text>
          </View>
        ) : filteredFoods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Utensils size={40} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No matching food items found</Text>
            <Text style={styles.emptySubtitle}>Try searching for Idli, Dosa, Rice, Sambar, Chapati, Dal, or Egg</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.foodListScroll}
            contentContainerStyle={styles.foodList}
            showsVerticalScrollIndicator={false}
          >
            {filteredFoods.map((food) => (
              <TouchableOpacity
                key={food._id}
                style={styles.foodCard}
                onPress={() => handleOpenPortionModal(food)}
                activeOpacity={0.7}
              >
                <View style={styles.foodCardLeft}>
                  <Text style={styles.foodCardName}>{food.name}</Text>
                  <Text style={styles.foodCardMeta}>
                    Serving: {food.defaultServingSize} {food.defaultServingUnit} ({food.weightPerDefaultServingGrams}g) • {food.source.split(' ')[0]}
                  </Text>
                  {food.allergens && food.allergens.length > 0 ? (
                    <Text style={styles.allergenTag}>
                      Contains: {food.allergens.join(', ')}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.foodCardRight}>
                  <View style={styles.foodCalsBadge}>
                    <Text style={styles.foodCalsText}>
                      {Math.round(
                        (food.nutrientsPer100g.calories * food.weightPerDefaultServingGrams) / 100
                      )}{' '}
                      kcal
                    </Text>
                    <Text style={styles.foodProteinText}>
                      {Math.round(
                        (food.nutrientsPer100g.protein * food.weightPerDefaultServingGrams) / 10
                      ) / 10}
                      g protein
                    </Text>
                  </View>
                  <View style={styles.plusButton}>
                    <Plus size={16} color="#FFFFFF" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Serving Size & Quantity Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBox}>
                <Text style={styles.modalTitle}>{activeFood?.name}</Text>
                <Text style={styles.modalSubtitle}>
                  Log to {selectedMeal}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Serving Input Row */}
            <View style={styles.servingInputSection}>
              <Text style={styles.inputLabel}>Serving Quantity & Unit</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.quantityInput}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                />

                {/* Available Unit Pills */}
                <View style={styles.unitSelector}>
                  {activeFood?.availableServings?.map((srv) => (
                    <TouchableOpacity
                      key={srv.unit}
                      style={[
                        styles.unitPill,
                        selectedUnit === srv.unit && styles.unitPillActive,
                      ]}
                      onPress={() => setSelectedUnit(srv.unit)}
                    >
                      <Text
                        style={[
                          styles.unitPillText,
                          selectedUnit === srv.unit && styles.unitPillTextActive,
                        ]}
                      >
                        {srv.unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.unitPill,
                      selectedUnit === 'g' && styles.unitPillActive,
                    ]}
                    onPress={() => setSelectedUnit('g')}
                  >
                    <Text
                      style={[
                        styles.unitPillText,
                        selectedUnit === 'g' && styles.unitPillTextActive,
                      ]}
                    >
                      grams (g)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Dynamic Calculated Nutrients Preview */}
            <View style={styles.previewBox}>
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Calculated Weight</Text>
                <Text style={styles.previewValue}>{liveNutritionEstimate.grams} g</Text>
              </View>
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Calories</Text>
                <Text style={[styles.previewValue, { color: '#F97316' }]}>
                  {liveNutritionEstimate.cals} kcal
                </Text>
              </View>
              <View style={styles.previewItem}>
                <Text style={styles.previewLabel}>Protein</Text>
                <Text style={[styles.previewValue, { color: '#2563EB' }]}>
                  {liveNutritionEstimate.protein} g
                </Text>
              </View>
            </View>

            {/* Add Food Button */}
            <TouchableOpacity
              style={[styles.confirmLogButton, submitting && styles.buttonDisabled]}
              onPress={handleConfirmLogFood}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmLogButtonText}>Add to {selectedMeal}</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  mealScrollContainer: {
    flexGrow: 0,
    marginBottom: 10,
  },
  mealSelectorRow: {
    paddingVertical: 2,
    paddingHorizontal: 2,
    gap: 8,
    alignItems: 'center',
  },
  mealSelectorChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealSelectorChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  mealSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  mealSelectorTextActive: {
    color: '#FFFFFF',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  categoryScrollContainer: {
    flexGrow: 0,
    marginBottom: 12,
  },
  categoryChipsRow: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: colors.secondary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  categoryChipTextActive: {
    color: colors.primary,
  },
  foodListScroll: {
    flex: 1,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLabel: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  foodList: {
    paddingBottom: 40,
    gap: 10,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  foodCardLeft: {
    flex: 1,
    marginRight: 12,
  },
  foodCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  foodCardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_400Regular',
    marginTop: 2,
  },
  allergenTag: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 3,
  },
  foodCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  foodCalsBadge: {
    alignItems: 'flex-end',
  },
  foodCalsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  foodProteinText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitleBox: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 4,
  },
  servingInputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityInput: {
    width: 80,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unitSelector: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  unitPillActive: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unitPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  unitPillTextActive: {
    color: colors.primary,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewItem: {
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  previewValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  confirmLogButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  confirmLogButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});

