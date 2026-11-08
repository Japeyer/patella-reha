// Logik des Sprungkraft-Blocks als reine Funktionen: kein DOM, kein Speicher.
// Der gespeicherte Teil ist ein kleines Objekt mit den Aenderungen gegenueber
// dem Plan (Verschiebungen, Ausfaelle, Eingefuegtes) und den abgehakten Saetzen.
// Alle Aenderungsfunktionen geben einen neuen Zustand zurueck.

import { SPRUNG } from './sprung-data.js';
import { datumPlus, montagDerWoche, tageDazwischen, titelDatum, wochentagVon } from './datum.js';
import { ausgangsWert } from './logic.js';

export const SPRUNG_START = SPRUNG.von;
export const SPRUNG_ENDE = SPRUNG.bis;

const ERSTER_MONTAG = '2026-11-09';
const ARTEN_EINFUEGEN = ['spiel', 'volleyball', 'kraft', 'regeneration', 'eigene'];
const HOHE_BELASTUNG = ['spiel', 'volleyball', 'kraft', 'sprungtest'];
const SPRUNGTEST_FELDER = ['approach', 'cmj'];

export const leererSprungZustand = () => ({
  verschoben: {},
  ausgefallen: [],
  eingefuegt: [],
  saetze: {},
  sprungtest: {}
});

// Gespeicherte Teile koennen aus aelteren Staenden fehlen.
const vollstaendig = (s) => ({ ...leererSprungZustand(), ...(s ?? {}) });

const imBlock = (datum) => typeof datum === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(datum)
  && datum >= SPRUNG_START && datum <= SPRUNG_ENDE;

const wochenNummer = (datum) => Math.round(tageDazwischen(ERSTER_MONTAG, montagDerWoche(datum)) / 7) + 1;

// Satzzahl aus der woertlichen Angabe: "3×5 @ 3 RIR" -> 3, "2 × 6–8" -> 2.
export function satzZahl(angabe) {
  const treffer = /^\s*(\d+)\s*×/.exec(String(angabe ?? ''));
  return treffer ? Number(treffer[1]) : null;
}

const PLAN_EINHEITEN = SPRUNG.wochen.flatMap((w) => w.einheiten.map((e) => ({ ...e, woche: w.nummer })));
const PLAN_NACH_ID = new Map(PLAN_EINHEITEN.map((e) => [e.id, e]));

export function grundformEinheit(form, datum, id) {
  const g = SPRUNG.grundformen[form];
  return {
    id,
    datum,
    art: 'kraft',
    titel: g.titel,
    grundform: form,
    einleitung: g.texte,
    uebungen: g.uebungen,
    texte: g.schluss
  };
}

const gueltigEingefuegt = (e) => typeof e?.id === 'string'
  && imBlock(e.datum)
  && ARTEN_EINFUEGEN.includes(e.art)
  && (e.art !== 'kraft' || e.grundform === 'A' || e.grundform === 'B');

function ausEingefuegtem(e) {
  if (e.art === 'kraft') return grundformEinheit(e.grundform, e.datum, e.id);
  const titel = {
    spiel: 'Spiel',
    volleyball: 'Volleyball',
    regeneration: 'Regeneration',
    eigene: (e.text ?? '').trim() || 'Eigene Einheit'
  }[e.art];
  return { id: e.id, datum: e.datum, art: e.art, titel, texte: [], ...(e.zeit ? { zeit: e.zeit } : {}) };
}

/**
 * Alle Einheiten mit wirksamem Datum: Planeinheiten in Planreihenfolge, danach
 * das Eingefuegte. Ausgefallene bleiben in der Liste und sind markiert.
 */
