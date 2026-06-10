import { Router, Response } from 'express';
import { getDb, saveDb } from '../database';
import { queryAll, queryOne, execute } from '../db-helpers';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  // Profile info
  const user = queryOne(db, 'SELECT weight, height, bmi, cycleLength, painLevel, medicationWorks, goals, onboardingDone FROM users WHERE id = ?', [req.userId]);

  // Cycle phase berekening
  const lastPeriod = queryOne(db,
    'SELECT date FROM cycle_entries WHERE userId = ? AND flow != "none" ORDER BY date DESC LIMIT 1',
    [req.userId]);

  let cyclePhase = 'Onbekend';
  let daysUntilNextPeriod: number | null = null;

  if (lastPeriod) {
    const entries = queryAll(db,
      'SELECT date, flow FROM cycle_entries WHERE userId = ? AND flow != "none" ORDER BY date ASC',
      [req.userId]);

    const dates = entries.map(e => new Date(e.date).getTime());
    const cycles: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const diff = Math.round((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
      if (diff > 20 && diff < 50) cycles.push(diff);
    }
    const avgCycle = cycles.length > 0
      ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
      : 28;

    const lastDate = new Date(lastPeriod.date);
    const daysSince = Math.round((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = daysSince % avgCycle;

    if (cycleDay <= 5) cyclePhase = 'Menstruatie';
    else if (cycleDay <= 13) cyclePhase = 'Folliculaire fase';
    else if (cycleDay <= 16) cyclePhase = 'Ovulatie';
    else cyclePhase = 'Luteale fase';

    daysUntilNextPeriod = avgCycle - cycleDay;
  }

  // Active goals
  const activeGoals = queryAll(db,
    'SELECT * FROM goals WHERE userId = ? AND active = 1 ORDER BY startDate DESC',
    [req.userId]);

  // Today's tasks (with completion status)
  const allTasks = queryAll(db, 'SELECT * FROM tasks WHERE userId = ?', [req.userId]);
  const todayTasks = allTasks.map(t => ({
    ...t,
    completed: t.completedDates?.includes(today) || false,
  }));

  // Today's quiz
  const todayQuiz = queryOne(db,
    'SELECT * FROM quiz_entries WHERE userId = ? AND date = ?',
    [req.userId, today]);

  // Streak berekening
  const quizDates = queryAll(db,
    'SELECT date FROM quiz_entries WHERE userId = ? ORDER BY date DESC',
    [req.userId]);

  let streak = 0;
  const checkDate = new Date();
  for (const q of quizDates) {
    const d = new Date(q.date);
    const diff = Math.round((checkDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === streak) streak++;
    else break;
  }

  // Today's calories
  const todayFood = queryAll(db,
    'SELECT calories FROM food_entries WHERE userId = ? AND date = ?',
    [req.userId, today]);
  const todayCalories = todayFood.reduce((sum, f) => sum + (f.calories || 0), 0);

  // Today's workout
  const todayWorkout = queryOne(db,
    'SELECT * FROM workout_entries WHERE userId = ? AND date = ? ORDER BY id DESC LIMIT 1',
    [req.userId, today]);

  // Pending supplements
  const allSupps = queryAll(db,
    'SELECT * FROM supplements WHERE userId = ? AND active = 1 ORDER BY time ASC',
    [req.userId]);
  const pendingSupplements = allSupps.map((s: any) => ({
    ...s,
    taken: s.takenDates?.includes(today) || false,
  }));

  // Weekly mood chart
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekQuiz = queryAll(db,
    'SELECT date, mood, energy, stress FROM quiz_entries WHERE userId = ? AND date >= ? ORDER BY date ASC',
    [req.userId, weekAgo.toISOString().split('T')[0]]);
  const weeklyMood = weekQuiz.map((q: any) => ({
    date: q.date,
    avg: ((q.mood + q.energy + (11 - q.stress)) / 3).toFixed(1),
  }));

  // Journal today
  const todayJournal = queryOne(db,
    'SELECT question, answer FROM journal_entries WHERE userId = ? AND date = ?',
    [req.userId, today]);

  res.json({
    profile: user ? {
      weight: user.weight,
      height: user.height,
      bmi: user.bmi,
      cycleLength: user.cycleLength,
      painLevel: user.painLevel,
      medicationWorks: !!user.medicationWorks,
      goals: JSON.parse(user.goals || '[]'),
      onboardingDone: !!user.onboardingDone,
    } : null,
    cyclePhase,
    daysUntilNextPeriod,
    activeGoals,
    todayTasks,
    todayQuiz: todayQuiz || null,
    streak,
    todayCalories,
    todayWorkout: todayWorkout || null,
    pendingSupplements,
    weeklyMood,
    todayJournal: todayJournal || null,
  });
});

// Toggle task from dashboard
router.put('/tasks/:id/toggle', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const task = queryOne(db, 'SELECT * FROM tasks WHERE id = ? AND userId = ?', [req.params.id, req.userId]);
  if (!task) { res.status(404).json({ error: 'Task niet gevonden' }); return; }
  const completed = task.completedDates ? task.completedDates.split(',').filter(Boolean) : [];
  const idx = completed.indexOf(date);
  if (idx > -1) {
    completed.splice(idx, 1);
  } else {
    completed.push(date);
  }
  execute(db, 'UPDATE tasks SET completedDates = ? WHERE id = ?', [completed.join(','), req.params.id]);
  saveDb();
  res.json({ completed: idx === -1 });
});

export default router;
