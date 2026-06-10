import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../utils/theme';

export function SupplementScreen() {
  const [supplements, setSupplements] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('');

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  async function loadData() {
    try { setSupplements(await api.getSupplements() || []); } catch (e) { console.error(e); }
  }

  async function toggleSupp(id: number) {
    try { await api.toggleSupplement(id); await loadData(); } catch (e: any) { Alert.alert('Fout', e.message); }
  }

  async function addSupp() {
    if (!name.trim()) { Alert.alert('Fout', 'Vul een naam in'); return; }
    try {
      await api.createSupplement({ name: name.trim(), dose, time, frequency: 'daily', customDays: '' });
      setName(''); setDose(''); setTime(''); setShowAdd(false);
      await loadData();
    } catch (e: any) { Alert.alert('Fout', e.message); }
  }

  async function deleteSupp(id: number) {
    try { await api.deleteSupplement(id); await loadData(); } catch (e: any) { Alert.alert('Fout', e.message); }
  }

  const today = new Date();
  const timeOptions = [];
  for (let h = 6; h <= 23; h++) {
    timeOptions.push(`${String(h).padStart(2, '0')}:00`);
    timeOptions.push(`${String(h).padStart(2, '0')}:30`);
  }

  const active = supplements.filter((s: any) => s.active);
  const takenCount = active.filter((s: any) => s.taken).length;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Supplementen 💊</Text>

      {/* Progress */}
      {active.length > 0 && (
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>{takenCount}/{active.length} vandaag</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(takenCount / active.length) * 100}%` }]} />
          </View>
        </View>
      )}

      {/* Supplement list */}
      {active.map((s: any) => (
        <TouchableOpacity key={s.id} style={styles.suppCard} onPress={() => toggleSupp(s.id)}>
          <View style={[styles.checkCircle, s.taken && styles.checkDone]}>
            <Text style={styles.checkIcon}>{s.taken ? '✓' : ''}</Text>
          </View>
          <View style={styles.suppInfo}>
            <Text style={[styles.suppName, s.taken && styles.suppDone]}>{s.name}</Text>
            {s.dose ? <Text style={styles.suppDose}>{s.dose}</Text> : null}
          </View>
          {s.time ? (
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{s.time}</Text>
            </View>
          ) : null}
          <TouchableOpacity onPress={() => deleteSupp(s.id)} style={styles.suppDelete}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {active.length === 0 && !showAdd && (
        <Text style={styles.emptyText}>Nog geen supplementen. Voeg ze toe!</Text>
      )}

      {/* Inactive */}
      {supplements.filter((s: any) => !s.active).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Gestopt</Text>
          {supplements.filter((s: any) => !s.active).map((s: any) => (
            <View key={s.id} style={[styles.suppCard, styles.inactiveCard]}>
              <Text style={styles.suppName}>{s.name}</Text>
            </View>
          ))}
        </>
      )}

      {/* Add form */}
      {showAdd ? (
        <View style={styles.addForm}>
          <TextInput style={styles.input} placeholder="Supplement naam" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Dosering (bijv. 1000 IU)" value={dose} onChangeText={setDose} />
          <Text style={styles.timeLabel}>Tijdstip</Text>
          <ScrollView horizontal style={styles.timeList} showsHorizontalScrollIndicator={false}>
            {timeOptions.map(t => (
              <TouchableOpacity key={t} style={[styles.timeOption, time === t && styles.timeActive]}
                onPress={() => setTime(t)}>
                <Text style={[styles.timeOptionText, time === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.addBtns}>
            <TouchableOpacity style={styles.saveBtn} onPress={addSupp}><Text style={styles.saveBtnText}>Toevoegen</Text></TouchableOpacity>
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
  progressCard: { backgroundColor: '#fff', borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 12 },
  progressText: { fontSize: 14, color: theme.colors.text, marginBottom: 8, fontWeight: '500' },
  progressBar: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: theme.colors.success, borderRadius: 4 },
  suppCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: theme.borderRadius.md, marginBottom: 6 },
  inactiveCard: { opacity: 0.5 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkDone: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
  checkIcon: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  suppInfo: { flex: 1 },
  suppName: { fontSize: 15, color: theme.colors.text, fontWeight: '500' },
  suppDone: { textDecorationLine: 'line-through', color: theme.colors.textSecondary },
  suppDose: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 },
  timeBadge: { backgroundColor: theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  timeText: { fontSize: 12, color: theme.colors.primary, fontWeight: '500' },
  suppDelete: { padding: 4 },
  deleteText: { fontSize: 16, color: theme.colors.error },
  emptyText: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginTop: 16, marginBottom: 8 },
  addForm: { backgroundColor: '#fff', borderRadius: theme.borderRadius.md, padding: 16, marginTop: 12, marginBottom: 60 },
  input: { backgroundColor: '#F3F4F6', borderRadius: theme.borderRadius.sm, padding: 12, fontSize: 14, marginBottom: 10 },
  timeLabel: { fontSize: 13, fontWeight: '500', color: theme.colors.text, marginBottom: 8 },
  timeList: { flexDirection: 'row', marginBottom: 16 },
  timeOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#F3F4F6', marginRight: 6 },
  timeActive: { backgroundColor: theme.colors.primary },
  timeOptionText: { fontSize: 13, color: theme.colors.textSecondary },
  addBtns: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  saveBtn: { flex: 1, backgroundColor: theme.colors.primary, padding: 12, borderRadius: theme.borderRadius.sm, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  cancelBtn: { color: theme.colors.textSecondary, fontSize: 13, padding: 4 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30, marginTop: -2 },
});
