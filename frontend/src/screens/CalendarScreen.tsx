import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../utils/theme';

const MONTHS = ['Jan', 'Feb', 'Maa', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

export function CalendarScreen() {
  const [entries, setEntries] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const [cyc, pred] = await Promise.all([api.getCycle(), api.predictCycle()]);
      setEntries(cyc || []);
      setPrediction(pred);
    } catch (e) { console.error(e); }
  }

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  // Shift to Monday-start (0=Sunday => 6, Mon=0, ..., Sat=5, Sun=6)
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  }

  function getEntryForDay(day: number) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entries.find((e: any) => e.date === dateStr);
  }

  function isPredictedPeriod(day: number) {
    if (!prediction?.nextPeriod) return false;
    const predDate = new Date(prediction.nextPeriod);
    return predDate.getMonth() === currentMonth && predDate.getFullYear() === currentYear && predDate.getDate() === day;
  }

  function isPredictedOvulation(day: number) {
    if (!prediction?.ovulation) return false;
    const ovDate = new Date(prediction.ovulation);
    return ovDate.getMonth() === currentMonth && ovDate.getFullYear() === currentYear && ovDate.getDate() === day;
  }

  const selectedDateStr = selectedDay
    ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
    : null;
  const selectedEntry = selectedDateStr ? getEntryForDay(selectedDay!) : null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cycle Kalender 📅</Text>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth}><Text style={styles.navBtn}>◀</Text></TouchableOpacity>
        <Text style={styles.monthTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
        <TouchableOpacity onPress={nextMonth}><Text style={styles.navBtn}>▶</Text></TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.weekGrid}>
        {DAYS.map(d => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
      </View>

      {/* Calendar grid */}
      <View style={styles.calGrid}>
        {Array.from({ length: startOffset }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.dayCell} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const entry = getEntryForDay(day);
          const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
          const isPredicted = isPredictedPeriod(day);
          const isOvulation = isPredictedOvulation(day);
          const isSelected = day === selectedDay;
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayCell,
                isToday && styles.todayCell,
                isSelected && styles.selectedCell,
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayNum, isToday && styles.todayText]}>{day}</Text>
              {entry && (
                <View style={[styles.flowDot, {
                  backgroundColor: entry.flow === 'heavy' ? '#DC2626' : entry.flow === 'medium' ? '#F87171' : entry.flow === 'light' ? '#FCA5A5' : 'transparent',
                }]} />
              )}
              {isPredicted && !entry && <View style={styles.predDot} />}
              {isOvulation && <Text style={styles.ovuIcon}>🌸</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} /><Text style={styles.legendText}>Zwaar</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F87171' }]} /><Text style={styles.legendText}>Medium</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FCA5A5' }]} /><Text style={styles.legendText}>Licht</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#DDD' }]} /><Text style={styles.legendText}>Voorspeld</Text></View>
        <View style={styles.legendItem}><Text style={{ fontSize: 12 }}>🌸</Text><Text style={styles.legendText}>Ovulatie</Text></View>
      </View>

      {/* Selected day detail */}
      {selectedEntry && (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{selectedDateStr}</Text>
          <Text style={styles.detailFlow}>Flow: {selectedEntry.flow}</Text>
          {selectedEntry.symptoms ? <Text style={styles.detailText}>Symptomen: {selectedEntry.symptoms}</Text> : null}
          {selectedEntry.notes ? <Text style={styles.detailText}>Notities: {selectedEntry.notes}</Text> : null}
        </View>
      )}

      {/* Prediction info */}
      {prediction?.nextPeriod && (
        <View style={styles.predCard}>
          <Text style={styles.predTitle}>Voorspellingen</Text>
          <Text style={styles.predText}>Volgende menstruatie: {new Date(prediction.nextPeriod).toLocaleDateString('nl-NL')}</Text>
          <Text style={styles.predText}>Ovulatie: {new Date(prediction.ovulation).toLocaleDateString('nl-NL')}</Text>
          <Text style={styles.predText}>Gem. cyclus: {prediction.avgCycleLength} dagen</Text>
          {prediction.fertileWindow && (
            <Text style={styles.predText}>
              Vruchtbaar venster: {new Date(prediction.fertileWindow.start).toLocaleDateString('nl-NL')} - {new Date(prediction.fertileWindow.end).toLocaleDateString('nl-NL')}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text, marginTop: 8, marginBottom: 16 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { fontSize: 24, color: theme.colors.primary, padding: 8 },
  monthTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  weekGrid: { flexDirection: 'row', marginBottom: 4 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500', paddingVertical: 4 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: theme.borderRadius.md, padding: 4 },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', position: 'relative', padding: 2 },
  todayCell: { backgroundColor: '#FEF3C7', borderRadius: 8 },
  selectedCell: { backgroundColor: theme.colors.primaryLight, borderRadius: 8 },
  dayNum: { fontSize: 13, color: theme.colors.text },
  todayText: { fontWeight: 'bold', color: theme.colors.primary },
  flowDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', bottom: 4 },
  predDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5DB', position: 'absolute', bottom: 4 },
  ovuIcon: { fontSize: 10, position: 'absolute', top: 2, right: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: theme.colors.textSecondary },
  detailCard: { backgroundColor: '#fff', borderRadius: theme.borderRadius.md, padding: 14, marginBottom: 8 },
  detailTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 4 },
  detailFlow: { fontSize: 14, color: theme.colors.text, marginBottom: 2 },
  detailText: { fontSize: 13, color: theme.colors.textSecondary },
  predCard: { backgroundColor: '#FEF3C7', borderRadius: theme.borderRadius.md, padding: 14, marginBottom: 24 },
  predTitle: { fontSize: 15, fontWeight: '600', color: '#92400E', marginBottom: 4 },
  predText: { fontSize: 13, color: '#92400E', marginBottom: 2 },
});
