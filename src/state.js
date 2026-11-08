// Zustand und Datenzugriff. Haelt die Views von Speicher und Kalenderrechnung
// frei und vermeidet Ringabhaengigkeiten: app.js meldet seine Zeichenfunktion
// hier an, die Views loesen ueber aktualisiere() neu zeichnen aus.

import { PLAN } from './plan-data.js';
import { leerEintrag, zoneFuerTag, ausgangsWert } from './logic.js';
import { erzeugeSpeicher } from './storage.js';
import {
  effektiveTage, effektiveWochen, belastungenDerWoche, istAngepasst
} from './kalender.js';
import { montagDerWoche } from './datum.js';
import {
  SPRUNG_START, sprungTage, sprungWochen, leererSprungZustand
} from './sprung-logik.js';

const backend = (() => {
  try { return globalThis.localStorage ?? null; } catch { return null; }
})();

export const zustand = {
  ansicht: 'verlauf',
  gewaehltesDatum: null,
  angezeigteWoche: 1,
  nurMorgen: false,
  speicher: erzeugeSpeicher(backend),
  // Nur waehrend der Einheit gebraucht, deshalb nicht gespeichert.
  letzterSprung: null,
  letzterAbstand: null,
  // Welcher Messpunkt aufgeklappt ist; null heisst "der naechste faellige".
  offenerMesspunkt: null,
  mehrOffen: false,
  // Wochenplanung: welche Woche offen ist und der noch nicht uebernommene Entwurf.
  offeneWoche: null,
  wochenEntwurf: null,
  // Sprungkraft-Block: offenes Verschieben oder Einfuegen samt Entwurf, und
  // welcher Block im Verlauf gezeigt wird (null = der Block von heute).
  aktion: null,
  verlaufBlock: null
};

let zeichner = () => {};
export function registriereZeichner(fn) { zeichner = fn; }
export function aktualisiere() { zeichner(); }

const TRAININGSTYPEN = ['volleyball-reduziert', 'volleyball-kontrolliert', 'match', 'kraft-a', 'kraft-b'];
export const istTrainingstag = (tag) => TRAININGSTYPEN.includes(tag.typ);

export const alleEintraege = () => zustand.speicher.lies().eintraege;

// Der gespeicherte Wochenplan. Leer heisst: alles wie im Dokument.
export const wochenplan = () => zustand.speicher.lies().wochenplan ?? {};

// Der gespeicherte Teil des Sprungkraft-Blocks; fehlt in Staenden vor dem Update.
export const sprungZustand = () => ({ ...leererSprungZustand(), ...(zustand.speicher.lies().sprung ?? {}) });

// Die Tage, die die App fuehrt: zuerst der Reha-Block (ohne Anpassung genau
// PLAN.tage), dann der Sprungkraft-Block. Reha-Tage enden vor dem
// Sprungkraft-Block, auch wenn dort frueher Wochen angefuegt wurden.
// Wird bei jedem Zeichnen neu gerechnet; beide Rechnungen sind billig.
export const rehaTage = () => effektiveTage(wochenplan()).filter((t) => t.datum < SPRUNG_START);
export const tage = () => [...rehaTage(), ...sprungTage(sprungZustand())];
export const wochen = () => [
  ...effektiveWochen(wochenplan())
    .map((w) => ({ ...w, block: 'reha', tage: w.tage.filter((t) => t.datum < SPRUNG_START) }))
    .filter((w) => w.tage.length > 0),
  ...sprungWochen(sprungZustand()).map((w) => ({ ...w, block: 'sprung', angepasst: false, hinweise: [] }))
];

export const tagFuer = (datum) => tage().find((t) => t.datum === datum) ?? null;
// Gegen leerEintrag aufgefuellt, damit ein wiederhergestellter Eintrag aus einer
// aelteren Sicherung keine fehlenden Felder mitbringt.
export const eintragFuer = (datum) => ({ ...leerEintrag(datum), ...(alleEintraege()[datum] ?? {}) });

export function heutigerPlantag(heute = new Date()) {
  const jahr = heute.getFullYear();
  const monat = String(heute.getMonth() + 1).padStart(2, '0');
  const tagZahl = String(heute.getDate()).padStart(2, '0');
  const key = `${jahr}-${monat}-${tagZahl}`;
  const treffer = tagFuer(key);
  if (treffer) return treffer;
  // Zwischen den Bloecken und nach dem Ende gilt der letzte gefuehrte Tag davor.
  const liste = tage();
  if (key < liste[0].datum) return liste[0];
  return liste.filter((t) => t.datum <= key).at(-1);
}

export function aktuellesDatum() {
  return zustand.gewaehltesDatum ?? heutigerPlantag().datum;
}

// Morgenwert des Folgetags: die 24-Stunden-Reaktion auf die Einheit dieses Tages.
// Nur fuer Reha-Tage: der Sprungkraft-Block bewertet seine Morgen selbst.
export function folgeMorgenFuer(datum) {
  const liste = rehaTage();
  const i = liste.findIndex((t) => t.datum === datum);
  if (i < 0) return null;
  const naechster = liste[i + 1];
  if (!naechster) return null;
  const e = alleEintraege()[naechster.datum];
  return ausgangsWert(e?.morgen) == null ? null : e.morgen;
}

