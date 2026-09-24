// Wochenrechner: aus den Volleyballtagen, die der Nutzer setzt, entsteht die
// uebrige Woche.
//
// Die Regeln sind nicht erfunden, sie sind die Wochenstruktur des Plandokuments
// ausgeschrieben (Mo Volleyball, Di Regeneration, Mi Volleyball, Do Kraft A,
// Fr Regeneration, Sa Kraft B, So Kontrolltag):
//
//   H1  Vor einem Volleyballtag liegt kein Belastungstag.      Mo<-So, Mi<-Di
//   H2  Zwei Krafttage, mindestens 48 Stunden auseinander.     Do->Sa
//   H3  Hoechstens zwei Belastungstage hintereinander.         Mi+Do
//   H4  Der letzte freie Tag der Woche ist Kontrolltag.        So
//
// Weich, also nur bevorzugt:
//   S1  Ein Krafttag direkt nach einem Volleyballtag.          Mi->Do
//   S2  Krafttage moeglichst weit auseinander.
//
// Geht eine Kombination nicht auf, wird nicht geraten: der Rechner lockert eine
// benannte Regel und meldet, welche.

import { wochenTage, wochentagIndex, tageDazwischen } from './datum.js';

export const ROLLE = {
  volleyball: 'volleyball',
  match: 'match',
  kraft: 'kraft',
  regeneration: 'regeneration',
  kontrolle: 'kontrolle'
};

const istBelastung = (rolle) => rolle === ROLLE.volleyball || rolle === ROLLE.match
  || rolle === ROLLE.kraft;

export const REGELN = {
  H1: 'Vor einem Volleyballtag liegt kein Belastungstag',
  H2: 'Zwei Krafttage mit mindestens 48 Stunden Abstand',
  H3: 'Höchstens zwei Belastungstage hintereinander',
  H4: 'Der letzte freie Tag der Woche ist Kontrolltag'
};

// Bewertet eine fertige Belegung. Gibt die verletzten harten Regeln zurueck und
// eine Punktzahl fuer die weichen Vorlieben (hoeher ist besser).
function bewerte(belegung, tage, vortagRolle) {
  const verletzt = new Set();
  const rolleAn = (i) => (i < 0 ? vortagRolle : belegung[i]);

  tage.forEach((_, i) => {
    const rolle = belegung[i];
    if (rolle === ROLLE.volleyball || rolle === ROLLE.match) {
      const vorher = rolleAn(i - 1);
      if (vorher && istBelastung(vorher)) verletzt.add('H1');
    }
  });

  const kraftTage = tage.filter((_, i) => belegung[i] === ROLLE.kraft);
  if (kraftTage.length === 2 && tageDazwischen(kraftTage[0], kraftTage[1]) < 2) {
    verletzt.add('H2');
  }
  if (kraftTage.length < 2) verletzt.add('H2');

  let strecke = vortagRolle && istBelastung(vortagRolle) ? 1 : 0;
  for (let i = 0; i < tage.length; i += 1) {
    strecke = istBelastung(belegung[i]) ? strecke + 1 : 0;
    if (strecke > 2) { verletzt.add('H3'); break; }
  }

  if (!belegung.includes(ROLLE.kontrolle)) verletzt.add('H4');

  // Weiche Vorlieben
  let punkte = 0;
  tage.forEach((_, i) => {
    if (belegung[i] !== ROLLE.kraft) return;
    const vorher = rolleAn(i - 1);
    if (vorher === ROLLE.volleyball || vorher === ROLLE.match) punkte += 3; // S1
  });
  if (kraftTage.length === 2) {
    punkte += Math.min(tageDazwischen(kraftTage[0], kraftTage[1]), 4); // S2
  }

  return { verletzt: [...verletzt], punkte };
}

function alleZweierAus(liste) {
  const paare = [];
  for (let a = 0; a < liste.length; a += 1) {
    for (let b = a + 1; b < liste.length; b += 1) paare.push([liste[a], liste[b]]);
  }
  return paare;
}

/**
 * Plant eine Woche.
 * @param montag        Montag der Woche, YYYY-MM-DD
 * @param belastungen   { [datum]: 'volleyball' | 'match' } - vom Nutzer gesetzt
 * @param vortagRolle   Rolle des letzten Tages der Vorwoche, oder null
 * @returns { tage: [{datum, rolle}], gelockert: [string], hinweise: [string] }
 */
export function planeWoche(montag, belastungen = {}, vortagRolle = null) {
  const tage = wochenTage(montag);
  const gesetzt = tage.map((datum) => belastungen[datum] ?? null);
  const frei = tage.map((_, i) => i).filter((i) => !gesetzt[i]);

  if (frei.length === 0) {
    return {
      tage: tage.map((datum, i) => ({ datum, rolle: gesetzt[i] })),
      gelockert: ['H2', 'H4'],
      hinweise: ['Die ganze Woche ist mit Volleyball belegt. Es bleibt kein Tag für Kraft oder Kontrolle.']
    };
  }

  // Der Kontrolltag ist der letzte freie Tag der Woche.
  const kontrolleIndex = frei[frei.length - 1];
  const kraftKandidaten = frei.filter((i) => i !== kontrolleIndex);

  const bauen = (kraftIndizes) => {
    const belegung = tage.map((_, i) => {
      if (gesetzt[i]) return gesetzt[i];
      if (i === kontrolleIndex) return ROLLE.kontrolle;
      if (kraftIndizes.includes(i)) return ROLLE.kraft;
      return ROLLE.regeneration;
    });
    return { belegung, ...bewerte(belegung, tage, vortagRolle) };
  };

  const kandidaten = [
    ...alleZweierAus(kraftKandidaten).map(bauen),
    ...kraftKandidaten.map((i) => bauen([i])),
    bauen([])
  ];

  // Erst nach Zahl der verletzten Regeln. Bei Gleichstand bleiben die zwei
  // Krafttage erhalten: progressive Sehnenbelastung ist die Behandlung, nicht
  // das Beiwerk - eine Einheit zu streichen waere der groessere Verlust als sie
  // ungünstig zu legen. Welche Regel dabei weicht, sagt der Hinweis. Zuletzt
  // entscheiden die weichen Vorlieben.
  const fehlendeKrafttage = (k) => 2 - k.belegung.filter((r) => r === ROLLE.kraft).length;
  kandidaten.sort((a, b) => a.verletzt.length - b.verletzt.length
    || fehlendeKrafttage(a) - fehlendeKrafttage(b)
    || b.punkte - a.punkte);
  const beste = kandidaten[0];

  const hinweise = beste.verletzt.map((schluessel) => {
    if (schluessel === 'H2') {
      const anzahl = beste.belegung.filter((r) => r === ROLLE.kraft).length;
      return anzahl < 2
        ? `Es bleibt kein Platz für zwei Krafttage; diese Woche ${anzahl === 1 ? 'nur einer' : 'keiner'}. Gelockert: ${REGELN.H2}.`
        : `Die beiden Krafttage liegen an aufeinanderfolgenden Tagen. Gelockert: ${REGELN.H2}.`;
    }
    return `Gelockert: ${REGELN[schluessel]}.`;
  });

  return {
    tage: tage.map((datum, i) => ({ datum, rolle: beste.belegung[i] })),
    gelockert: beste.verletzt,
    hinweise
  };
}

// Die Vorgabe des Dokuments: Volleyball am Montag- und Mittwochabend (Z. 3).
export function standardBelastungen(montag) {
  const tage = wochenTage(montag);
  return { [tage[0]]: ROLLE.volleyball, [tage[2]]: ROLLE.volleyball };
}

export { istBelastung, wochentagIndex };
