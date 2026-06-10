import { Router, Response } from "express";
import { getDb, saveDb } from "../database";
import { queryAll, queryOne, execute } from "../db-helpers";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Goedemorgen";
  if (h < 18) return "Goedemiddag";
  return "Goedenavond";
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function getCyclePhaseLabel(entries: any[]): string {
  if (entries.length === 0) return "onbekend";
  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const last = new Date(sorted[0].date);
  const daysSince = Math.floor((Date.now() - last.getTime()) / 86400000);
  if (daysSince <= 5) return "menstruatie";
  if (daysSince <= 13) return "folliculaire fase";
  if (daysSince <= 16) return "ovulatie";
  return "luteale fase";
}

function getPhaseAdvice(phase: string): string[] {
  const tips: Record<string, string[]> = {
    menstruatie: [
      "Rust is ok\u00e9! Je lichaam is hard aan het werk. \ud83e\udd78",
      "Warme kruik op je buik kan helpen tegen kramp.",
      "Lichte rek- en strekoefeningen verminderen menstruatiepijn.",
      "IJzerrijk eten zoals spinazie of rode biet helpt je energie op peil houden.",
    ],
    "folliculaire fase": [
      "Je energie komt weer op gang! Perfect voor creatieve projecten. \u2728",
      "Dit is de beste tijd om nieuwe dingen te beginnen.",
      "Je huid is vaak helderder in deze fase \u2014 geniet ervan!",
      "Lichte cardio zoals wandelen of fietsen voelt nu goed aan.",
    ],
    ovulatie: [
      "Je bent op je meest sociale en communicatief sterk. \ud83d\udcac",
      "Dit is een goede dag voor een meeting of presentatie!",
      "Je energie is op zn piek \u2014 gebruik het voor een leuke workout.",
      "Let op: je huid kan gevoeliger zijn nu.",
    ],
    "luteale fase": [
      "Je kunt je wat vermoeider voelen \u2014 gun jezelf rust. \ud83c\udf19",
      "Hormonen kunnen invloed hebben op je stemming \u2014 wees lief voor jezelf.",
      "Warm eten en uitgebreid ontbijten helpt je bloedsuiker stabiel houden.",
      "Deze dagen vraagt je lichaam om meer zelfzorg.",
    ],
  };
  return tips[phase] || tips["folliculaire fase"];
}

function getGoalAdvice(goals: string[]): string {
  if (goals.length === 0) return "Je hebt nog geen doelen ingesteld. Wil je er een paar bespreken?";
  const goal = pick(goals);
  const tips: Record<string, string> = {
    "Gezonder eten": "Kleine stapjes werken het best: begin met 1 portie groente extra per dag. \ud83e\udd57",
    "Meer bewegen": "Een wandeling van 15 minuten telt al! Bewegen hoeft niet intensief te zijn. \ud83d\udeb6",
    "Beter slapen": "Een vast slaapritme is het krachtigst \u2014 elke dag rond dezelfde tijd erin. \ud83d\ude34",
    "Stress verminderen": "Probeer 2 minuten diep ademhalen: 4 sec in, 6 sec uit. \ud83e\uddd8",
    "Gewicht verliezen": "Focus op groente en eiwit bij elke maaltijd, niet op minder eten.",
    "Spieren opbouwen": "Eiwitrijke voeding + consistentie is belangrijker dan zware gewichten. \ud83d\udcaa",
    "Cyclus beter begrijpen": "Het bijhouden van je stemming en energie per dag geeft veel inzicht. \ud83d\udcd3",
  };
  return tips[goal] || 'Goed bezig met "' + goal + '"! Wil je een specifieke tip of gewoon even sparren?';
}

function getBMITip(bmi: number | null): string {
  if (bmi === null) return "";
  if (bmi < 18.5) return "Je BMI is wat aan de lage kant. Eet vaker kleine maaltijden met noten en avocado. \ud83e\udd51";
  if (bmi < 25) return "Je BMI is gezond! Blijf doen wat je doet, en luister naar je lichaam. \u2728";
  if (bmi < 30) return "Je BMI is verhoogd. Wandelen na het eten helpt je stofwisseling al. \ud83d\udeb6";
  return "Bij een hogere BMI is het goed om te starten met kleine, haalbare doelen. Elke stap telt! \ud83c\udf31";
}

