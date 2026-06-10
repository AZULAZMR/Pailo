import { Router, Response } from 'express';
import z from 'zod';
import { getDb, saveDb } from '../database';
import { queryAll, queryOne, execute } from '../db-helpers';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const createSchema = z.object({
  goalId: z.number().optional(),
  title: z.string().min(1),
  description: z.string().default(''),
  frequency: z.enum(['daily', 'weekly', 'custom']).default('daily'),
  customDays: z.number().optional(),
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { date: dateParam, goalId } = req.query;
  let sql = 'SELECT * FROM tasks WHERE userId = ?';
  const params: any[] = [req.userId];
  if (goalId) { sql += ' AND goalId = ?'; params.push(Number(goalId)); }
  const tasks = queryAll(db, sql + ' ORDER BY createdAt DESC', params);
  const today = (dateParam as string) || new Date().toISOString().split('T')[0];
  const result = tasks.map(t => ({
    ...t,
    completed: t.completedDates && t.completedDates.includes(today),
  }));
  res.json(result);
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ongeldige invoer', details: parsed.error.flatten() }); return; }
  const db = getDb();
  const { goalId, title, description, frequency, customDays } = parsed.data;
  const result = execute(db,
    'INSERT INTO tasks (userId, goalId, title, description, frequency, customDays) VALUES (?, ?, ?, ?, ?, ?)',
    [req.userId, goalId || null, title, description, frequency, customDays || null]);
  saveDb();
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id/toggle', authMiddleware, (req: AuthRequest, res: Response) => {
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

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { title, description, frequency } = req.body;
  execute(db,
    'UPDATE tasks SET title = COALESCE(?, title), description = COALESCE(?, description), frequency = COALESCE(?, frequency) WHERE id = ? AND userId = ?',
    [title, description, frequency, req.params.id, req.userId]);
  saveDb();
  res.json({ updated: true });
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  execute(db, 'DELETE FROM tasks WHERE id = ? AND userId = ?', [req.params.id, req.userId]);
  saveDb();
  res.json({ deleted: true });
});

export default router;
