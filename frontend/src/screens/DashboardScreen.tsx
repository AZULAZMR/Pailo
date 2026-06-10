import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { Screen } from '../components/Screen';
import { theme } from '../utils/theme';
import { DashboardData } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function FadeInView({ children, delay = 0, style }: any) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

const PARTICLE_COLORS = ['#F06292', '#CE93D8', '#81C784', '#FFB74D', '#64B5F6', '#EF5350'];
const PARTICLE_COUNT = 16;

function ConfettiBurst({ trigger }: { trigger: number }) {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i, x: new Animated.Value(0), y: new Animated.Value(0), opacity: new Animated.Value(0), scale: new Animated.Value(0),
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length], size: Math.random() * 8 + 5,
      angle: (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5, distance: 80 + Math.random() * 120,
    }))
  ).current;

  useEffect(() => {
    if (trigger === 0) return;
    particles.forEach(p => {
      p.x.setValue(SCREEN_WIDTH / 2); p.y.setValue(300); p.opacity.setValue(1); p.scale.setValue(0.3);
      const dx = Math.cos(p.angle) * p.distance; const dy = Math.sin(p.angle) * p.distance - 60;
      Animated.parallel([
        Animated.timing(p.x, { toValue: SCREEN_WIDTH / 2 + dx, duration: 700 + Math.random() * 300, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: 300 + dy, duration: 700 + Math.random() * 300, useNativeDriver: true }),
        Animated.timing(p.opacity, { toValue: 0, duration: 500, delay: 300 + Math.random() * 200, useNativeDriver: true }),
        Animated.spring(p.scale, { toValue: 1, friction: 8, useNativeDriver: true }),
      ]).start();
    });
  }, [trigger]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => (
        <Animated.View key={p.id} style={{
          position: 'absolute', width: p.size, height: p.size, borderRadius: p.size / 2, backgroundColor: p.color,
          opacity: p.opacity, transform: [{ translateX: p.x }, { translateY: p.y }, { scale: p.scale }],
        }} />
      ))}
    </View>
  );
}

const GOAL_EMOJI: Record<string, string> = {
  slaap: '😴', eten: '🥗', beweging: '🏃', stress: '🧘',
  energie: '⚡', cyclus: '🌸', lichaam: '💪', lifestyle: '🌿',
};

const DAY_LABELS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

const TASK_CAT_COLORS: Record<string, string> = {
  slaap: '#5C6BC0', mediteer: '#CE93D8', adem: '#CE93D8', ontspan: '#CE93D8',
  mindful: '#CE93D8', stretch: '#FF8A65', beweeg: '#FF8A65', wandel: '#FF8A65',
  loop: '#FF8A65', fiets: '#FF8A65', workout: '#FF8A65', water: '#81C784',
  eet: '#81C784', drink: '#81C784', groente: '#81C784', fruit: '#81C784',
  cyclus: '#F06292', spierpijn: '#F06292', kramp: '#F06292',
};

function getTaskColor(title: string): string {
  const lower = title?.toLowerCase() || '';
  for (const [kw, c] of Object.entries(TASK_CAT_COLORS)) {
    if (lower.includes(kw)) return c;
  }
  return theme.colors.textMuted;
}

