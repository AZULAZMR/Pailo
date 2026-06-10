export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export interface CycleEntry {
  id?: number;
  userId?: number;
  date: string;
  flow: 'light' | 'medium' | 'heavy' | 'none';
  symptoms: string;
  notes: string;
}

export interface Goal {
  id?: number;
  userId?: number;
  title: string;
  category: string;
  startDate: string;
  targetDate?: string;
  notes: string;
  active: boolean;
}

export interface TaskItem {
  id?: number;
  userId?: number;
  goalId?: number;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number;
  completedDates: string;
  createdAt?: string;
  completed?: boolean;
}

export interface QuizEntry {
  id?: number;
  userId?: number;
  date: string;
  mood: number;
  energy: number;
  sleep: number;
  stress: number;
  symptoms: string;
  notes: string;
}

export interface UserProfile {
  weight: number | null;
  height: number | null;
  bmi: number | null;
  cycleLength: number | null;
  painLevel: number | null;
  medicationWorks: boolean;
  goals: string[];
  onboardingDone: boolean;
}

export interface DashboardData {
  profile: UserProfile | null;
  cyclePhase: string;
  daysUntilNextPeriod: number | null;
  activeGoals: Goal[];
  todayTasks: (TaskItem & { completed: boolean })[];
  todayQuiz: QuizEntry | null;
  streak: number;
  todayCalories: number;
  todayWorkout: WorkoutEntry | null;
  pendingSupplements: (Supplement & { taken: boolean })[];
  weeklyMood: { date: string; avg: string }[];
  todayJournal: { question: string; answer: string } | null;
}

export interface GoalPreset {
  id: number;
  category: string;
  title: string;
  icon: string;
}

export interface FoodEntry {
  id?: number;
  userId?: number;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string;
}

export interface WorkoutEntry {
  id?: number;
  userId?: number;
  date: string;
  type: string;
  duration: number;
  intensity: 'light' | 'medium' | 'high';
  exercises: string;
  notes: string;
}

export interface Supplement {
  id?: number;
  userId?: number;
  name: string;
  dose: string;
  time: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays: string;
  takenDates: string;
  active: boolean;
  taken?: boolean;
}

export interface AIAdvice {
  category: string;
  title: string;
  items: string[];
}