function paintostring(p: number): string {
  if (p <= 2) return "mild";
  if (p <= 5) return "matig";
  if (p <= 7) return "fors";
  return "ernstig";
}

const RESPONSES: { keywords: string[]; getReply: (user: any, phase: string, goals: string[]) => string }[] = [
  {
    keywords: ["energie", "moe", "vermoeid", "slap", "geen energie", "uitgerust"],
    getReply: (user, phase, goals) => {
      const phaseAdvice = getPhaseAdvice(phase);
      if (phase === "menstruatie") return pick(phaseAdvice) + " Wil je voedingstips voor meer energie? \ud83c\udf7d\ufe0f";
      return (
        pick([
          "Energie komt vaak in golven \u2014 plan je belangrijke taken voor wanneer jij het sterkst bent. \u26a1",
          "Wist je dat 7-8 uur slaap en voldoende water de grootste energieleveranciers zijn?",
          "Een korte wandeling van 10 minuten geeft vaak meer energie dan een powernap.",
        ]) +
        " " +
        getBMITip(user.bmi)
      );
    },
  },
  {
    keywords: ["slaap", "slapen", "inslapen", "doorslapen", "nachtrust", "bed", "wakker"],
    getReply: (user, phase, goals) =>
      pick([
        "Een vast ritme is goud: elke dag dezelfde tijd naar bed, ook in het weekend. \ud83d\ude34",
        "Schermtijd uit 30 min voor slapen maakt een groot verschil. Probeer een boek! \ud83d\udcd6",
        "Kamillethee of een warm bad voor het slapengaan helpt je zenuwstelsel tot rust te komen. \ud83d\udec1",
        "Je slaapkamer koel houden (16-18\u00b0C) bevordert diepe slaap.",
      ]) + " Hoeveel uur slaap krijg je gemiddeld?",
  },
  {
    keywords: ["stress", "gestrest", "druk", "overprikkeld", "paniek", "angst", "spanning"],
    getReply: (user, phase, goals) =>
      pick([
        "Probeer de 4-7-8 ademhaling: 4 sec in, 7 sec vasthouden, 8 sec uit. Direct rustiger. \ud83e\uddd8",
        "Stress is een signaal, niet je vijand. Luister: wat heeft je lichaam nu nodig?",
        "Schrijf 3 dingen op waar je dankbaar voor bent \u2014 het herprogrammeert je brein. \u270d\ufe0f",
        "Bewegen is de beste stresskiller: 10 min wandelen verlaagt cortisol al.",
      ]) + " Wil je een korte mindfulness oefening proberen?",
  },
  {
    keywords: ["eten", "voeding", "dieet", "gezond", "recept", "koken", "maaltijd", "ontbijt", "lunch", "avondeten"],
    getReply: (user, phase, goals) => {
      if (phase === "menstruatie")
        return pick([
          "IJzerrijk eten is nu extra belangrijk: denk aan spinazie, linzen of rood vlees. \ud83e\udd6c",
          "Pittig eten kan kramp verergeren \u2014 kies liever voor warme, rustige maaltijden.",
          "Pure chocolade (70%+) is trouwens ook ijzerrijk en goed voor je humeur! \ud83c\udf6b",
        ]);
      return (
        pick([
          "Een gebalanceerde maaltijd: 1/2 bord groente, 1/4 eiwit, 1/4 koolhydraten. Makkelijk te onthouden! \ud83e\udd57",
          "Voldoende water drinken (1.5-2L) heeft meer effect dan welk superfood dan ook.",
          "Maaltijdvoorbereiding op zondag bespaart doordeweeks tijd en stress.",
        ]) +
        " " +
        getGoalAdvice(goals)
      );
    },
  },
  {
    keywords: ["sport", "bewegen", "workout", "trainen", "fitness", "hardlopen", "yoga", "sportschool"],
    getReply: (user, phase, goals) => {
      if (phase === "menstruatie") return "Rustige yoga of wandelen is perfect tijdens je menstruatie. Luister naar je lichaam. \ud83e\uddd8";
      if (phase === "ovulatie") return "Je energie is op z'n hoogst! Goed moment voor krachttraining of HIIT. \ud83d\udcaa";
      return pick([
        "Elke beweging telt: 3x per week 20 min is al genoeg voor meetbare gezondheidswinst. \ud83d\udcc8",
        "De beste workout is degene die je leuk vindt \u2014 dan blijf je het doen!",
        "Rekoefeningen na het sporten verminderen spierpijn en verbeteren herstel.",
      ]);
    },
  },
  {
    keywords: ["cyclus", "menstruatie", "ongesteld", "pijn", "kramp", "bloeding", "hormoon"],
    getReply: (user, phase, goals) => {
      const pain = user.painLevel != null ? parseInt(user.painLevel) : null;
      let painAdvice = "";
      if (pain !== null && pain >= 6)
        painAdvice =
          "Je pijn is hoog (score " +
          paintostring(pain) +
          "). Warmte en rust zijn nu belangrijk. Overweeg een consult als het te heftig is. \ud83e\udec2";
      else if (pain !== null && pain >= 3) painAdvice = "Lichte rek- en strekoefeningen kunnen helpen tegen de kramp.";
      else painAdvice = "Fijn dat je weinig pijn ervaart!";
      return (
        pick([
          "Je zit in de " + phase + ". " + getPhaseAdvice(phase)[0],
          "Het is heel normaal dat je stemming en energie wisselen per cyclus. \ud83c\udf0a",
          "Een cyclustracker bijhouden helpt patronen te herkennen \u2014 dan kun je erop anticiperen.",
        ]) +
        " " +
        painAdvice
      );
    },
  },
  {
    keywords: ["huid", "acne", "puistje", "eczeem", "droge huid", "vlekken"],
    getReply: (user, phase, goals) => {
      if (phase === "luteale fase" || phase === "menstruatie")
        return pick([
          "Hormonale huidproblemen zijn vervelend maar normaal. Een consistent ritueel met milde reiniging helpt. \u2728",
          "Tijdens deze fase kun je gevoeliger zijn voor puistjes. Probeer je kussenhoes vaker te verschonen!",
        ]);
      return pick([
        "Je huid zit nu vaak in een betere fase. Hydrateren en zonbescherming blijven belangrijk! SPF elke dag \u2600\ufe0f",
        "Weet je dat voeding invloed heeft op je huid? Minder suiker kan al verschil maken.",
      ]);
    },
  },
  {
    keywords: ["haar", "uitval", "haaruitval", "dunner", "haren", "coupe"],
    getReply: (user, phase, goals) =>
      pick([
        "Haaruitval kan door hormonen, stress of voeding komen. Zorg voor voldoende eiwit en ijzer. \ud83d\udc87",
        "Biotine en zink kunnen haarsterkte ondersteunen. Overleg wel eerst met je huisarts.",
        "Haaruitval is vaak tijdelijk en groeit vanzelf terug. Stress maakt het erger \u2014 dus probeer te ontspannen.",
      ]) + " Hoe lang merk je dit al?",
  },
  {
    keywords: ["libido", "zin", "seks", "lust", "opgewonden", "relatie", "intimiteit"],
    getReply: (user, phase, goals) => {
      if (phase === "ovulatie")
        return "Het is heel normaal dat je libido hoger is rond je ovulatie. Moeder Natuur weet wat ze doet! \ud83c\udf38";
      return (
        pick([
          "Libido schommelt met je cyclus \u2014 dat is volkomen normaal. \u2764\ufe0f",
          "Stress en vermoeidheid zijn de grootste libido-killers. Rust en quality time met je partner helpen.",
          "Soms is aanraking zonder verwachting al genoeg om de intimiteit weer op gang te brengen.",
        ]) + " Zit je ergens mee?"
      );
    },
  },
  {
    keywords: ["pcos", "polycysteus", "eierstokken", "cystes"],
    getReply: (user, phase, goals) =>
      pick([
        "PCOS vraagt om een holistische aanpak: voeding, beweging en stressmanagement. \ud83e\ude7a",
        "Bij PCOS kan een lage glycemische index (GI) voeding helpen je hormonen te balanceren.",
        "Regelmatige beweging (3-4x per week) verbetert insulinegevoeligheid bij PCOS.",
      ]) + " Heb je een behandelplan met je arts besproken?",
  },
  {
    keywords: ["endometriose", "endo", "bekkenpijn"],
    getReply: (user, phase, goals) =>
      pick([
        "Endometriose is zwaar \u2014 erken dat het ok\u00e9 is om hulp te vragen. \ud83e\udec1",
        "Een warm bad en rust helpen, maar blijf in beweging (wandelen) om vastroesten te voorkomen.",
        "Sommige vrouwen hebben baat bij aanpassingen in voeding, zoals minder gluten en zuivel.",
      ]) + " Wat zijn jouw ervaringen met endo? Wil je tips of gewoon even praten?",
  },
  {
    keywords: ["mentaal", "mentale", "stemming", "verdriet", "somber", "depressief", "huilen", "emoties"],
    getReply: (user, phase, goals) =>
      pick([
        "Je emoties zijn er niet voor niets. Ze vertellen je iets waardevols. \ud83e\udde0",
        "Vrouwen hebben vaker stemmingswisselingen door hormonen \u2014 je bent niet raar of alleen.",
        "Praat erover met iemand die je vertrouwt. Soms helpt het al om het te delen.",
        "Als het lang aanhoudt: schaam je niet om professionele hulp te zoeken. Een psycholoog is een krachtig geschenk aan jezelf.",
      ]) + " Ben je hier al langer mee bezig of is het vandaag?",
  },
  {
    keywords: ["mindfulness", "meditatie", "adem", "mindful", "ontspan", "rust", "tot rust"],
    getReply: (user, phase, goals) =>
      pick([
        "Hier is een mini-oefening: Sluit je ogen, adem diep in, en voel de lucht in je buik. 3 keer. \ud83e\uddd8",
        "Mindfulness hoeft niet lang: 2 minuten bewust ademen telt al.",
        "Probeer eens een bodyscan: van je tenen naar je kruin, elke plek voelen.",
      ]) + " Zal ik een langere oefening met je doen?",
  },
  {
    keywords: ["dankbaar", "dankbaarheid", "blij", "gelukkig", "blijheid", "goed nieuws"],
    getReply: (user, phase, goals) =>
      pick([
        "Wat mooi om te horen! \ud83c\udf1f Dankbaarheid is een van de krachtigste emoties voor je gezondheid.",
        "Wetenschappelijk bewezen: 3 dingen per dag opschrijven waar je dankbaar voor bent, maakt je gelukkiger. \u270d\ufe0f",
        "Blijheid geeft een dopamineboost \u2014 geniet ervan! Dat heb je verdiend.",
      ]),
  },
  {
    keywords: ["doelen", "doel", "voornemen", "voornemens", "motivatie", "gemotiveerd"],
    getReply: (user, phase, goals) => {
      if (goals.length === 0)
        return "Wil je een doel instellen? Dat kan in het Profiel tabblad! Kies iets kleins om mee te starten. \ud83c\udfaf";
      return (
        pick([
          "Mooie doelen! Wil je een specifiek doel bespreken? Dan geef ik je een persoonlijke tip. \ud83c\udfaf",
          "Houd het behapbaar: 1 nieuw gewoonte per keer is beter dan alles tegelijk.",
          "Motivatie komt en gaat \u2014 discipline is wat telt. Maar rust is ook onderdeel van discipline!",
        ]) +
        " " +
        getGoalAdvice(goals)
      );
    },
  },
  {
    keywords: ["recept", "koken", "kooktip", "maaltijd", "wat eten", "gezond recept"],
    getReply: (user, phase, goals) =>
      pick([
        "Een simpel recept: roer 200g kip met paprika, courgette en ui door volkoren pasta. Klaar in 15 min! \ud83c\udf5d",
        "Ontbijt smoothie: banaan, hand spinazie, havermout, amandelmelk \u2014 vol energie en simpel.",
        "Maaltijd: zalm + zoete aardappel + gestoomde broccoli = omega-3, vezels en vitamines.",
      ]),
  },
  {
    keywords: ["dagboek", "journal", "schrijven", "dag", "vandaag"],
    getReply: (user, phase, goals) =>
      pick([
        "Het dagboek is een mooie plek om je gedachten te ordenen. Heb je de jouwe al ingevuld vandaag? \ud83d\udcd3",
        "Schrijven helpt om patronen te herkennen in je stemming en energie door de maand heen.",
        "Soms voelt het alsof er niks bijzonders is gebeurd \u2014 maar juist de kleine dingen tellen.",
      ]),
  },
  {
    keywords: ["hallo", "hey", "hoi", "hi", "goedemorgen", "goedemiddag", "goedenavond"],
    getReply: (user, phase, goals) => {
      const name = user.name || "daar";
      return pick([
        getGreeting() + " " + name + "! \ud83c\udf38 Hoe is het vandaag met je?",
        "Hoi " + name + "! Wat fijn dat je er bent. Waar kan ik je mee helpen?",
        getGreeting() + "! Leuk je te zien " + name + ". Zin om te praten over hoe je je voelt?",
      ]);
    },
  },
];

