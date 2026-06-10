import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../utils/theme';

const screenWidth = Dimensions.get('window').width;

export function InsightsScreen() {
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [workoutStats, setWorkoutStats] = useState<any[]>([]);
  const [cycleEntries, setCycleEntries] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const [quiz, workouts, cycle] = await Promise.all([
        api.getQuizHistory(),
        api.getWorkouts(),
        api.getCycle(),
      ]);
      setQuizHistory(quiz || []);
      setWorkoutStats(workouts || []);
      setCycleEntries(cycle || []);
    } catch (e) { console.error(e); }
  }

  const chartWidth = Math.min(screenWidth - 64, 350);

  // Mood chart
  const moodData = quizHistory.slice(0, 14).reverse();
  const maxVal = 10;

  // Cycle phase distribution
  const phaseCount: Record<string, number> = { menstruatie: 0, folliculair: 0, ovulatie: 0, luteaal: 0 };
  if (cycleEntries.length > 2) {
    const sorted = cycleEntries.filter((e: any) => e.flow !== 'none').map((e: any) => e.date).sort();
    if (sorted.length > 0) {
      const dates = sorted.map((d: string) => new Date(d).getTime());
      const cycles: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        const diff = Math.round((dates[i] - dates[i - 1]) / 86400000);
        if (diff > 20 && diff < 50) cycles.push(diff);
      }
      const avg = cycles.length > 0 ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : 28;
      const lastDate = new Date(sorted[sorted.length - 1]);
      const daysSince = Math.round((Date.now() - lastDate.getTime()) / 86400000);
      const cycleDay = daysSince % avg;
      phaseCount.menstruatie = cycleDay <= 5 ? 1 : 0;
      phaseCount.folliculair = cycleDay > 5 && cycleDay <= 13 ? 1 : 0;
      phaseCount.ovulatie = cycleDay > 13 && cycleDay <= 16 ? 1 : 0;
      phaseCount.luteaal = cycleDay > 16 ? 1 : 0;
    }
  }

  // Mood average
  const avgMood = moodData.length > 0
    ? (moodData.reduce((sum: number, q: any) => sum + q.mood, 0) / moodData.length).toFixed(1)
    : '--';

  // Workout stats
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthWorkouts = workoutStats.filter((w: any) => w.date?.startsWith(thisMonth));
  const totalWorkoutMin = monthWorkouts.reduce((sum: number, w: any) => sum + (w.duration || 0), 0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Inzichten 📊</Text>
      <Text style={styles.subtitle}>Jouw gezondheid in cijfers</Text>

      {/* Stats cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{avgMood}</Text>
          <Text style={styles.statLabel}>Gem. mood</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{moodData.length}</Text>
          <Text style={styles.statLabel}>Check-ins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalWorkoutMin}</Text>
          <Text style={styles.statLabel}>Min. getraind</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{monthWorkouts.length}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
      </View>

      {/* Mood chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Mood & Energie (14 dagen)</Text>
        <View style={styles.chartContainer}>
          <View style={styles.yAxis}>
            {[10, 8, 6, 4, 2].map(n => (
              <Text key={n} style={styles.yLabel}>{n}</Text>
            ))}
          </View>
          <View style={[styles.chart, { width: chartWidth }]}>
            {moodData.map((q: any, i: number) => {
              const moodH = (q.mood / maxVal) * 120;
              const energyH = (q.energy / maxVal) * 120;
              return (
                <View key={i} style={styles.barCol}>
                  <View style={[styles.bar, { height: energyH, backgroundColor: '#93C5FD', opacity: 0.7 }]} />
                  <View style={[styles.bar, { height: moodH, backgroundColor: theme.colors.primary }]} />
                  <Text style={styles.barLabel}>
                    {new Date(q.date).getDate()}/{new Date(q.date).getMonth() + 1}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Cycle info */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Cyclus fase</Text>
        {cycleEntries.length > 0 ? (
          <View style={styles.cyclePhases}>
            {['menstruatie', 'folliculair', 'ovulatie', 'luteaal'].map(phase => (
              <View key={phase} style={[
                styles.phaseDot,
                { backgroundColor: phaseCount[phase] ? theme.colors.primary : '#E5E7EB' },
              ]}>
                <Text style={[
                  styles.phaseText,
                  { color: phaseCount[phase] ? '#fff' : theme.colors.textSecondary },
                ]}>
                  {phase === 'menstruatie' ? '🩸' : phase === 'folliculair' ? '🌱' : phase === 'ovulatie' ? '🌸' : '🌙'}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noData}>Nog niet genoeg cycle data</Text>
        )}
      </View>

      {/* Weekly mood trend */}
      {moodData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Gemiddelde welzijnsscore</Text>
          <View style={styles.trendRow}>
            {moodData.map((q: any, i: number) => {
              const score = (q.mood + q.energy + (11 - q.stress)) / 3;
              return (
                <View key={i} style={styles.trendCol}>
                  <View style={[styles.trendBar, {
                    height: (score / 10) * 100,
                    backgroundColor: score >= 6 ? theme.colors.success : score >= 4 ? theme.colors.warning : theme.colors.error,
                  }]} />
                  <Text style={styles.trendLabel}>{new Date(q.date).getDate()}/{new Date(q.date).getMonth() + 1}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text, marginTop: 8 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: theme.borderRadius.md, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: theme.colors.primary },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  chartCard: { backgroundColor: '#fff', borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 12 },
  chartTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 12 },
  chartContainer: { flexDirection: 'row', height: 160 },
  yAxis: { justifyContent: 'space-between', marginRight: 6, paddingVertical: 4 },
  yLabel: { fontSize: 9, color: theme.colors.textSecondary },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  barCol: { alignItems: 'center', flex: 1, justifyContent: 'flex-end', height: 140 },
  bar: { width: 8, borderRadius: 3, marginBottom: 1 },
  barLabel: { fontSize: 8, color: theme.colors.textSecondary, marginTop: 2 },
  noData: { color: theme.colors.textSecondary, fontSize: 13 },
  cyclePhases: { flexDirection: 'row', justifyContent: 'space-around' },
  phaseDot: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  phaseText: { fontSize: 20 },
  trendRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120 },
  trendCol: { alignItems: 'center', flex: 1 },
  trendBar: { width: 14, borderRadius: 4, minHeight: 4 },
  trendLabel: { fontSize: 9, color: theme.colors.textSecondary, marginTop: 4 },
});
