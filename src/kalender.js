// Der effektive Kalender: die Tage des Plandokuments, soweit nichts verschoben
// wurde, sonst die gerechnete Woche.
//
// Die Treue zum Dokument bleibt durch Konstruktion erhalten: solange eine Woche
// keinen gespeicherten Eintrag hat, kommen ihre Tage unveraendert aus PLAN.tage.
// Erst eine Anpassung schaltet auf den Wochenrechner um.

import { PLAN } from './plan-data.js';
import { planeWoche, standardBelastungen, ROLLE } from './schedule.js';
import { tagAusVorlage } from './vorlagen.js';
import { montagDerWoche, wochenTage, datumPlus, tageDazwischen } from './datum.js';

export const ERSTE_WOCHE = '2026-09-21';
export const VORLAUF_WOCHE = '2026-09-14';
export const AUSWERTUNGSTAG = '2026-10-04';

// Wochennummer fuer die Anzeige: der Vorlauf ist 0, die erste Planwoche 1.
export function wochenNummer(montag) {
  return Math.round(tageDazwischen(ERSTE_WOCHE, montag) / 7) + 1;
}

// Phase 1 sind die Umfaenge der Woche 1, Phase 2 die der Woche 2. Angefuegte
// Wochen laufen in Phase 2 weiter, ohne erfundene Steigerung.
export function phaseFuerWoche(montag) {
  return wochenNummer(montag) <= 1 ? 1 : 2;
}

// Die Wochen, die das Dokument selbst abdeckt.
const DOKUMENT_WOCHEN = [VORLAUF_WOCHE, ERSTE_WOCHE, '2026-09-28'];

export function alleWochen(wochenplan = {}) {
  const montage = new Set([...DOKUMENT_WOCHEN, ...Object.keys(wochenplan)]);
  return [...montage].sort();
}

export function belastungenDerWoche(montag, wochenplan = {}) {
  const gespeichert = wochenplan[montag]?.belastungen;
  if (gespeichert) return gespeichert;
  // Vorgabe des Dokuments, aber nur fuer Tage, die es auch fuehrt.
  const standard = standardBelastungen(montag);
  if (montag !== VORLAUF_WOCHE) return standard;
  return {};
}

export const istAngepasst = (montag, wochenplan = {}) => Boolean(wochenplan[montag]);

// Tage einer Woche aus dem Dokument, unveraendert.
function dokumentTage(montag) {
  const daten = new Set(wochenTage(montag));
  return PLAN.tage.filter((tag) => daten.has(tag.datum));
}

// Tage einer Woche, gerechnet aus den gesetzten Belastungen.
function gerechneteTage(montag, belastungen, vortagRolle) {
  const phase = phaseFuerWoche(montag);
  const woche = wochenNummer(montag);
  const ergebnis = planeWoche(montag, belastungen, vortagRolle);

  const zaehler = {};
  const tage = ergebnis.tage.map(({ datum, rolle }) => {
    // Der Auswertungstag des Dokuments bleibt der Auswertungstag, solange an
    // ihm nicht ausdruecklich Volleyball gesetzt wurde.
    if (datum === AUSWERTUNGSTAG && rolle === ROLLE.kontrolle) {
      const original = PLAN.tage.find((t) => t.datum === AUSWERTUNGSTAG);
      return { ...original, woche, rolle, herkunft: undefined };
    }
    zaehler[rolle] = (zaehler[rolle] ?? 0) + 1;
    return tagAusVorlage(rolle, datum, phase, zaehler[rolle] - 1, woche);
  });

  return { tage, gelockert: ergebnis.gelockert, hinweise: ergebnis.hinweise };
}

/**
 * Die Woche, wie die App sie fuehrt.
 * @returns { montag, woche, angepasst, tage, gelockert, hinweise }
 */
export function wocheFuer(montag, wochenplan = {}, vortagRolle = null) {
  const woche = wochenNummer(montag);
  if (!istAngepasst(montag, wochenplan)) {
    return {
      montag,
      woche,
      angepasst: false,
      tage: dokumentTage(montag),
      gelockert: [],
      hinweise: []
    };
  }
  return {
    montag,
    woche,
    angepasst: true,
    ...gerechneteTage(montag, belastungenDerWoche(montag, wochenplan), vortagRolle)
  };
}

// Rolle eines Tages, auch fuer die unveraenderten Dokumenttage.
export function rolleVonTag(tag) {
  if (tag.rolle) return tag.rolle;
  if (tag.typ === 'match') return ROLLE.match;
  if (tag.typ.startsWith('volleyball')) return ROLLE.volleyball;
  if (tag.typ === 'kraft-a' || tag.typ === 'kraft-b') return ROLLE.kraft;
  if (tag.typ === 'kontrolltag' || tag.typ === 'auswertung') return ROLLE.kontrolle;
  return ROLLE.regeneration;
}

/**
 * Alle Tage, die die App fuehrt, in zeitlicher Reihenfolge.
 * Ohne gespeicherten Wochenplan sind das genau die Tage des Dokuments.
 */
export function effektiveWochen(wochenplan = {}) {
  const wochen = [];
  let vortagRolle = null;
  for (const montag of alleWochen(wochenplan)) {
    const w = wocheFuer(montag, wochenplan, vortagRolle);
    wochen.push(w);
    const letzter = w.tage[w.tage.length - 1];
    vortagRolle = letzter ? rolleVonTag(letzter) : null;
  }
  return wochen;
}

export function effektiveTage(wochenplan = {}) {
  return effektiveWochen(wochenplan).flatMap((w) => w.tage);
}

// Die naechste anfuegbare Woche.
export function naechsteWoche(wochenplan = {}) {
  const wochen = alleWochen(wochenplan);
  return datumPlus(wochen[wochen.length - 1], 7);
}

export { montagDerWoche };
