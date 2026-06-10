import { Router, Response } from 'express';
import z from 'zod';
import { getDb, saveDb } from '../database';
import { queryAll, queryOne, execute } from '../db-helpers';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const createSchema = z.object({
  mood: z.number().min(1).max(10),
  energy: z.number().min(1).max(10),
  sleep: z.number().min(1).max(10),
  stress: z.number().min(1).max(10),
  symptoms: z.string().default(''),
  notes: z.string().default(''),
});

router.get('/today', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const entry = queryOne(db, 'SELECT * FROM quiz_entries WHERE userId = ? AND date = ?', [req.userId, today]);
  res.json(entry || null);
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const entries = queryAll(db, 'SELECT * FROM quiz_entries WHERE userId = ? ORDER BY date DESC LIMIT 30', [req.userId]);
  res.json(entries);
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ongeldige invoer', details: parsed.error.flatten() }); return; }
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const { mood, energy, sleep, stress, symptoms, notes } = parsed.data;
  const existing = queryOne(db, 'SELECT id FROM quiz_entries WHERE userId = ? AND date = ?', [req.userId, today]);
  if (existing) {
    execute(db,
      'UPDATE quiz_entries SET mood = ?, energy = ?, sleep = ?, stress = ?, symptoms = ?, notes = ? WHERE userId = ? AND date = ?',
      [mood, energy, sleep, stress, symptoms, notes, req.userId, today]);
    saveDb();
    res.json({ updated: true });
    return;
  }
  execute(db,
    'INSERT INTO quiz_entries (userId, date, mood, energy, sleep, stress, symptoms, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.userId, today, mood, energy, sleep, stress, symptoms, notes]);
  saveDb();
  res.status(201).json({ created: true });
});

export default router;
