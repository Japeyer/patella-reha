import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAN } from '../src/plan-data.js';
import {
  effektiveTage, effektiveWochen, wocheFuer, wochenNummer, phaseFuerWoche,
  naechsteWoche, rolleVonTag, belastungenDerWoche
} from '../src/kalender.js';
import { ROLLE } from '../src/schedule.js';
import { wochenTage } from '../src/datum.js';

// --- Die Treuegarantie: ohne Anpassung genau das Dokument ---

test('ohne gespeicherten Wochenplan sind es exakt die Tage des Dokuments', () => {
  const tage = effektiveTage({});
  assert.equal(tage.length, PLAN.tage.length);
  assert.deepEqual(tage.map((t) => t.datum), PLAN.tage.map((t) => t.datum));
  // Nicht nur gleiche Daten: identische Objekte, Feld für Feld.
  for (let i = 0; i < tage.length; i += 1) {
    assert.deepEqual(tage[i], PLAN.tage[i], `${tage[i].datum} unverändert`);
  }
});

test('ohne Anpassung gilt keine Woche als angepasst', () => {
  for (const woche of effektiveWochen({})) {
    assert.equal(woche.angepasst, false, woche.montag);
    assert.deepEqual(woche.hinweise, []);
  }
});

// --- Wochennummern und Phasen ---

test('Wochennummern zählen ab der ersten Planwoche', () => {
  assert.equal(wochenNummer('2026-09-14'), 0, 'Vorlauf');
  assert.equal(wochenNummer('2026-09-21'), 1);
  assert.equal(wochenNummer('2026-09-28'), 2);
  assert.equal(wochenNummer('2026-10-05'), 3);
  assert.equal(wochenNummer('2026-10-12'), 4);
});

test('angefügte Wochen laufen in Phase 2 weiter, ohne Steigerung', () => {
  assert.equal(phaseFuerWoche('2026-09-14'), 1);
  assert.equal(phaseFuerWoche('2026-09-21'), 1);
  assert.equal(phaseFuerWoche('2026-09-28'), 2);
  assert.equal(phaseFuerWoche('2026-10-05'), 2);
  assert.equal(phaseFuerWoche('2026-11-02'), 2);
});

// --- Anpassen ---

test('eine angepasste Woche wird gerechnet und ist als solche erkennbar', () => {
  const tage = wochenTage('2026-09-28');
  const plan = {
    '2026-09-28': {
      belastungen: { [tage[1]]: ROLLE.volleyball, [tage[3]]: ROLLE.volleyball }
    }
  };
  const w = wocheFuer('2026-09-28', plan, ROLLE.kontrolle);
  assert.equal(w.angepasst, true);
  assert.equal(w.tage.length, 7);
  assert.equal(rolleVonTag(w.tage[1]), ROLLE.volleyball);
  assert.equal(rolleVonTag(w.tage[3]), ROLLE.volleyball);
  for (const tag of w.tage) {
    if (tag.datum === '2026-10-04') continue;
    assert.equal(tag.herkunft, 'gerechnet', `${tag.datum} ist ausgewiesen`);
    assert.ok(tag.vorlageVon, `${tag.datum} nennt seine Vorlage`);
  }
});

test('gerechnete Tage übernehmen Übungen und Grenzen ihrer Vorlage', () => {
  const tage = wochenTage('2026-09-28');
  const plan = { '2026-09-28': { belastungen: { [tage[1]]: ROLLE.volleyball } } };
  const w = wocheFuer('2026-09-28', plan, ROLLE.kontrolle);
  const volley = w.tage.find((t) => rolleVonTag(t) === ROLLE.volleyball);
  const vorlage = PLAN.tage.find((t) => t.datum === volley.vorlageVon);
  assert.deepEqual(volley.bloecke, vorlage.bloecke);
  assert.deepEqual(volley.volleyball, vorlage.volleyball);
  assert.equal(volley.volleyball.spruengeMin, 15, 'Woche-2-Umfänge');
  assert.equal(volley.volleyball.spruengeMax, 25);
});

test('der Auswertungstag bleibt der Auswertungstag', () => {
  const tage = wochenTage('2026-09-28');
  const plan = { '2026-09-28': { belastungen: { [tage[1]]: ROLLE.volleyball } } };
  const w = wocheFuer('2026-09-28', plan, ROLLE.kontrolle);
  const sonntag = w.tage.find((t) => t.datum === '2026-10-04');
  assert.equal(sonntag.typ, 'auswertung');
});

