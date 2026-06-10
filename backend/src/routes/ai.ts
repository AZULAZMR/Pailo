import { Router, Response } from 'express';
import { getDb } from '../database';
import { queryAll, queryOne } from '../db-helpers';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const BMI_TIPS: Record<string, { label: string; tips: string[] }> = {
  underweight: {
    label: 'Ondergewicht',
    tips: [
      'Probeer vaker te eten: 5-6 kleine maaltijden per dag',
      'Voeg gezonde vetten toe zoals avocado, noten en olijfolie',
      'Eet eiwitrijke snacks zoals eieren, kwark of hummus',
      'Overweeg een calorierijke smoothie als ontbijt',
      'Raadpleeg een diëtist voor een persoonlijk plan',
    ],
  },
  normal: {
    label: 'Gezond gewicht',
    tips: [
      'Blijf gebalanceerd eten met voldoende groenten en eiwitten',
      'Houd je BMI in de gaten met regelmatige checks',
      'Blijf actief met minstens 30 min beweging per dag',
      'Zorg voor voldoende slaap (7-9 uur) voor herstel',
      'Blijf gehydrateerd: drink 1.5-2L water per dag',
    ],
  },
  overweight: {
    label: 'Overgewicht',
    tips: [
      'Begin met wandelen: 30 min per dag kan al veel doen',
      'Vervang frisdrank door water of kruidenthee',
      'Eet meer groenten: vul de helft van je bord met groente',
      'Probeer intermittent fasting of kleinere porties',
      'Vermijd bewerkte snacks en kies voor hele voeding',
    ],
  },
  obese: {
    label: 'Obesitas',
    tips: [
      'Start met laag-impact oefeningen zoals zwemmen of fietsen',
      'Overweeg een voedingsdagboek bij te houden',
      'Raadpleeg een arts of diëtist voor begeleiding',
      'Focus op langzame, duurzame veranderingen',
      'Streef naar 5-10% gewichtsverlies voor gezondheidswinst',
    ],
  },
};

const CYCLE_TIPS: Record<string, string[]> = {
  lowPain: ['Goed zo! Blijf luisteren naar je lichaam.', 'Warme kruik kan helpen bij lichte kramp.'],
  highPain: [
    'Probeer een warm bad of kruik voor pijnverlichting',
    'Lichte beweging zoals yoga kan helpen tegen kramp',
    'Overweeg magnesium supplementen bij menstruatiepijn',
    'Raadpleeg je huisarts als de pijn aanhoudt',
    'Probeer ontstekingsremmende voeding zoals gember en kurkuma',
  ],
};

