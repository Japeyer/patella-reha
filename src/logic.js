// Entscheidungslogik des Plans als reine Funktionen: kein DOM, kein Speicher,
// keine Zeitabhaengigkeit ausser dem uebergebenen Zeitstempel. Alle Schwellen
// und Texte stammen aus docs/plan-original.txt ueber PLAN.

import { PLAN } from './plan-data.js';

const hatWert = (v) => v !== null && v !== undefined;

export function leerEintrag(datum) {
  return {
    datum,
    morgen: { ruhe: null, treppe: null },
    vor: { ruhe: null, treppe: null, stepDownsMoeglich: null, hinken: null },
    waehrend: { max: null, zunahmeProSatz: null },
    nach: { schmerz: null },
    spruenge: 0,
    landungVeraendert: null,
    schwellungInstabilitaetKraftverlust: null,
    uebungenAbgehakt: [],
    notiz: ''
  };
}

// Der Plan erhebt vor jeder Belastung zwei Zahlen (Quelle Z. 27-28):
// "Schmerz in Ruhe" und "Schmerz beim Treppenabwaertsgehen". Das Abwaerts ist
// die exzentrische Richtung und damit der eigentliche Lasttest der Sehne;
// Ruheschmerz allein wuerde ein gereiztes Knie freigeben. Die Teilnahmeregel
// spricht danach vom "Ausgangsschmerz" (Z. 33), ohne eine der beiden Messungen
// zu benennen.
//
// Festgelegte Lesart: Ausgangsschmerz ist der hoehere der beiden Werte. Das ist
// die konservative Lesart und deckt sich damit, dass der Plan Treppen als
// eigene Dimension ueberwacht ("Alltag oder Treppen werden zunehmend
// schmerzhaft", Z. 222). Fehlt ein Wert, zaehlt der vorhandene.
export function ausgangsschmerz(messpunkt) {
  const ruhe = messpunkt?.ruhe;
  const treppe = messpunkt?.treppe;
  const werte = [ruhe, treppe].filter(hatWert);
  if (werte.length === 0) return { wert: null, quelle: null };
  const wert = Math.max(...werte);
  let quelle;
  if (hatWert(ruhe) && hatWert(treppe) && ruhe === treppe) quelle = 'Ruhe und Treppenabwärtsgehen';
  else quelle = wert === ruhe ? 'Ruhe' : 'Treppenabwärtsgehen';
  return { wert, quelle };
}

export const ausgangsWert = (messpunkt) => ausgangsschmerz(messpunkt).wert;

// Zone nach den Schmerzregeln des Plans (Quelle Z. 6-22).
// Rot schlaegt Gelb, Gelb schlaegt Gruen. Die 24-Stunden-Reaktion wiegt
// schwerer als der Wert unmittelbar nach der Einheit (Quelle Z. 23):
// deshalb entscheidet der Morgenwert des Folgetags mit, und solange er fehlt,
// ist die Zone nur vorlaeufig.
export function zoneFuerTag(eintrag, folgeMorgen) {
  const gruende = [];
  const waehrend = eintrag.waehrend?.max;
  // Verglichen wird der Ausgangsschmerz, nicht nur der Ruhewert: sonst bliebe
  // eine Verschlechterung, die sich nur auf der Treppe zeigt, unsichtbar.
  const morgenVorher = ausgangsWert(eintrag.morgen);
  const morgenDanach = ausgangsWert(folgeMorgen);

  const keineWerte = !hatWert(waehrend) && !hatWert(eintrag.nach?.schmerz)
    && !hatWert(morgenVorher) && !hatWert(ausgangsWert(eintrag.vor));
  if (keineWerte) {
    return { zone: 'offen', vorlaeufig: true, gruende: ['Noch keine Werte erfasst.'], konsequenz: '' };
  }

  // Rote Bedingungen
  if (hatWert(waehrend) && waehrend >= 4) {
    gruende.push('Schmerz 4 von 10 oder stärker während der Belastung.');
  }
  if (eintrag.vor?.hinken === true) {
    gruende.push('Hinken oder Ausweichen.');
  }
  if (eintrag.landungVeraendert === true) {
    gruende.push('Veränderte Landung.');
  }
  if (eintrag.schwellungInstabilitaetKraftverlust === true) {
    gruende.push('Schwellung, Instabilität oder Kraftverlust.');
  }
  if (hatWert(morgenDanach) && hatWert(morgenVorher) && morgenDanach - morgenVorher >= 2) {
    gruende.push('Am nächsten Morgen deutlich schlechter.');
  }
  if (gruende.length > 0) {
    return { zone: 'rot', vorlaeufig: false, gruende, konsequenz: PLAN.zonen.rot.konsequenz };
  }

  // Gelbe Bedingungen
  if (hatWert(waehrend) && waehrend === 3) {
    gruende.push('Schmerz 3 von 10.');
  }
  if (eintrag.waehrend?.zunahmeProSatz === true) {
    gruende.push('Beschwerden nehmen innerhalb der Einheit zu.');
  }
  if (hatWert(morgenDanach) && hatWert(morgenVorher) && morgenDanach - morgenVorher === 1) {
    gruende.push('Am nächsten Morgen leicht stärker.');
  }
  if (gruende.length > 0) {
    return {
      zone: 'gelb',
      vorlaeufig: !hatWert(morgenDanach),
      gruende,
      konsequenz: PLAN.zonen.gelb.konsequenz
    };
  }

  return {
    zone: 'gruen',
    vorlaeufig: !hatWert(morgenDanach),
    gruende: ['Schmerz während der Belastung 0 bis 2 von 10, kein Hinken oder Ausweichen.'],
    konsequenz: PLAN.zonen.gruen.konsequenz
  };
}

