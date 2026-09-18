import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAN } from '../src/plan-data.js';
import {
  leerEintrag,
  teilnahmeGate, sprungLimit, sprungStatus, sprungAbstand,
  fortschrittsGate, fortschrittsVorschlag, auswertungVorschlag, umfangFuerWoche2
} from '../src/logic.js';

const tag = (datum) => PLAN.tage.find((t) => t.datum === datum);

// --- Teilnahme-Gate (Quelle Z. 25-41) ---

const vorTraining = (teil = {}) => ({
  ...leerEintrag('2026-09-21'),
  ...teil,
  vor: { ruhe: 1, treppe: 1, stepDownsMoeglich: true, hinken: false, ...(teil.vor ?? {}) }
});

test('Teilnahme mit Sprüngen bei erfüllten Bedingungen', () => {
  const r = teilnahmeGate(vorTraining(), { ruhe: 1 });
  assert.equal(r.teilnahme, 'erlaubt');
  assert.equal(r.spruenge, 'erlaubt');
  assert.equal(r.grenzfall, false);
  assert.match(r.anzeige, /Teilnahme.*Sprüngen/);
});

test('Ausgangsschmerz 2 ist erfüllt, 3 ist Grenzfall, 4 nicht erfüllt', () => {
  assert.equal(teilnahmeGate(vorTraining({ vor: { ruhe: 2 } }), { ruhe: 2 }).teilnahme, 'erlaubt');
  const drei = teilnahmeGate(vorTraining({ vor: { ruhe: 3 } }), { ruhe: 3 });
  assert.equal(drei.teilnahme, 'erlaubt');
  assert.equal(drei.grenzfall, true);
  const vier = teilnahmeGate(vorTraining({ vor: { ruhe: 4 } }), { ruhe: 4 });
  assert.equal(vier.teilnahme, 'nicht-erfuellt');
  assert.equal(vier.spruenge, 'keine');
});

test('Hinken verhindert die Teilnahme', () => {
  const r = teilnahmeGate(vorTraining({ vor: { hinken: true } }), { ruhe: 1 });
  assert.equal(r.teilnahme, 'nicht-erfuellt');
  assert.ok(r.ausgeloest.includes('kein Hinken vorhanden ist'));
});

test('nicht kontrollierbare Step-downs verhindern die Teilnahme', () => {
  const r = teilnahmeGate(vorTraining({ vor: { stepDownsMoeglich: false } }), { ruhe: 1 });
  assert.equal(r.teilnahme, 'nicht-erfuellt');
});

test('schlechteres Knie als am Vortag verhindert die Teilnahme', () => {
  const r = teilnahmeGate(vorTraining({ vor: { ruhe: 2 } }), { ruhe: 0 });
  assert.equal(r.teilnahme, 'nicht-erfuellt');
});

test('Schwellung erlaubt Teilnahme, aber keine Sprünge', () => {
  const r = teilnahmeGate(vorTraining({ schwellungInstabilitaetKraftverlust: true }), { ruhe: 1 });
  assert.equal(r.teilnahme, 'erlaubt');
  assert.equal(r.spruenge, 'keine');
  assert.ok(r.ausgeloest.includes('Schwellung, Instabilität oder Kraftverlust bestehen'));
  assert.match(r.anzeige, /Technik ohne Sprünge und Oberkörpertraining/);
});

test('deutlich schlechterer Folgetag erlaubt keine Sprünge', () => {
  const r = teilnahmeGate(vorTraining(), { ruhe: 1, deutlichSchlechter: true });
  assert.equal(r.spruenge, 'keine');
});

test('fehlende Angaben werden als offen gemeldet, nicht als erfüllt', () => {
  const r = teilnahmeGate(leerEintrag('2026-09-21'), null);
  assert.ok(r.offen.length > 0);
  assert.equal(r.spruenge, 'keine');
  assert.match(r.anzeige, /Angaben/);
});

test('ausgelöste Bedingungen stehen im Wortlaut des Plans', () => {
  const r = teilnahmeGate(vorTraining({ vor: { ruhe: 5 } }), { ruhe: 5 });
  assert.ok(r.ausgeloest.length > 0);
  for (const text of r.ausgeloest) {
    assert.ok(
      PLAN.volleyballRegeln.teilnahmeErlaubtWenn.includes(text)
      || PLAN.volleyballRegeln.keineSpruengeWenn.includes(text),
      `Wortlaut aus dem Plan erwartet: ${text}`
    );
  }
});

// --- Sprunglimit und Zähler (Quelle Z. 79, 81, 98-99, 162, 177) ---

test('Montag Woche 1 nimmt den Bereich des Plans', () => {
  const r = sprungLimit(tag('2026-09-21'), {});
  assert.equal(r.min, 10);
  assert.equal(r.max, 15);
});

test('Mittwoch Woche 1 nimmt die Montagszahl ohne Steigerung', () => {
  const eintraege = { '2026-09-21': { ...leerEintrag('2026-09-21'), spruenge: 12 } };
  const r = sprungLimit(tag('2026-09-23'), eintraege);
  assert.equal(r.max, 12);
  assert.match(r.quelle, /Montag/);
});