router.get('/advice', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const user = queryOne(db, 'SELECT * FROM users WHERE id = ?', [req.userId]);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const advice: { category: string; title: string; items: string[] }[] = [];

  // BMI advice
  if (user.bmi) {
    let category: string;
    if (user.bmi < 18.5) category = 'underweight';
    else if (user.bmi < 25) category = 'normal';
    else if (user.bmi < 30) category = 'overweight';
    else category = 'obese';

    advice.push({
      category: 'bmi',
      title: `BMI: ${user.bmi} (${BMI_TIPS[category].label})`,
      items: BMI_TIPS[category].tips,
    });
  }

  // Cycle advice
  if (user.painLevel !== null && user.painLevel > 0) {
    const painTips = user.painLevel >= 6 ? CYCLE_TIPS.highPain : CYCLE_TIPS.lowPain;
    advice.push({
      category: 'cycle',
      title: `Menstruatiepijn (${user.painLevel}/10)`,
      items: painTips,
    });
  }

  // Goal-based advice
  const userGoals = JSON.parse(user.goals || '[]');
  if (userGoals.includes('beter_slapen')) {
    advice.push({
      category: 'sleep',
      title: '💤 Beter slapen',
      items: [
        'Ga elke dag op dezelfde tijd naar bed',
        'Vermijd schermen 1 uur voor slapen',
        'Drink geen cafeïne na 14:00',
        'Houd je slaapkamer koel en donker',
        'Probeer een vast avondritueel',
      ],
    });
  }
  if (userGoals.includes('stress_verminderen')) {
    advice.push({
      category: 'stress',
      title: '🧘 Stress verminderen',
      items: [
        'Probeer 5 minuten mindfulness per dag',
        'Doe ademhalingsoefeningen: 4-7-8 methode',
        'Schrijf je gedachten op in je dagboek',
        'Bewegen helpt: zelfs een korte wandeling',
        'Praat erover met iemand die je vertrouwt',
      ],
    });
  }
  if (userGoals.includes('meer_energie')) {
    advice.push({
      category: 'energy',
      title: '⚡ Meer energie',
      items: [
        'Begin de dag met een eiwitrijk ontbijt',
        'Beweeg 15 min in de ochtendzon',
        'Drink voldoende water door de dag',
        'Vermijd suikerpieken: kies voor langzame koolhydraten',
        'Neem korte pauzes elke 90 min',
      ],
    });
  }
  if (userGoals.includes('gezonder_eten')) {
    advice.push({
      category: 'food',
      title: '🥗 Gezonder eten',
      items: [
        'Plan je maaltijden voor de week',
        'Eet meer groente: streef naar 250g per dag',
        'Kook zelf in plaats van kant-en-klaar',
        'Drink water voor elke maaltijd',
        'Vermijd toegevoegde suikers',
      ],
    });
  }

  if (userGoals.includes('huid')) {
    advice.push({
      category: 'huid',
      title: '✨ Huid verbeteren',
      items: [
        'Drink voldoende water voor een gezonde huid',
        'Gebruik een milde reiniger zonder agressieve chemicaliën',
        'Vermijd te veel suiker en zuivel bij huidproblemen',
        'Zorg voor voldoende omega 3 vetzuren in je dieet',
        'Raadpleeg een dermatoloog bij aanhoudende klachten',
      ],
    });
  }
  if (userGoals.includes('haar')) {
    advice.push({
      category: 'haar',
      title: '💇 Haaruitval verminderen',
      items: [
        'Zorg voor voldoende ijzer in je voeding (spinazie, peulvruchten)',
        'Eet voldoende eiwitten voor haargroei',
        'Vermijd strakke kapsels die haarbreuk veroorzaken',
        'Overweeg biotine of zink supplementen na overleg met arts',
        'Stressvermindering kan haaruitval helpen verminderen',
      ],
    });
  }
  if (userGoals.includes('libido')) {
    advice.push({
      category: 'libido',
      title: '❤️ Libido verbeteren',
      items: [
        'Zorg voor voldoende slaap en ontspanning',
        'Beweeg regelmatig voor een betere doorbloeding',
        'Praat open met je partner over wensen en grenzen',
        'Vermijd overmatig alcohol- en medicijngebruik',
        'Raadpleeg een arts bij aanhoudende klachten',
      ],
    });
  }
  if (userGoals.includes('pcos')) {
    advice.push({
      category: 'pcos',
      title: '🩺 PCOS beheren',
      items: [
        'Kies voor een laag-glycemisch dieet met volkoren producten',
        'Beweeg regelmatig: combinatie van kracht en cardio',
        'Overweeg supplementen zoals inositol na overleg met arts',
        'Houd je cyclus bij om patronen te herkennen',
        'Zoek begeleiding van een gynaecoloog of endocrinoloog',
      ],
    });
  }
  if (userGoals.includes('endometriose')) {
    advice.push({
      category: 'endometriose',
      title: '🫁 Endometriose beheren',
      items: [
        'Probeer een anti-inflammatoir dieet met veel groenten',
        'Warmte therapie (kruik, bad) kan pijn verlichten',
        'Overweeg fysiotherapie voor bekkenbodem klachten',
        'Houd een symptoomdagboek bij voor je arts',
        'Zoek steun bij lotgenoten of een gespecialiseerd centrum',
      ],
    });
  }
  if (userGoals.includes('mentale_gezondheid')) {
    advice.push({
      category: 'mental',
      title: '🧠 Mentale gezondheid verbeteren',
      items: [
        'Plan dagelijks 10 minuten tijd voor jezelf',
        'Praat met een vriend, familielid of therapeut',
        'Beperk social media gebruik tot maximaal 30 min per dag',
        'Schrijf elke dag 3 dingen op waar je dankbaar voor bent',
        'Bewegen in de natuur helpt bij sombere gevoelens',
      ],
    });
  }
  if (userGoals.includes('mindfulness')) {
    advice.push({
      category: 'mindfulness',
      title: '🧘 Mindfulness/meditatie',
      items: [
        'Begin met 5 minuten ademmeditatie per dag',
        'Probeer een bodyscan voor het slapen gaan',
        'Loop 10 min in stilte zonder telefoon of muziek',
        'Gebruik apps zoals Headspace of Calm voor begeleiding',
        'Eet één maaltijd per dag zonder afleiding',
      ],
    });
  }

  res.json(advice);
});

export default router;