export function effektiveEinheiten(gespeichert) {
  const s = vollstaendig(gespeichert);
  const ausPlan = PLAN_EINHEITEN.map((e) => {
    const ziel = s.verschoben[e.id];
    return {
      ...e,
      datum: ziel ?? e.datum,
      planDatum: e.datum,
      verschoben: Boolean(ziel && ziel !== e.datum),
      ausgefallen: s.ausgefallen.includes(e.id),
      eingefuegt: false
    };
  });
  // Eingefuegtes kommt auch aus Sicherungstexten; Unbrauchbares wird uebergangen.
  const eingefuegt = s.eingefuegt.filter(gueltigEingefuegt).map((e) => ({
    ...ausEingefuegtem(e),
    planDatum: null,
    verschoben: false,
    ausgefallen: false,
    eingefuegt: true
  }));
  return [...ausPlan, ...eingefuegt];
}

const aktiv = (einheiten) => einheiten.filter((e) => !e.ausgefallen);

export function tagesTyp(einheiten) {
  const arten = new Set(aktiv(einheiten).map((e) => e.art));
  if (arten.has('spiel')) return 'spiel';
  if (arten.has('sprungtest')) return 'sprungtest';
  if (arten.has('kraft') && arten.has('volleyball')) return 'kraft-vb';
  if (arten.has('kraft')) return 'kraft';
  if (arten.has('volleyball')) return 'volleyball';
  if (arten.has('regeneration')) return 'regeneration';
  if (arten.has('eigene')) return 'eigene';
  return 'frei';
}

// Festlegung: hohe Belastung sind Spiel, Volleyball, Krafteinheit und Sprungtest.
export const hoheBelastung = (einheiten) => aktiv(einheiten).some((e) => HOHE_BELASTUNG.includes(e.art));

export function sprungTage(gespeichert) {
  const einheiten = effektiveEinheiten(gespeichert);
  const tage = [];
  for (let datum = SPRUNG_START; datum <= SPRUNG_ENDE; datum = datumPlus(datum, 1)) {
    const amTag = einheiten.filter((e) => e.datum === datum);
    tage.push({
      datum,
      block: 'sprung',
      woche: wochenNummer(datum),
      wochentag: wochentagVon(datum),
      titel: titelDatum(datum),
      typ: tagesTyp(amTag),
      einheiten: amTag
    });
  }
  return tage;
}

export function sprungWochen(gespeichert) {
  const wochen = [];
  for (const tag of sprungTage(gespeichert)) {
    let woche = wochen.at(-1);
    if (!woche || woche.woche !== tag.woche) {
      const daten = SPRUNG.wochen.find((w) => w.nummer === tag.woche);
      woche = { montag: montagDerWoche(tag.datum), woche: tag.woche, titel: daten.titel, texte: daten.texte, tage: [] };
      wochen.push(woche);
    }
    woche.tage.push(tag);
  }
  return wochen;
}

// --- Aenderungen ---

export function verschiebe(gespeichert, id, datum) {
  const s = vollstaendig(gespeichert);
  if (!imBlock(datum)) return gespeichert;
  if (s.eingefuegt.some((e) => e.id === id)) {
    return { ...s, eingefuegt: s.eingefuegt.map((e) => (e.id === id ? { ...e, datum } : e)) };
  }
  const plan = PLAN_NACH_ID.get(id);
  if (!plan) return gespeichert;
  const verschoben = { ...s.verschoben };
  if (datum === plan.datum) delete verschoben[id];
  else verschoben[id] = datum;
  return { ...s, verschoben };
}

export function setzeAusgefallen(gespeichert, id, ja) {
  const s = vollstaendig(gespeichert);
  if (!PLAN_NACH_ID.has(id)) return gespeichert;
  const ohne = s.ausgefallen.filter((x) => x !== id);
  return { ...s, ausgefallen: ja ? [...ohne, id] : ohne };
}

