import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface AuthState {
  token: string | null;
  userId: number | null;
  name: string | null;
  email: string | null;
  onboardingDone: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'apple', idToken: string, email?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  setOnboardingDone: (done: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    userId: null,
    name: null,
    email: null,
    onboardingDone: false,
    loading: true,
  });

  useEffect(() => {
    loadToken();
  }, []);

  async function loadToken() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userId = await AsyncStorage.getItem('user_id');
      const name = await AsyncStorage.getItem('user_name');
      const email = await AsyncStorage.getItem('user_email');
      const onboarding = await AsyncStorage.getItem('onboarding_done');
      if (token) setState({
        token, userId: Number(userId), name, email,
        onboardingDone: onboarding === 'true', loading: false,
      });
      else setState(s => ({ ...s, loading: false }));
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    await AsyncStorage.setItem('auth_token', res.token);
    await AsyncStorage.setItem('user_id', String(res.userId));
    await AsyncStorage.setItem('user_name', res.name);
    await AsyncStorage.setItem('user_email', email);
    const onboarding = !!res.onboardingDone;
    await AsyncStorage.setItem('onboarding_done', String(onboarding));
    setState({
      token: res.token, userId: res.userId, name: res.name, email,
      onboardingDone: onboarding, loading: false,
    });
  }

  async function register(email: string, name: string, password: string) {
    const res = await api.register(email, name, password);
    await AsyncStorage.setItem('auth_token', res.token);
    await AsyncStorage.setItem('user_id', String(res.userId));
    await AsyncStorage.setItem('user_name', res.name);
    await AsyncStorage.setItem('user_email', email);
    await AsyncStorage.setItem('onboarding_done', 'false');
    setState({
      token: res.token, userId: res.userId, name, email,
      onboardingDone: false, loading: false,
    });
  }

  async function socialLogin(provider: 'google' | 'apple', idToken: string, email?: string, name?: string) {
    const res = await api.socialLogin(provider, idToken, email, name);
    await AsyncStorage.setItem('auth_token', res.token);
    await AsyncStorage.setItem('user_id', String(res.userId));
    await AsyncStorage.setItem('user_name', res.name);
    await AsyncStorage.setItem('user_email', res.email || email || '');
    const onboarding = !!res.onboardingDone;
    await AsyncStorage.setItem('onboarding_done', String(onboarding));
    setState({
      token: res.token, userId: res.userId, name: res.name, email: res.email || email || null,
      onboardingDone: onboarding, loading: false,
    });
  }

  async function logout() {
    await AsyncStorage.multiRemove(['auth_token', 'user_id', 'user_name', 'user_email', 'onboarding_done']);
    setState({ token: null, userId: null, name: null, email: null, onboardingDone: false, loading: false });
  }

  function setOnboardingDone(done: boolean) {
    AsyncStorage.setItem('onboarding_done', String(done));
    setState(s => ({ ...s, onboardingDone: done }));
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, socialLogin, logout, setOnboardingDone }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
