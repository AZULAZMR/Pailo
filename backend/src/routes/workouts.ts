import { Router, Response } from 'express';
import z from 'zod';
import { getDb, saveDb } from '../database';
import { queryAll, queryOne, execute } from '../db-helpers';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const WORKOUT_TYPES = [
  'Krachttraining', 'Hardlopen', 'Wandelen', 'Yoga', 'Fietsen',
  'Zwemmen', 'Dans', 'HIIT', 'Pilates', 'Cardio', 'Sport', 'Anders',
];

const createSchema = z.object({
  date: z.string(),
  type: z.string().min(1),
  duration: z.number().min(1),
  intensity: z.enum(['light', 'medium', 'high']).default('medium'),
  exercises: z.string().default(''),
  notes: z.string().default(''),
});

router.get('/types', (_req, res: Response) => {
  res.json(WORKOUT_TYPES);
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { date, startDate, endDate } = req.query;
  let sql = 'SELECT * FROM workout_entries WHERE userId = ?';
  const params: any[] = [req.userId];
  if (date) { sql += ' AND date = ?'; params.push(date); }
  if (startDate && endDate) { sql += ' AND date >= ? AND date <= ?'; params.push(startDate, endDate); }
  sql += ' ORDER BY date DESC, id DESC';
  const entries = queryAll(db, sql, params);
  res.json(entries);
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ongeldige invoer', details: parsed.error.flatten() }); return; }
  const db = getDb();
  const { date, type, duration, intensity, exercises, notes } = parsed.data;
  const result = execute(db,
    'INSERT INTO workout_entries (userId, date, type, duration, intensity, exercises, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.userId, date, type, duration, intensity, exercises, notes]);
  saveDb();
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { type, duration, intensity, exercises, notes } = req.body;
  execute(db,
    'UPDATE workout_entries SET type = COALESCE(?, type), duration = COALESCE(?, duration), intensity = COALESCE(?, intensity), exercises = COALESCE(?, exercises), notes = COALESCE(?, notes) WHERE id = ? AND userId = ?',
    [type, duration, intensity, exercises, notes, req.params.id, req.userId]);
  saveDb();
  res.json({ updated: true });
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  execute(db, 'DELETE FROM workout_entries WHERE id = ? AND userId = ?', [req.params.id, req.userId]);
  saveDb();
  res.json({ deleted: true });
});

router.get('/stats/:date', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const date = req.params.date;
  const today = queryAll(db, 'SELECT * FROM workout_entries WHERE userId = ? AND date = ?', [req.userId, date]);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const week = queryAll(db,
    'SELECT date, SUM(duration) as totalDuration, COUNT(*) as count FROM workout_entries WHERE userId = ? AND date >= ? GROUP BY date ORDER BY date',
    [req.userId, weekAgo.toISOString().split('T')[0]]);
  const month = queryAll(db,
    'SELECT date, SUM(duration) as totalDuration, COUNT(*) as count FROM workout_entries WHERE userId = ? AND date >= ? GROUP BY date ORDER BY date',
    [req.userId, new Date(new Date().setDate(1)).toISOString().split('T')[0]]);
  res.json({ today, week, month });
});

export default router;
