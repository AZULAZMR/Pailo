import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Animated, PanResponder } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { Screen } from '../components/Screen';
import { ConfettiOverlay } from '../components/ConfettiOverlay';
import { theme } from '../utils/theme';
import { TaskItem } from '../types';

const DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

const CATEGORY_KEYWORDS: Record<string, string> = {
  slaap: '#5C6BC0',
  mediteer: '#CE93D8',
  adem: '#CE93D8',
  ontspan: '#CE93D8',
  mindful: '#CE93D8',
  stretch: '#FF8A65',
  beweeg: '#FF8A65',
  wandel: '#FF8A65',
  loop: '#FF8A65',
  fiets: '#FF8A65',
  workout: '#FF8A65',
  water: '#81C784',
  eet: '#81C784',
  drink: '#81C784',
  groente: '#81C784',
  fruit: '#81C784',
  cyclus: '#F06292',
  spierpijn: '#F06292',
  kramp: '#F06292',
};

function getCategoryColor(title: string): string {
  const lower = title.toLowerCase();
  for (const [keyword, color] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) return color;
  }
  return theme.colors.textMuted;
}

function getBarColor(pct: number): string {
  if (pct < 33) return theme.colors.error;
  if (pct < 66) return theme.colors.orange;
  return theme.colors.success;
}