// Teilnahmeentscheidung vor dem Volleyball (Quelle Z. 25-41).
// Der Plan fuehrt zwei getrennte Pruefungen, und die bleiben getrennt:
//   Pruefung 1 "Teilnahme erlaubt, wenn": alle vier Bedingungen muessen zutreffen.
//   Pruefung 2 "Keine Spruenge, wenn": eine Bedingung genuegt.
// Festgelegte Lesart der Schwelle "hoechstens 2 bis 3 von 10": bis 2 erfuellt,
// 3 erfuellt und als Grenzfall gekennzeichnet, ab 4 nicht erfuellt.
// vergleichMorgen ist der Zustand am Morgen nach dem vorherigen Training.
export function teilnahmeGate(eintrag, vergleichMorgen) {
  const R = PLAN.volleyballRegeln;
  const vor = eintrag.vor ?? {};
  const ausgang = ausgangsWert(vor);
  const vergleich = ausgangsWert(vergleichMorgen);
  const ausgeloest = [];
  const offen = [];

  if (!hatWert(ausgang)) offen.push('Schmerz in Ruhe oder beim Treppenabwärtsgehen vor dem Training');
  if (!hatWert(vor.hinken)) offen.push('Hinken ja oder nein');
  if (!hatWert(vor.stepDownsMoeglich)) offen.push('5 Step-downs kontrolliert möglich');

  // Pruefung 1
  if (vor.hinken === true) ausgeloest.push(R.teilnahmeErlaubtWenn[0]);
  if (hatWert(ausgang) && ausgang >= 4) ausgeloest.push(R.teilnahmeErlaubtWenn[1]);
  if (hatWert(ausgang) && hatWert(vergleich) && ausgang > vergleich) {
    ausgeloest.push(R.teilnahmeErlaubtWenn[2]);
  }
  if (vor.stepDownsMoeglich === false) ausgeloest.push(R.teilnahmeErlaubtWenn[3]);
  const teilnahme = ausgeloest.length === 0 && offen.length === 0 ? 'erlaubt' : 'nicht-erfuellt';
  const grenzfall = hatWert(ausgang) && ausgang === 3;

  // Pruefung 2
  const keine = [];
  if (hatWert(ausgang) && ausgang >= 4) keine.push(R.keineSpruengeWenn[0]);
  if (vergleichMorgen?.deutlichSchlechter === true) keine.push(R.keineSpruengeWenn[1]);
  if (eintrag.schwellungInstabilitaetKraftverlust === true) keine.push(R.keineSpruengeWenn[2]);
  if (eintrag.waehrend?.zunahmeProSatz === true) keine.push(R.keineSpruengeWenn[3]);
  const spruenge = keine.length === 0 && offen.length === 0 && teilnahme === 'erlaubt'
    ? 'erlaubt' : 'keine';

  for (const k of keine) if (!ausgeloest.includes(k)) ausgeloest.push(k);

  let anzeige;
  if (offen.length > 0) {
    anzeige = 'Es fehlen noch Angaben vor dem Training. Ohne diese Angaben zeigt der Plan keine Freigabe für Sprünge.';
  } else if (teilnahme === 'erlaubt' && spruenge === 'erlaubt') {
    anzeige = grenzfall
      ? 'Teilnahme mit kontrollierten Sprüngen nach Tagesvorgabe. Ausgangsschmerz 3 von 10 liegt an der Grenze des Plans.'
      : 'Teilnahme mit kontrollierten Sprüngen nach Tagesvorgabe.';
  } else {
    anzeige = 'Keine Sprünge. Der Plan sieht für diesen Fall höchstens Technik ohne Sprünge und Oberkörpertraining vor.';
  }

  return { teilnahme, spruenge, grenzfall, ausgeloest, offen, anzeige };
}

