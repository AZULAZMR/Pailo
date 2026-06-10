import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share, Platform } from 'react-native';
import { api } from '../services/api';
import { theme } from '../utils/theme';

export function ExportScreen() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  async function generateReport() {
    setLoading(true);
    try {
      const data = await api.getExport();
      // data is the raw text
      if (typeof data === 'string') {
        setReport(data);
      } else {
        setReport(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      setReport('Fout bij ophalen rapport');
    } finally { setLoading(false); }
  }

  async function shareReport() {
    if (!report) return;
    try {
      await Share.share({ message: report, title: 'Pailo Rapport' });
    } catch (e) { console.error(e); }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Export voor huisarts 👩‍⚕️</Text>
      <Text style={styles.subtitle}>
        Genereer een compleet overzicht van al je gezondheidsdata. Perfect om mee te nemen naar de huisarts of specialist.
      </Text>

      <View style={styles.infoCards}>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoText}>Cyclus data en voorspellingen</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>📊</Text>
          <Text style={styles.infoText}>Dagelijkse check-ins (mood, energie, stress)</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🥗</Text>
          <Text style={styles.infoText}>Voedingsdagboek</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🏃</Text>
          <Text style={styles.infoText}>Workout geschiedenis</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🎯</Text>
          <Text style={styles.infoText}>Doelen, taken en supplementen</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.generateBtn} onPress={generateReport} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.generateText}>📄 Rapport genereren</Text>
        )}
      </TouchableOpacity>

      {report && (
        <>
          <TouchableOpacity style={styles.shareBtn} onPress={shareReport}>
            <Text style={styles.shareText}>📤 Delen</Text>
          </TouchableOpacity>
          <View style={styles.reportBox}>
            <Text style={styles.reportText}>{report}</Text>
          </View>
        </>
      )}

      <View style={styles.privacyNote}>
        <Text style={styles.privacyTitle}>🔒 Privacy</Text>
        <Text style={styles.privacyText}>
          Alle data wordt lokaal opgeslagen op jouw apparaat en server. 
          Het rapport bevat alleen de informatie die jij hebt ingevoerd.
          Deel alleen met zorgverleners die jij vertrouwt.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: theme.colors.text, marginTop: 8 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 20, lineHeight: 20 },
  infoCards: { marginBottom: 20 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: theme.borderRadius.sm, marginBottom: 6 },
  infoIcon: { fontSize: 20, marginRight: 12 },
  infoText: { fontSize: 14, color: theme.colors.text, flex: 1 },
  generateBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, padding: 16, alignItems: 'center', marginBottom: 12 },
  generateText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  shareBtn: { backgroundColor: '#fff', borderRadius: theme.borderRadius.md, padding: 14, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: theme.colors.primary },
  shareText: { color: theme.colors.primary, fontSize: 15, fontWeight: '500' },
  reportBox: { backgroundColor: '#1F2937', borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 20 },
  reportText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11, color: '#34D399', lineHeight: 16 },
  privacyNote: { backgroundColor: '#FEF3C7', borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 40 },
  privacyTitle: { fontSize: 14, fontWeight: '600', color: '#92400E', marginBottom: 4 },
  privacyText: { fontSize: 12, color: '#92400E', lineHeight: 18 },
});
