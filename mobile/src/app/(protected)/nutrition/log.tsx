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
  Switch,
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
  ChevronUp,
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

  // Manual Food Entry Modal State
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualFoodName, setManualFoodName] = useState('');
  const [manualMealType, setManualMealType] = useState<MealType>(selectedMeal);
  const [manualQuantity, setManualQuantity] = useState('1');
  const [manualUnit, setManualUnit] = useState('serving');
  const [manualWeightGrams, setManualWeightGrams] = useState('150');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualFiber, setManualFiber] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualSaveCustom, setManualSaveCustom] = useState(true);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [showMacroFields, setShowMacroFields] = useState(false);

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

  // Filter foods by search query and category (including custom foods)
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        (selectedCategory === 'CUSTOM' ? !!food.isCustom : food.category === selectedCategory);
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

  const handleOpenManualModal = (prefillName = '') => {
    setManualFoodName(prefillName || searchQuery);
    setManualMealType(selectedMeal);
    setManualQuantity('1');
    setManualUnit('serving');
    setManualWeightGrams('150');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
    setManualFiber('');
    setManualNotes('');
    setManualSaveCustom(true);
    setShowMacroFields(false);
    setManualModalVisible(true);
  };

  // Live Macro Distribution for Manual Entry Visualizer
  const manualMacroRatios = useMemo(() => {
    const p = parseFloat(manualProtein) || 0;
    const c = parseFloat(manualCarbs) || 0;
    const f = parseFloat(manualFat) || 0;
    const totalGrams = p + c + f;
    if (totalGrams <= 0) return { pPct: 0, cPct: 0, fPct: 0 };
    return {
      pPct: Math.round((p / totalGrams) * 100),
      cPct: Math.round((c / totalGrams) * 100),
      fPct: Math.round((f / totalGrams) * 100),
    };
  }, [manualProtein, manualCarbs, manualFat]);

  const handleConfirmManualLog = async () => {
    if (!manualFoodName.trim()) {
      const msg = 'Please enter a food name';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Missing Name', msg);
      return;
    }

    const cals = parseFloat(manualCalories);
    if (isNaN(cals) || cals < 0) {
      const msg = 'Please enter a valid calorie amount (e.g. 250)';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Invalid Calories', msg);
      return;
    }

    const qty = parseFloat(manualQuantity) || 1;
    const wt = parseFloat(manualWeightGrams) || 150;
    const protein = parseFloat(manualProtein) || 0;
    const carbs = parseFloat(manualCarbs) || 0;
    const fat = parseFloat(manualFat) || 0;
    const fiber = parseFloat(manualFiber) || 0;

    setManualSubmitting(true);
    try {
      await foodLogService.logManualFood({
        foodName: manualFoodName.trim(),
        mealType: manualMealType,
        quantity: qty,
        unit: manualUnit,
        weightGrams: wt,
        calories: cals,
        protein,
        carbohydrates: carbs,
        fat,
        fiber,
        notes: manualNotes.trim() || undefined,
        saveToCustomFoods: manualSaveCustom,
      });

      setManualModalVisible(false);

      // Refresh list to include newly created custom food
      const searchRes = await foodService.searchFoods({ limit: 40 });
      setFoods(searchRes.foods);

      if (Platform.OS === 'web') {
        window.alert(`Logged "${manualFoodName.trim()}" (${cals} kcal) to ${manualMealType}!`);
        router.replace('/(protected)/nutrition');
      } else {
        Alert.alert(
          'Food Logged Successfully',
          `Added "${manualFoodName.trim()}" (${cals} kcal) to ${manualMealType}`,
          [
            {
              text: 'View Dashboard',
              onPress: () => router.replace('/(protected)/nutrition'),
            },
            {
              text: 'Add More',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to log food';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setManualSubmitting(false);
    }
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

        {/* Quick Manual Entry Banner */}
        <TouchableOpacity
          style={styles.manualEntryBanner}
          onPress={() => handleOpenManualModal(searchQuery)}
          activeOpacity={0.8}
        >
          <View style={styles.manualBannerLeft}>
            <View style={styles.manualBannerIcon}>
              <Sparkles size={16} color="#12372A" />
            </View>
            <View style={styles.manualBannerTextBox}>
              <Text style={styles.manualBannerTitle}>Can't find your food?</Text>
              <Text style={styles.manualBannerSub}>Enter custom dish, portions & calories manually</Text>
            </View>
          </View>
          <View style={styles.manualBannerButton}>
            <Plus size={14} color="#FFFFFF" />
            <Text style={styles.manualBannerBtnText}>Add</Text>
          </View>
        </TouchableOpacity>

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

          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'CUSTOM' && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory('CUSTOM')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === 'CUSTOM' && styles.categoryChipTextActive,
              ]}
            >
              ⭐ My Foods
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
            <Text style={styles.emptyTitle}>
              {searchQuery ? `"${searchQuery}" not found` : 'No matching food items found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `Don't see "${searchQuery}" in our database? Add it manually in 1 tap!`
                : 'Try searching for Idli, Dosa, Rice, Sambar, Chapati, Dal, or add custom food.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => handleOpenManualModal(searchQuery)}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.emptyAddButtonText}>
                {searchQuery ? `+ Add "${searchQuery}" Manually` : '+ Enter Food Manually'}
              </Text>
            </TouchableOpacity>
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
                  {food.isCustom ? (
                    <View style={styles.customFoodBadge}>
                      <Sparkles size={10} color="#15803D" />
                      <Text style={styles.customFoodBadgeText}>My Custom Food</Text>
                    </View>
                  ) : null}
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

      {/* Manual Food Entry Modal */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setManualModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={18} color="#15803D" />
                  <Text style={styles.modalTitle}>Enter Food Manually</Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  Add custom homemade recipe, meal or snack
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setManualModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Meal Type Selector */}
              <View style={styles.manualFieldGroup}>
                <Text style={styles.inputLabel}>Meal Time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {MEALS.map((m) => (
                    <TouchableOpacity
                      key={m.value}
                      style={[
                        styles.manualMealChip,
                        manualMealType === m.value && styles.manualMealChipActive,
                      ]}
                      onPress={() => setManualMealType(m.value)}
                    >
                      <Text
                        style={[
                          styles.manualMealChipText,
                          manualMealType === m.value && styles.manualMealChipTextActive,
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Food Name */}
              <View style={styles.manualFieldGroup}>
                <Text style={styles.inputLabel}>Food Name *</Text>
                <TextInput
                  style={styles.manualTextInput}
                  placeholder="e.g., Homemade Dosa, Kambu Koozh, Sambar Rice"
                  placeholderTextColor={colors.textSecondary}
                  value={manualFoodName}
                  onChangeText={setManualFoodName}
                />
              </View>

              {/* Portion & Serving */}
              <View style={styles.manualFieldGroup}>
                <Text style={styles.inputLabel}>Portion / Serving</Text>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.quantityInput, { width: 70 }]}
                    keyboardType="numeric"
                    placeholder="1"
                    value={manualQuantity}
                    onChangeText={setManualQuantity}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {['serving', 'plate', 'bowl', 'cup', 'piece', 'g', 'ml'].map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitPill, manualUnit === u && styles.unitPillActive]}
                        onPress={() => setManualUnit(u)}
                      >
                        <Text style={[styles.unitPillText, manualUnit === u && styles.unitPillTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Calories & Weight */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Flame size={14} color="#EA580C" />
                    <Text style={styles.inputLabel}>Calories (kcal) *</Text>
                  </View>
                  <TextInput
                    style={[styles.manualTextInput, { borderColor: '#FDBA74', backgroundColor: '#FFF7ED' }]}
                    keyboardType="numeric"
                    placeholder="e.g. 250"
                    placeholderTextColor="#9A3412"
                    value={manualCalories}
                    onChangeText={setManualCalories}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { marginBottom: 6 }]}>Weight (grams approx)</Text>
                  <TextInput
                    style={styles.manualTextInput}
                    keyboardType="numeric"
                    placeholder="150"
                    placeholderTextColor={colors.textSecondary}
                    value={manualWeightGrams}
                    onChangeText={setManualWeightGrams}
                  />
                </View>
              </View>

              {/* Expandable Macronutrients Section */}
              <TouchableOpacity
                style={styles.macroToggleRow}
                onPress={() => setShowMacroFields(!showMacroFields)}
                activeOpacity={0.7}
              >
                <Text style={styles.macroToggleText}>
                  {showMacroFields ? 'Hide Macronutrients' : '+ Add Macronutrients (Protein, Carbs, Fat)'}
                </Text>
                {showMacroFields ? (
                  <ChevronUp size={16} color={colors.primary} />
                ) : (
                  <ChevronDown size={16} color={colors.primary} />
                )}
              </TouchableOpacity>

              {showMacroFields && (
                <View style={styles.macroInputsCard}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.macroInputLabel}>Protein (g)</Text>
                      <TextInput
                        style={styles.macroTextInput}
                        keyboardType="numeric"
                        placeholder="0"
                        value={manualProtein}
                        onChangeText={setManualProtein}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.macroInputLabel}>Carbs (g)</Text>
                      <TextInput
                        style={styles.macroTextInput}
                        keyboardType="numeric"
                        placeholder="0"
                        value={manualCarbs}
                        onChangeText={setManualCarbs}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.macroInputLabel}>Fat (g)</Text>
                      <TextInput
                        style={styles.macroTextInput}
                        keyboardType="numeric"
                        placeholder="0"
                        value={manualFat}
                        onChangeText={setManualFat}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.macroInputLabel}>Fiber (g)</Text>
                      <TextInput
                        style={styles.macroTextInput}
                        keyboardType="numeric"
                        placeholder="0"
                        value={manualFiber}
                        onChangeText={setManualFiber}
                      />
                    </View>
                  </View>

                  {/* Visual Macro Bar */}
                  {(parseFloat(manualProtein) > 0 || parseFloat(manualCarbs) > 0 || parseFloat(manualFat) > 0) && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>
                        Macro Ratio: {manualMacroRatios.pPct}% Protein • {manualMacroRatios.cPct}% Carbs • {manualMacroRatios.fPct}% Fat
                      </Text>
                      <View style={styles.macroBarTrack}>
                        <View style={{ flex: manualMacroRatios.pPct || 1, backgroundColor: '#2563EB' }} />
                        <View style={{ flex: manualMacroRatios.cPct || 1, backgroundColor: '#F97316' }} />
                        <View style={{ flex: manualMacroRatios.fPct || 1, backgroundColor: '#EAB308' }} />
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Notes Input */}
              <View style={[styles.manualFieldGroup, { marginTop: 10 }]}>
                <Text style={styles.inputLabel}>Notes / Preparation (Optional)</Text>
                <TextInput
                  style={[styles.manualTextInput, { height: 38 }]}
                  placeholder="e.g., Cooked with low oil, less salt"
                  placeholderTextColor={colors.textSecondary}
                  value={manualNotes}
                  onChangeText={setManualNotes}
                />
              </View>

              {/* Save to Custom Foods Library Switch */}
              <View style={styles.saveCustomRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.saveCustomTitle}>Save to My Custom Foods</Text>
                  <Text style={styles.saveCustomSub}>
                    Easily search and re-log this dish next time
                  </Text>
                </View>
                <Switch
                  value={manualSaveCustom}
                  onValueChange={setManualSaveCustom}
                  trackColor={{ false: '#E2E8F0', true: '#86EFAC' }}
                  thumbColor={manualSaveCustom ? colors.primary : '#94A3B8'}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.confirmLogButton, manualSubmitting && styles.buttonDisabled, { marginTop: 14 }]}
                onPress={handleConfirmManualLog}
                disabled={manualSubmitting}
                activeOpacity={0.8}
              >
                {manualSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmLogButtonText}>
                    Log {manualFoodName ? `"${manualFoodName}"` : 'Food'} Now
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  // Manual Entry Quick Banner
  manualEntryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  manualBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  manualBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualBannerTextBox: {
    flex: 1,
  },
  manualBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  manualBannerSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  manualBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#12372A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  manualBannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Custom Food Badge
  customFoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 3,
  },
  customFoodBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  // Empty State Button
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 16,
  },
  emptyAddButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  // Manual Form Fields
  manualFieldGroup: {
    marginBottom: 14,
  },
  manualTextInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textPrimary,
  },
  manualMealChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  manualMealChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  manualMealChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  manualMealChipTextActive: {
    color: '#FFFFFF',
  },
  macroToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginBottom: 10,
  },
  macroToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  macroInputsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  macroInputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  macroTextInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  macroBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
  },
  saveCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 8,
  },
  saveCustomTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  saveCustomSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

