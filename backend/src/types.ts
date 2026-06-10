export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface CycleEntry {
  id: number;
  userId: number;
  date: string;
  flow: 'light' | 'medium' | 'heavy' | 'none';
  symptoms: string;
  notes: string;
}

export interface Goal {
  id: number;
  userId: number;
  title: string;
  category: GoalCategory;
  startDate: string;
  targetDate?: string;
  notes: string;
  active: boolean;
}

export type GoalCategory =
  | 'afvallen'
  | 'aankomen'
  | 'spiermassa'
  | 'abs_krijgen'
  | 'beter_slapen'
  | 'split_leren'
  | 'flexibiliteit'
  | 'meer_energie'
  | 'minder_stress'
  | 'gezonder_eten'
  | 'conditie_verbeteren'
  | 'zelfvertrouwen';

export interface Task {
  id: number;
  userId: number;
  goalId?: number;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number;
  completedDates: string;
  createdAt: string;
}

export interface QuizEntry {
  id: number;
  userId: number;
  date: string;
  mood: number;
  energy: number;
  sleep: number;
  stress: number;
  symptoms: string;
  notes: string;
}

export interface FoodEntry {
  id: number;
  userId: number;
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
  id: number;
  userId: number;
  date: string;
  type: string;
  duration: number;
  intensity: 'light' | 'medium' | 'high';
  exercises: string;
  notes: string;
}

export interface Supplement {
  id: number;
  userId: number;
  name: string;
  dose: string;
  time: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays: string;
  takenDates: string;
  active: boolean;
}

export interface DashboardData {
  cyclePhase: string;
  daysUntilNextPeriod: number | null;
  activeGoals: Goal[];
  todayTasks: (Task & { completed: boolean })[];
  todayQuiz: QuizEntry | null;
  streak: number;
  todayCalories: number;
  todayWorkout: WorkoutEntry | null;
  pendingSupplements: Supplement[];
  weeklyMood: { date: string; avg: number }[];
}
