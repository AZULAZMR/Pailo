import { Router, Response } from 'express';
import { getDb } from '../database';
import { queryAll } from '../db-helpers';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const userId = req.userId!;

  const user = queryAll(db, 'SELECT name FROM users WHERE id = ?', [userId])[0];
  const goals = queryAll(db, 'SELECT * FROM goals WHERE userId = ? AND active = 1', [userId]);
  const cycleEntries = queryAll(db, 'SELECT * FROM cycle_entries WHERE userId = ? ORDER BY date DESC LIMIT 60', [userId]);
  const quizEntries = queryAll(db, 'SELECT * FROM quiz_entries WHERE userId = ? ORDER BY date DESC LIMIT 30', [userId]);
  const foodEntries = queryAll(db, 'SELECT * FROM food_entries WHERE userId = ? ORDER BY date DESC LIMIT 30', [userId]);
  const workoutEntries = queryAll(db, 'SELECT * FROM workout_entries WHERE userId = ? ORDER BY date DESC LIMIT 30', [userId]);
  const supplements = queryAll(db, 'SELECT * FROM supplements WHERE userId = ? AND active = 1', [userId]);
  const tasks = queryAll(db, 'SELECT * FROM tasks WHERE userId = ?', [userId]);

  const now = new Date().toISOString().split('T')[0];

  let lines: string[] = [];
  lines.push('═══════════════════════════════════════');
  lines.push('  VROUWGEZOND - GEZONDHEIDSRAPPORT');
  lines.push('═══════════════════════════════════════');
  lines.push(`  Naam: ${user?.name || 'Onbekend'}`);
  lines.push(`  Datum: ${now}`);
  lines.push(`  Generated: ${new Date().toLocaleString('nl-NL')}`);
  lines.push('───────────────────────────────────────');

  // Cycle
  lines.push('\n📅 MENSTRUATIECYCLUS');
  lines.push('────────────────────');
  if (cycleEntries.length > 0) {
    const dates = cycleEntries.filter((e: any) => e.flow !== 'none').map((e: any) => e.date).sort();
    let cycleLengths: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      const diff = Math.round((new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime()) / 86400000);
      if (diff > 20 && diff < 50) cycleLengths.push(diff);
    }
    const avg = cycleLengths.length > 0 ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : '?';
    lines.push(`  Gemiddelde cyclus: ${avg} dagen`);
    lines.push(`  Laatste periode: ${dates[dates.length - 1] || 'N/A'}`);
    lines.push(`  Totaal entries: ${cycleEntries.length}`);
  } else {
    lines.push('  Nog geen data');
  }

  // Quiz
  lines.push('\n📊 DAGELIJKSE CHECK-IN (laatste 7 dagen)');
  lines.push('────────────────────────────────────');
  const last7 = quizEntries.slice(0, 7);
  for (const q of last7.reverse() as any[]) {
    const avg = ((q.mood + q.energy + (11 - q.stress)) / 3).toFixed(1);
    lines.push(`  ${q.date}: Mood ${q.mood}/10 | Energie ${q.energy}/10 | Slaap ${q.sleep}/10 | Stress ${q.stress}/10 | Score ${avg}`);
  }

  // Goals
  lines.push('\n🎯 DOELEN');
  lines.push('────────');
  for (const g of goals as any[]) {
    lines.push(`  ✅ ${g.title} (${g.category.replace(/_/g, ' ')})`);
  }
  if (goals.length === 0) lines.push('  Geen actieve doelen');

  // Tasks
  lines.push('\n✅ TAKEN');
  lines.push('────────');
  let completedTasks = 0;
  for (const t of tasks as any[]) {
    const done = t.completedDates?.includes(now);
    if (done) completedTasks++;
    lines.push(`  ${done ? '✅' : '⬜'} ${t.title}`);
  }
  if (tasks.length > 0) lines.push(`  Voortgang: ${completedTasks}/${tasks.length}`);

  // Food
  lines.push('\n🥗 VOEDING (vandaag)');
  lines.push('──────────────────');
  const todayFood = foodEntries.filter((f: any) => f.date === now) as any[];
  if (todayFood.length > 0) {
    let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
    const meals: Record<string, any[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const f of todayFood) {
      meals[f.mealType]?.push(f);
      totalCal += f.calories || 0; totalP += f.protein || 0; totalC += f.carbs || 0; totalF += f.fat || 0;
    }
    for (const [type, items] of Object.entries(meals)) {
      if (items.length > 0) {
        lines.push(`  ${type}: ${items.map((i: any) => `${i.food} (${i.calories}cal)`).join(', ')}`);
      }
    }
    lines.push(`  Totaal: ${totalCal}cal | Eiwit ${totalP}g | Koolh. ${totalC}g | Vet ${totalF}g`);
  } else {
    lines.push('  Nog niet gelogd');
  }

  // Workouts
  lines.push('\n🏃 WORKOUTS (deze maand)');
  lines.push('───────────────────────');
  const monthWorkouts = workoutEntries.filter((w: any) => w.date?.startsWith(now.slice(0, 7)));
  if (monthWorkouts.length > 0) {
    const totalMin = monthWorkouts.reduce((sum: number, w: any) => sum + (w.duration || 0), 0);
    lines.push(`  Aantal workouts: ${monthWorkouts.length}`);
    lines.push(`  Totale duur: ${totalMin} min`);
    for (const w of monthWorkouts.slice(0, 5) as any[]) {
      lines.push(`  • ${w.date}: ${w.type} - ${w.duration}min (${w.intensity})`);
    }
  } else {
    lines.push('  Nog geen workouts gelogd');
  }

  // Supplements
  lines.push('\n💊 SUPPLEMENTEN');
  lines.push('───────────────');
  for (const s of supplements as any[]) {
    const taken = s.takenDates?.includes(now);
    lines.push(`  ${taken ? '✅' : '⬜'} ${s.name} ${s.dose ? `(${s.dose})` : ''} - ${s.time || 'geen tijd'}`);
  }
  if (supplements.length === 0) lines.push('  Geen supplementen ingesteld');

  lines.push('\n═══════════════════════════════════════');
  lines.push('  Einde rapport. Blijf gezond! 🌸');
  lines.push('═══════════════════════════════════════');

  const text = lines.join('\n');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="vrouwgezond-rapport-${now}.txt"`);
  res.send(text);
});

export default router;