// Die Antwort auf "was darf ich heute im Volleyball", berechnet aus dem, was
// bereits erfasst ist - ohne dass vorher ein Formular ausgefuellt werden muss.
// Grundlage sind ausschliesslich die Sperrgruende des Plans:
//   Z. 37 Ausgangsschmerz ab 4
//   Z. 38 Folgetag nach der letzten Belastung deutlich schlechter
//   Z. 39 Schwellung, Instabilitaet oder Kraftverlust
//   Z. 22 rote Zone beim letzten Training: Spruenge stoppen
// Der Check vor dem Training (Hinken, Step-downs) kann zusaetzlich sperren,
// hebt aber nie eine Sperre auf.
export function freigabeVorab({ tag, eintrag, vergleichMorgen, letzteZone, limit }) {
  const R = PLAN.volleyballRegeln;
  const ausgang = ausgangsschmerz(eintrag.morgen);
  const vor = eintrag.vor ?? {};
  const gruende = [];

  if (!hatWert(ausgang.wert)) {
    return {
      stufe: 'angaben-fehlen',
      ueberschrift: 'Morgenwert von heute fehlt noch',
      erlaeuterung: 'Der Plan entscheidet über Sprünge anhand des Ausgangsschmerzes. Trage Schmerz in Ruhe und beim Treppenabwärtsgehen ein.',
      gruende: [],
      grenzfall: false,
      ausgang,
      limit: null
    };
  }

  if (ausgang.wert >= 4) gruende.push(R.keineSpruengeWenn[0]);
  if (vergleichMorgen?.deutlichSchlechter === true) gruende.push(R.keineSpruengeWenn[1]);
  if (eintrag.schwellungInstabilitaetKraftverlust === true) gruende.push(R.keineSpruengeWenn[2]);
  if (letzteZone === 'rot') gruende.push(PLAN.zonen.rot.konsequenz);
  if (vor.hinken === true) gruende.push(R.teilnahmeErlaubtWenn[0]);
  if (vor.stepDownsMoeglich === false) gruende.push(R.teilnahmeErlaubtWenn[3]);

  if (gruende.length > 0) {
    return {
      stufe: 'keine-spruenge',
      ueberschrift: 'Keine Sprünge — höchstens Technik ohne Sprünge und Oberkörpertraining',
      erlaeuterung: `Ausgangsschmerz heute ${ausgang.wert} von 10 (${ausgang.quelle}).`,
      gruende,
      grenzfall: false,
      ausgang,
      limit: null
    };
  }

  const grenzfall = ausgang.wert === 3;

  // War die letzte Einheit gelb, gilt fuer diese schon die Reduktion aus dem
  // Plan (Z. 15). Sonst wuerde die Freigabe eine zu hohe Zahl nennen.
  const reduziert = letzteZone === 'gelb'
    ? {
        min: Math.floor(limit.min * 0.7),
        max: Math.floor(limit.max * 0.8)
      }
    : { min: limit.min, max: limit.max };

  const basis = `Ausgangsschmerz heute ${ausgang.wert} von 10 (${ausgang.quelle}).`;
  const zusatz = [];
  if (grenzfall) zusatz.push('An der Grenze des Plans, kontrolliert bleiben.');
  if (letzteZone === 'gelb') {
    zusatz.push(`Letzte Einheit war gelb, deshalb um 20 bis 30 Prozent reduziert: ${reduziert.min} bis ${reduziert.max} statt ${limit.min} bis ${limit.max}.`);
  }

  return {
    stufe: 'spruenge',
    ueberschrift: `Sprünge erlaubt — ${reduziert.min} bis ${reduziert.max}`,
    erlaeuterung: [basis, ...zusatz].join(' '),
    gruende: letzteZone === 'gelb' ? [PLAN.zonen.gelb.konsequenz] : [],
    grenzfall,
    ausgang,
    limit: reduziert
  };
}

// Leitsaetze eines Tages fuer die Anzeige auf den ersten Blick: die
// Tagesbedingungen plus die Verbote und Schmerzgrenzen aus der Tagesliste.
// Nichts davon ist neu formuliert; alles steht woertlich im Plan.
const LEITSATZ_MUSTER = [/^kein/i, /^nicht /i, /^Schmerz höchstens/i, /^Alltag normal/i];