test('Mittwoch Woche 2 erlaubt höchstens 10 Prozent mehr als Montag', () => {
  const eintraege = { '2026-09-28': { ...leerEintrag('2026-09-28'), spruenge: 20 } };
  const r = sprungLimit(tag('2026-09-30'), eintraege);
  assert.equal(r.max, 22);
});

test('fehlende Montagszahl fällt auf den Planbereich zurück und sagt es', () => {
  const r = sprungLimit(tag('2026-09-23'), {});
  assert.equal(r.min, 10);
  assert.equal(r.max, 15);
  assert.match(r.hinweis, /Montag/);
});

test('Nicht-Volleyballtag hat kein Sprunglimit', () => {
  assert.equal(sprungLimit(tag('2026-09-24'), {}), null);
});

test('Status: Hinweis ab Untergrenze, Warnung ab Obergrenze, darüber bleibend', () => {
  const limit = { min: 10, max: 15 };
  assert.equal(sprungStatus(0, limit).stufe, 'frei');
  assert.equal(sprungStatus(9, limit).stufe, 'frei');
  assert.equal(sprungStatus(10, limit).stufe, 'hinweis');
  assert.equal(sprungStatus(15, limit).stufe, 'warnung');
  assert.equal(sprungStatus(16, limit).stufe, 'ueber');
  assert.match(sprungStatus(16, limit).text, /über/);
});

test('Abstand unter 20 Sekunden gilt als zu kurz', () => {
  const jetzt = new Date('2026-09-21T19:00:30Z').getTime();
  const vorher = new Date('2026-09-21T19:00:15Z').getTime();
  const r = sprungAbstand(vorher, jetzt);
  assert.equal(r.sekunden, 15);
  assert.equal(r.zuKurz, true);
  assert.match(r.text, /20 bis 30 Sekunden/);
});

test('Abstand ab 30 Sekunden ist in Ordnung', () => {
  const jetzt = new Date('2026-09-21T19:01:00Z').getTime();
  const vorher = new Date('2026-09-21T19:00:25Z').getTime();
  assert.equal(sprungAbstand(vorher, jetzt).zuKurz, false);
});

test('erster Sprung hat keinen Abstand', () => {
  const r = sprungAbstand(null, Date.now());
  assert.equal(r.sekunden, null);
  assert.equal(r.zuKurz, false);
});

// --- Fortschritts-Gate und Auswertung (Quelle Z. 150-154, 168, 208-214) ---

test('alle vier Kriterien erfüllt gibt Woche 2 frei', () => {
  const r = fortschrittsGate([true, true, true, true]);
  assert.equal(r.freigegeben, true);
  assert.deepEqual(r.nichtErfuellt, []);
});

test('ein nicht erfülltes Kriterium verhindert die Freigabe und wird benannt', () => {
  const r = fortschrittsGate([true, false, true, true]);
  assert.equal(r.freigegeben, false);
  assert.deepEqual(r.nichtErfuellt, [PLAN.fortschrittskriterien[1]]);
  assert.match(r.anzeige, /Woche 1/);
});

test('unbeantwortete Kriterien gelten als offen, nicht als erfüllt', () => {
  const r = fortschrittsGate([true, null, true, true]);
  assert.equal(r.freigegeben, false);
  assert.deepEqual(r.offen, [PLAN.fortschrittskriterien[1]]);
});

test('Vorbelegung: Morgenbeschwerden höchstens 2 wird aus Einträgen abgeleitet', () => {
  const eintraege = {
    '2026-09-25': { ...leerEintrag('2026-09-25'), morgen: { ruhe: 2, treppe: 2 } },
    '2026-09-26': { ...leerEintrag('2026-09-26'), morgen: { ruhe: 1, treppe: 1 } }
  };
  const v = fortschrittsVorschlag(eintraege);
  assert.equal(v[1], true);
});

test('Vorbelegung bleibt null, wenn keine Werte vorliegen', () => {
  assert.deepEqual(fortschrittsVorschlag({}), [null, null, null, null]);
});

test('Auswertung wird aus den erfassten Werten vorbelegt', () => {
  const eintraege = {
    '2026-10-03': { ...leerEintrag('2026-10-03'), nach: { schmerz: 3 } },
    '2026-10-04': { ...leerEintrag('2026-10-04'), morgen: { ruhe: 1, treppe: 2 } }
  };
  const a = auswertungVorschlag(eintraege);
  assert.equal(a.ruhe, 1);
  assert.equal(a.treppe, 2);
  assert.equal(a.morgenDanach, 1);
});

test('Woche 2 ohne Freigabe zeigt die Umfänge von Woche 1', () => {
  const r = umfangFuerWoche2(false, tag('2026-09-28'));
  assert.equal(r.spruengeMin, 10);
  assert.equal(r.spruengeMax, 15);
  assert.match(r.hinweis, /Woche 1/);
});

test('Woche 2 mit Freigabe zeigt die Umfänge von Woche 2', () => {
  const r = umfangFuerWoche2(true, tag('2026-09-28'));
  assert.equal(r.spruengeMin, 15);
  assert.equal(r.spruengeMax, 25);
});
