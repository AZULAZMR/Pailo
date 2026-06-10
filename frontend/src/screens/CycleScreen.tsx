import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { Screen } from '../components/Screen';
import { theme } from '../utils/theme';
import { CycleEntry } from '../types';

const FLOW_OPTIONS = [
  { key: 'none' as const, label: 'Geen', color: '#D1D5DB', bgColor: '#F3F4F6', icon: '○' },
  { key: 'light' as const, label: 'Licht', color: '#F9A8D4', bgColor: '#FCE7F3', icon: '●' },
  { key: 'medium' as const, label: 'Medium', color: '#EC4899', bgColor: '#FBCFE8', icon: '●●' },
  { key: 'heavy' as const, label: 'Zwaar', color: '#BE185D', bgColor: '#F9A8D4', icon: '●●●' },
];

const SYMPTOM_OPTIONS = [
  { label: 'Hoofdpijn', icon: '😤' },
  { label: 'Buikpijn', icon: '😣' },
  { label: 'Vermoeid', icon: '😴' },
  { label: 'Opgeblazen', icon: '🫧' },
  { label: 'Rugpijn', icon: '😣' },
  { label: 'Misselijk', icon: '🤢' },
  { label: 'Gevoelig', icon: '😢' },
  { label: 'Acné', icon: '🔴' },
];