export function tagesLeitsaetze(tag) {
  const ausListe = tag.bloecke
    .flatMap((block) => block.uebungen.map((u) => u.name))
    .filter((name) => LEITSATZ_MUSTER.some((muster) => muster.test(name)));
  const saetze = [...tag.bedingungen, ...ausListe];
  if (saetze.length > 0) return saetze;
  // Der Auswertungstag fuehrt keine Uebungen; sein Inhalt ist der Wertebogen.
  if (tag.typ === 'auswertung') return [PLAN.auswertung.einleitung];
  return tag.bloecke.flatMap((block) => block.uebungen.map((u) => u.name)).slice(0, 3);
}

const MONTAG_DER_WOCHE = { 1: '2026-09-21', 2: '2026-09-28' };

// Sprunglimit des Tages.
// Woche 1, Mittwoch: "maximal dieselbe Sprungzahl wie am Montag", "keine
// Steigerung innerhalb derselben Woche" (Quelle Z. 98-99).
// Woche 2, Mittwoch: "maximal gleiche Sprungzahl wie Montag oder hoechstens
// 10 Prozent mehr" (Quelle Z. 177).
export function sprungLimit(tag, eintraege = {}) {
  if (!tag.volleyball) return null;
  const basis = {
    min: tag.volleyball.spruengeMin,
    max: tag.volleyball.spruengeMax,
    quelle: 'Bereich des Plans für diese Woche',
    hinweis: null
  };
  if (tag.wochentag !== 'Mittwoch') return basis;

  const montag = eintraege[MONTAG_DER_WOCHE[tag.woche]];
  const gezaehlt = montag?.spruenge ?? 0;
  if (!gezaehlt) {
    return {
      ...basis,
      hinweis: 'Für den Montag dieser Woche ist keine Sprungzahl erfasst. Es gilt der Bereich des Plans.'
    };
  }
  const faktor = tag.woche === 2 ? 1.1 : 1;
  const max = Math.floor(gezaehlt * faktor);
  return {
    min: Math.min(basis.min, max),
    max,
    quelle: tag.woche === 2
      ? `Montagszahl ${gezaehlt} plus höchstens 10 Prozent`
      : `Montagszahl ${gezaehlt}, keine Steigerung innerhalb derselben Woche`,
    hinweis: null
  };
}

// Festgelegter Umgang mit dem Bereich: Hinweis ab Untergrenze, deutliche
// Warnung ab Obergrenze, darueber bleibende Warnung. Keine Sperre.
export function sprungStatus(anzahl, limit) {
  if (!limit) return { stufe: 'frei', text: '' };
  if (anzahl > limit.max) {
    return { stufe: 'ueber', text: `${anzahl} Sprünge — über der Obergrenze von ${limit.max}.` };
  }
  if (anzahl >= limit.max) {
    return { stufe: 'warnung', text: `${anzahl} von ${limit.max} Sprüngen — Obergrenze erreicht.` };
  }
  if (anzahl >= limit.min) {
    return { stufe: 'hinweis', text: `${anzahl} Sprünge — Untergrenze ${limit.min} erreicht, Obergrenze ${limit.max}.` };
  }
  return { stufe: 'frei', text: `${anzahl} von ${limit.min} bis ${limit.max} Sprüngen.` };
}

// "mindestens 20 bis 30 Sekunden zwischen einzelnen Spruengen" (Quelle Z. 81).
// Die Untergrenze ist die harte Grenze; zwischen 20 und 30 Sekunden ein
// neutraler Hinweis auf den Bereich.
export function sprungAbstand(letzterZeitstempel, jetzt = Date.now()) {
  if (!letzterZeitstempel) return { sekunden: null, zuKurz: false, text: '' };
  const sekunden = Math.floor((jetzt - letzterZeitstempel) / 1000);
  if (sekunden < 20) {
    return {
      sekunden,
      zuKurz: true,
      text: `Erst ${sekunden} Sekunden seit dem letzten Sprung. Der Plan sieht mindestens 20 bis 30 Sekunden vor.`
    };
  }
  if (sekunden < 30) {
    return {
      sekunden,
      zuKurz: false,
      text: `${sekunden} Sekunden seit dem letzten Sprung. Der Plan nennt 20 bis 30 Sekunden.`
    };
  }
  return { sekunden, zuKurz: false, text: `${sekunden} Sekunden seit dem letzten Sprung.` };
}

