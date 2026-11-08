import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SPRUNG_START, SPRUNG_ENDE, leererSprungZustand, satzZahl, grundformEinheit,
  effektiveEinheiten, sprungTage, sprungWochen, tagesTyp, hoheBelastung,
  verschiebe, setzeAusgefallen, fuegeEin, entferne, setzeSaetze, setzeSprungtest
} from '../src/sprung-logik.js';

const leer = leererSprungZustand();
const tagAm = (datum, s = leer) => sprungTage(s).find((t) => t.datum === datum);
const einheit = (id, s = leer) => effektiveEinheiten(s).find((e) => e.id === id);

test('Sprung-Tage lückenlos 7.11.2026 bis 3.1.2027', () => {
  const t = sprungTage(leer);
  assert.equal(SPRUNG_START, '2026-11-07');
  assert.equal(SPRUNG_ENDE, '2027-01-03');
  assert.equal(t.length, 58);
  assert.equal(t[0].datum, '2026-11-07');
  assert.equal(t.at(-1).datum, '2027-01-03');
  assert.ok(t.every((tag) => tag.block === 'sprung'));
});

test('Tagestypen folgen den Einheiten', () => {
  assert.equal(tagAm('2026-11-07').typ, 'spiel');
  assert.equal(tagAm('2026-11-08').typ, 'frei');
  assert.equal(tagAm('2026-11-09').typ, 'volleyball');
  assert.equal(tagAm('2026-11-13').typ, 'kraft');
  assert.equal(tagAm('2026-11-16').typ, 'kraft-vb');
  assert.equal(tagAm('2026-11-14').typ, 'regeneration');
  assert.equal(tagAm('2027-01-01').typ, 'sprungtest');
});

test('Wochennummer und Titel der Sprung-Tage', () => {
  assert.equal(tagAm('2026-11-08').woche, 0);
  assert.equal(tagAm('2026-11-09').woche, 1);
  assert.equal(tagAm('2027-01-03').woche, 8);
  assert.equal(tagAm('2026-11-13').titel, 'Freitag, 13. November');
});

