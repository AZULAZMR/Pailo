import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDb } from './database';
import authRoutes from './routes/auth';
import cycleRoutes from './routes/cycle';
import goalsRoutes from './routes/goals';
import tasksRoutes from './routes/tasks';
import quizRoutes from './routes/quiz';
import dashboardRoutes from './routes/dashboard';
import foodRoutes from './routes/food';
import workoutRoutes from './routes/workouts';
import supplementRoutes from './routes/supplements';
import exportRoutes from './routes/export';
import profileRoutes from './routes/profile';
import journalRoutes from './routes/journal';
import aiRoutes from './routes/ai';
import chatRoutes from './routes/chat';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

async function main() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/cycle', cycleRoutes);
  app.use('/api/goals', goalsRoutes);
  app.use('/api/tasks', tasksRoutes);
  app.use('/api/quiz', quizRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/food', foodRoutes);
  app.use('/api/workouts', workoutRoutes);
  app.use('/api/supplements', supplementRoutes);
  app.use('/api/export', exportRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/journal', journalRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/chat', chatRoutes);

  const distDir = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    console.warn('frontend/dist niet gevonden op:', distDir);
  }

  app.listen(PORT, () => {
    console.log(`Health app backend draait op http://localhost:${PORT}`);
  });

  // DB init na server start, zodat health endpoint altijd bereikbaar is
  try {
    await initDb();
    console.log('Database geïnitialiseerd');
  } catch (err) {
    console.error('Database init mislukt (app draait verder):', err);
  }
}

main().catch(console.error);