function localReply(user: any, message: string, goals: string[], phase: string): string {
  const lower = message.toLowerCase();

  for (const entry of RESPONSES) {
    if (entry.keywords.some((k) => lower.includes(k))) {
      return entry.getReply(user, phase, goals);
    }
  }

  if (message.endsWith("?")) {
    return "Dat is een goede vraag! Ik ben een lokale coach, dus ik heb geen internetkennis. Maar ik kan je wel adviseren op basis van je profiel. Vertel me meer over waar je mee zit. \ud83c\udf38";
  }

  const name = user.name || "daar";
  return pick([
    "Dankjewel voor het delen " + name + ". Kun je me meer vertellen? Hoe voel je je erbij? \ud83c\udf38",
    "Wat interessant! Ik luister graag. Wat maakt dat je dit nu zegt?",
    "Vertel me er meer over \u2014 hoe lang speelt dit al?",
    "Dankjewel voor je bericht. Laten we even terug naar de basis: hoe voel je je vandaag op een schaal van 1-10?",
    "Ik hoor je! Neem gerust de tijd. Wil je een specifiek onderwerp bespreken? Denk aan voeding, beweging, slaap of stress.",
  ]);
}

router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      res.status(400).json({ error: "Bericht is verplicht" });
      return;
    }

    const db = getDb();
    const user = queryOne(db, "SELECT * FROM users WHERE id = ?", [req.userId]);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const cycleEntries = queryAll(db, "SELECT * FROM cycle_entries WHERE userId = ? ORDER BY date DESC LIMIT 10", [req.userId]);
    const goals = JSON.parse(user.goals || "[]");
    const phase = getCyclePhaseLabel(cycleEntries);
    const reply = localReply(user, message, goals, phase);

    execute(db, "INSERT INTO chat_messages (userId, role, content) VALUES (?, ?, ?)", [req.userId, "user", message]);
    execute(db, "INSERT INTO chat_messages (userId, role, content) VALUES (?, ?, ?)", [req.userId, "assistant", reply]);
    saveDb();

    res.json({ reply });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message || "Chat error" });
  }
});

router.get("/history", authMiddleware, (req: AuthRequest, res: Response) => {
  const db = getDb();
  const messages = queryAll(db, "SELECT role, content, createdAt FROM chat_messages WHERE userId = ? ORDER BY createdAt ASC", [req.userId]);
  res.json(messages);
});

export default router;