export function fuegeEin(gespeichert, { datum, art, grundform, zeit, text }) {
  const s = vollstaendig(gespeichert);
  const gueltig = imBlock(datum)
    && ARTEN_EINFUEGEN.includes(art)
    && (art !== 'kraft' || grundform === 'A' || grundform === 'B');
  if (!gueltig) return { zustand: gespeichert, id: null };

  const hoechste = s.eingefuegt.reduce((max, e) => Math.max(max, Number(String(e?.id ?? '').slice(2)) || 0), 0);
  const id = `e-${hoechste + 1}`;
  const neu = { id, datum, art };
  if (art === 'kraft') neu.grundform = grundform;
  if (art === 'spiel' && zeit) neu.zeit = String(zeit);
  if (art === 'eigene') neu.text = String(text ?? '').trim();
  return { zustand: { ...s, eingefuegt: [...s.eingefuegt, neu] }, id };
}

export function entferne(gespeichert, id) {
  const s = vollstaendig(gespeichert);
  if (!s.eingefuegt.some((e) => e.id === id)) return gespeichert;
  const saetze = { ...s.saetze };
  delete saetze[id];
  return { ...s, eingefuegt: s.eingefuegt.filter((e) => e.id !== id), saetze };
}

export function setzeSaetze(gespeichert, id, index, anzahl) {
  const s = vollstaendig(gespeichert);
  const einheit = { ...(s.saetze[id] ?? {}) };
  if (anzahl > 0) einheit[index] = anzahl;
  else delete einheit[index];
  return { ...s, saetze: { ...s.saetze, [id]: einheit } };
}

export function setzeSprungtest(gespeichert, feld, wert) {
  if (!SPRUNGTEST_FELDER.includes(feld)) return gespeichert;
  const s = vollstaendig(gespeichert);
  const gueltig = Number.isFinite(wert) && wert > 0 ? wert : null;
  return { ...s, sprungtest: { ...s.sprungtest, [feld]: gueltig } };
}

// --- Ampel (Quelle: "Patellasehne: unser Kontrollsystem") ---

const K = SPRUNG.kontrollsystem;
const hatWert = (v) => v !== null && v !== undefined;
const zahl = (n) => String(n).replace('.', ',');

// Festlegung "persoenlicher Normalwert": Median der Ausgangsschmerzen der bis
// zu 14 letzten erfassten Morgen in den 28 Tagen vor dem Tag, mindestens 3.
export function normalwert(eintraege, datum) {
  const von = datumPlus(datum, -28);
  const werte = Object.keys(eintraege ?? {})
    .filter((d) => d >= von && d < datum)
    .sort()
    .reverse()
    .map((d) => ausgangsWert(eintraege[d]?.morgen))
    .filter(hatWert)
    .slice(0, 14)
    .sort((a, b) => a - b);
  if (werte.length < 3) return null;
  const mitte = Math.floor(werte.length / 2);
  return werte.length % 2 ? werte[mitte] : (werte[mitte - 1] + werte[mitte]) / 2;
}

// Zone eines Morgens. Rot schlaegt Gelb, Gelb schlaegt Gruen.
// Festlegung "merklich mehr": mindestens 1 Punkt ueber dem Normalwert.
export function sprungZone(eintrag, normal) {
  const wert = ausgangsWert(eintrag?.morgen);
  const zunehmend = eintrag?.beschwerdenZunehmend === true;
  if (!hatWert(wert) && !zunehmend) return { zone: 'offen', wert: null, gruende: [], konsequenz: [] };

  const rot = [];
  if (hatWert(wert) && wert > 3) rot.push(`${wert}/10 am Morgen`);
  if (zunehmend) rot.push('Beschwerden nehmen zu');
  if (rot.length) return { zone: 'rot', wert, gruende: rot, konsequenz: K.rot.konsequenz };

  const gelb = [];
  if (wert >= 2) gelb.push(`${wert}/10 am Morgen`);
  if (hatWert(normal) && wert - normal >= 1) gelb.push(`merklich mehr als der Normalwert ${zahl(normal)}`);
  if (gelb.length) return { zone: 'gelb', wert, gruende: gelb, konsequenz: K.gelb.konsequenz };

  return { zone: 'gruen', wert, gruende: [`${wert}/10 am Morgen`], konsequenz: K.gruen.konsequenz };
}

