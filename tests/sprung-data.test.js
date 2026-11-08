import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPRUNG } from '../src/sprung-data.js';
import { wochentagVon, montagDerWoche } from '../src/datum.js';

const alleEinheiten = SPRUNG.wochen.flatMap((w) => w.einheiten.map((e) => ({ ...e, woche: w.nummer })));
const finde = (id) => alleEinheiten.find((e) => e.id === id);

const GRUNDFORM_HINWEISE = [
  'Maximale Qualität, 2–3 min Pause.',
  '3–5 Minuten Pause.',
  'Kein Grind.',
  'Konzentrisch maximale Beschleunigungsabsicht.',
  'Zunächst 15–20 cm.'
];

test('jedes Einheitsdatum liegt im Block', () => {
  for (const e of alleEinheiten) {
    assert.ok(e.datum >= SPRUNG.von && e.datum <= SPRUNG.bis, `${e.id} ${e.datum}`);
  }
});

test('die Einheiten einer Woche liegen in derselben Kalenderwoche', () => {
  for (const w of SPRUNG.wochen) {
    const montage = new Set(w.einheiten.map((e) => montagDerWoche(e.datum)));
    assert.equal(montage.size, 1, `Woche ${w.nummer}`);
  }
});

test('die ID nennt den Wochentag des Datums', () => {
  const kurz = { Montag: 'mo', Dienstag: 'di', Mittwoch: 'mi', Donnerstag: 'do', Freitag: 'fr', Samstag: 'sa', Sonntag: 'so' };
  for (const e of alleEinheiten) {
    assert.equal(e.id.split('-')[1], kurz[wochentagVon(e.datum)], e.id);
  }
});

test('IDs sind eindeutig', () => {
  const ids = alleEinheiten.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('die sechs Spiele stehen als Spiel-Einheit am richtigen Tag mit Zeit', () => {
  const spiele = alleEinheiten.filter((e) => e.art === 'spiel').map((e) => `${e.datum} ${e.zeit}`);
  assert.deepEqual(spiele, ['2026-11-07 16:00', '2026-11-11 20:00', '2026-11-25 20:00',
    '2026-11-30 20:00', '2026-12-07 19:30', '2026-12-12 18:30']);
  assert.deepEqual(SPRUNG.spiele.map((s) => `${s.datum} ${s.zeit}`), spiele);
});

test('Mo 9.11. ist Volleyball ohne Krafttraining davor', () => {
  const e = finde('w1-mo-vb');
  assert.equal(e.datum, '2026-11-09');
  assert.equal(e.art, 'volleyball');
  assert.ok(e.texte.includes('Kein Bein-Krafttraining davor.'));
  assert.equal(alleEinheiten.filter((x) => x.datum === '2026-11-09' && x.art === 'kraft').length, 0);
});

test('Fr 13.11. ist die moderate Einstiegseinheit', () => {
  const e = finde('w1-fr-kraft');
  assert.equal(e.datum, '2026-11-13');
  assert.deepEqual(e.uebungen.map((u) => `${u.name} ${u.angabe}`),
    ['Approach Jump 3×2', 'Belt Squat 3×5 @ 3 RIR', 'RDL 2×5 @ 3 RIR', 'Calf Raise 2×8']);
  assert.ok(e.texte.includes('Keine Drop Jumps.') && e.texte.includes('Keine Nordics.'));
});

test('Mo 16.11. ist Beintag A vor dem Volleyball', () => {
  const kraft = finde('w2-mo-kraft');
  assert.deepEqual(kraft.uebungen.map((u) => `${u.name} ${u.angabe}`),
    ['CMJ 3×2', 'Deadlift 3×3 @ 3 RIR', 'Bulgarian Split Squat 2×5 @ 3 RIR', 'Calf Raise 2×8']);
  assert.equal(finde('w2-mo-vb').datum, '2026-11-16');
});

test('Fr 18.12. hat die volle Einheit von Woche 6', () => {
  const e = finde('w6-fr-kraft');
  assert.equal(e.datum, '2026-12-18');
  assert.deepEqual(e.uebungen.map((u) => `${u.name} ${u.angabe}`),
    ['Drop Jump 3×2', 'Approach Jump 4×2 maximal', 'Belt Squat 4×4 @ 2 RIR', 'RDL 3×5', 'Nordic 2×4', 'Calf Raise 2×6']);
});

test('Fr 11.12. ist kein Beintag', () => {
  assert.equal(alleEinheiten.filter((e) => e.datum === '2026-12-11' && e.art === 'kraft').length, 0);
  assert.ok(alleEinheiten.some((e) => e.datum === '2026-12-11' && e.texte.includes('Kein Beintraining.')));
});

test('Sprungtest am Fr 1.1.2027 mit Ablauf', () => {
  const e = finde('w8-fr-sprungtest');
  assert.equal(e.datum, '2027-01-01');
  assert.equal(e.art, 'sprungtest');
  assert.ok(e.ablauf.length >= 3);
  assert.ok(e.schluss.includes('Bestwert notieren.'));
});

test('Volleyball Mi in Woche 7 und 8 trägt den Weihnachts-Vorbehalt', () => {
  for (const id of ['w7-mi-vb', 'w8-mi-vb']) {
    assert.equal(finde(id).vorbehalt, SPRUNG.uebersicht.fussnote, id);
  }
});

test('jede Krafteinheit hat Übungen mit Angabe', () => {
  for (const e of alleEinheiten.filter((x) => x.art === 'kraft')) {
    assert.ok(e.uebungen.length > 0, e.id);
    for (const u of e.uebungen) assert.ok(u.name && u.angabe, `${e.id} ${u.name}`);
  }
});

test('Grundform-Hinweise nur Pausen und Ausführung, nie RIR', () => {
  for (const e of alleEinheiten) {
    for (const u of e.uebungen ?? []) {
      for (const h of u.ausGrundform ?? []) {
        assert.ok(GRUNDFORM_HINWEISE.includes(h.text), `${e.id} ${u.name}: ${h.text}`);
        assert.ok(h.aus === 'A' || h.aus === 'B');
      }
    }
  }
});

test('Drop-Jump-Höhe aus der Grundform nur, wo die Woche keine nennt', () => {
  for (const e of alleEinheiten) {
    for (const u of (e.uebungen ?? []).filter((x) => x.name === 'Drop Jump')) {
      const eigeneHoehe = /cm/.test(u.angabe);
      const uebernommen = (u.ausGrundform ?? []).some((h) => h.text === 'Zunächst 15–20 cm.');
      assert.equal(uebernommen, !eigeneHoehe, e.id);
    }
  }
});

test('Grundformen A und B mit allen Übungen', () => {
  assert.deepEqual(SPRUNG.grundformen.A.uebungen.map((u) => u.name),
    ['CMJ', 'Conventional Deadlift', 'Bulgarian Split Squat', 'Calf Raise']);
  assert.deepEqual(SPRUNG.grundformen.B.uebungen.map((u) => u.name),
    ['Volleyball Approach Jump', 'Drop Jump', 'Belt Squat', 'Romanian Deadlift', 'Nordic', 'Calf Raise']);
});

test('Übersichtstabelle mit acht Wochen', () => {
  assert.equal(SPRUNG.uebersicht.zeilen.length, 8);
  assert.ok(SPRUNG.uebersicht.zeilen.every((z) => z.length === SPRUNG.uebersicht.kopf.length));
});

test('kein ß in den Daten', () => {
  assert.ok(!JSON.stringify(SPRUNG).includes('ß'));
});