function getDateStr(): string {
  const now = new Date();
  return `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}

function SwipeableTask({ task, onToggle, onDelete, index }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(30)).current;
  const swipeX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) swipeX.setValue(Math.max(g.dx, -80));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) {
          Animated.spring(swipeX, { toValue: -80, useNativeDriver: true }).start();
        } else {
          Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 300, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const catColor = getCategoryColor(task.title);
  const catLabel = Object.keys(CATEGORY_KEYWORDS).find(k => task.title?.toLowerCase().includes(k)) || '';

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <View style={styles.swipeContainer}>
        <TouchableOpacity style={styles.deleteReveal} onPress={() => onDelete(task.id)}>
          <Text style={styles.deleteRevealText}>🗑</Text>
        </TouchableOpacity>
        <Animated.View style={{ transform: [{ translateX: swipeX }], flex: 1 }} {...panResponder.panHandlers}>
          <TouchableOpacity
            style={[styles.taskCard, task.completed && styles.taskCardDone]}
            onPress={() => onToggle(task.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.comboCheckbox, { borderColor: catColor }, task.completed && { backgroundColor: catColor, borderColor: catColor }]}>
              {task.completed && <Text style={styles.comboCheckIcon}>✓</Text>}
            </View>
            <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]}>{task.title}</Text>
            {catLabel ? (
              <View style={[styles.catPill, { backgroundColor: catColor + '22' }]}>
                <Text style={[styles.catPillText, { color: catColor }]}>{catLabel}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export function TasksScreen() {
  const [tasks, setTasks] = useState<(TaskItem & { completed: boolean })[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [key, setKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => { loadTasks(); }, [])
  );

  async function loadTasks() {
    setLoading(true);
    try {
      const t = await api.getTasks();
      const unique = t.filter((task: any, i: number, self: any[]) => i === self.findIndex((x: any) => x.id === task.id));
      setTasks(unique);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function toggleTask(id: number) {
    const task = tasks.find(t => t.id === id);
    const wasCompleted = task?.completed ?? false;
    try {
      await api.toggleTask(id);
      await loadTasks();
      if (!wasCompleted) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2500);
        setKey(k => k + 1);
      }
    } catch (e: any) { Alert.alert('Fout', e.message); }
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return;
    try {
      await api.createTask({ title: newTaskTitle.trim(), description: '', frequency: 'daily' });
      setNewTaskTitle('');
      setShowAdd(false);
      await loadTasks();
    } catch (e: any) { Alert.alert('Fout', e.message); }
  }

  async function deleteTask(id: number) {
    Alert.alert('Verwijder taak', 'Weet je het zeker?', [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Verwijderen', style: 'destructive', onPress: async () => {
        try { await api.deleteTask(id); await loadTasks(); } catch (e: any) { Alert.alert('Fout', e.message); }
      }},
    ]);
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const barColor = getBarColor(progress);
  const todoTasks = tasks.filter(t => !t.completed);
  const doneTasks = tasks.filter(t => t.completed);

  function getCatForTask(task: any): string {
    const lower = task.title?.toLowerCase() || '';
    for (const kw of Object.keys(CATEGORY_KEYWORDS)) {
      if (lower.includes(kw)) return kw;
    }
    return 'overig';
  }

  function groupByCat(taskList: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    taskList.forEach(t => {
      const cat = getCatForTask(t);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    });
    return grouped;
  }

  const todoGrouped = groupByCat(todoTasks);

  function getEmojiForCat(cat: string): string {
    const map: Record<string, string> = {
      slaap: '😴', mediteer: '🧘', adem: '🌬️', ontspan: '🧘', mindful: '🧠',
      stretch: '🤸', beweeg: '🏃', wandel: '🚶', loop: '🏃', fiets: '🚲',
      workout: '💪', water: '💧', eet: '🥗', drink: '🥤', groente: '🥦',
      fruit: '🍎', cyclus: '🩸', spierpijn: '😣', kramp: '😖', overig: '📋',
    };
    return map[cat] || '📋';
  }

  let taskIndex = 0;

  return (
    <Screen>
      {showConfetti && <ConfettiOverlay key={key} />}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Taken</Text>
          <Text style={styles.dateText}>{getDateStr()}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{completedCount}/{totalCount}</Text>
        </View>
      </View>
      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <View style={styles.progressCircleOuter}>
            <Text style={[styles.progressCircleText, { color: barColor }]}>{progress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: barColor }]} />
          </View>
        </View>
        <Text style={styles.progressLabel}>{completedCount} van {totalCount} taken gedaan</Text>
      </View>
      {loading ? (
        <View style={styles.centerWrap}>
          <Text style={styles.centerText}>Laden...</Text>
        </View>
      ) : totalCount === 0 ? (
        <View style={styles.centerWrap}>
          <Text style={styles.emptyIcon}>🎉</Text>
          <Text style={styles.emptyTitle}>Alles gedaan!</Text>
          <Text style={styles.emptySub}>Voeg een nieuwe taak toe</Text>
        </View>
      ) : (
        <>
          {Object.entries(todoGrouped).map(([cat, catTasks]) => (
            <View key={cat} style={styles.section}>
              <Text style={styles.catSectionTitle}>
                {getEmojiForCat(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
              {catTasks.map((task: any) => {
                const idx = taskIndex++;
                return <SwipeableTask key={task.id} task={task} index={idx} onToggle={toggleTask} onDelete={deleteTask} />;
              })}
            </View>
          ))}
          {doneTasks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitleDone}>GEDAAN ✅</Text>
              {doneTasks.map((task) => {
                const idx = taskIndex++;
                return <SwipeableTask key={task.id} task={task} index={idx} onToggle={toggleTask} onDelete={deleteTask} />;
              })}
            </View>
          )}
        </>
      )}
      {showAdd ? (
        <View style={styles.addSection}>
          <TextInput
            style={styles.addInput}
            placeholder="Bijv. 30 min wandelen"
            placeholderTextColor={theme.colors.textMuted}
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            autoFocus
          />
          <View style={styles.addActions}>
            <TouchableOpacity style={styles.addBtn} onPress={addTask}>
              <Text style={styles.addBtnText}>Toevoegen</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={styles.cancelText}>Annuleren</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addCard} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
          <Text style={styles.addCardText}>+ Nieuwe taak</Text>
        </TouchableOpacity>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: theme.colors.text },
  dateText: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  badge: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  badgeText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  progressCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 16, marginBottom: 20, ...theme.shadow.card },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  progressCircleOuter: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: '#F0E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  progressCircleText: { fontSize: 13, fontWeight: '800' },
  progressBarBg: { flex: 1, height: 12, backgroundColor: theme.colors.background, borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
  progressPct: { fontSize: 14, fontWeight: '700', minWidth: 40, textAlign: 'right' },
  progressLabel: { fontSize: 13, color: theme.colors.textSecondary },
  centerWrap: { alignItems: 'center', paddingVertical: 40 },
  centerText: { fontSize: 14, color: theme.colors.textSecondary },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  emptySub: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, letterSpacing: 1.5, marginBottom: 8 },
  catSectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 8, marginTop: 4 },
  sectionTitleDone: { fontSize: 12, fontWeight: '700', color: theme.colors.success, letterSpacing: 1.5, marginBottom: 8 },
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, paddingVertical: 14, paddingHorizontal: 16, borderRadius: theme.borderRadius.md, ...theme.shadow.sm, minHeight: 50 },
  taskCardDone: { backgroundColor: theme.colors.successLight, opacity: 0.85 },
  comboCheckbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  comboCheckIcon: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  taskTitle: { flex: 1, fontSize: 15, color: theme.colors.text },
  taskTitleDone: { flex: 1, fontSize: 15, color: theme.colors.textMuted, textDecorationLine: 'line-through' },
  doneIcon: { fontSize: 16, marginRight: 10 },
  swipeContainer: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 8, overflow: 'hidden', borderRadius: theme.borderRadius.md },
  deleteReveal: { backgroundColor: '#FF5252', justifyContent: 'center', alignItems: 'center', width: 60, borderRadius: theme.borderRadius.md },
  deleteRevealText: { fontSize: 22 },
  catPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginLeft: 6 },
  catPillText: { fontSize: 10, fontWeight: '600' },
  deleteBtn: { padding: 6, marginLeft: 4 },
  deleteText: { fontSize: 14 },
  addCard: { alignItems: 'center', paddingVertical: 16, borderWidth: 2, borderColor: theme.colors.border, borderStyle: 'dashed', borderRadius: theme.borderRadius.md, marginTop: 4 },
  addCardText: { fontSize: 15, color: theme.colors.textSecondary, fontWeight: '500' },
  addSection: { marginTop: 12 },
  addInput: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: 14, fontSize: 15, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12, color: theme.colors.text },
  addActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: theme.borderRadius.md },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  cancelText: { color: theme.colors.textSecondary, fontSize: 14 },
});
