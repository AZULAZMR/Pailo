import { Router, Response } from 'express';
import z from 'zod';
import { getDb, saveDb } from '../database';
import { queryAll, queryOne, execute } from '../db-helpers';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1),
  category: z.string(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  notes: z.string().default(''),
});

router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const goals = queryAll(db, 'SELECT * FROM goals WHERE userId = ? ORDER BY active DESC, startDate DESC', [req.userId]);
  res.json(goals);
});

router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Ongeldige invoer', details: parsed.error.flatten() }); return; }
  const db = getDb();
  const { title, category, startDate, targetDate, notes } = parsed.data;
  const existing = queryOne(db, 'SELECT id FROM goals WHERE userId = ? AND title = ? AND active = 1', [req.userId, title]);
  if (existing) { res.status(409).json({ error: 'Dit doel bestaat al' }); return; }
  const result = execute(db,
    'INSERT INTO goals (userId, title, category, startDate, targetDate, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [req.userId, title, category, startDate || new Date().toISOString().split('T')[0], targetDate || null, notes]);
  saveDb();
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const { title, category, targetDate, notes, active } = req.body;
  execute(db,
    'UPDATE goals SET title = COALESCE(?, title), category = COALESCE(?, category), targetDate = COALESCE(?, targetDate), notes = COALESCE(?, notes), active = COALESCE(?, active) WHERE id = ? AND userId = ?',
    [title, category, targetDate, notes, active != null ? (active ? 1 : 0) : undefined, req.params.id, req.userId]);
  saveDb();
  res.json({ updated: true });
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  execute(db, 'DELETE FROM goals WHERE id = ? AND userId = ?', [req.params.id, req.userId]);
  saveDb();
  res.json({ deleted: true });
});

