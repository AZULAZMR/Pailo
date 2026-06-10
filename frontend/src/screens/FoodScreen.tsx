import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../utils/theme';

const MEAL_TYPES = [
  { key: 'breakfast', label: '🍳 Ontbijt' },
  { key: 'lunch', label: '🥪 Lunch' },
  { key: 'dinner', label: '🍝 Diner' },
  { key: 'snack', label: '🥜 Snack' },
];

export function FoodScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [entries, setEntries] = useState<any[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [mealType, setMealType] = useState('breakfast');
  const [food, setFood] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  useFocusEffect(
    useCallback(() => { loadFood(); }, [])
  );

  async function loadFood() {
    try {
      const data = await api.getFoodDaily(today);
      setEntries(data.entries || []);
      setTotals(data.totals);
    } catch (e) { console.error(e); }
  }

  async function addFood() {
    if (!food.trim() || !calories) { Alert.alert('Fout', 'Vul minimaal eten en calorieën in'); return; }
    try {
      await api.createFood({
        date: today, mealType, food: food.trim(),
        calories: Number(calories) || 0, protein: Number(protein) || 0,
        carbs: Number(carbs) || 0, fat: Number(fat) || 0, notes: '',
      });
      setFood(''); setCalories(''); setProtein(''); setCarbs(''); setFat('');
      setShowAdd(false);
      await loadFood();
    } catch (e: any) { Alert.alert('Fout', e.message); }
  }

  async function deleteFood(id: number) {
    try { await api.deleteFood(id); await loadFood(); } catch (e: any) { Alert.alert('Fout', e.message); }
  }

  const mealsByType: Record<string, any[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
  for (const e of entries) {
    if (mealsByType[e.mealType]) mealsByType[e.mealType].push(e);
  }

  const calGoal = 2000;
  const calPct = Math.min((totals.calories / calGoal) * 100, 100);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Voedingsdagboek 🥗</Text>
      <Text style={styles.subtitle}>{new Date().toLocaleDateString('nl-NL')}</Text>

      {/* Calorie ring */}
      <View style={styles.calCard}>
        <View style={styles.calRing}>
          <View style={[styles.calRingFill, { width: `${calPct}%` }]} />
        </View>
        <Text style={styles.calText}>{totals.calories} / {calGoal} kcal</Text>
        <View style={styles.macroRow}>
          <View style={styles.macro}><Text style={styles.macroVal}>{totals.protein}g</Text><Text style={styles.macroLabel}>Eiwit</Text></View>
          <View style={styles.macro}><Text style={styles.macroVal}>{totals.carbs}g</Text><Text style={styles.macroLabel}>Koolh.</Text></View>
          <View style={styles.macro}><Text style={styles.macroVal}>{totals.fat}g</Text><Text style={styles.macroLabel}>Vet</Text></View>
        </View>
      </View>

      {/* Meals */}
      {MEAL_TYPES.map(mt => (
        <View key={mt.key}>
          <Text style={styles.mealTitle}>{mt.label}</Text>
          {mealsByType[mt.key].length === 0 ? (
            <Text style={styles.emptyMeal}>Nog niet gelogd</Text>
          ) : (
            mealsByType[mt.key].map((entry: any) => (
              <View key={entry.id} style={styles.foodRow}>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{entry.food}</Text>
                  <Text style={styles.foodCal}>{entry.calories} kcal</Text>
                </View>
                <TouchableOpacity onPress={() => deleteFood(entry.id)}>
                  <Text style={styles.deleteFood}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      ))}

      {/* Add food form */}
      {showAdd ? (
        <View style={styles.addForm}>
          <View style={styles.mealTypeRow}>
            {MEAL_TYPES.map(mt => (
              <TouchableOpacity key={mt.key} style={[styles.mealTypeBtn, mealType === mt.key && styles.mealTypeActive]}
                onPress={() => setMealType(mt.key)}>
                <Text style={[styles.mealTypeText, mealType === mt.key && { color: '#fff' }]}>{mt.label.split(' ')[0]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Wat heb je gegeten?" value={food} onChangeText={setFood} />
          <View style={styles.macroInputRow}>
            <TextInput style={styles.macroInput} placeholder="Cal" value={calories} onChangeText={setCalories} keyboardType="numeric" />
            <TextInput style={styles.macroInput} placeholder="Eiwit" value={protein} onChangeText={setProtein} keyboardType="numeric" />
            <TextInput style={styles.macroInput} placeholder="Koolh" value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
            <TextInput style={styles.macroInput} placeholder="Vet" value={fat} onChangeText={setFat} keyboardType="numeric" />
          </View>
          <View style={styles.addBtns}>
            <TouchableOpacity style={styles.saveBtn} onPress={addFood}><Text style={styles.saveBtnText}>Voeg toe</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={styles.cancelBtn}>Annuleren</Text></TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text, marginTop: 8 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16 },
  calCard: { backgroundColor: '#fff', borderRadius: theme.borderRadius.md, padding: 16, alignItems: 'center', marginBottom: 16 },
  calRing: { width: '100%', height: 12, backgroundColor: '#F3F4F6', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  calRingFill: { height: '100%', backgroundColor: theme.colors.success, borderRadius: 6 },
  calText: { fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 12 },
  macroRow: { flexDirection: 'row', gap: 24 },
  macro: { alignItems: 'center' },
  macroVal: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  macroLabel: { fontSize: 11, color: theme.colors.textSecondary },
  mealTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginTop: 8, marginBottom: 4 },
  emptyMeal: { fontSize: 13, color: theme.colors.textSecondary, fontStyle: 'italic', marginBottom: 4 },
  foodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: theme.borderRadius.sm, marginBottom: 3 },
  foodInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  foodName: { fontSize: 14, color: theme.colors.text, flex: 1 },
  foodCal: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
  deleteFood: { fontSize: 16, color: theme.colors.error, marginLeft: 8 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30, marginTop: -2 },
  addForm: { backgroundColor: '#fff', borderRadius: theme.borderRadius.md, padding: 16, marginTop: 12 },
  mealTypeRow: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  mealTypeBtn: { flex: 1, padding: 8, borderRadius: theme.borderRadius.sm, backgroundColor: '#F3F4F6', alignItems: 'center' },
  mealTypeActive: { backgroundColor: theme.colors.primary },
  mealTypeText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
  input: { backgroundColor: '#F3F4F6', borderRadius: theme.borderRadius.sm, padding: 12, fontSize: 14, marginBottom: 8 },
  macroInputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  macroInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: theme.borderRadius.sm, padding: 10, fontSize: 13, textAlign: 'center' },
  addBtns: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  saveBtn: { flex: 1, backgroundColor: theme.colors.primary, padding: 12, borderRadius: theme.borderRadius.sm, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  cancelBtn: { color: theme.colors.textSecondary, fontSize: 13, padding: 4 },
});
