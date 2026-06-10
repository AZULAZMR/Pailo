import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Animated, ActivityIndicator } from 'react-native';
import { Screen } from '../components/Screen';
import { useAuth } from '../store/AuthContext';
import { api } from '../services/api';
import { theme } from '../utils/theme';
import { UserProfile } from '../types';

const GOAL_OPTIONS = [
  { id: 'beter_slapen', title: 'Beter slapen', icon: '😴' },
  { id: 'stress_verminderen', title: 'Stress verminderen', icon: '🧘' },
  { id: 'meer_energie', title: 'Meer energie', icon: '⚡' },
  { id: 'gezonder_eten', title: 'Gezonder eten', icon: '🥗' },
  { id: 'meer_bewegen', title: 'Meer bewegen', icon: '🏃' },
  { id: 'afvallen', title: 'Afvallen', icon: '🏋️' },
  { id: 'huid', title: 'Huid verbeteren', icon: '✨' },
  { id: 'haar', title: 'Haaruitval verminderen', icon: '💇' },
  { id: 'libido', title: 'Libido verbeteren', icon: '❤️' },
  { id: 'pcos', title: 'PCOS beheren', icon: '🩺' },
  { id: 'endometriose', title: 'Endometriose beheren', icon: '🫁' },
  { id: 'hormonen', title: 'Hormonale balans', icon: '⚖️' },
  { id: 'menstruatie', title: 'Cyclus reguleren', icon: '🩸' },
  { id: 'pijn', title: 'Pijn verminderen', icon: '💊' },
  { id: 'mindfulness', title: 'Mindfulness', icon: '🧘' },
  { id: 'mentale_gezondheid', title: 'Mentale gezondheid', icon: '🧠' },
];

const EXTRA_FEATURES = [
  { name: 'AI Coach', icon: '🌸', screen: 'AIAgent', desc: 'Persoonlijk advies' },
  { name: 'Inzichten', icon: '📊', screen: 'Insights', desc: 'Grafieken & statistieken' },
  { name: 'Cycle Kalender', icon: '🩸', screen: 'Calendar', desc: 'Kalender met voorspellingen' },
  { name: 'Voedingsdagboek', icon: '🥗', screen: 'Food', desc: 'Track maaltijden & kcal' },
  { name: 'Workouts', icon: '💪', screen: 'Workout', desc: 'Log je trainingen' },
  { name: 'Supplementen', icon: '💊', screen: 'Supplements', desc: 'Herinneringen' },
  { name: 'Export', icon: '📄', screen: 'Export', desc: 'Rapport voor huisarts' },
];

