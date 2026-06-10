import { Router, Response } from 'express';
import z from 'zod';
import { getDb, saveDb } from '../database';
import { queryOne, execute } from '../db-helpers';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const onboardingSchema = z.object({
  weight: z.number().min(20).max(300),
  height: z.number().min(80).max(250),
  cycleLength: z.number().min(1).max(14),
  painLevel: z.number().min(0).max(10),
  medicationWorks: z.boolean(),
  goals: z.array(z.string()),
  name: z.string().optional(),
  age: z.number().min(12).max(120).optional(),
  cycleLengthFull: z.number().min(21).max(35).optional(),
  contraception: z.string().optional(),
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = queryOne(db,
    'SELECT weight, height, bmi, cycleLength, painLevel, medicationWorks, goals, onboardingDone, name, age, cycleLengthFull, contraception FROM users WHERE id = ?',
    [req.userId]);
  if (!user) { res.status(404).json({ error: 'Gebruiker niet gevonden' }); return; }
  res.json({
    weight: user.weight,
    height: user.height,
    bmi: user.bmi,
    cycleLength: user.cycleLength,
    painLevel: user.painLevel,
    medicationWorks: !!user.medicationWorks,
    goals: JSON.parse(user.goals || '[]'),
    onboardingDone: !!user.onboardingDone,
    name: user.name || '',
    age: user.age || null,
    cycleLengthFull: user.cycleLengthFull || 28,
    contraception: user.contraception || null,
  });
});

router.post('/onboarding', authMiddleware, (req: AuthRequest, res: Response) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ongeldige invoer', details: parsed.error.flatten() });
    return;
  }
  const { weight, height, cycleLength, painLevel, medicationWorks, goals, name, age, cycleLengthFull, contraception } = parsed.data;
  const bmi = Math.round((weight / ((height / 100) * (height / 100))) * 10) / 10;
  const db = getDb();
  execute(db,
    `UPDATE users SET name = COALESCE(?, name), weight = ?, height = ?, bmi = ?, cycleLength = ?, painLevel = ?, medicationWorks = ?, goals = ?, age = COALESCE(?, age), cycleLengthFull = COALESCE(?, cycleLengthFull), contraception = COALESCE(?, contraception), onboardingDone = 1 WHERE id = ?`,
    [name || null, weight, height, bmi, cycleLength, painLevel, medicationWorks ? 1 : 0, JSON.stringify(goals), age || null, cycleLengthFull || null, contraception || null, req.userId]);
  saveDb();
  res.json({ bmi, onboardingDone: true });
});

router.put('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const { weight, height, cycleLength, painLevel, medicationWorks } = req.body;
  const db = getDb();
  let bmi = null;
  if (weight && height) {
    bmi = Math.round((weight / ((height / 100) * (height / 100))) * 10) / 10;
  }
  execute(db,
    `UPDATE users SET weight = COALESCE(?, weight), height = COALESCE(?, height), bmi = COALESCE(?, bmi), cycleLength = COALESCE(?, cycleLength), painLevel = COALESCE(?, painLevel), medicationWorks = COALESCE(?, medicationWorks) WHERE id = ?`,
    [weight || null, height || null, bmi, cycleLength || null, painLevel ?? null, medicationWorks !== undefined ? (medicationWorks ? 1 : 0) : null, req.userId]);
  saveDb();
  res.json({ updated: true });
});

export default router;
