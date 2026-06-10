const TUNNEL_URL = 'https://tangy-clubs-battle.loca.lt';
const API_BASE = typeof window !== 'undefined' ? window.location.origin + '/api' : TUNNEL_URL + '/api';

async function request(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    console.log('API error response:', JSON.stringify(err));
    const msg = err.details ? Object.values(err.details.fieldErrors || {}).flat().join(', ') : (err.error || 'Request failed');
    throw new Error(msg);
  }
  return res.json();
}

async function getToken(): Promise<string | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('auth_token');
  } catch { return null; }
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (email: string, name: string, password: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, name, password }) }),

  socialLogin: (provider: 'google' | 'apple', idToken: string, email?: string, name?: string) =>
    request('/auth/social', { method: 'POST', body: JSON.stringify({ provider, idToken, email, name }) }),

  getMe: () => request('/auth/me'),

  getDashboard: () => request('/dashboard'),

  getCycle: () => request('/cycle'),
  saveCycle: (data: any) => request('/cycle', { method: 'POST', body: JSON.stringify(data) }),
  deleteCycle: (id: number) => request(`/cycle/${id}`, { method: 'DELETE' }),
  predictCycle: () => request('/cycle/predict'),

  getGoals: () => request('/goals'),
  createGoal: (data: any) => request('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id: number, data: any) => request(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGoal: (id: number) => request(`/goals/${id}`, { method: 'DELETE' }),
  getGoalPresets: () => request('/goals/presets'),

  getTasks: (date?: string) => request(`/tasks${date ? `?date=${date}` : ''}`),
  createTask: (data: any) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  toggleTask: (id: number, date?: string) => request(`/tasks/${id}/toggle${date ? `?date=${date}` : ''}`, { method: 'PUT' }),
  updateTask: (id: number, data: any) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: number) => request(`/tasks/${id}`, { method: 'DELETE' }),

  getQuizToday: () => request('/quiz/today'),
  getQuizHistory: () => request('/quiz'),
  saveQuiz: (data: any) => request('/quiz', { method: 'POST', body: JSON.stringify(data) }),

  getFood: (date?: string) => request(`/food${date ? `?date=${date}` : ''}`),
  getFoodDaily: (date: string) => request(`/food/daily/${date}`),
  createFood: (data: any) => request('/food', { method: 'POST', body: JSON.stringify(data) }),
  deleteFood: (id: number) => request(`/food/${id}`, { method: 'DELETE' }),

  getWorkouts: (date?: string) => request(`/workouts${date ? `?date=${date}` : ''}`),
  getWorkoutTypes: () => request('/workouts/types'),
  createWorkout: (data: any) => request('/workouts', { method: 'POST', body: JSON.stringify(data) }),
  deleteWorkout: (id: number) => request(`/workouts/${id}`, { method: 'DELETE' }),

  getSupplements: () => request('/supplements'),
  createSupplement: (data: any) => request('/supplements', { method: 'POST', body: JSON.stringify(data) }),
  toggleSupplement: (id: number) => request(`/supplements/${id}/toggle`, { method: 'PUT' }),
  deleteSupplement: (id: number) => request(`/supplements/${id}`, { method: 'DELETE' }),

  getExport: () => request('/export'),

  // Profile / Onboarding
  getProfile: () => request('/profile'),
  saveOnboarding: (data: any) => request('/profile/onboarding', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (data: any) => request('/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // AI advice
  getAIAdvice: () => request('/ai/advice'),

  // Dashboard task toggle
  toggleTaskFromDashboard: (id: number, date?: string) =>
    request(`/dashboard/tasks/${id}/toggle${date ? `?date=${date}` : ''}`, { method: 'PUT' }),

  // Journal
  getJournalQuestion: () => request('/journal/question'),
  getJournalHistory: () => request('/journal'),
  saveJournal: (data: any) => request('/journal', { method: 'POST', body: JSON.stringify(data) }),

  // AI Coach chat
  sendChatMessage: (message: string) =>
    request('/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  getChatHistory: () => request('/chat/history'),
};