// Fortschrittskriterien des Kontrolltags (Quelle Z. 150-154).
// Unbeantwortet gilt nicht als erfuellt.
export function fortschrittsGate(antworten) {
  const K = PLAN.fortschrittskriterien;
  const offen = K.filter((_, i) => !hatWert(antworten?.[i]));
  const nichtErfuellt = K.filter((_, i) => antworten?.[i] === false);
  const freigegeben = offen.length === 0 && nichtErfuellt.length === 0;
  const anzeige = freigegeben
    ? 'Alle vier Kriterien erfüllt. Woche 2 gibt die höheren Umfänge frei.'
    : 'Nicht alle Kriterien erfüllt. Der Plan sieht vor, den Umfang von Woche 1 zu wiederholen oder vollständig ohne Sprünge zu trainieren.';
  return { freigegeben, offen, nichtErfuellt, anzeige };
}

// Vorbelegung, soweit aus den erfassten Werten ableitbar; sonst null, damit
// nichts stillschweigend als erfuellt gilt. Kriterium 3 (Rueckgang innerhalb
// von 24 Stunden) und 4 (Gang- und Landemuster) beantwortet nur der Nutzer.
export function fortschrittsVorschlag(eintraege) {
  const morgenWerte = Object.keys(eintraege).sort()
    .map((d) => eintraege[d].morgen?.ruhe)
    .filter(hatWert);
  const letzteDrei = morgenWerte.slice(-3);
  const alltagNichtZugenommen = morgenWerte.length >= 2
    ? letzteDrei[letzteDrei.length - 1] <= letzteDrei[0]
    : null;
  const morgenHoechstens2 = morgenWerte.length > 0
    ? letzteDrei.every((w) => w <= 2)
    : null;
  return [alltagNichtZugenommen, morgenHoechstens2, null, null];
}

// Auswertungsbogen am 4. Oktober (Quelle Z. 208-214), vorbelegt aus den
// erfassten Werten. Die beiden Ja-Nein-Fragen zur 24-Stunden-Reaktion
// beantwortet der Nutzer.
export function auswertungVorschlag(eintraege) {
  const letzter = eintraege['2026-10-04'];
  const vortag = eintraege['2026-10-03'];
  return {
    ruhe: letzter?.morgen?.ruhe ?? null,
    treppe: letzter?.morgen?.treppe ?? null,
    nachVolleyball: eintraege['2026-09-30']?.nach?.schmerz ?? null,
    morgenDanach: letzter?.morgen?.ruhe ?? null,
    abgeklungen24h: null,
    landungGangNormal: hatWert(vortag?.landungVeraendert) ? !vortag.landungVeraendert : null
  };
}

// "Wenn Woche 1 nicht gut vertragen wurde: Umfang von Woche 1 wiederholen oder
// vollstaendig ohne Spruenge trainieren." (Quelle Z. 168)
export function umfangFuerWoche2(freigegeben, tag) {
  if (freigegeben) {
    return {
      spruengeMin: tag.volleyball.spruengeMin,
      spruengeMax: tag.volleyball.spruengeMax,
      anteilDauerProzent: tag.volleyball.anteilDauerProzent,
      hinweis: null
    };
  }
  const w1 = PLAN.tage.find((t) => t.datum === MONTAG_DER_WOCHE[1]);
  return {
    spruengeMin: w1.volleyball.spruengeMin,
    spruengeMax: w1.volleyball.spruengeMax,
    anteilDauerProzent: w1.volleyball.anteilDauerProzent,
    hinweis: 'Fortschrittskriterien nicht erfüllt: Umfang von Woche 1 wiederholen oder vollständig ohne Sprünge trainieren.'
  };
}

// Konsequenz der gelben Zone, vorgerechnet (Quelle Z. 15):
// "Naechste Einheit um etwa 20 bis 30 Prozent reduzieren. Weniger Saetze,
// Gewicht oder Spruenge." Untergrenze des reduzierten Bereichs mit dem
// hoeheren Prozentsatz, Obergrenze mit dem niedrigeren; Saetze um ein Viertel,
// die Mitte des Bereichs.
export function reduzierteBelastung(tag, prozent = [20, 30]) {
  const [unten, oben] = prozent;
  const spruenge = tag.volleyball
    ? [
        Math.floor(tag.volleyball.spruengeMin * (1 - oben / 100)),
        Math.floor(tag.volleyball.spruengeMax * (1 - unten / 100))
      ]
    : null;

  const saetze = [];
  for (const block of tag.bloecke ?? []) {
    for (const uebung of block.uebungen ?? []) {
      if (typeof uebung.saetze === 'number') {
        saetze.push({
          name: uebung.name,
          original: uebung.saetze,
          reduziert: Math.max(1, Math.floor(uebung.saetze * 0.75))
        });
      }
    }
  }
  return { saetze, spruenge, prozent };
}