export function DashboardScreen({ navigation }: any) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  async function loadData() {
    try {
      const [dash, me] = await Promise.all([api.getDashboard(), api.getMe()]);
      setData(dash); setUserName(me.name);
    } catch (e) { console.error(e); }
  }

  async function onRefresh() { setRefreshing(true); await loadData(); setRefreshing(false); }

  async function toggleTask(taskId: number) {
    try {
      const task = data?.todayTasks.find((t: any) => t.id === taskId);
      const wasCompleted = task?.completed;
      await api.toggleTaskFromDashboard(taskId); await loadData();
      if (!wasCompleted) setConfettiTrigger(k => k + 1);
    } catch (e: any) { Alert.alert('Fout', e.message); }
  }

  if (!data) return <Screen scroll={false}><View style={styles.loading}><Text>Laden...</Text></View></Screen>;

  const taskProgress = data.todayTasks.length > 0
    ? Math.round((data.todayTasks.filter((t: any) => t.completed).length / data.todayTasks.length) * 100) : 0;
  const completedCount = data.todayTasks.filter((t: any) => t.completed).length;

  const bmi = data.profile?.bmi;
  let bmiLabel = ''; let bmiColor = theme.colors.success;
  if (bmi) {
    if (bmi < 18.5) { bmiLabel = 'Ondergewicht'; bmiColor = theme.colors.warning; }
    else if (bmi < 25) { bmiLabel = 'Gezond'; bmiColor = theme.colors.success; }
    else if (bmi < 30) { bmiLabel = 'Overgewicht'; bmiColor = theme.colors.warning; }
    else { bmiLabel = 'Obesitas'; bmiColor = theme.colors.error; }
  }

  const phaseEmoji = data.cyclePhase.includes('Menstruatie') ? '🩸' :
    data.cyclePhase.includes('Folliculaire') ? '🌱' :
    data.cyclePhase.includes('Ovulatie') ? '🌸' : '🌙';

  const cycleLength = data.profile?.cycleLength || 28;
  const cycleDay = data.daysUntilNextPeriod != null ? cycleLength - data.daysUntilNextPeriod : 0;
  const cycleProgress = cycleLength > 0 ? Math.round((cycleDay / cycleLength) * 100) : 0;

  function getDayMood(avg: number): string {
    if (avg >= 6) return '🟢';
    if (avg >= 4) return '🟡';
    return '🔴';
  }

  const today = new Date();
  const dayNames = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const monthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  const dateStr = `${dayNames[today.getDay()]} ${today.getDate()} ${monthNames[today.getMonth()]}`;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <ConfettiBurst trigger={confettiTrigger} />
      <FadeInView>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Goedemorgen, {userName}! 🌸</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
          <TouchableOpacity style={styles.avatarCircle} onPress={() => navigation.navigate('Profiel', { screen: 'Profile' })}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </FadeInView>

      <FadeInView delay={100}>
        <TouchableOpacity style={styles.phaseCard} onPress={() => navigation.navigate('Cycle')} activeOpacity={0.85}>
          <View style={styles.phaseLeft}>
            <View style={styles.phaseRow}>
              <View style={styles.phaseEmojiWrap}><Text style={styles.phaseEmoji}>{phaseEmoji}</Text></View>
              <View style={styles.phaseTextWrap}>
                  <Text style={styles.phaseTitle}>{data.cyclePhase}</Text>
                </View>
            </View>
            {data.daysUntilNextPeriod != null && (
              <Text style={styles.phaseDays}>Nog {data.daysUntilNextPeriod} dagen</Text>
            )}
            <View style={styles.cycleProgressBg}>
              <View style={[styles.cycleProgressFill, { width: `${Math.min(cycleProgress, 100)}%` }]} />
            </View>
          </View>
          {bmi && (
            <View style={styles.phaseRight}>
              <Text style={styles.phaseBmiLabel}>BMI</Text>
              <View style={[styles.bmiRing, { borderColor: bmiColor }]}>
                <Text style={styles.bmiValue}>{bmi}</Text>
              </View>
              <View style={[styles.bmiBadge, { backgroundColor: bmiColor }]}>
                <Text style={styles.bmiBadgeText}>{bmiLabel}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </FadeInView>

      {!data.todayJournal && (
        <FadeInView delay={130}>
          <TouchableOpacity style={styles.journalCard} onPress={() => navigation.navigate('Dagboek')} activeOpacity={0.85}>
            <Text style={styles.journalIcon}>📖</Text>
            <View style={styles.journalInfo}>
              <Text style={styles.journalTitle}>Dagboek</Text>
              <Text style={styles.journalSub}>Beantwoord de vraag van vandaag</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </FadeInView>
      )}

      <FadeInView delay={200}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.orangeLight }]}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{data.streak}</Text>
            <Text style={styles.statLabel}>{data.streak === 0 ? 'Begin vandaag!' : 'streak'}</Text>
          </View>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: theme.colors.successLight }]} onPress={() => navigation.navigate('Profiel', { screen: 'Food' })}>
            <Text style={styles.statIcon}>🥗</Text>
            <Text style={styles.statValue}>{data.todayCalories}</Text>
            <Text style={styles.statLabel}>{data.todayCalories === 0 ? 'Begin vandaag!' : 'kcal'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: theme.colors.blueLight }]} onPress={() => navigation.navigate('Profiel', { screen: 'Workout' })}>
            <Text style={styles.statIcon}>🏃</Text>
            <Text style={styles.statValue}>{data.todayWorkout?.duration || 0}</Text>
            <Text style={styles.statLabel}>{!data.todayWorkout?.duration ? 'Begin vandaag!' : 'min'}</Text>
          </TouchableOpacity>
        </View>
      </FadeInView>

      <FadeInView delay={300}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Taken vandaag</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tasks')} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.seeAll}>Bekijk alles</Text>
            <Text style={styles.seeAllArrow}> →</Text>
          </TouchableOpacity>
        </View>
        {data.todayTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>Geen taken vandaag</Text>
          </View>
        ) : (
          <View style={styles.taskCard}>
            <View style={styles.taskProgressRow}>
              <View style={styles.taskProgressBarBg}>
                <View style={[styles.taskProgressBarFill, {
                  width: `${taskProgress}%`,
                  backgroundColor: taskProgress === 100 ? theme.colors.success : theme.colors.primary,
                }]} />
              </View>
              <Text style={[styles.taskProgressPct, { color: taskProgress === 100 ? theme.colors.success : theme.colors.primary }]}>
                {taskProgress}%
              </Text>
              <Text style={styles.taskProgressCount}>{completedCount}/{data.todayTasks.length}</Text>
            </View>
            {data.todayTasks.slice(0, 5).map((task: any) => (
              <TouchableOpacity key={task.id} style={styles.taskItem} onPress={() => toggleTask(task.id)} activeOpacity={0.7}>
                <View style={[styles.catDot, { backgroundColor: getTaskColor(task.title) }]} />
                <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxDone]}>
                  {task.completed && <Text style={styles.taskCheckIcon}>✓</Text>}
                </View>
                <Text style={[styles.taskItemText, task.completed && styles.taskItemTextDone]}>{task.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </FadeInView>

      {data.activeGoals.length > 0 && (
        <FadeInView delay={400}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mijn doelen</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Goals')} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.seeAll}>Bekijk alles</Text>
              <Text style={styles.seeAllArrow}> →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.goalList}>
            {data.activeGoals.slice(0, 3).map((goal: any) => {
              const goalTasks = data.todayTasks.filter((t: any) => t.goalId === goal.id);
              const total = goalTasks.length;
              const done = goalTasks.filter((t: any) => t.completed).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const emoji = GOAL_EMOJI[goal.category] || '🎯';
              return (
                <TouchableOpacity key={goal.id} style={styles.goalItem} onPress={() => navigation.navigate('Goals')}>
                  <Text style={styles.goalEmoji}>{emoji}</Text>
                  <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                  <View style={styles.goalProgressBg}>
                    <View style={[styles.goalProgressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.goalPct}>{pct}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeInView>
      )}

      <FadeInView delay={450}>
        <TouchableOpacity style={styles.coachCard} onPress={() => navigation.navigate('Profiel', { screen: 'AIAgent' })}>
          <Text style={styles.coachAvatar}>🌸</Text>
          <View style={styles.coachInfo}>
            <Text style={styles.coachTitle}>Lotus Coach</Text>
            <Text style={styles.coachSub}>Vraag mij iets...</Text>
          </View>
          <Text style={styles.chevron}>→</Text>
        </TouchableOpacity>
      </FadeInView>

      {data.weeklyMood?.length > 0 && (
        <FadeInView delay={500}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Deze week</Text>
          </View>
          <View style={styles.weekCard}>
            <View style={styles.weekGrid}>
              {data.weeklyMood.map((day: any, i: number) => {
                const d = new Date(day.date);
                const avg = Number(day.avg);
                return (
                  <View key={i} style={styles.weekCol}>
                    <Text style={styles.weekDayLabel}>{DAY_LABELS[d.getDay()]}</Text>
                    <Text style={styles.weekDot}>{getDayMood(avg)}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.weekLegend}>
              <Text style={styles.legendText}>🟢 compleet</Text>
              <Text style={styles.legendText}>🟡 gedeeltelijk</Text>
            </View>
          </View>
        </FadeInView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingTop: 4 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text },
  date: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', ...theme.shadow.md },
  avatarInner: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  phaseCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 16, flexDirection: 'row', marginBottom: 12, ...theme.shadow.card },
  phaseLeft: { flex: 1 },
  phaseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  phaseEmojiWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.secondaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  phaseEmoji: { fontSize: 18 },
  phaseTextWrap: {},
  phaseTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  phaseSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: -1 },
  phaseDays: { fontSize: 12, color: theme.colors.primary, fontWeight: '600', marginBottom: 8 },
  cycleProgressBg: { height: 6, backgroundColor: theme.colors.background, borderRadius: 3, overflow: 'hidden' },
  cycleProgressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  phaseRight: { alignItems: 'center', justifyContent: 'center', marginLeft: 16, minWidth: 64 },
  phaseBmiLabel: { fontSize: 10, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  bmiRing: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  bmiValue: { fontSize: 14, fontWeight: 'bold', color: theme.colors.text },
  bmiBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4 },
  bmiBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  journalCard: { backgroundColor: theme.colors.secondaryLight, borderRadius: theme.borderRadius.lg, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  journalIcon: { fontSize: 22, marginRight: 12 },
  journalInfo: { flex: 1 },
  journalTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  journalSub: { fontSize: 12, color: theme.colors.textSecondary },
  chevron: { fontSize: 20, color: theme.colors.textMuted },
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: theme.borderRadius.lg, padding: 12, alignItems: 'center', ...theme.shadow.sm },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text },
  statLabel: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '500', marginTop: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
  seeAll: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
  seeAllArrow: { fontSize: 13, color: theme.colors.primary, fontWeight: '600', marginLeft: 2 },
  emptyCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 24, alignItems: 'center', marginBottom: 12, ...theme.shadow.sm },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  taskCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 16, marginBottom: 12, ...theme.shadow.card },
  taskProgressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  taskProgressBarBg: { flex: 1, height: 6, backgroundColor: theme.colors.background, borderRadius: 3, overflow: 'hidden', marginRight: 10 },
  taskProgressBarFill: { height: '100%', borderRadius: 3 },
  taskProgressPct: { fontSize: 14, fontWeight: 'bold', marginRight: 8, minWidth: 36, textAlign: 'right' },
  taskProgressCount: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' },
  catDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  taskCheckbox: { width: 22, height: 22, borderRadius: 8, borderWidth: 2, borderColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  taskCheckboxDone: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  taskCheckIcon: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  taskItemText: { fontSize: 14, color: theme.colors.text, flex: 1 },
  taskItemTextDone: { textDecorationLine: 'line-through', color: theme.colors.textMuted },
  goalList: { marginBottom: 12, gap: 8 },
  goalItem: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: 12, flexDirection: 'row', alignItems: 'center', ...theme.shadow.sm },
  goalEmoji: { fontSize: 18, marginRight: 8 },
  goalTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text, flex: 1, marginRight: 8 },
  goalProgressBg: { width: 56, height: 6, backgroundColor: theme.colors.background, borderRadius: 3, overflow: 'hidden', marginRight: 6 },
  goalProgressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  goalPct: { fontSize: 12, fontWeight: '700', color: theme.colors.text, minWidth: 32, textAlign: 'right' },
  coachCard: { backgroundColor: theme.colors.secondaryLight, borderRadius: theme.borderRadius.lg, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  coachAvatar: { fontSize: 22, marginRight: 10 },
  coachInfo: { flex: 1 },
  coachTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  coachSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 },
  weekCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 16, marginBottom: 20, ...theme.shadow.card },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  weekCol: { alignItems: 'center' },
  weekDayLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  weekDot: { fontSize: 20 },
  weekLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  legendText: { fontSize: 11, color: theme.colors.textSecondary },
});
