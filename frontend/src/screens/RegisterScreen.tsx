import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { theme } from '../utils/theme';

export function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) { Alert.alert('Fout', 'Vul alle velden in'); return; }
    if (password.length < 6) { Alert.alert('Fout', 'Wachtwoord moet minimaal 6 karakters zijn'); return; }
    setLoading(true);
    try {
      await register(email, name, password);
    } catch (e: any) {
      Alert.alert('Fout', e.message || 'Registreren mislukt');
    } finally { setLoading(false); }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Account aanmaken</Text>
      <Text style={styles.subtitle}>Maak je eigen gezondheidsprofiel</Text>

      <TextInput style={styles.input} placeholder="Naam" placeholderTextColor="#999" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Wachtwoord (min 6 chars)" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Registreren</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Heb je al een account? Log in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { alignItems: 'center', justifyContent: 'center', padding: 24, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 32 },
  input: {
    width: '100%', backgroundColor: '#fff', borderRadius: theme.borderRadius.md,
    padding: 16, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border,
  },
  button: {
    width: '100%', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: theme.colors.primary, marginTop: 16, fontSize: 14 },
});
