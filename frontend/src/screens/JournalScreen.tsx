import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Animated, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { Screen } from '../components/Screen';
import { theme } from '../utils/theme';

const MOODS = [
  { emoji: '😔', label: 'Slecht', value: 1 },
  { emoji: '😐', label: 'Matig', value: 2 },
  { emoji: '🙂', label: 'Ok\u00e9', value: 3 },
  { emoji: '😊', label: 'Goed', value: 4 },
  { emoji: '😄', label: 'Top!', value: 5 },
];

export function JournalScreen() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [mood, setMood] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    try {
      const [q, h] = await Promise.all([api.getJournalQuestion(), api.getJournalHistory()]);
      setQuestion(q.question); setAnswer(q.answer || ''); setDone(q.done); setHistory(h);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(); }, []);

  async function handleSave() {
    if (!answer.trim()) { Alert.alert('Fout', 'Schrijf iets op!'); return; }
    setSaving(true);
    try {
      await api.saveJournal({ answer, mood });
      Alert.alert('Opgeslagen!', 'Mooi dat je hebt geschreven');
      setDone(true); await loadData();
    } catch (e: any) { Alert.alert('Fout', e.message); }
    setSaving(false);
  }

  return (
    <Screen scroll={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.emoji}>✍️</Text>
          <Text style={styles.title}>Dagboek</Text>
          <Text style={styles.subtitle}>Schrijf elke dag iets voor jezelf</Text>

          <Animated.View style={[styles.questionCard, { opacity: fadeAnim }]}>
            <Text style={styles.qLabel}>VRAAG VAN VANDAAG</Text>
            <Text style={styles.questionText}>{question}</Text>

            {!done ? (
              <>
                <Text style={styles.moodLabel}>Hoe voel je je vandaag?</Text>
                <View style={styles.moodRow}>
                  {MOODS.map(m => (
                    <TouchableOpacity key={m.value} style={[styles.moodBtn, mood === m.value && styles.moodBtnActive]} onPress={() => setMood(m.value)}>
                      {mood === m.value ? (
                  <View style={styles.moodActiveCircle}>
                    <Text style={styles.moodEmojiActive}>{m.emoji}</Text>
                  </View>
                ) : (
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                )}
                      <Text style={[styles.moodBtnLabel, mood === m.value && styles.moodBtnLabelActive]}>{m.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Schrijf hier je gedachten..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={answer}
                  onChangeText={setAnswer}
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? 'Bezig...' : 'Opslaan'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.doneCard}>
                <View style={styles.doneMoodWrap}>
                  {MOODS.filter(m => m.value === mood).map(m => (
                    <Text key={m.value} style={styles.doneMood}>{m.emoji}</Text>
                  ))}
                </View>
                <Text style={styles.answerText}>{answer}</Text>
                <TouchableOpacity style={styles.editBtn} onPress={() => setDone(false)}>
                  <Text style={styles.editBtnText}>✏️ Bewerken</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {history.length > 0 && (
            <>
              <Text style={styles.historyTitle}>Eerdere berichten</Text>
              {history.slice(0, 10).map((entry: any, i: number) => (
                <View key={entry.id || i} style={styles.historyCard}>
                  <View style={styles.historyTop}>
                    <Text style={styles.historyDate}>
                      {new Date(entry.date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </Text>
                    {entry.mood && <Text style={styles.historyMood}>{MOODS.find(m => m.value === entry.mood)?.emoji || ''}</Text>}
                  </View>
                  <Text style={styles.historyQuestion} numberOfLines={1}>{entry.question}</Text>
                  <Text style={styles.historyAnswer} numberOfLines={2}>{entry.answer}</Text>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 40, textAlign: 'center', marginTop: 8, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: 'bold', color: theme.colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  questionCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 20, marginBottom: 20, ...theme.shadow.card },
  qLabel: { fontSize: 11, color: theme.colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  questionText: { fontSize: 18, fontWeight: '600', color: theme.colors.text, lineHeight: 26, fontStyle: 'italic', marginBottom: 16 },
  moodLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 10 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  moodBtn: { alignItems: 'center', padding: 8, borderRadius: theme.borderRadius.md, width: '18%' },
  moodBtnActive: { backgroundColor: 'transparent' },
  moodEmoji: { fontSize: 28, opacity: 0.45 },
  moodActiveCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  moodEmojiActive: { fontSize: 26 },
  moodBtnLabel: { fontSize: 10, color: theme.colors.textMuted, marginTop: 2 },
  moodBtnLabelActive: { color: theme.colors.primary, fontWeight: '600' },
  input: { backgroundColor: '#FFF8F5', borderRadius: theme.borderRadius.lg, padding: 16, fontSize: 15, minHeight: 130, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text, textAlignVertical: 'top', lineHeight: 22 },
  saveBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.xl, padding: 16, alignItems: 'center', marginTop: 14 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneCard: { backgroundColor: theme.colors.successLight, borderRadius: theme.borderRadius.lg, padding: 16 },
  doneMoodWrap: { marginBottom: 8 },
  doneMood: { fontSize: 36 },
  answerText: { fontSize: 15, color: theme.colors.text, lineHeight: 22 },
  editBtn: { alignSelf: 'flex-end', marginTop: 10 },
  editBtnText: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
  historyTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text, marginBottom: 12, marginTop: 8 },
  historyCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 14, marginBottom: 10, ...theme.shadow.card },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { fontSize: 11, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  historyMood: { fontSize: 18 },
  historyQuestion: { fontSize: 14, fontWeight: '500', color: theme.colors.text, marginTop: 4, marginBottom: 2 },
  historyAnswer: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },
});