const zoneAm = (eintraege, datum) => sprungZone(eintraege?.[datum], normalwert(eintraege, datum));

/**
 * Was heute gilt: die Zone des heutigen Morgens. Fehlt er nach einem Tag mit
 * hoher Belastung, ist der Morgenwert faellig. Sonst gilt der letzte erfasste
 * Morgen im Block.
 */
export function heuteGilt({ datum, eintraege, tage }) {
  const heute = zoneAm(eintraege, datum);
  if (heute.zone !== 'offen') return { stufe: 'zone', ...heute, quelleDatum: datum };

  const vortag = tage.find((t) => t.datum === datumPlus(datum, -1));
  // Die Liste kann Reha-Tage enthalten (tage() aus state.js); die haben keine Einheiten.
  if (vortag?.block === 'sprung' && hoheBelastung(vortag.einheiten)) return { stufe: 'morgen-fehlt' };

  for (let d = datumPlus(datum, -1); d >= SPRUNG_START; d = datumPlus(d, -1)) {
    const z = zoneAm(eintraege, d);
    if (z.zone !== 'offen') return { stufe: 'zone', ...z, quelleDatum: d };
  }
  return { stufe: 'offen' };
}

// --- Hinweisregeln beim Verschieben und Einfuegen ---
// Jede Regel zitiert den Plan woertlich. Sie blockieren nie.

const textAus = (id, index) => PLAN_NACH_ID.get(id).texte[index];
const REGEL_TEXT = {
  R1: textAus('w5-fr-reg', 1),
  R2: textAus('w1-mo-vb', 1),
  R3: textAus('w4-mo-spiel', 0),
  R4: SPRUNG.einleitung.slice(SPRUNG.einleitung.indexOf('Weil montags')),
  R5: SPRUNG.grundformen.A.schluss[2]
};
const MIT_VOLLEYBALL_UNPASSEND = /^(RDL|Romanian Deadlift|Nordic|Drop Jump)$/;

export function regelHinweise(datum, einheiten) {
  const aktive = aktiv(einheiten);
  const am = (d, art) => aktive.some((e) => e.datum === d && e.art === art);
  const hinweise = [];
  for (const e of aktive.filter((x) => x.datum === datum && x.art === 'kraft')) {
    const regeln = [];
    if (am(datumPlus(datum, 1), 'spiel')) regeln.push('R1');
    if (am(datumPlus(datum, 2), 'spiel')) regeln.push('R2');
    if (am(datum, 'spiel')) regeln.push('R3');
    const namen = (e.uebungen ?? []).map((u) => u.name);
    if (wochentagVon(datum) === 'Montag' && namen.includes('Belt Squat')) regeln.push('R4');
    if (am(datum, 'volleyball') && namen.some((n) => MIT_VOLLEYBALL_UNPASSEND.test(n))) regeln.push('R5');
    for (const regel of regeln) hinweise.push({ regel, text: REGEL_TEXT[regel], einheitId: e.id });
  }
  return hinweise;
}

function alleHinweise(gespeichert) {
  const einheiten = effektiveEinheiten(gespeichert);
  const liste = [];
  for (let d = SPRUNG_START; d <= SPRUNG_ENDE; d = datumPlus(d, 1)) {
    for (const h of regelHinweise(d, einheiten)) liste.push({ ...h, datum: d });
  }
  return liste;
}

export function hinweiseNachAenderung(alt, neu) {
  const schluessel = (h) => `${h.regel}|${h.einheitId}|${h.datum}`;
  const vorher = new Set(alleHinweise(alt).map(schluessel));
  return alleHinweise(neu).filter((h) => !vorher.has(schluessel(h)));
}

// Leitsaetze fuer den ersten Blick: die Verbote der aktiven Einheiten,
// woertlich aus dem Plan.
export function leitsaetze(einheiten) {
  return aktiv(einheiten)
    .flatMap((e) => [...(e.einleitung ?? []), ...(e.texte ?? [])])
    .filter((t) => /^kein/i.test(t));
}
