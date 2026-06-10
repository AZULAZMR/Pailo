import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../utils/theme';
import { QuizEntry } from '../types';

const MOODS = [
  { emoji: '😢', label: 'Slecht' },
  { emoji: '😕', label: 'Matig' },
  { emoji: '😐', label: 'Oké' },
  { emoji: '🙂', label: 'Goed' },
  { emoji: '😊', label: 'Heel goed' },
];

const SYMPTOMS = [
  'Hoofdpijn', 'Vermoeid', 'Buikpijn', 'Misselijk',
  'Duizelig', 'Spierpijn', 'Geprikkeld', 'Energie',
];

export function QuizScreen() {
  const [todayEntry, setTodayEntry] = useState<QuizEntry | null>(null);
  const [history, setHistory] = useState<QuizEntry[]>([]);
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [stress, setStress] = useState(5);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  async function loadData() {
    try {
      const [today, hist] = await Promise.all([api.getQuizToday(), api.getQuizHistory()]);
      setTodayEntry(today);
      setHistory(hist);
      if (today) {
        setMood(today.mood);
        setEnergy(today.energy);
        setSleep(today.sleep);
        setStress(today.stress);
        if (today.symptoms) setSymptoms(today.symptoms.split(', '));
        setNotes(today.notes || '');
      }
    } catch (e) { console.error(e); }
  }

  function toggleSymptom(s: string) {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function saveQuiz() {
    try {
      await api.saveQuiz({
        mood: Math.round(mood),
        energy: Math.round(energy),
        sleep: Math.round(sleep),
        stress: Math.round(stress),
        symptoms: symptoms.join(', '),
        notes,
      });
      Alert.alert('Opgeslagen!', 'Check-in opgeslagen');
      await loadData();
    } catch (e: any) { Alert.alert('Fout', e.message); }
  }

  const Slider = ({ value, setValue, label, min = 1, max = 10 }: any) => (
    <View style={styles.sliderRow}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <View style={styles.sliderTrack}>
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <TouchableOpacity
            key={n}
            onPress={() => setValue(n)}
            style={[
              styles.sliderDot,
              n <= value && {
                backgroundColor: n <= 3 ? theme.colors.error : n <= 6 ? theme.colors.warning : theme.colors.success,
              },
            ]}
          >
            <Text style={[styles.sliderDotText, n <= value && { color: '#fff' }]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dagelijkse check-in</Text>
      <Text style={styles.subtitle}>Hoe voel je je vandaag?</Text>

      {todayEntry && (
        <View style={styles.doneBanner}>
          <Text style={styles.doneText}>✅ Vandaag al ingevuld!</Text>
        </View>
      )}

      <Slider label="Mood" value={mood} setValue={setMood} />
      <Slider label="Energie" value={energy} setValue={setEnergy} />
      <Slider label="Slaapkwaliteit" value={sleep} setValue={setSleep} />
      <Slider label="Stress" value={stress} setValue={setStress} max={10} />

      <Text style={styles.sympLabel}>Symptomen</Text>
      <View style={styles.symptomGrid}>
        {SYMPTOMS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, symptoms.includes(s) && styles.chipActive]}
            onPress={() => toggleSymptom(s)}
          >
            <Text style={[styles.chipText, symptoms.includes(s) && { color: '#fff' }]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Notities..." value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity style={styles.saveBtn} onPress={saveQuiz}>
        <Text style={styles.saveText}>Check-in opslaan</Text>
      </TouchableOpacity>

      {/* History chart */}
      {history.length > 0 && (
        <>
          <Text style={styles.historyTitle}>Afgelopen dagen</Text>
          <View style={styles.chart}>
            {history.slice(0, 7).reverse().map((day, i) =>  {
              const avg = (day.mood + day.energy + (11 - day.stress)) / 3;
              return (
                <View key={i} style={styles.barCol}>
                  <View style={[styles.bar, { height: (avg / 10) * 100, backgroundColor: avg >= 6 ? theme.colors.success : avg >= 4 ? theme.colors.warning : theme.colors.error }]} />
                  <Text style={styles.barLabel}>{new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text, marginTop: 8 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 20 },
  doneBanner: { backgroundColor: theme.colors.successLight, padding: 12, borderRadius: theme.borderRadius.md, marginBottom: 16 },
  doneText: { color: theme.colors.success, fontSize: 14, fontWeight: '500' },
  sliderRow: { marginBottom: 20 },
  sliderLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.text, marginBottom: 8 },
  sliderTrack: { flexDirection: 'row', gap: 4 },
  sliderDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  sliderDotText: { fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary },
  sympLabel: { fontSize: 14, fontWeight: '500', color: theme.colors.text, marginBottom: 8, marginTop: 4 },
  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.background },
  chipActive: { backgroundColor: theme.colors.primary },
  chipText: { fontSize: 13, color: theme.colors.textSecondary },
  input: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.sm, padding: 12, fontSize: 14, minHeight: 60, textAlignVertical: 'top', borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16, color: theme.colors.text },
  saveBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, padding: 14, alignItems: 'center', marginBottom: 24, ...theme.shadow.md },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  historyTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text, marginBottom: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: 12, marginBottom: 24, ...theme.shadow.sm },
  barCol: { alignItems: 'center', flex: 1 },
  bar: { width: 20, borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 4 },
});
