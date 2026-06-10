import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { Screen } from '../components/Screen';
import { theme } from '../utils/theme';

const EXTRA_FEATURES = [
  { name: 'AI Coach', icon: '🌸', screen: 'AIAgent', desc: 'Persoonlijk gezondheidsadvies', bg: '#FCE4EC' },
  { name: 'Inzichten', icon: '📊', screen: 'Insights', desc: 'Grafieken en statistieken', bg: '#FFF8F5' },
  { name: 'Cycle Kalender', icon: '📅', screen: 'Calendar', desc: 'Kalender met voorspellingen', bg: '#FFF8F5' },
  { name: 'Voedingsdagboek', icon: '🥗', screen: 'Food', desc: 'Track je maaltijden en calorieën', bg: '#FFF8F5' },
  { name: 'Workouts', icon: '🏃', screen: 'Workout', desc: 'Log je trainingen', bg: '#FFF8F5' },
  { name: 'Supplementen', icon: '💊', screen: 'Supplements', desc: 'Herinneringen voor supplementen', bg: '#FFF8F5' },
  { name: 'Export', icon: '👩‍⚕️', screen: 'Export', desc: 'Rapport voor de huisarts', bg: '#FFF8F5' },
];

export function MoreScreen({ navigation }: any) {
  const { name, email } = useAuth();

  return (
    <Screen>
      <Text style={styles.title}>Meer</Text>

      {/* Profile card */}
      <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      {EXTRA_FEATURES.map((feature) => (
        <TouchableOpacity
          key={feature.screen}
          style={[styles.featureCard, { backgroundColor: feature.bg }]}
          onPress={() => navigation.navigate(feature.screen)}
          activeOpacity={0.8}
        >
          <View style={[styles.featureIconWrap, feature.screen === 'AIAgent' && { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={styles.featureIcon}>{feature.icon}</Text>
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>{feature.name}</Text>
            <Text style={styles.featureDesc}>{feature.desc}</Text>
          </View>
          <Text style={styles.featureArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20, marginTop: 8 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, padding: 14, borderRadius: theme.borderRadius.lg, marginBottom: 24, ...theme.shadow.card },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileName: { fontSize: 17, fontWeight: '600', color: theme.colors.text },
  profileEmail: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 1 },
  arrow: { fontSize: 26, color: theme.colors.textMuted },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, display: 'none' },
  featureCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: theme.borderRadius.lg, marginBottom: 10, ...theme.shadow.card },
  featureIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  featureIcon: { fontSize: 20 },
  featureInfo: { flex: 1 },
  featureName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  featureDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  featureArrow: { fontSize: 26, color: theme.colors.textSecondary },
});
