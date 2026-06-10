import { Router, Response } from 'express';
import z from 'zod';
import { getDb, saveDb } from '../database';
import { queryAll, queryOne, execute } from '../db-helpers';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const createSchema = z.object({
  date: z.string(),
  flow: z.enum(['light', 'medium', 'heavy', 'none']).default('none'),
  symptoms: z.string().default(''),
  notes: z.string().default(''),
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const entries = queryAll(db, 'SELECT * FROM cycle_entries WHERE userId = ? ORDER BY date DESC', [req.userId]);
  res.json(entries);
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ongeldige invoer', details: parsed.error.flatten() }); return; }
  const db = getDb();
  const { date, flow, symptoms, notes } = parsed.data;
  const existing = queryOne(db, 'SELECT id FROM cycle_entries WHERE userId = ? AND date = ?', [req.userId, date]);
  if (existing) {
    execute(db, 'UPDATE cycle_entries SET flow = ?, symptoms = ?, notes = ? WHERE userId = ? AND date = ?',
      [flow, symptoms, notes, req.userId, date]);
    saveDb();
    res.json({ updated: true, date });
    return;
  }
  execute(db, 'INSERT INTO cycle_entries (userId, date, flow, symptoms, notes) VALUES (?, ?, ?, ?, ?)',
    [req.userId, date, flow, symptoms, notes]);
  saveDb();
  res.status(201).json({ created: true, date });
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  execute(db, 'DELETE FROM cycle_entries WHERE id = ? AND userId = ?', [req.params.id, req.userId]);
  saveDb();
  res.json({ deleted: true });
});

router.get('/predict', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const entries = queryAll(db,
    'SELECT date, flow FROM cycle_entries WHERE userId = ? AND flow != "none" ORDER BY date DESC LIMIT 10',
    [req.userId]);

  if (entries.length < 2) {
    res.json({ nextPeriod: null, ovulation: null, message: 'Nog niet genoeg data voor voorspellingen' });
    return;
  }

  const dates = entries.map(e => new Date(e.date).getTime()).sort((a, b) => a - b);
  const cycles: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    if (diff > 20 && diff < 50) cycles.push(diff);
  }

  if (cycles.length === 0) {
    res.json({ nextPeriod: null, ovulation: null, message: 'Nog niet genoeg cycli gedetecteerd' });
    return;
  }

  const avgCycle = Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length);
  const lastPeriod = new Date(dates[dates.length - 1]);
  const nextPeriod = new Date(lastPeriod.getTime() + avgCycle * 86400000);
  const ovulation = new Date(lastPeriod.getTime() + (avgCycle - 14) * 86400000);

  res.json({
    avgCycleLength: avgCycle,
    lastPeriod: lastPeriod.toISOString().split('T')[0],
    nextPeriod: nextPeriod.toISOString().split('T')[0],
    ovulation: ovulation.toISOString().split('T')[0],
    fertileWindow: {
      start: new Date(ovulation.getTime() - 5 * 86400000).toISOString().split('T')[0],
      end: new Date(ovulation.getTime() + 1 * 86400000).toISOString().split('T')[0],
    },
  });
});

export default router;