export function ProfileScreen({ navigation }: any) {
  const { name, email, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [menstruationDays, setMenstruationDays] = useState('');
  const [painLevel, setPainLevel] = useState(0);
  const [medicationWorks, setMedicationWorks] = useState<boolean | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      const data = await api.getProfile();
      setProfile(data);
      setWeight(String(data.weight || ''));
      setHeight(String(data.height || ''));
      setMenstruationDays(String(data.cycleLength || ''));
      setPainLevel(data.painLevel || 0);
      setMedicationWorks(data.medicationWorks);
      setSelectedGoals(data.goals || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function toggleGoal(id: string) {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const md = menstruationDays ? parseInt(menstruationDays) : null;
    if (!weight || !height || isNaN(w) || isNaN(h)) {
      Alert.alert('Fout', 'Vul geldige getallen in voor gewicht en lengte');
      return;
    }
    if (w < 20 || w > 300) { Alert.alert('Fout', 'Gewicht moet tussen 20 en 300 kg zijn'); return; }
    if (h < 80 || h > 250) { Alert.alert('Fout', 'Lengte moet in centimeters zijn (bijv. 170)'); return; }
    if (md !== null && (isNaN(md) || md < 1 || md > 14)) { Alert.alert('Fout', 'Menstruatieduur moet tussen 1 en 14 dagen zijn'); return; }
    if (medicationWorks === null) { Alert.alert('Fout', 'Vul alle velden in'); return; }
    setSaving(true);
    try {
      await api.updateProfile({
        weight: w,
        height: h,
        cycleLength: md,
        painLevel,
        medicationWorks,
        goals: selectedGoals,
      });
      await loadProfile();
      setEditing(false);
      Alert.alert('Opgeslagen', 'Je profiel is bijgewerkt');
    } catch (e: any) { Alert.alert('Fout', e.message); }
    setSaving(false);
  }

  function handleLogout() {
    Alert.alert('Uitloggen', 'Weet je het zeker?', [
      { text: 'Annuleren', style: 'cancel' },
      { text: 'Uitloggen', style: 'destructive', onPress: logout },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <Screen scroll={true}>
        <Text style={styles.pageTitle}>Profiel</Text>

        <TouchableOpacity style={styles.profileCard} onPress={() => setEditing(!editing)} activeOpacity={0.85}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
          {editing ? (
            <Text style={styles.cancelEditArrow}>Stop</Text>
          ) : (
            <View style={styles.editChevronWrap}>
              <Text style={styles.editChevronLabel}>Bewerk</Text>
              <Text style={styles.editChevronArrow}>›</Text>
            </View>
          )}
        </TouchableOpacity>

        {!editing ? (
          <>
            {profile?.bmi && (
              <View style={styles.bmiCard}>
                <Text style={styles.bmiLabel}>BMI</Text>
                <Text style={styles.bmiValue}>{profile.bmi}</Text>
                <Text style={[styles.bmiStatus, {
                  color: profile.bmi < 18.5 ? theme.colors.warning : profile.bmi < 25 ? theme.colors.success : theme.colors.error
                }]}>
                  {profile.bmi < 18.5 ? 'Ondergewicht' : profile.bmi < 25 ? 'Gezond gewicht' : profile.bmi < 30 ? 'Overgewicht' : 'Obesitas'}
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Extra functies</Text>

            {EXTRA_FEATURES.map((feature) => (
              <TouchableOpacity
                key={feature.screen}
                style={styles.featureCard}
                onPress={() => navigation?.navigate(feature.screen)}
                activeOpacity={0.8}
              >
                <View style={styles.featureIconWrap}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureName}>{feature.name}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
                <Text style={styles.featureArrow}>›</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Uitloggen</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📏 Lichaam</Text>
              <View style={styles.editRow}>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Gewicht (kg)</Text>
                  <TextInput style={styles.editInput} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="65" placeholderTextColor={theme.colors.textMuted} />
                </View>
                <View style={styles.editField}>
                  <Text style={styles.editLabel}>Lengte (cm)</Text>
                  <TextInput style={styles.editInput} value={height} onChangeText={setHeight} keyboardType="decimal-pad" placeholder="170" placeholderTextColor={theme.colors.textMuted} />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🩸 Menstruatie</Text>
              <Text style={styles.editLabel}>Hoeveel dagen ben je ongesteld?</Text>
              <Text style={styles.editHelp}>Meestal 2-7 dagen</Text>
              <TextInput style={styles.editInput} value={menstruationDays} onChangeText={setMenstruationDays} keyboardType="number-pad" placeholder="5" placeholderTextColor={theme.colors.textMuted} />
              <Text style={[styles.editLabel, { marginTop: 14 }]}>Pijn niveau</Text>
              <View style={styles.painRow}>
                {[0, 2, 4, 6, 8, 10].map(n => (
                  <TouchableOpacity key={n} style={[styles.painDot, painLevel === n && styles.painDotActive]} onPress={() => setPainLevel(n)}>
                    <Text style={[styles.painDotText, painLevel === n && styles.painDotTextActive]}>{n === 0 ? '😊' : n === 10 ? '😫' : n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.editLabel, { marginTop: 14 }]}>Medicatie werkt?</Text>
              <View style={styles.medRow}>
                <TouchableOpacity style={[styles.medBtn, medicationWorks === true && styles.medBtnActive]} onPress={() => setMedicationWorks(true)}>
                  <Text style={[styles.medBtnText, medicationWorks === true && styles.medBtnTextActive]}>Ja</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.medBtn, medicationWorks === false && styles.medBtnActive]} onPress={() => setMedicationWorks(false)}>
                  <Text style={[styles.medBtnText, medicationWorks === false && styles.medBtnTextActive]}>Nee</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎯 Doelen</Text>
              <View style={styles.goalGrid}>
                {GOAL_OPTIONS.map(g => (
                  <TouchableOpacity key={g.id} style={[styles.goalCard, selectedGoals.includes(g.id) && styles.goalCardActive]} onPress={() => toggleGoal(g.id)}>
                    <Text style={styles.goalIcon}>{g.icon}</Text>
                    <Text style={[styles.goalText, selectedGoals.includes(g.id) && styles.goalTextActive]}>{g.title}</Text>
                    {selectedGoals.includes(g.id) && <Text style={styles.goalCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>💾 Opslaan</Text>}
            </TouchableOpacity>
          </>
        )}
      </Screen>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20, marginTop: 8 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, padding: 14, borderRadius: theme.borderRadius.lg, marginBottom: 20, ...theme.shadow.card },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileName: { fontSize: 17, fontWeight: '600', color: theme.colors.text },
  profileEmail: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 1 },
  editChevronWrap: { flexDirection: 'row', alignItems: 'center' },
  editChevronLabel: { fontSize: 13, color: theme.colors.textSecondary, marginRight: 4 },
  editChevronArrow: { fontSize: 26, color: theme.colors.textMuted, marginTop: -2 },
  cancelEditArrow: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
  bmiCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg, padding: 16, alignItems: 'center', marginBottom: 20, ...theme.shadow.card },
  bmiLabel: { fontSize: 11, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  bmiValue: { fontSize: 34, fontWeight: 'bold', color: theme.colors.text, marginVertical: 2 },
  bmiStatus: { fontSize: 15, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  featureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, padding: 14, borderRadius: theme.borderRadius.md, marginBottom: 8, ...theme.shadow.sm },
  featureIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  featureIcon: { fontSize: 20 },
  featureInfo: { flex: 1 },
  featureName: { fontSize: 15, fontWeight: '500', color: theme.colors.text },
  featureDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 },
  featureArrow: { fontSize: 22, color: theme.colors.textMuted },
  logoutBtn: { marginTop: 24, padding: 14, borderRadius: theme.borderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.error },
  logoutText: { color: theme.colors.error, fontSize: 16, fontWeight: '500' },
  section: { marginBottom: 24 },
  editRow: { flexDirection: 'row', gap: 12 },
  editField: { flex: 1 },
  editLabel: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  editHelp: { fontSize: 11, color: theme.colors.textMuted, marginBottom: 8, lineHeight: 15 },
  editInput: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: 12, fontSize: 15, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text, textAlign: 'center' },
  painRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  painDot: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.border },
  painDotActive: { borderColor: theme.colors.error, backgroundColor: theme.colors.errorLight },
  painDotText: { fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary },
  painDotTextActive: { color: theme.colors.error },
  medRow: { flexDirection: 'row', gap: 12 },
  medBtn: { flex: 1, padding: 12, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.card, alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.border },
  medBtnActive: { borderColor: theme.colors.secondary, backgroundColor: theme.colors.secondaryLight },
  medBtnText: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },
  medBtnTextActive: { color: theme.colors.secondary },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: theme.colors.border, width: '48%' },
  goalCardActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight + '40' },
  goalIcon: { fontSize: 16, marginRight: 6 },
  goalText: { fontSize: 11, color: theme.colors.text, flex: 1, fontWeight: '500' },
  goalTextActive: { color: theme.colors.primaryDark },
  goalCheck: { fontSize: 12, color: theme.colors.primary, fontWeight: 'bold' },
  saveBtn: { backgroundColor: theme.colors.success, borderRadius: theme.borderRadius.md, padding: 16, alignItems: 'center', marginBottom: 20, ...theme.shadow.md },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
