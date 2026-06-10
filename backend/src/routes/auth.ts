import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import z from 'zod';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { getDb } from '../database';
import { queryOne, execute } from '../db-helpers';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const googleClient = new OAuth2Client();

async function verifyAppleToken(idToken: string): Promise<{ sub: string; email: string | null }> {
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || typeof decoded === 'string') throw new Error('Invalid Apple token');
  const kid = decoded.header.kid;
  const res = await fetch('https://appleid.apple.com/auth/keys');
  const { keys } = await res.json() as { keys: any[] };
  const key = keys.find((k: any) => k.kid === kid);
  if (!key) throw new Error('Apple key not found');
  const pubKey = crypto.createPublicKey({ key: { kty: 'RSA', n: key.n as string, e: key.e as string }, format: 'jwk' });
  const pem = pubKey.export({ type: 'spki', format: 'pem' });
  const payload = jwt.verify(idToken, pem, { algorithms: ['RS256'], issuer: 'https://appleid.apple.com' }) as any;
  return { sub: payload.sub, email: payload.email || null };
}

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ongeldige invoer', details: parsed.error.flatten() });
    return;
  }
  const { email, name, password } = parsed.data;
  const db = getDb();
  const existing = queryOne(db, 'SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    res.status(409).json({ error: 'Email bestaat al' });
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = execute(db, 'INSERT INTO users (email, name, password) VALUES (?, ?, ?)', [email, name, hash]);
  const token = generateToken(result.lastInsertRowid);
  res.status(201).json({ token, userId: result.lastInsertRowid, name });
});

router.post('/login', (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ongeldige invoer' });
    return;
  }
  const { email, password } = parsed.data;
  const db = getDb();
  const user = queryOne(db, 'SELECT id, name, password, onboardingDone FROM users WHERE email = ?', [email]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Ongeldige email of wachtwoord' });
    return;
  }
  const token = generateToken(user.id);
  res.json({ token, userId: user.id, name: user.name, onboardingDone: !!user.onboardingDone });
});

const socialSchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: z.string(),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

router.post('/social', async (req: Request, res: Response) => {
  const parsed = socialSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Ongeldige invoer', details: parsed.error.flatten() });
    return;
  }
  const { provider, idToken, email, name } = parsed.data;
  let providerId: string;
  let userEmail: string | null = email || null;
  let userName: string | null = name || null;
  try {
    if (provider === 'google') {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: undefined });
      const payload = ticket.getPayload();
      if (!payload) throw new Error('Invalid Google token');
      providerId = payload.sub;
      userEmail = userEmail || payload.email || null;
      userName = userName || payload.name || null;
    } else {
      const apple = await verifyAppleToken(idToken);
      providerId = apple.sub;
      userEmail = userEmail || apple.email || null;
      userName = userName || userEmail?.split('@')[0] || 'Gebruiker';
    }
  } catch (e: any) {
    res.status(401).json({ error: 'Ongeldig token' });
    return;
  }

  const db = getDb();
  let user = queryOne(db, 'SELECT id, name, email, onboardingDone FROM users WHERE authProvider = ? AND providerId = ?', [provider, providerId]);
  if (!user && userEmail) {
    user = queryOne(db, 'SELECT id, name, email, onboardingDone FROM users WHERE email = ?', [userEmail]);
  }

  if (user) {
    if (!user.authProvider) {
      execute(db, 'UPDATE users SET authProvider = ?, providerId = ? WHERE id = ?', [provider, providerId, user.id]);
    }
    const token = generateToken(user.id);
    res.json({ token, userId: user.id, name: user.name, email: user.email, onboardingDone: !!user.onboardingDone });
  } else {
    const result = execute(db, 'INSERT INTO users (email, name, password, authProvider, providerId) VALUES (?, ?, ?, ?, ?)',
      [userEmail || `social_${provider}_${providerId}@pailo.app`, userName || 'Gebruiker', '', provider, providerId]);
    const token = generateToken(result.lastInsertRowid);
    res.status(201).json({ token, userId: result.lastInsertRowid, name: userName || 'Gebruiker', email: userEmail || null, onboardingDone: false });
  }
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = queryOne(db, 'SELECT id, email, name, createdAt FROM users WHERE id = ?', [req.userId]);
  if (!user) { res.status(404).json({ error: 'Gebruiker niet gevonden' }); return; }
  res.json(user);
});

export default router;
