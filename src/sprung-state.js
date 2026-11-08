// Speicherzugriffe des Sprungkraft-Blocks: liest den gespeicherten Teil, wendet
// eine reine Aenderung aus sprung-logik.js an, schreibt und zeichnet neu.

import { zustand, aktualisiere, sprungZustand } from './state.js';
import {
  verschiebe, setzeAusgefallen, fuegeEin, entferne, setzeSaetze, setzeSprungtest
} from './sprung-logik.js';

export function aendereSprung(aenderung) {
  const gesamt = zustand.speicher.lies();
  zustand.speicher.schreib({ ...gesamt, sprung: aenderung(sprungZustand()) });
  aktualisiere();
}

export const verschiebeEinheit = (id, datum) => aendereSprung((s) => verschiebe(s, id, datum));
export const einheitAusfallen = (id, ja) => aendereSprung((s) => setzeAusgefallen(s, id, ja));
export const einheitEntfernen = (id) => aendereSprung((s) => entferne(s, id));
export const satzSetzen = (id, index, anzahl) => aendereSprung((s) => setzeSaetze(s, id, index, anzahl));
export const sprungtestSetzen = (feld, wert) => aendereSprung((s) => setzeSprungtest(s, feld, wert));

// Gibt die ID der neuen Einheit zurueck, oder null, wenn nichts eingefuegt wurde.
export function einheitEinfuegen(daten) {
  let id = null;
  aendereSprung((s) => {
    const ergebnis = fuegeEin(s, daten);
    id = ergebnis.id;
    return ergebnis.zustand;
  });
  return id;
}
