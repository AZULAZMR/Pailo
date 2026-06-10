import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../utils/theme';

const CATEGORY_COLORS: Record<string, string> = {
  slaap: '#64B5F6',
  eten: '#81C784',
  beweging: '#FFB74D',
  stress: '#CE93D8',
  energie: '#FFD54F',
  cyclus: '#F06292',
  lichaam: '#CE93D8',
  lifestyle: '#81C784',
  afvallen: '#FFB74D', aankomen: '#FF8A65', spiermassa: '#FF8A65', abs_krijgen: '#FF5252',
  beter_slapen: '#64B5F6', split_leren: '#CE93D8', flexibiliteit: '#CE93D8',
  meer_energie: '#FFD54F', minder_stress: '#CE93D8', gezonder_eten: '#81C784',
  conditie_verbeteren: '#FF8A65', zelfvertrouwen: '#CE93D8',
  menstruatie: '#F06292', pijn: '#E57373', zwanger: '#BA68C8',
  anticonceptie: '#9575CD', overgang: '#FF8A80', hormonen: '#CE93D8',
  mentale_gezondheid: '#4FC3F7', huid: '#FFAB91', haar: '#A1887F',
  libido: '#EF5350', borstvoeding: '#B39DDB', endometriose: '#F06292',
  pcos: '#FF8A65', migraine: '#90A4AE', bloedarmoede: '#EF5350',
  schildklier: '#4DD0E1', mindfulness: '#81C784', dagboek: '#64B5F6',
  sociale_connecties: '#FFB74D', zelfliefde: '#F48FB1', carriere: '#78909C',
  financieel: '#66BB6A', reizen: '#4FC3F7', creativiteit: '#FFB74D',
  koken: '#FFAB91', lezen: '#8D6E63', hobby: '#AED581',
  vrijwilliger: '#81C784', duurzaam: '#AED581', mindset: '#FFD54F',
};

function getEmojiForCategory(cat: string): string {
  const map: Record<string, string> = {
    afvallen: '⚖️', aankomen: '💪', spiermassa: '🏋️', abs_krijgen: '🔥',
    beter_slapen: '😴', split_leren: '🤸', flexibiliteit: '🧘', meer_energie: '⚡',
    minder_stress: '🧠', gezonder_eten: '🥗', conditie_verbeteren: '🏃', zelfvertrouwen: '✨',
    slaap: '😴', eten: '🥗', beweging: '🏃', stress: '🧘',
    energie: '⚡', cyclus: '🌸', lichaam: '💪', lifestyle: '🌿',
    menstruatie: '🩸', pijn: '💊', zwanger: '🤱', anticonceptie: '⚕️',
    overgang: '🌺', hormonen: '⚖️', mentale_gezondheid: '🧠', huid: '✨',
    haar: '💇', libido: '❤️', borstvoeding: '🍼', endometriose: '🫁',
    pcos: '🩺', migraine: '🤕', bloedarmoede: '🩸', schildklier: '🦋',
    mindfulness: '🧘', dagboek: '📓', sociale_connecties: '👥', zelfliefde: '🌸',
    carriere: '💼', financieel: '💰', reizen: '✈️', creativiteit: '🎨',
    koken: '🍳', lezen: '📚', hobby: '🎸', vrijwilliger: '🤝',
    duurzaam: '🌍', mindset: '🌞',
  };
  return map[cat] || '🎯';
}

