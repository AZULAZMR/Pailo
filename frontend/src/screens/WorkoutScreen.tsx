import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../utils/theme';

const INTENSITY = ['light', 'medium', 'high'];
const INTENSITY_LABELS: Record<string, string> = { light: 'Licht 🟢', medium: 'Gemiddeld 🟡', high: 'Intensief 🔴' };

export function WorkoutScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('medium');
  const [exercises, setExercises] = useState('');

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  async function loadData() {
    try {
      const [w, t] = await Promise.all([api.getWorkouts(), api.getWorkoutTypes()]);
      setWorkouts(w || []);
      setTypes(t || []);
    } catch (e) { console.error(e); }
  }

  async function addWorkout() {
    if (!type || !duration) { Alert.alert('Fout', 'Vul type en duur in'); return; }
    try {
      await api.createWorkout({
        date: today, type, duration: Number(duration),
        intensity, exercises, notes: '',
      });
      setType(''); setDuration(''); setExercises(''); setShowAdd(false);
      await loadData();
    } catch (e: any) { Alert.alert('Fout', e.message); }
  }

  async function deleteWorkout(id: number) {
    try { await api.deleteWorkout(id); await loadData(); } catch (e: any) { Alert.alert('Fout', e.message); }
  }

  const thisMonth = today.slice(0, 7);
  const monthWorkouts = workouts.filter((w: any) => w.date?.startsWith(thisMonth));
  const totalMin = monthWorkouts.reduce((sum: number, w: any) => sum + (w.duration || 0), 0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Workouts 🏃</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{monthWorkouts.length}</Text>
          <Text style={styles.statLabel}>Deze maand</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{totalMin}</Text>
          <Text style={styles.statLabel}>Minuten</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>
            {monthWorkouts.length > 0 ? Math.round(totalMin / monthWorkouts.length) : 0}
          </Text>
          <Text style={styles.statLabel}>Gem./workout</Text>
        </View>
      </View>

      {/* Today's workouts */}
      <Text style={styles.sectionTitle}>Vandaag</Text>
      {workouts.filter((w: any) => w.date === today).length === 0 ? (
        <Text style={styles.emptyText}>Nog geen workout gelogd vandaag</Text>
      ) : (
        workouts.filter((w: any) => w.date === today).map((w: any) => (
          <View key={w.id} style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutType}>{w.type}</Text>
              <TouchableOpacity onPress={() => deleteWorkout(w.id)}>
                <Text style={styles.deleteBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.workoutDetail}>{w.duration} min | {INTENSITY_LABELS[w.intensity] || w.intensity}</Text>
            {w.exercises ? <Text style={styles.workoutEx}>{w.exercises}</Text> : null}
          </View>
        ))
      )}

      {/* History */}
      <Text style={styles.sectionTitle}>Geschiedenis</Text>
      {workouts.filter((w: any) => w.date !== today).slice(0, 10).map((w: any) => (
        <View key={w.id} style={styles.historyRow}>
          <Text style={styles.historyDate}>{new Date(w.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
          <View style={styles.historyInfo}>
            <Text style={styles.historyType}>{w.type}</Text>
            <Text style={styles.historyDur}>{w.duration}min</Text>
          </View>
        </View>
      ))}

      {/* Quick add types */}
      {!showAdd && (
        <>
          <Text style={styles.sectionTitle}>Snel toevoegen</Text>
          <View style={styles.quickTypes}>
            {types.slice(0, 6).map(t => (
              <TouchableOpacity key={t} style={styles.quickType} onPress={() => {
                setType(t); setShowAdd(true);
              }}>
                <Text style={styles.quickTypeText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Add form */}
      {showAdd ? (
        <View style={styles.addForm}>
          <Text style={styles.sectionTitle}>Nieuwe workout</Text>
          <View style={styles.typeRow}>
            {types.slice(0, 6).map(t => (
              <TouchableOpacity key={t} style={[styles.typeChip, type === t && styles.typeChipActive]}
                onPress={() => setType(t)}>
                <Text style={[styles.typeChipText, type === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.durationRow}>
            <TextInput style={styles.durInput} placeholder="Duur (min)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
            <View style={styles.intensityRow}>
              {INTENSITY.map(i => (
                <TouchableOpacity key={i} style={[styles.intensityBtn, intensity === i && styles.intensityActive]}
                  onPress={() => setIntensity(i)}>
                  <Text style={[styles.intensityText, intensity === i && { color: '#fff' }]}>{INTENSITY_LABELS[i].split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TextInput style={styles.input} placeholder="Oefeningen (optioneel)" value={exercises} onChangeText={setExercises} />
          <View style={styles.addBtns}>
            <TouchableOpacity style={styles.saveBtn} onPress={addWorkout}><Text style={styles.saveBtnText}>Opslaan</Text></TouchableOpacity>
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
  title: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text, marginTop: 8, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: theme.borderRadius.md, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginTop: 12, marginBottom: 8 },
  emptyText: { fontSize: 13, color: theme.colors.textSecondary, fontStyle: 'italic', marginBottom: 8 },
  workoutCard: { backgroundColor: '#fff', borderRadius: theme.borderRadius.md, padding: 12, marginBottom: 6 },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workoutType: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  deleteBtn: { fontSize: 16, color: theme.colors.error },
  workoutDetail: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  workoutEx: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  historyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: theme.borderRadius.sm, marginBottom: 3 },
  historyDate: { fontSize: 12, color: theme.colors.textSecondary, width: 65 },
  historyInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  historyType: { fontSize: 14, color: theme.colors.text },
  historyDur: { fontSize: 13, color: theme.colors.textSecondary },
  quickTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 60 },
  quickType: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: theme.colors.border },
  quickTypeText: { fontSize: 13, color: theme.colors.text },
  addForm: { backgroundColor: '#fff', borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 60 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6' },
  typeChipActive: { backgroundColor: theme.colors.primary },
  typeChipText: { fontSize: 13, color: theme.colors.textSecondary },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  durInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: theme.borderRadius.sm, padding: 12, fontSize: 14, textAlign: 'center' },
  intensityRow: { flexDirection: 'row', gap: 4 },
  intensityBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: theme.borderRadius.sm, backgroundColor: '#F3F4F6' },
  intensityActive: { backgroundColor: theme.colors.primary },
  intensityText: { fontSize: 12, color: theme.colors.textSecondary },
  input: { backgroundColor: '#F3F4F6', borderRadius: theme.borderRadius.sm, padding: 12, fontSize: 14, marginBottom: 12 },
  addBtns: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  saveBtn: { flex: 1, backgroundColor: theme.colors.primary, padding: 12, borderRadius: theme.borderRadius.sm, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  cancelBtn: { color: theme.colors.textSecondary, fontSize: 13, padding: 4 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30, marginTop: -2 },
});
