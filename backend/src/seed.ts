import { initDb, getDb, saveDb } from './database';
import { queryOne, execute } from './db-helpers';
import bcrypt from 'bcryptjs';

async function seed() {
  await initDb();
  const db = getDb();

  // Demo gebruiker
  const hash = bcrypt.hashSync('test123', 10);
  execute(db, 'INSERT OR IGNORE INTO users (email, name, password) VALUES (?, ?, ?)',
    ['demo@health.app', 'Demo Gebruiker', hash]);
  let user = queryOne(db, 'SELECT id FROM users WHERE email = ?', ['demo@health.app'])!;

  // Goal presets
  const presets = [
    { cat: 'menstruatie', title: 'Menstruatiecyclus reguleren', icon: '🩸' },
    { cat: 'pijn', title: 'Pijn bij menstruatie verminderen', icon: '💊' },
    { cat: 'zwanger', title: 'Zwanger worden', icon: '🤱' },
    { cat: 'anticonceptie', title: 'Anticonceptie', icon: '⚕️' },
    { cat: 'overgang', title: 'Overgang/Menopauze beheren', icon: '🌺' },
    { cat: 'hormonen', title: 'Hormonale balans herstellen', icon: '⚖️' },
    { cat: 'afvallen', title: 'Afvallen', icon: '🏋️' },
    { cat: 'aankomen', title: 'Aankomen in gewicht', icon: '💪' },
    { cat: 'spieren', title: 'Spieren opbouwen', icon: '💪' },
    { cat: 'gezonder_eten', title: 'Gezonder eten', icon: '🥗' },
    { cat: 'meer_bewegen', title: 'Meer bewegen', icon: '🏃' },
    { cat: 'stress_verminderen', title: 'Stress verminderen', icon: '🧘' },
    { cat: 'beter_slapen', title: 'Beter slapen', icon: '😴' },
    { cat: 'meer_energie', title: 'Meer energie krijgen', icon: '⚡' },
    { cat: 'mentale_gezondheid', title: 'Mentale gezondheid verbeteren', icon: '🧠' },
    { cat: 'huid', title: 'Huid verbeteren', icon: '✨' },
    { cat: 'haar', title: 'Haaruitval verminderen', icon: '💇' },
    { cat: 'libido', title: 'Libido verbeteren', icon: '❤️' },
    { cat: 'zwangerschap', title: 'Zwangerschap voorbereiden', icon: '👶' },
    { cat: 'postpartum', title: 'Postpartum herstel', icon: '🤱' },
    { cat: 'borstvoeding', title: 'Borstvoeding', icon: '🍼' },
    { cat: 'endometriose', title: 'Endometriose beheren', icon: '🫁' },
    { cat: 'pcos', title: 'PCOS beheren', icon: '🩺' },
    { cat: 'migraine', title: 'Migraine bij menstruatie', icon: '🤕' },
    { cat: 'bloedarmoede', title: 'Bloedarmoede/ijzertekort', icon: '🩸' },
    { cat: 'schildklier', title: 'Schildklier gezondheid', icon: '🦋' },
    { cat: 'mindfulness', title: 'Mindfulness/meditatie', icon: '🧘' },
    { cat: 'dagboek', title: 'Dagboek bijhouden', icon: '📓' },
    { cat: 'sociale_connecties', title: 'Sociale connecties verbeteren', icon: '👥' },
    { cat: 'zelfliefde', title: 'Zelfliefde en self-care', icon: '🌸' },
    { cat: 'carriere', title: 'Carrière doelen', icon: '💼' },
    { cat: 'financieel', title: 'Financiële gezondheid', icon: '💰' },
    { cat: 'reizen', title: 'Reizen en avontuur', icon: '✈️' },
    { cat: 'creativiteit', title: 'Creativiteit ontwikkelen', icon: '🎨' },
    { cat: 'koken', title: 'Beter leren koken', icon: '🍳' },
    { cat: 'lezen', title: 'Meer lezen', icon: '📚' },
    { cat: 'hobby', title: 'Nieuwe hobby ontdekken', icon: '🎸' },
    { cat: 'vrijwilliger', title: 'Vrijwilligerswerk doen', icon: '🤝' },
    { cat: 'duurzaam', title: 'Duurzamer leven', icon: '🌍' },
    { cat: 'mindset', title: 'Positieve mindset ontwikkelen', icon: '🌞' },
  ];
  for (const p of presets) {
    execute(db, 'INSERT OR IGNORE INTO goal_presets (category, title, icon) VALUES (?, ?, ?)',
      [p.cat, p.title, p.icon]);
  }

  // Set demo profile
  execute(db,
    `UPDATE users SET weight = 65, height = 170, bmi = 22.5, cycleLength = 5, painLevel = 6, medicationWorks = 1, goals = ?, onboardingDone = 0, age = 25, cycleLengthFull = 28, contraception = 'pil' WHERE id = ?`,
    [JSON.stringify(['beter_slapen', 'stress_verminderen', 'meer_energie']), user.id]);

  // Cycle data
  const cycleData = [
    { date: '2026-05-01', flow: 'heavy', symptoms: 'hoofdpijn, vermoeid', notes: 'Dag 1 - zware dag' },
    { date: '2026-05-02', flow: 'heavy', symptoms: '', notes: '' },
    { date: '2026-05-03', flow: 'medium', symptoms: '', notes: '' },
    { date: '2026-05-04', flow: 'light', symptoms: '', notes: '' },
    { date: '2026-05-05', flow: 'light', symptoms: '', notes: 'Bijna over' },
    { date: '2026-05-28', flow: 'heavy', symptoms: '', notes: '' },
    { date: '2026-05-29', flow: 'heavy', symptoms: 'buikpijn', notes: '' },
    { date: '2026-05-30', flow: 'medium', symptoms: '', notes: '' },
    { date: '2026-05-31', flow: 'light', symptoms: '', notes: '' },
    { date: '2026-06-01', flow: 'light', symptoms: '', notes: '' },
  ];

  for (const c of cycleData) {
    execute(db,
      'INSERT OR IGNORE INTO cycle_entries (userId, date, flow, symptoms, notes) VALUES (?, ?, ?, ?, ?)',
      [user.id, c.date, c.flow, c.symptoms, c.notes]);
  }

  // Goals
  const goals = [
    { title: 'Beter slapen', category: 'beter_slapen', notes: 'Ik wil elke dag voor 23:00 slapen' },
    { title: 'Flexibeler worden', category: 'split_leren', notes: 'Mijn doel is om de split te kunnen tegen december' },
    { title: 'Gezonder eten', category: 'gezonder_eten', notes: 'Meer groente en minder snacks' },
  ];

  for (const g of goals) {
    const res = execute(db,
      'INSERT OR IGNORE INTO goals (userId, title, category, notes, startDate) VALUES (?, ?, ?, ?, ?)',
      [user.id, g.title, g.category, g.notes, '2026-05-15']);

    if (g.category === 'beter_slapen') {
      const tasks = [
        'Geen schermen 1 uur voor bedtijd',
        'Ga elke dag opzelfde tijd naar bed',
        'Drink geen cafeïne na 14:00',
        'Mediteer 5 min voor slapen',
      ];
      for (const t of tasks) {
        execute(db,
          'INSERT OR IGNORE INTO tasks (userId, goalId, title, description, frequency, completedDates) VALUES (?, ?, ?, ?, ?, ?)',
          [user.id, res.lastInsertRowid, t, '', 'daily', '2026-06-07,2026-06-08']);
      }
    }
    if (g.category === 'split_leren') {
      const tasks = [
        'Hamstring stretch: 3x30sec per been',
        'Hip opener: pigeon pose 2min per been',
        'Front split hold: 3x30sec per been',
      ];
      for (const t of tasks) {
        execute(db,
          'INSERT OR IGNORE INTO tasks (userId, goalId, title, description, frequency) VALUES (?, ?, ?, ?, ?)',
          [user.id, res.lastInsertRowid, t, '', 'daily']);
      }
    }
  }

  // Quiz entries (last 7 days)
  const moods = [7, 6, 8, 5, 7, 9, 8];
  const energies = [6, 5, 7, 4, 6, 8, 7];
  const sleeps = [7, 6, 8, 5, 7, 9, 8];
  const stresses = [4, 5, 3, 6, 4, 2, 3];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];
    execute(db,
      'INSERT OR IGNORE INTO quiz_entries (userId, date, mood, energy, sleep, stress, symptoms, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user.id, date, moods[i], energies[i], sleeps[i], stresses[i], '', '']);
  }

  // Food entries (today + yesterday)
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const foodData = [
    { date: todayStr, mealType: 'breakfast', food: 'Havermout met banaan', calories: 350, protein: 12, carbs: 55, fat: 8, notes: '' },
    { date: todayStr, mealType: 'lunch', food: 'Volkoren brood met avocado en ei', calories: 450, protein: 18, carbs: 40, fat: 22, notes: '' },
    { date: todayStr, mealType: 'dinner', food: 'Zalm met quinoa en broccoli', calories: 550, protein: 35, carbs: 45, fat: 18, notes: 'Lekker!' },
    { date: todayStr, mealType: 'snack', food: 'Handje amandelen', calories: 160, protein: 6, carbs: 6, fat: 14, notes: '' },
    { date: yesterdayStr, mealType: 'breakfast', food: 'Griekse yoghurt met muesli', calories: 320, protein: 15, carbs: 40, fat: 10, notes: '' },
    { date: yesterdayStr, mealType: 'lunch', food: 'Kip salade', calories: 380, protein: 28, carbs: 15, fat: 20, notes: '' },
    { date: yesterdayStr, mealType: 'dinner', food: 'Pasta bolognese', calories: 620, protein: 30, carbs: 65, fat: 22, notes: '' },
  ];
  for (const f of foodData) {
    execute(db,
      'INSERT OR IGNORE INTO food_entries (userId, date, mealType, food, calories, protein, carbs, fat, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user.id, f.date, f.mealType, f.food, f.calories, f.protein, f.carbs, f.fat, f.notes]);
  }

  // Workout entries
  const workoutData = [
    { date: new Date(Date.now() - 86400000 * 0).toISOString().split('T')[0], type: 'Krachttraining', duration: 45, intensity: 'high', exercises: 'Squats, Deadlifts, Bench Press, Rows', notes: 'PR op squats!' },
    { date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], type: 'Yoga', duration: 30, intensity: 'light', exercises: 'Zonnegroet, Warrior, Tree pose', notes: 'Ontspannend' },
    { date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0], type: 'Hardlopen', duration: 25, intensity: 'medium', exercises: '5km interval', notes: '' },
    { date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0], type: 'HIIT', duration: 20, intensity: 'high', exercises: 'Burpees, Mountain Climbers, Jump Squats', notes: 'Zwaar maar goed' },
  ];
  for (const w of workoutData) {
    execute(db,
      'INSERT OR IGNORE INTO workout_entries (userId, date, type, duration, intensity, exercises, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user.id, w.date, w.type, w.duration, w.intensity, w.exercises, w.notes]);
  }

  // Supplements
  const suppData = [
    { name: 'Vitamine D', dose: '1000 IU', time: '08:00', frequency: 'daily', takenDates: `${todayStr},${yesterdayStr}` },
    { name: 'Magnesium', dose: '200mg', time: '21:00', frequency: 'daily', takenDates: `${todayStr}` },
    { name: 'Omega 3', dose: '1000mg', time: '12:00', frequency: 'daily', takenDates: yesterdayStr },
    { name: 'Vitamine B12', dose: '500 mcg', time: '08:00', frequency: 'daily', takenDates: '' },
  ];
  for (const s of suppData) {
    execute(db,
      'INSERT OR IGNORE INTO supplements (userId, name, dose, time, frequency, takenDates) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, s.name, s.dose, s.time, s.frequency, s.takenDates]);
  }

  saveDb();
  console.log('Seed data toegevoegd!');
  console.log('Demo login: demo@health.app / test123');
}

seed().catch(console.error);