export function GoalsScreen() {
  const [goals, setGoals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [presets, setPresets] = useState<Record<string, any>>({});
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    try {
      const [g, p, t] = await Promise.all([api.getGoals(), api.getGoalPresets(), api.getTasks()]);
      const unique = g.filter((goal: any, i: number, self: any[]) => i === self.findIndex((x: any) => x.id === goal.id));
      setGoals(unique);
      setPresets(p);
      setTasks(t);
    } catch (e) { console.error(e); }
  }

  function getProgress(goal: any): { done: number; total: number; pct: number; nextTask: string } {
    const goalTasks = tasks.filter((t: any) => t.goalId === goal.id);
    const total = goalTasks.length;
    if (total === 0) return { done: 0, total: 0, pct: 0, nextTask: '' };
    const today = new Date().toISOString().split('T')[0];
    const done = goalTasks.filter((t: any) => (t.completedDates || '').includes(today)).length;
    const next = goalTasks.find((t: any) => !(t.completedDates || '').includes(today));
    return { done, total, pct: Math.round((done / total) * 100), nextTask: next?.title || '' };
  }

  function getColorForGoal(category: string): string {
    return CATEGORY_COLORS[category] || theme.colors.primary;
  }

  async function addGoal(category: string) {
    const preset = presets[category];
    if (!preset) return;
    try {
      const result = await api.createGoal({ title: preset.title, category, notes: customNotes });
      const goalId = result.id;
      setShowModal(false);
      setCustomNotes('');
      setSelectedCategory('');
      if (preset.tasks) {
        for (const taskTitle of preset.tasks) {
          try { await api.createTask({ title: taskTitle, description: '', frequency: 'daily', goalId }); } catch {}
        }
      }
      await loadData();
    } catch (e: any) {
      if (e.message !== 'Dit doel bestaat al') Alert.alert('Fout', e.message);
    }
  }

  function handleLongPress(id: number, title: string) {
    Alert.alert('Doel verwijderen', `Weet je zeker dat je "${title}" wilt verwijderen?`, [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Verwijder', style: 'destructive', onPress: async () => { try { await api.deleteGoal(id); await loadData(); } catch {} } },
    ]);
  }

  function handleToggle(id: number, active: boolean) {
    Alert.alert(active ? 'Doel afronden' : 'Doel hervatten', active ? 'Markeer dit doel als afgerond?' : 'Hervat dit doel?', [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Ja', onPress: async () => { try { await api.updateGoal(id, { active: !active }); await loadData(); } catch {} } },
    ]);
  }

  const activeGoals = goals.filter((g: any) => g.active);
  const inactiveGoals = goals.filter((g: any) => !g.active);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Mijn doelen</Text>
            <Text style={styles.headerSub}>{activeGoals.length} actieve {activeGoals.length === 1 ? 'doel' : 'doelen'}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>+ Nieuw doel</Text>
          </TouchableOpacity>
        </View>

        {activeGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>Nog geen actieve doelen</Text>
            <Text style={styles.emptySub}>Voeg een doel toe om aan te werken</Text>
          </View>
        ) : (
          activeGoals.map((g: any) => {
            const color = getColorForGoal(g.category);
            const prog = getProgress(g);
            return (
              <TouchableOpacity
                key={g.id}
                style={styles.goalCard}
                onLongPress={() => handleLongPress(g.id, g.title)}
                activeOpacity={0.95}
              >
                <View style={[styles.goalLeftBar, { backgroundColor: color }]} />
                <View style={styles.goalBody}>
                  <View style={styles.goalTop}>
                    <Text style={styles.goalEmoji}>{getEmojiForCategory(g.category)}</Text>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalTitle}>{g.title}</Text>
                      <Text style={styles.goalProgressText}>{prog.done} van {prog.total} taken vandaag</Text>
                    </View>
                    <View style={[styles.goalPctCircle, { borderColor: color }]}>
                      <Text style={[styles.goalPctCircleText, { color }]}>{prog.pct}%</Text>
                    </View>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${prog.pct}%`, backgroundColor: color }]} />
                  </View>
                  <View style={styles.goalBottomRow}>
                    {prog.pct === 100 ? <Text style={styles.nextTask}>Alles gedaan! ✅</Text> : prog.nextTask ? <Text style={styles.nextTask}>Volgende: {prog.nextTask} →</Text> : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {activeGoals.length > 0 && (
          <View style={styles.motivationCard}>
            <Text style={styles.motivationIcon}>🌸</Text>
            <View style={styles.motivationBody}>
              <Text style={styles.motivationTitle}>Jij doet het geweldig!</Text>
              <Text style={styles.motivationSub}>Je werkt actief aan {activeGoals.length} {activeGoals.length === 1 ? 'doel' : 'doelen'} 💪</Text>
            </View>
          </View>
        )}

        {inactiveGoals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Afgeronde doelen</Text>
            {inactiveGoals.map((g: any) => (
              <TouchableOpacity key={g.id} style={[styles.goalCard, styles.inactiveCard]} onPress={() => handleToggle(g.id, g.active)}>
                <View style={[styles.goalLeftBar, { backgroundColor: '#BDBDBD' }]} />
                <View style={styles.goalBody}>
                  <Text style={styles.goalTitle}>{g.title}</Text>
                  <Text style={styles.goalProgressText}>Afgerond \u2714\ufe0f</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Kies een doel</Text>
            <ScrollView style={styles.presetList}>
              {Object.entries(presets).map(([key, preset]) => {
                const color = getColorForGoal(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.presetItem, selectedCategory === key && { backgroundColor: color + '22', borderLeftColor: color, borderLeftWidth: 4 }]}
                    onPress={() => setSelectedCategory(key)}
                  >
                    <Text style={styles.presetIcon}>{preset.icon || getEmojiForCategory(key)}</Text>
                    <View style={styles.presetInfo}>
                      <Text style={styles.presetTitle}>{preset.title}</Text>
                      <Text style={styles.presetCount}>{preset.tasks?.length || 0} taken</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TextInput style={styles.modalInput} placeholder="Eigen notities (optioneel)" value={customNotes} onChangeText={setCustomNotes} placeholderTextColor="#CCC" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Annuleren</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, !selectedCategory && { opacity: 0.5 }]} disabled={!selectedCategory} onPress={() => addGoal(selectedCategory)}>
                <Text style={styles.confirmText}>Toevoegen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8, marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text },
  headerSub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  addBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: theme.borderRadius.xl, ...theme.shadow.sm },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  emptySub: { fontSize: 14, color: theme.colors.textSecondary },

  goalCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, marginBottom: 12, flexDirection: 'row', overflow: 'hidden', ...theme.shadow.card },
  goalLeftBar: { width: 6 },
  goalBody: { flex: 1, padding: 16 },
  goalTop: { flexDirection: 'row', alignItems: 'center' },
  goalEmoji: { fontSize: 22, marginRight: 10 },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  goalProgressText: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  goalPctCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2.5, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  goalPctCircleText: { fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 10, backgroundColor: '#F0E8F0', borderRadius: 5, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'right' },
  goalBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  nextTask: { fontSize: 11, color: theme.colors.primary, fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 8 },
  inactiveCard: { opacity: 0.6 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text, marginBottom: 12, marginTop: 8 },

  motivationCard: { backgroundColor: '#FCE4EC', borderRadius: theme.borderRadius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 12, ...theme.shadow.card },
  motivationIcon: { fontSize: 28, marginRight: 14 },
  motivationBody: { flex: 1 },
  motivationTitle: { fontSize: 15, fontWeight: '700', color: '#C2185B' },
  motivationSub: { fontSize: 13, color: '#AD1457', marginTop: 2, lineHeight: 18 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: theme.colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.text, marginBottom: 16 },
  presetList: { maxHeight: 340 },
  presetItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: theme.borderRadius.md, marginBottom: 6, backgroundColor: '#FAFAFA', borderLeftWidth: 2, borderLeftColor: 'transparent' },
  presetIcon: { fontSize: 26, marginRight: 14 },
  presetInfo: { flex: 1 },
  presetTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  presetCount: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  modalInput: { backgroundColor: '#F5F5F5', borderRadius: theme.borderRadius.md, padding: 14, fontSize: 14, marginTop: 12, color: theme.colors.text },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: theme.borderRadius.xl, alignItems: 'center', backgroundColor: '#F5F5F5' },
  cancelText: { color: theme.colors.textSecondary, fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: theme.borderRadius.xl, alignItems: 'center', backgroundColor: theme.colors.primary },
  confirmText: { color: '#fff', fontWeight: '700' },
});