const MONTHS_NL = ['', 'JANUARI', 'FEBRUARI', 'MAART', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AUGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER'];

function formatDateShort(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${dt.toLocaleDateString('nl-NL', { month: 'short' })}`;
}

function getMonthLabel(d: string) {
  const dt = new Date(d);
  return `${MONTHS_NL[dt.getMonth() + 1]} ${dt.getFullYear()}`;
}

function getCycleDay(ovulation: string, avgLength: number): string {
  const today = new Date();
  const ov = new Date(ovulation);
  const diff = Math.round((today.getTime() - ov.getTime()) / 86400000);
  const day = 14 - diff;
  if (day < 1 || day > avgLength) return `Dag 14`;
  return `Dag ${day}`;
}

export function CycleScreen() {
  const [entries, setEntries] = useState<CycleEntry[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [flow, setFlow] = useState<'none' | 'light' | 'medium' | 'heavy'>('none');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  async function loadData() {
    try {
      const [cyc, pred] = await Promise.all([api.getCycle(), api.predictCycle()]);
      setEntries(cyc);
      setPrediction(pred);
    } catch (e) { console.error(e); }
  }

  function toggleSymptom(s: string) {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function saveEntry() {
    try {
      await api.saveCycle({ date: selectedDate, flow, symptoms: symptoms.join(', '), notes });
      Alert.alert('Opgeslagen!', 'Cyclus entry opgeslagen');
      await loadData();
    } catch (e: any) { Alert.alert('Fout', e.message); }
  }

  const today = new Date().toISOString().split('T')[0];
  const pastEntries = entries.filter(e => e.date !== today);

  const groupedByMonth: { month: string; entries: CycleEntry[] }[] = [];
  const seenMonths = new Set<string>();
  for (const e of pastEntries) {
    const ml = getMonthLabel(e.date);
    if (!seenMonths.has(ml)) {
      seenMonths.add(ml);
      groupedByMonth.push({ month: ml, entries: [] });
    }
    groupedByMonth[groupedByMonth.length - 1].entries.push(e);
  }

  function getFlowIcon(flowKey: string) {
    const opt = FLOW_OPTIONS.find(f => f.key === flowKey);
    return opt ? opt.icon : '';
  }

  return (
    <Screen>
      <Text style={styles.pageTitle}>Cyclus</Text>

      {prediction?.nextPeriod && (
        <View style={styles.predCard}>
          <View style={styles.predHeader}>
            <Text style={styles.predTitle}>Voorspelling</Text>
            <View style={styles.predBadge}>
              <Text style={styles.predBadgeText}>{prediction.avgCycleLength} dagen</Text>
            </View>
          </View>
          <View style={styles.timeline}>
            <View style={styles.timelineTrack}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <View style={styles.timelineLine} />
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <View style={styles.timelineLine} />
              <View style={styles.timelineDot} />
            </View>
            <View style={styles.timelineLabels}>
              <View style={styles.timelineLabelWrap}>
                <Text style={styles.timelineLabel}>Nu</Text>
                <Text style={styles.timelineDate}>{getCycleDay(prediction.ovulation, prediction.avgCycleLength)}</Text>
              </View>
              <View style={styles.timelineLabelWrap}>
                <Text style={styles.timelineLabel}>Ovulatie</Text>
                <Text style={styles.timelineDate}>{formatDateShort(prediction.ovulation)}</Text>
              </View>
              <View style={styles.timelineLabelWrap}>
                <Text style={styles.timelineLabel}>Volgende</Text>
                <Text style={styles.timelineDate}>{formatDateShort(prediction.nextPeriod)}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.todayLabel}>
        Vandaag — {new Date(selectedDate).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>FLOW</Text>
        <View style={styles.flowRow}>
          {FLOW_OPTIONS.map(f => {
            const sel = flow === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[
                  styles.flowBtn,
                  sel ? { backgroundColor: f.bgColor, borderColor: f.color } : null,
                ]}
                onPress={() => setFlow(f.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.flowIcon, sel && { color: f.color }]}>{f.icon}</Text>
                <Text style={[styles.flowLabel, sel && { color: f.color, fontWeight: '700' }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>SYMPTOMEN</Text>
        <View style={styles.symptomRow}>
          {SYMPTOM_OPTIONS.map(s => {
            const sel = symptoms.includes(s.label);
            return (
              <TouchableOpacity
                key={s.label}
                style={[styles.symptomChip, sel && styles.symptomChipSel]}
                onPress={() => toggleSymptom(s.label)}
                activeOpacity={0.7}
              >
                <Text style={styles.symptomIcon}>{s.icon}</Text>
                <Text style={[styles.symptomText, sel && styles.symptomTextSel]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TextInput
          style={styles.notesInput}
          placeholder="Notities..."
          placeholderTextColor={theme.colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity style={styles.saveBtn} onPress={saveEntry} activeOpacity={0.85}>
          <Text style={styles.saveText}>Opslaan</Text>
        </TouchableOpacity>
      </View>

      {pastEntries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Nog geen eerdere entries</Text>
        </View>
      ) : (
        groupedByMonth.map(g => (
          <View key={g.month}>
            <View style={styles.monthSep}>
              <View style={styles.monthLine} />
              <Text style={styles.monthLabel}>{g.month}</Text>
              <View style={styles.monthLine} />
            </View>
            {g.entries.map(e => {
              const flowOpt = FLOW_OPTIONS.find(f => f.key === e.flow);
              return (
                <View key={e.id || e.date} style={styles.historyCard}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDay}>{new Date(e.date).getDate()}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <View style={styles.historyFlowRow}>
                      <Text style={[styles.historyFlowDots, { color: flowOpt?.color || '#D1D5DB' }]}>
                        {getFlowIcon(e.flow) || '○'}
                      </Text>
                      <Text style={styles.historyFlowLabel}>{flowOpt?.label || e.flow}</Text>
                    </View>
                    {e.symptoms ? (
                      <Text style={styles.historySymptomText} numberOfLines={1}>
                        {e.symptoms}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 16,
  },
  predCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    ...theme.shadow.card,
  },
  predHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  predTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  predBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  predBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  timeline: {
    marginBottom: 4,
  },
  timelineTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.textMuted,
  },
  timelineDotActive: {
    backgroundColor: theme.colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  timelineLine: {
    flex: 1,
    height: 3,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineLabelWrap: {
    alignItems: 'center',
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    ...theme.shadow.card,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  flowRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  flowBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  flowIcon: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  flowIconSel: {
    color: '#fff',
  },
  flowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  flowLabelSel: {
    color: '#fff',
  },
  symptomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  symptomChipSel: {
    backgroundColor: '#FCE7F3',
    borderColor: '#EC4899',
  },
  symptomTextSel: {
    color: '#BE185D',
    fontWeight: '600',
  },
  symptomIcon: {
    fontSize: 15,
  },
  symptomText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1.5,
    borderColor: '#F5C6D0',
    marginBottom: 14,
    color: theme.colors.text,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  monthSep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  monthLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 6,
    ...theme.shadow.sm,
  },
  historyLeft: {
    width: 42,
    alignItems: 'center',
  },
  historyDay: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  historyRight: {
    flex: 1,
    marginLeft: 8,
  },
  historyFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyFlowDots: {
    fontSize: 16,
    fontWeight: '700',
  },
  historyFlowLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  historySymptomText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
