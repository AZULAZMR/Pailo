import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest as useGoogleAuthRequest } from 'expo-auth-session/providers/google';
import { useAuth } from '../store/AuthContext';
import { theme } from '../utils/theme';
import { OAUTH_CONFIG } from '../config/oauth';

WebBrowser.maybeCompleteAuthSession();

const googleHasConfig = !!(OAUTH_CONFIG.google.iosClientId || OAUTH_CONFIG.google.androidClientId ||
  OAUTH_CONFIG.google.webClientId || OAUTH_CONFIG.google.expoClientId);

function GoogleSignInButton({ loading }: { loading: boolean }) {
  const { socialLogin } = useAuth();
  const [, googleResponse, promptGoogle] = useGoogleAuthRequest({
    iosClientId: OAUTH_CONFIG.google.iosClientId,
    androidClientId: OAUTH_CONFIG.google.androidClientId,
    webClientId: OAUTH_CONFIG.google.webClientId,
    expoClientId: OAUTH_CONFIG.google.expoClientId,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token, accessToken } = googleResponse.params;
      if (id_token) {
        (async () => {
          try {
            await socialLogin('google', id_token);
          } catch (e: any) {
            Alert.alert('Fout', e.message || 'Google inloggen mislukt');
          }
        })();
      }
    }
  }, [googleResponse]);

  return (
    <TouchableOpacity style={styles.socialButton} onPress={() => promptGoogle()} disabled={loading} activeOpacity={0.8}>
      <Text style={styles.googleIcon}>G</Text>
      <Text style={styles.socialButtonText}>Doorgaan met Google</Text>
    </TouchableOpacity>
  );
}

function LotusLogo() {
  return (
    <View style={styles.lotusContainer}>
      <View style={styles.petalBackLeft} />
      <View style={styles.petalBackRight} />
      <View style={styles.petalMidLeft} />
      <View style={styles.petalMidRight} />
      <View style={styles.petalFrontLeft} />
      <View style={styles.petalFrontRight} />
      <View style={styles.petalCenter} />
      <View style={styles.lotusCenter} />
    </View>
  );
}

export function LoginScreen({ navigation }: any) {
  const { login, socialLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleAppleLogin() {
    if (Platform.OS !== 'ios') {
      Alert.alert('Niet beschikbaar', 'Inloggen met Apple is alleen beschikbaar op iOS');
      return;
    }
    try {
      const AppleAuthentication = require('expo-apple-authentication');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope?.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope?.EMAIL,
        ],
      });
      const identityToken = credential.identityToken;
      if (!identityToken) throw new Error('Geen identity token ontvangen');
      setLoading(true);
      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ')
        : undefined;
      await socialLogin('apple', identityToken, credential.email || undefined, fullName);
    } catch (e: any) {
      if (e.code !== 'ERR_CANCELED') {
        Alert.alert('Fout', e.message || 'Apple inloggen mislukt');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleGooglePress() {
    Alert.alert(
      'Google OAuth configureren',
      'Vul je Google Client ID in in frontend/src/config/oauth.ts\n\n' +
      'Zo maak je een Client ID aan:\n' +
      '1. Ga naar https://console.cloud.google.com\n' +
      '2. Maak een project aan\n' +
      '3. Ga naar APIs & Services > Credentials\n' +
      '4. Maak een OAuth 2.0 Client ID aan\n' +
      '5. Voeg het web type toe voor de web build\n' +
      '6. Voeg iOS/Android type toe voor de app',
      [{ text: 'OK' }]
    );
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Fout', 'Vul alle velden in');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      Alert.alert('Fout', e.message || 'Inloggen mislukt');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={styles.decoTopRight}>
          <View style={styles.decoCircleLarge} />
          <View style={styles.decoCircleSmall} />
        </View>

        <View style={styles.logoSection}>
          <LotusLogo />
          <Text style={styles.appName}>Pailo</Text>
          <Text style={styles.tagline}>Jouw lichaam, in harmonie</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.label}>E-mailadres</Text>
          <TextInput
            style={styles.input}
            placeholder="demo@health.app"
            placeholderTextColor={theme.colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <View style={styles.passwordLabelRow}>
            <Text style={styles.label}>Wachtwoord</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotLink}>Vergeten? →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Inloggen</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>of</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialSection}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleAppleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.socialIcon}>🍎</Text>
            <Text style={styles.socialButtonText}>Doorgaan met Apple</Text>
          </TouchableOpacity>

          {googleHasConfig ? (
            <GoogleSignInButton loading={loading} />
          ) : (
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGooglePress}
              activeOpacity={0.8}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.socialButtonText}>Doorgaan met Google</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>Nog geen account? Registreer</Text>
        </TouchableOpacity>

        <View style={styles.decoBottomLeft}>
          <View style={styles.decoCircleBottom} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  decoTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  decoCircleLarge: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F06292',
    opacity: 0.15,
  },
  decoCircleSmall: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#CE93D8',
    opacity: 0.15,
  },
  decoBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  decoCircleBottom: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#CE93D8',
    opacity: 0.12,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  lotusContainer: {
    width: 80,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  petalBackLeft: {
    position: 'absolute',
    width: 22,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#CE93D8',
    bottom: 16,
    left: 8,
    transform: [{ rotate: '-40deg' }],
  },
  petalBackRight: {
    position: 'absolute',
    width: 22,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#CE93D8',
    bottom: 16,
    right: 8,
    transform: [{ rotate: '40deg' }],
  },
  petalMidLeft: {
    position: 'absolute',
    width: 24,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8BBD0',
    bottom: 18,
    left: 14,
    transform: [{ rotate: '-20deg' }],
  },
  petalMidRight: {
    position: 'absolute',
    width: 24,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F8BBD0',
    bottom: 18,
    right: 14,
    transform: [{ rotate: '20deg' }],
  },
  petalFrontLeft: {
    position: 'absolute',
    width: 22,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#F06292',
    bottom: 18,
    left: 6,
    transform: [{ rotate: '-10deg' }],
  },
  petalFrontRight: {
    position: 'absolute',
    width: 22,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#F06292',
    bottom: 18,
    right: 6,
    transform: [{ rotate: '10deg' }],
  },
  petalCenter: {
    position: 'absolute',
    width: 20,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F06292',
    bottom: 22,
  },
  lotusCenter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#CE93D8',
    zIndex: 10,
    bottom: 22,
    position: 'absolute',
  },
  appName: {
    fontSize: 36,
    fontWeight: '300',
    color: theme.colors.primary,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    fontStyle: 'italic',
    marginTop: 4,
  },
  formSection: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    fontSize: 15,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 13,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  passwordWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    color: theme.colors.text,
  },
  eyeButton: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 18,
  },
  loginButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    padding: 16,
    alignItems: 'center',
    ...theme.shadow.md,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  socialSection: {
    width: '100%',
    gap: 12,
  },
  socialButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.sm,
    marginBottom: 12,
  },
  socialIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 10,
    width: 22,
    height: 22,
    textAlign: 'center',
    lineHeight: 22,
    backgroundColor: '#fff',
    borderRadius: 11,
    overflow: 'hidden',
  },
  registerLink: {
    color: theme.colors.secondary,
    marginTop: 24,
    fontSize: 14,
    fontWeight: '500',
  },
});