router.get('/presets', (_req, res: Response) => {
  res.json({
    afvallen: {
      title: 'Afvallen',
      icon: '⚖️',
      tasks: [
        'Drink 2L water per dag',
        'Eet 3 porties groente',
        'Loop 10.000 stappen',
        'Geen suikerhoudende drankjes',
        'Eet genoeg proteïne bij elke maaltijd',
      ],
    },
    aankomen: {
      title: 'Aankomen (gewicht)',
      icon: '💪',
      tasks: [
        'Eet 3 hoofmaaltijden + 2 snacks',
        'Focus op proteïne en gezonde vetten',
        'Krachttraining 3x per week',
        'Drink een proteïne shake na training',
        'Slaap minimaal 8 uur',
      ],
    },
    spiermassa: {
      title: 'Spiermassa opbouwen',
      icon: '🏋️',
      tasks: [
        'Krachttraining 4x per week',
        'Eet voldoende proteïne (1.6g per kg)',
        'Progressive overload toepassen',
        'Rustdag tussen spiergroepen',
        'Eet caloriet overschot van 300-500',
      ],
    },
    abs_krijgen: {
      title: 'Abs krijgen',
      icon: '🔥',
      tasks: [
        'Core workout 15 min per dag',
        'Bodyfat verlagen met cardio',
        'Planken: 3 sets van 60sec',
        'Crunches: 3x15 herhalingen',
        'Leg raises: 3x12 herhalingen',
        'Eet clean met calorietekort',
      ],
    },
    beter_slapen: {
      title: 'Beter slapen',
      icon: '😴',
      tasks: [
        'Geen schermen 1 uur voor bedtijd',
        'Ga elke dag opzelfde tijd naar bed',
        'Drink geen cafeïne na 14:00',
        'Doe een bedtime routine',
        'Mediteer 5 min voor slapen',
        'Houd slaapkamer koel (18-20°C)',
      ],
    },
    split_leren: {
      title: 'Split leren',
      icon: '🤸',
      tasks: [
        'Dynamic stretching 10 min',
        'Hamstring stretch: 3x30sec per been',
        'Hip opener: pigeon pose 2min per been',
        'Butterfly stretch: 3min',
        'Front split hold: 3x30sec per been',
        'Side split (straddle): 3x30sec',
      ],
    },
    flexibiliteit: {
      title: 'Flexibiliteit verbeteren',
      icon: '🧘',
      tasks: [
        'Yoga of stretching 20 min per dag',
        'Focus op heupen en hamstrings',
        'Ademhalingsoefeningen',
        'Houd elke stretch min 30 sec',
        'Warme douche voor stretching',
      ],
    },
    meer_energie: {
      title: 'Meer energie',
      icon: '⚡',
      tasks: [
        'Beweeg 30 min per dag',
        'Geen bewerkte snacks',
        'Eet elke 3-4 uur een kleine maaltijd',
        'Drink voldoende water',
        'Neem een koude douche',
        'Supplementeer vitamine D + B12',
      ],
    },
    minder_stress: {
      title: 'Minder stress',
      icon: '🧠',
      tasks: [
        'Doe 5 min ademhalingsoefeningen',
        'Schrijf 3 dingen op waar je dankbaar voor bent',
        'Geen social media 30 min voor bed',
        'Doe iets creatiefs: tekenen, schrijven, muziek',
        'Beweeg buiten voor 20 min',
      ],
    },
    gezonder_eten: {
      title: 'Gezonder eten',
      icon: '🥗',
      tasks: [
        'Eet 5 porties fruit/groente per dag',
        'Vervang witmeel door volkoren',
        'Kook 5x per week zelf',
        'Eet bewust zonder telefoon',
        'Neem een multivitamine',
      ],
    },
    conditie_verbeteren: {
      title: 'Conditie verbeteren',
      icon: '🏃',
      tasks: [
        'Cardio 30 min per dag',
        'Interval training 2x per week',
        'Loop elke dag 5000 stappen meer',
        'Springtouw 5 min per dag',
        'Fiets of zwem 1x per week',
      ],
    },
    zelfvertrouwen: {
      title: 'Zelfvertrouwen',
      icon: '✨',
      tasks: [
        'Zeg elke dag 1 positieve affirmatie',
        'Doe iets waar je trots op bent',
        'Draag iets waar je je goed in voelt',
        'Help iemand anders',
        'Reflecteer op je vooruitgang',
      ],
    },
    menstruatie: {
      title: 'Menstruatiecyclus reguleren',
      icon: '🩸',
      tasks: [
        'Houd je cyclus bij in de app',
        'Noteer dagelijkse symptomen',
        'Eet ijzerrijk tijdens menstruatie',
        'Beweeg rustig tijdens je menstruatie',
        'Neem rust als je lichaam dat vraagt',
      ],
    },
    pijn: {
      title: 'Pijn bij menstruatie verminderen',
      icon: '💊',
      tasks: [
        'Neem een warme kruik of bad',
        'Doe lichte stretchoefeningen',
        'Vermijd cafeïne en zout',
        'Drink gember- of kamille thee',
        'Neem rust en slaap voldoende',
      ],
    },
    zwanger: {
      title: 'Zwanger worden',
      icon: '🤱',
      tasks: [
        'Houd ovulatie bij in de app',
        'Neem foliumzuur supplement',
        'Eet gezond en gevarieerd',
        'Vermijd alcohol en roken',
        'Beweeg matig, 30 min per dag',
      ],
    },
    anticonceptie: {
      title: 'Anticonceptie',
      icon: '⚕️',
      tasks: [
        'Neem pil elke dag op vaste tijd',
        'Houd bij wanneer je volgende afspraak is',
        'Let op bijwerkingen en noteer ze',
        'Overleg met huisarts bij twijfel',
        'Lees over verschillende opties',
      ],
    },
    overgang: {
      title: 'Overgang/Menopauze beheren',
      icon: '🌺',
      tasks: [
        'Houd opvliegers en symptomen bij',
        'Eet soja en calciumrijk voedsel',
        'Beweeg min 30 min per dag',
        'Vermijd alcohol en pikant eten',
        'Praat erover met lotgenoten',
      ],
    },
    hormonen: {
      title: 'Hormonale balans herstellen',
      icon: '⚖️',
      tasks: [
        'Eet voldoende gezonde vetten',
        'Vermijd bewerkt voedsel en suiker',
        'Slaap min 7-8 uur per nacht',
        'Doe stressverlagende oefeningen',
        'Beperk alcohol tot 1 glas per dag',
      ],
    },
    mentale_gezondheid: {
      title: 'Mentale gezondheid verbeteren',
      icon: '🧠',
      tasks: [
        'Schrijf elke dag in je dagboek',
        'Doe 10 min ademhalingsoefeningen',
        'Praat met een vriend of therapeut',
        'Doe elke dag iets wat je blij maakt',
        'Beperk social media tot 30 min',
      ],
    },
    huid: {
      title: 'Huid verbeteren',
      icon: '✨',
      tasks: [
        'Reinig en verzorg je huid 2x per dag',
        'Drink 2L water per dag',
        'Vermijd suiker en zuivel',
        'Gebruik SPF elke ochtend',
        'Vervang kussensloop 2x per week',
      ],
    },
    haar: {
      title: 'Haaruitval verminderen',
      icon: '💇',
      tasks: [
        'Neem haarvitaminen (biotine, zink)',
        'Vermijd hitte styling',
        'Gebruik mild, sulfietvrij shampoo',
        'Eet proteïnerijk en ijzerrijk',
        'Stress verminderen (stress verergert haaruitval)',
      ],
    },
    libido: {
      title: 'Libido verbeteren',
      icon: '❤️',
      tasks: [
        'Plan quality time met je partner',
        'Beweeg 30 min per dag',
        'Vermijd alcohol en stress',
        'Probeer nieuwe dingen samen',
        'Eet voldoende zink en gezonde vetten',
      ],
    },
    borstvoeding: {
      title: 'Borstvoeding',
      icon: '🍼',
      tasks: [
        'Drink 2-3L water per dag',
        'Zorg voor een goede aanleg',
        'Wissel borsten bij voedingen',
        'Neem rust als je voedt',
        'Eet voldoende calorieën (extra 500)',
      ],
    },
    endometriose: {
      title: 'Endometriose beheren',
      icon: '🫁',
      tasks: [
        'Houd pijn en symptomen bij',
        'Eet ontstekingsremmend (geen bewerkt)',
        'Doe lichte oefeningen zoals yoga',
        'Neem warme baden bij pijn',
        'Overleg met je arts over behandeling',
      ],
    },
    pcos: {
      title: 'PCOS beheren',
      icon: '🩺',
      tasks: [
        'Eet laag-glycemisch en volkoren',
        'Beweeg 30-60 min per dag',
        'Supplementeer inositol en magnesium',
        'Slaap voldoende en verminder stress',
        'Houd cyclus en symptomen bij',
      ],
    },
    migraine: {
      title: 'Migraine bij menstruatie',
      icon: '🤕',
      tasks: [
        'Houd migraine triggers bij',
        'Vermijd fel licht en hard geluid',
        'Drink voldoende water',
        'Eet regelmatig (bloedarmoede voorkoming)',
        'Neem rust in een donkere kamer',
      ],
    },
    bloedarmoede: {
      title: 'Bloedarmoede/ijzertekort',
      icon: '🩸',
      tasks: [
        'Eet ijzerrijk (spinazie, rood vlees, peulvruchten)',
        'Neem ijzersupplement bij maaltijd',
        'Combineer met vitamine C voor opname',
        'Vermijd thee/koffie direct bij maaltijd',
        'Laat bloedwaarde controleren bij huisarts',
      ],
    },
    schildklier: {
      title: 'Schildklier gezondheid',
      icon: '🦋',
      tasks: [
        'Neem schildkliermedicatie op vaste tijd',
        'Eet jodiumrijk (zeewier, vis, eieren)',
        'Vermijd soja in grote hoeveelheden',
        'Beweeg 30 min per dag',
        'Laat TSH-waarde controleren',
      ],
    },
    mindfulness: {
      title: 'Mindfulness/meditatie',
      icon: '🧘',
      tasks: [
        'Mediteer 10 min in de ochtend',
        'Doe een bodyscan voor slapen',
        'Eet één maaltijd per dag mindful',
        'Loop 10 min in stilte zonder telefoon',
        'Doe een ademhalingsoefening (4-7-8)',
      ],
    },
    dagboek: {
      title: 'Dagboek bijhouden',
      icon: '📓',
      tasks: [
        'Schrijf elke ochtend 3 doelen voor vandaag',
        'Schrijf elke avond 3 dingen waar je dankbaar voor bent',
        'Verwerk één emotie in een paar zinnen',
        'Schrijf zonder oordeel (brain dump)',
        'Herlees je oude geschreven tekst 1x per week',
      ],
    },
    sociale_connecties: {
      title: 'Sociale connecties verbeteren',
      icon: '👥',
      tasks: [
        'Bel een vriend of familielid',
        'Plan een afspraak met iemand',
        'Doe een compliment aan iemand',
        'Stuur een lieve berichtje aan iemand',
        'Zeg ja tegen een sociale activiteit',
      ],
    },
    zelfliefde: {
      title: 'Zelfliefde en self-care',
      icon: '🌸',
      tasks: [
        'Doe elke dag iets voor jezelf',
        'Zeg een positieve affirmatie in de spiegel',
        'Neem een self-care moment: bad, masker, boek',
        'Zeg nee tegen iets wat je energie kost',
        'Schrijf 3 dingen die je mooi vindt aan jezelf',
      ],
    },
    carriere: {
      title: 'Carrière doelen',
      icon: '💼',
      tasks: [
        'Werk 30 min aan een groter project',
        'Leer een nieuwe vaardigheid (15 min)',
        'Update je LinkedIn of CV',
        'Netwerk met 1 persoon in je vakgebied',
        'Stel 3 carrièredoelen voor deze maand',
      ],
    },
    financieel: {
      title: 'Financiële gezondheid',
      icon: '💰',
      tasks: [
        'Houd je uitgaven bij',
        'Zet een vast bedrag opzij voor sparen',
        'Kook thuis ipv uit eten te gaan',
        'Vermijd 1 impulse aankoop per dag',
        'Check je bankrekening en budget',
      ],
    },
    reizen: {
      title: 'Reizen en avontuur',
      icon: '✈️',
      tasks: [
        'Lees een artikel over een nieuwe bestemming',
        'Zet geld opzij voor reizen',
        'Leer 5 zinnen in een nieuwe taal',
        'Plan een weekendje weg',
        'Doe iets nieuws in eigen stad',
      ],
    },
    creativiteit: {
      title: 'Creativiteit ontwikkelen',
      icon: '🎨',
      tasks: [
        'Doe 15 min iets creatiefs',
        'Teken of schrijf iets zonder doel',
        'Inspiratie opdoen: museum, boek, natuur',
        'Probeer een nieuw creatief medium',
        'Maak een moodboard van je ideeën',
      ],
    },
    koken: {
      title: 'Beter leren koken',
      icon: '🍳',
      tasks: [
        'Probeer een nieuw recept',
        'Kook met een seizoensgroente',
        'Leer 1 kooktechniek (bv mes hanteren)',
        'Maak een weekmenu',
        'Kook een maaltijd van begin tot eind',
      ],
    },
    lezen: {
      title: 'Meer lezen',
      icon: '📚',
      tasks: [
        'Lees 20 min in een boek',
        'Lees een artikel over een nieuw onderwerp',
        'Bezoek de bibliotheek of boekwinkel',
        'Doe 1 pagina lezen voor slapen',
        'Wissel fictie en non-fictie af',
      ],
    },
    hobby: {
      title: 'Nieuwe hobby ontdekken',
      icon: '🎸',
      tasks: [
        'Zoek 3 hobby\'s die je interessant vindt',
        'Probeer 1 nieuwe activiteit deze week',
        'Kijk een tutorial over iets nieuws',
        'Vraag vrienden naar hun hobby\'s',
        'Geef jezelf toestemming om te stoppen als het niet bevalt',
      ],
    },
    vrijwilliger: {
      title: 'Vrijwilligerswerk doen',
      icon: '🤝',
      tasks: [
        'Zoek naar lokale vrijwilligersopties',
        'Meld je aan bij een organisatie',
        'Besteed 1 uur aan een goed doel',
        'Doneer spullen die je niet meer gebruikt',
        'Help een buur of familielid',
      ],
    },
    duurzaam: {
      title: 'Duurzamer leven',
      icon: '🌍',
      tasks: [
        'Neem een herbruikbare fles mee',
        'Vermijd plastic verpakkingen',
        'Recycle op de juiste manier',
        'Eet 1 dag per week vegetarisch',
        'Zet de verwarming 1 graad lager',
      ],
    },
    mindset: {
      title: 'Positieve mindset ontwikkelen',
      icon: '🌞',
      tasks: [
        'Zeg 1 positieve affirmatie bij het opstaan',
        'Schrijf 3 dingen waar je dankbaar voor bent',
        'Vervang een negatieve gedachte door een positieve',
        'Visualiseer je ideale dag',
        'Focus op oplossingen, niet op problemen',
      ],
    },
  });
});

export default router;