test('Sprung-Wochen gruppieren alle Tage', () => {
  const w = sprungWochen(leer);
  assert.deepEqual(w.map((x) => x.woche), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(w[0].montag, '2026-11-02');
  assert.equal(w[0].tage.length, 2);
  assert.equal(w[1].titel, 'Woche 1 | 9.–15. November');
  assert.equal(w.reduce((n, x) => n + x.tage.length, 0), 58);
});

test('hohe Belastung: Spiel, Volleyball, Kraft, Sprungtest', () => {
  assert.equal(hoheBelastung(tagAm('2026-11-07').einheiten), true);
  assert.equal(hoheBelastung(tagAm('2026-11-14').einheiten), false);
  assert.equal(hoheBelastung(tagAm('2026-11-08').einheiten), false);
  assert.equal(hoheBelastung(tagAm('2027-01-01').einheiten), true);
});

test('satzZahl liest die Satzzahl', () => {
  assert.equal(satzZahl('3×5 @ 3 RIR'), 3);
  assert.equal(satzZahl('2 × 6–8'), 2);
  assert.equal(satzZahl('1×4 pro Bein @ ~3 RIR'), 1);
  assert.equal(satzZahl('4×2 maximal'), 4);
  assert.equal(satzZahl('Maximal.'), null);
});

test('verschieben behält Übungen, zurück aufs Plandatum löscht den Eintrag', () => {
  const s = verschiebe(leer, 'w2-fr-kraft', '2026-11-21');
  const e = einheit('w2-fr-kraft', s);
  assert.equal(e.datum, '2026-11-21');
  assert.equal(e.planDatum, '2026-11-20');
  assert.equal(e.verschoben, true);
  assert.deepEqual(e.uebungen, einheit('w2-fr-kraft').uebungen);
  assert.equal(tagAm('2026-11-20', s).typ, 'frei');
  const zurueck = verschiebe(s, 'w2-fr-kraft', '2026-11-20');
  assert.deepEqual(zurueck.verschoben, {});
  assert.equal(einheit('w2-fr-kraft', zurueck).verschoben, false);
});

test('verschieben auf leeres oder ausserhalb liegendes Datum ändert nichts', () => {
  assert.deepEqual(verschiebe(leer, 'w2-fr-kraft', ''), leer);
  assert.deepEqual(verschiebe(leer, 'w2-fr-kraft', '2027-01-04'), leer);
  assert.deepEqual(verschiebe(leer, 'w2-fr-kraft', '2026-11-06'), leer);
  assert.deepEqual(verschiebe(leer, 'gibt-es-nicht', '2026-11-21'), leer);
});

test('ändern lässt den Ausgangszustand unberührt', () => {
  const vorher = JSON.stringify(leer);
  verschiebe(leer, 'w2-fr-kraft', '2026-11-21');
  setzeAusgefallen(leer, 'w2-mi-vb', true);
  fuegeEin(leer, { datum: '2026-11-17', art: 'spiel', zeit: '19:00' });
  assert.equal(JSON.stringify(leer), vorher);
});

test('ausgefallen bleibt sichtbar, zählt nicht als Belastung', () => {
  const s = setzeAusgefallen(leer, 'w2-mi-vb', true);
  const tag = tagAm('2026-11-18', s);
  assert.equal(tag.einheiten.length, 1);
  assert.equal(tag.einheiten[0].ausgefallen, true);
  assert.equal(hoheBelastung(tag.einheiten), false);
  assert.equal(tag.typ, 'frei');
  assert.deepEqual(setzeAusgefallen(s, 'w2-mi-vb', false).ausgefallen, []);
});

test('zweimal einfügen ergibt zwei verschiedene IDs', () => {
  const a = fuegeEin(leer, { datum: '2026-11-17', art: 'volleyball' });
  const b = fuegeEin(a.zustand, { datum: '2026-11-17', art: 'spiel', zeit: '19:00' });
  assert.notEqual(a.id, b.id);
  const tag = tagAm('2026-11-17', b.zustand);
  assert.deepEqual(tag.einheiten.map((e) => e.art), ['volleyball', 'spiel']);
  assert.ok(tag.einheiten.every((e) => e.eingefuegt));
  assert.equal(tag.einheiten[1].zeit, '19:00');
  assert.equal(tag.typ, 'spiel');
});

test('einfügen ausserhalb des Blocks oder mit unbekannter Art ändert nichts', () => {
  assert.equal(fuegeEin(leer, { datum: '2027-02-01', art: 'spiel' }).id, null);
  assert.equal(fuegeEin(leer, { datum: '2026-11-17', art: 'quatsch' }).id, null);
});

test('eingefügter Beintag B trägt die Übungen der Grundform', () => {
  const { zustand, id } = fuegeEin(leer, { datum: '2026-11-17', art: 'kraft', grundform: 'B' });
  const e = einheit(id, zustand);
  assert.equal(e.art, 'kraft');
  assert.equal(e.grundform, 'B');
  assert.deepEqual(e.uebungen.map((u) => u.name),
    ['Volleyball Approach Jump', 'Drop Jump', 'Belt Squat', 'Romanian Deadlift', 'Nordic', 'Calf Raise']);
  assert.deepEqual(grundformEinheit('A', '2026-11-17', 'x').uebungen.map((u) => u.angabe),
    ['3 × 2', '3 × 3', '2 × 5 je Bein', '2 × 6–8']);
});

test('eigene Einheit trägt den Text', () => {
  const { zustand, id } = fuegeEin(leer, { datum: '2026-11-19', art: 'eigene', text: 'Beachvolleyball locker' });
  const e = einheit(id, zustand);
  assert.equal(e.titel, 'Beachvolleyball locker');
  assert.equal(tagAm('2026-11-19', zustand).typ, 'eigene');
});

test('eingefügte Einheit lässt sich verschieben und entfernen', () => {
  const { zustand, id } = fuegeEin(leer, { datum: '2026-11-17', art: 'spiel', zeit: '19:00' });
  const verschoben = verschiebe(zustand, id, '2026-11-19');
  assert.equal(einheit(id, verschoben).datum, '2026-11-19');
  assert.deepEqual(verschoben.verschoben, {});
  const weg = entferne(verschoben, id);
  assert.equal(einheit(id, weg), undefined);
});

test('entferne löscht nur Eingefügtes', () => {
  assert.deepEqual(entferne(leer, 'w2-fr-kraft'), leer);
});

test('Sätze hängen an der Einheit, nicht am Datum', () => {
  let s = setzeSaetze(leer, 'w2-fr-kraft', 2, 3);
  s = verschiebe(s, 'w2-fr-kraft', '2026-11-21');
  assert.deepEqual(s.saetze, { 'w2-fr-kraft': { 2: 3 } });
  assert.deepEqual(setzeSaetze(s, 'w2-fr-kraft', 2, 0).saetze, { 'w2-fr-kraft': {} });
});

test('Sprungtest speichert nur gültige Zahlen', () => {
  assert.deepEqual(setzeSprungtest(leer, 'approach', 312).sprungtest, { approach: 312 });
  assert.deepEqual(setzeSprungtest(leer, 'cmj', Number.NaN).sprungtest, { cmj: null });
  assert.deepEqual(setzeSprungtest(leer, 'cmj', -4).sprungtest, { cmj: null });
  assert.deepEqual(setzeSprungtest(leer, 'quatsch', 4), leer);
});

test('ungültige eingefügte Einträge aus einer Sicherung werden übersprungen', () => {
  const s = { ...leer, eingefuegt: [
    { id: 'e-1', datum: '2026-11-17', art: 'kraft' },
    { id: 'e-2', datum: '2026-11-17', art: 'quatsch' },
    { id: 'e-3', datum: '2030-01-01', art: 'spiel' },
    { id: 'e-4', datum: '2026-11-17', art: 'spiel', zeit: '19:00' }
  ] };
  const eingefuegt = effektiveEinheiten(s).filter((e) => e.eingefuegt);
  assert.deepEqual(eingefuegt.map((e) => e.id), ['e-4']);
});

test('einfügen verträgt Einträge ohne Text-ID aus einer Sicherung', () => {
  const s = { ...leer, eingefuegt: [{ datum: '2026-11-17', art: 'spiel' }, { id: 7, datum: '2026-11-17', art: 'spiel' }, { id: 'e-2', datum: '2026-11-18', art: 'spiel' }] };
  const r = fuegeEin(s, { datum: '2026-11-19', art: 'volleyball' });
  assert.equal(r.id, 'e-3');
});
