import { Router, Response } from 'express';
import z from 'zod';
import { getDb, saveDb } from '../database';
import { queryAll, queryOne, execute } from '../db-helpers';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const createSchema = z.object({
  date: z.string(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  food: z.string().min(1),
  calories: z.number().default(0),
  protein: z.number().default(0),
  carbs: z.number().default(0),
  fat: z.number().default(0),
  notes: z.string().default(''),
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { date, startDate, endDate } = req.query;
  let sql = 'SELECT * FROM food_entries WHERE userId = ?';
  const params: any[] = [req.userId];
  if (date) { sql += ' AND date = ?'; params.push(date); }
  if (startDate && endDate) { sql += ' AND date >= ? AND date <= ?'; params.push(startDate, endDate); }
  sql += ' ORDER BY date DESC, id ASC';
  const entries = queryAll(db, sql, params);
  res.json(entries);
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ongeldige invoer', details: parsed.error.flatten() }); return; }
  const db = getDb();
  const { date, mealType, food, calories, protein, carbs, fat, notes } = parsed.data;
  const result = execute(db,
    'INSERT INTO food_entries (userId, date, mealType, food, calories, protein, carbs, fat, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.userId, date, mealType, food, calories, protein, carbs, fat, notes]);
  saveDb();
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { mealType, food, calories, protein, carbs, fat, notes } = req.body;
  execute(db,
    'UPDATE food_entries SET mealType = COALESCE(?, mealType), food = COALESCE(?, food), calories = COALESCE(?, calories), protein = COALESCE(?, protein), carbs = COALESCE(?, carbs), fat = COALESCE(?, fat), notes = COALESCE(?, notes) WHERE id = ? AND userId = ?',
    [mealType, food, calories, protein, carbs, fat, notes, req.params.id, req.userId]);
  saveDb();
  res.json({ updated: true });
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  execute(db, 'DELETE FROM food_entries WHERE id = ? AND userId = ?', [req.params.id, req.userId]);
  saveDb();
  res.json({ deleted: true });
});

router.get('/daily/:date', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const entries = queryAll(db, 'SELECT * FROM food_entries WHERE userId = ? AND date = ? ORDER BY id ASC',
    [req.userId, req.params.date]);
  const totals = entries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories || 0),
    protein: acc.protein + (e.protein || 0),
    carbs: acc.carbs + (e.carbs || 0),
    fat: acc.fat + (e.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  res.json({ entries, totals });
});

export default router;