test('ein Match erscheint als eigener Typ mit den Grenzen des Volleyballtags', () => {
  const tage = wochenTage('2026-10-05');
  const plan = {
    '2026-10-05': { belastungen: { [tage[0]]: ROLLE.volleyball, [tage[5]]: ROLLE.match } }
  };
  const w = wocheFuer('2026-10-05', plan, ROLLE.kontrolle);
  const match = w.tage.find((t) => t.typ === 'match');
  assert.ok(match, 'Match vorhanden');
  assert.equal(match.datum, tage[5]);
  assert.match(match.titel, /Match/);
  assert.ok(match.volleyball, 'trägt Sprungvorgaben');
  assert.equal(match.volleyball.spruengeMax, 25, 'dieselben Grenzen wie ein Training');
});

// --- Wochen anfügen ---

test('die nächste Woche schliesst lückenlos an', () => {
  assert.equal(naechsteWoche({}), '2026-10-05');
  assert.equal(naechsteWoche({ '2026-10-05': { belastungen: {} } }), '2026-10-12');
});

test('eine angefügte Woche erweitert die Tagesliste um sieben Tage', () => {
  const vorher = effektiveTage({}).length;
  const tage = wochenTage('2026-10-05');
  const plan = {
    '2026-10-05': { belastungen: { [tage[0]]: ROLLE.volleyball, [tage[2]]: ROLLE.volleyball } }
  };
  const nachher = effektiveTage(plan);
  assert.equal(nachher.length, vorher + 7);
  assert.equal(nachher[nachher.length - 1].datum, '2026-10-11');
  const daten = nachher.map((t) => t.datum);
  assert.deepEqual(daten, [...daten].sort(), 'weiterhin aufsteigend');
  assert.equal(new Set(daten).size, daten.length, 'keine Dubletten');
});

test('eine angefügte Standardwoche spiegelt die Struktur des Plans', () => {
  const tage = wochenTage('2026-10-05');
  const plan = {
    '2026-10-05': { belastungen: { [tage[0]]: ROLLE.volleyball, [tage[2]]: ROLLE.volleyball } }
  };
  const w = wocheFuer('2026-10-05', plan, ROLLE.kontrolle);
  assert.deepEqual(w.tage.map(rolleVonTag), [
    ROLLE.volleyball, ROLLE.regeneration, ROLLE.volleyball, ROLLE.kraft,
    ROLLE.regeneration, ROLLE.kraft, ROLLE.kontrolle
  ]);
  assert.deepEqual(w.gelockert, []);
});

test('die Vorgabe einer Woche ist Montag und Mittwoch Volleyball', () => {
  const b = belastungenDerWoche('2026-10-05', {});
  assert.deepEqual(b, { '2026-10-05': ROLLE.volleyball, '2026-10-07': ROLLE.volleyball });
});

// --- Uebergang zwischen den Wochen ---

test('der letzte Tag der Vorwoche geht in die Planung der nächsten ein', () => {
  const tage = wochenTage('2026-10-05');
  // Samstag als letzter freier Tag wird Kontrolltag, Sonntag ist Volleyball:
  // die Folgewoche muss diesen Belastungstag als Vortag kennen.
  const plan = {
    '2026-10-05': { belastungen: { [tage[6]]: ROLLE.volleyball } },
    '2026-10-12': { belastungen: { '2026-10-12': ROLLE.volleyball } }
  };
  const wochen = effektiveWochen(plan);
  const zweite = wochen.find((w) => w.montag === '2026-10-12');
  assert.ok(zweite.gelockert.includes('H1'),
    'Volleyball am Sonntag und am Montag darauf wird als Verstoss gemeldet');
});

test('Rollen lassen sich auch für unveränderte Dokumenttage bestimmen', () => {
  const rolle = (d) => rolleVonTag(PLAN.tage.find((t) => t.datum === d));
  assert.equal(rolle('2026-09-21'), ROLLE.volleyball);
  assert.equal(rolle('2026-09-22'), ROLLE.regeneration);
  assert.equal(rolle('2026-09-24'), ROLLE.kraft);
  assert.equal(rolle('2026-09-27'), ROLLE.kontrolle);
  assert.equal(rolle('2026-10-04'), ROLLE.kontrolle);
});