// "Mit dem Zustand am Morgen nach dem vorherigen Training vergleichen"
// (Quelle Z. 30): sucht das letzte Training vor diesem Tag und nimmt den
// Morgenwert des Tages danach. deutlichSchlechter meldet eine Verschlechterung
// um 2 oder mehr Punkte gegenueber dem Morgen des Trainingstags selbst.
export function vergleichMorgenFuer(datum) {
  const eintraege = alleEintraege();
  const liste = rehaTage();
  const i = liste.findIndex((t) => t.datum === datum);
  for (let k = i - 1; k >= 0; k -= 1) {
    const training = liste[k];
    if (!istTrainingstag(training)) continue;
    const danach = liste[k + 1];
    const morgenDanach = danach ? eintraege[danach.datum]?.morgen : null;
    const wertDanach = ausgangsWert(morgenDanach);
    if (wertDanach == null) return null;
    const morgenDesTrainings = ausgangsWert(eintraege[training.datum]?.morgen);
    const deutlichSchlechter = morgenDesTrainings != null
      && wertDanach - morgenDesTrainings >= 2;
    return { ...morgenDanach, deutlichSchlechter, quelle: danach.datum };
  }
  return null;
}

// Schreibt einen Teilwert. pfad ist "morgen.ruhe", "vor.hinken", "spruenge", ...
export function setzeWert(datum, pfad, wert) {
  const schluessel = pfad.split('.');
  const teil = schluessel.reverse().reduce((innen, k) => ({ [k]: innen }), wert);
  zustand.speicher.setzeEintrag(datum, teil);
  aktualisiere();
}

export function schalteUebung(datum, name) {
  const vorhanden = eintragFuer(datum).uebungenAbgehakt;
  const neu = vorhanden.includes(name)
    ? vorhanden.filter((n) => n !== name)
    : [...vorhanden, name];
  zustand.speicher.setzeEintrag(datum, { uebungenAbgehakt: neu });
  aktualisiere();
}

export function fortschrittAntworten() {
  return zustand.speicher.lies().fortschritt ?? [null, null, null, null];
}

export function setzeFortschritt(index, wert) {
  const alt = fortschrittAntworten();
  const neu = alt.map((w, i) => (i === index ? wert : w));
  const z = zustand.speicher.lies();
  zustand.speicher.schreib({ ...z, fortschritt: neu });
  aktualisiere();
}

export function auswertungWerte() {
  return zustand.speicher.lies().auswertung ?? {};
}

export function setzeAuswertung(feld, wert) {
  const z = zustand.speicher.lies();
  zustand.speicher.schreib({ ...z, auswertung: { ...(z.auswertung ?? {}), [feld]: wert } });
  aktualisiere();
}

// Zone der letzten Einheit vor diesem Tag. Sie entscheidet mit darueber, was
// heute erlaubt ist: rot sperrt Spruenge, gelb reduziert sie um 20 bis 30 Prozent.
export function letzteTrainingsZone(datum) {
  const liste = rehaTage();
  const i = liste.findIndex((t) => t.datum === datum);
  for (let k = i - 1; k >= 0; k -= 1) {
    const training = liste[k];
    if (!istTrainingstag(training)) continue;
    const befund = zoneFuerTag(eintragFuer(training.datum), folgeMorgenFuer(training.datum));
    return befund.zone === 'offen' ? null : befund.zone;
  }
  return null;
}

export function oeffneMesspunkt(schluessel) {
  zustand.offenerMesspunkt = schluessel;
  aktualisiere();
}

// --- Wochenplan aendern ---

export function belastungenFuer(montag) {
  return belastungenDerWoche(montag, wochenplan());
}

export function wocheAngepasst(montag) {
  return istAngepasst(montag, wochenplan());
}

export function setzeWoche(montag, belastungen) {
  const z = zustand.speicher.lies();
  zustand.speicher.schreib({
    ...z,
    wochenplan: { ...(z.wochenplan ?? {}), [montag]: { belastungen } }
  });
  aktualisiere();
}

// Setzt eine Woche auf die Vorgabe des Dokuments zurueck.
export function wocheZuruecksetzen(montag) {
  const z = zustand.speicher.lies();
  const neu = { ...(z.wochenplan ?? {}) };
  delete neu[montag];
  zustand.speicher.schreib({ ...z, wochenplan: neu });
  aktualisiere();
}

export const montagVon = montagDerWoche;

export function wechsleAnsicht(name) {
  zustand.ansicht = name;
  aktualisiere();
}

export function oeffneWoche(montag) {
  zustand.offeneWoche = montag;
  zustand.wochenEntwurf = null;
  wechsleAnsicht('plan');
}

export function schliesseWoche() {
  zustand.offeneWoche = null;
  zustand.wochenEntwurf = null;
  aktualisiere();
}

export function setzeDatum(datum) {
  zustand.gewaehltesDatum = datum;
  zustand.letzterSprung = null;
  zustand.letzterAbstand = null;
  zustand.offenerMesspunkt = null;
  zustand.aktion = null;
  wechsleAnsicht('heute');
}
