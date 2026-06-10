import { Router, Response } from 'express';
import { getDb, saveDb } from '../database';
import { queryAll, queryOne, execute } from '../db-helpers';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const DAILY_QUESTIONS = [
  'Waar ben je vandaag dankbaar voor?',
  'Wat was het mooiste moment van vandaag?',
  'Hoe voel je je vandaag op een schaal van 1-10? Waarom?',
  'Wat heb je vandaag voor jezelf gedaan?',
  'Welke gedachten had je vandaag die je blij maakten?',
  'Wat zou je morgen anders willen doen?',
  'Wie heeft vandaag een positieve invloed op je gehad?',
  'Wat heeft je vandaag uitgedaagd?',
  'Beschrijf een moment van vandaag in drie woorden.',
  'Wat is iets nieuws dat je vandaag hebt geleerd?',
  'Hoe heeft je lichaam vandaag aangevoeld?',
  'Wat was je energielevel vandaag? Heb je goed voor jezelf gezorgd?',
  'Welke self-care heb je vandaag gedaan?',
  'Wat heeft je vandaag aan het lachen gemaakt?',
  'Als je vandaag een cijfer zou geven, welk cijfer en waarom?',
  'Wat is een doel dat je morgen wilt bereiken?',
  'Hoe was je slaap afgelopen nacht?',
  'Wat heeft vandaag je stressniveau beïnvloed?',
  'Noem drie dingen waar je trots op bent van vandaag.',
  'Wat voor moois heb je vandaag gezien of meegemaakt?',
];

router.get('/question', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const existing = queryOne(db, 'SELECT question, answer FROM journal_entries WHERE userId = ? AND date = ?', [req.userId, today]);
  if (existing) {
    res.json({ question: existing.question, answer: existing.answer || '', done: true });
    return;
  }
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const question = DAILY_QUESTIONS[dayOfYear % DAILY_QUESTIONS.length];
  res.json({ question, answer: '', done: false });
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const { answer, mood } = req.body;
  if (!answer || !answer.trim()) {
    res.status(400).json({ error: 'Antwoord is verplicht' });
    return;
  }
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const question = DAILY_QUESTIONS[dayOfYear % DAILY_QUESTIONS.length];
  const existing = queryOne(db, 'SELECT id FROM journal_entries WHERE userId = ? AND date = ?', [req.userId, today]);
  if (existing) {
    execute(db, 'UPDATE journal_entries SET answer = ?, mood = ? WHERE userId = ? AND date = ?', [answer, mood || null, req.userId, today]);
  } else {
    execute(db, 'INSERT INTO journal_entries (userId, date, question, answer, mood) VALUES (?, ?, ?, ?, ?)',
      [req.userId, today, question, answer, mood || null]);
  }
  saveDb();
  res.json({ saved: true, question, answer, mood });
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const entries = queryAll(db,
    'SELECT * FROM journal_entries WHERE userId = ? ORDER BY date DESC LIMIT 30',
    [req.userId]);
  res.json(entries);
});

export default router;
