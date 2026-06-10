import { Router, Response } from 'express';
import z from 'zod';
import { getDb, saveDb } from '../database';
import { queryAll, execute } from '../db-helpers';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  dose: z.string().default(''),
  time: z.string().default(''),
  frequency: z.enum(['daily', 'weekly', 'custom']).default('daily'),
  customDays: z.string().default(''),
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const supplements = queryAll(db,
    'SELECT * FROM supplements WHERE userId = ? ORDER BY active DESC, time ASC',
    [req.userId]);
  const today = new Date().toISOString().split('T')[0];
  const result = supplements.map(s => ({
    ...s,
    taken: s.takenDates?.includes(today) || false,
  }));
  res.json(result);
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ongeldige invoer', details: parsed.error.flatten() }); return; }
  const db = getDb();
  const { name, dose, time, frequency, customDays } = parsed.data;
  const result = execute(db,
    'INSERT INTO supplements (userId, name, dose, time, frequency, customDays) VALUES (?, ?, ?, ?, ?, ?)',
    [req.userId, name, dose, time, frequency, customDays]);
  saveDb();
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id/toggle', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const today = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const supp = queryAll(db, 'SELECT * FROM supplements WHERE id = ? AND userId = ?', [req.params.id, req.userId])[0];
  if (!supp) { res.status(404).json({ error: 'Niet gevonden' }); return; }
  const taken = supp.takenDates ? supp.takenDates.split(',').filter(Boolean) : [];
  const idx = taken.indexOf(today);
  if (idx > -1) taken.splice(idx, 1);
  else taken.push(today);
  execute(db, 'UPDATE supplements SET takenDates = ? WHERE id = ?', [taken.join(','), req.params.id]);
  saveDb();
  res.json({ taken: idx === -1 });
});

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { name, dose, time, frequency, active } = req.body;
  execute(db,
    'UPDATE supplements SET name = COALESCE(?, name), dose = COALESCE(?, dose), time = COALESCE(?, time), frequency = COALESCE(?, frequency), active = COALESCE(?, active) WHERE id = ? AND userId = ?',
    [name, dose, time, frequency, active != null ? (active ? 1 : 0) : undefined, req.params.id, req.userId]);
  saveDb();
  res.json({ updated: true });
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  execute(db, 'DELETE FROM supplements WHERE id = ? AND userId = ?', [req.params.id, req.userId]);
  saveDb();
  res.json({ deleted: true });
});

export default router;
