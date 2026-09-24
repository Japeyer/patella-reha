import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planeWoche, standardBelastungen, ROLLE } from '../src/schedule.js';
import { wochenTage, datumPlus, montagDerWoche, wochentagVon, tageDazwischen } from '../src/datum.js';

const MONTAG = '2026-09-21';
const rollen = (ergebnis) => ergebnis.tage.map((t) => t.rolle);

// --- Datumshelfer ---

test('Wochentage werden korrekt gerechnet', () => {
  assert.equal(wochentagVon('2026-09-21'), 'Montag');
  assert.equal(wochentagVon('2026-09-18'), 'Freitag');
  assert.equal(wochentagVon('2026-10-04'), 'Sonntag');
});

test('Montag der Woche und Wochentage', () => {
  assert.equal(montagDerWoche('2026-09-24'), '2026-09-21');
  assert.equal(montagDerWoche('2026-09-21'), '2026-09-21');
  assert.equal(montagDerWoche('2026-09-20'), '2026-09-14');
  assert.deepEqual(wochenTage('2026-09-21'), [
    '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24',
    '2026-09-25', '2026-09-26', '2026-09-27'
  ]);
});

test('Datumsrechnung über den Monatswechsel', () => {
  assert.equal(datumPlus('2026-09-30', 1), '2026-10-01');
  assert.equal(datumPlus('2026-10-01', -1), '2026-09-30');
});

// --- Der Standardfall muss die Struktur des Dokuments ergeben ---

test('Montag und Mittwoch Volleyball ergibt genau die Woche des Plans', () => {
  const r = planeWoche(MONTAG, standardBelastungen(MONTAG), ROLLE.kontrolle);
  assert.deepEqual(rollen(r), [
    ROLLE.volleyball,    // Montag
    ROLLE.regeneration,  // Dienstag
    ROLLE.volleyball,    // Mittwoch
    ROLLE.kraft,         // Donnerstag
    ROLLE.regeneration,  // Freitag
    ROLLE.kraft,         // Samstag
    ROLLE.kontrolle      // Sonntag
  ]);
  assert.deepEqual(r.gelockert, [], 'keine Regel gelockert');
  assert.deepEqual(r.hinweise, []);
});

// --- Verschieben ---

test('Volleyball auf Dienstag und Donnerstag: eine Regel muss weichen', () => {
  // Frei bleiben Mo, Mi, Fr, Sa, So. So ist Kontrolltag, Mo und Mi liegen je vor
  // einem Volleyballtag - fuer zwei Krafttage mit Abstand bleibt kein Platz.
  const tage = wochenTage(MONTAG);
  const r = planeWoche(MONTAG, {
    [tage[1]]: ROLLE.volleyball,
    [tage[3]]: ROLLE.volleyball
  }, ROLLE.kontrolle);
  const rs = rollen(r);
  assert.equal(rs[1], ROLLE.volleyball);
  assert.equal(rs[3], ROLLE.volleyball);
  assert.equal(rs[6], ROLLE.kontrolle);
  assert.equal(rs.filter((x) => x === ROLLE.kraft).length, 2,
    'beide Krafttage bleiben erhalten - Kraft ist die Behandlung');
  assert.deepEqual(r.gelockert, ['H1'], 'dafür weicht die Regel vor dem Volleyballtag');
  assert.ok(r.hinweise.length === 1 && /Volleyballtag/.test(r.hinweise[0]),
    'die Lockerung wird benannt');
});

test('lieber einen Krafttag ungünstig legen als ihn zu streichen', () => {
  const tage = wochenTage(MONTAG);
  const r = planeWoche(MONTAG, {
    [tage[1]]: ROLLE.volleyball,
    [tage[3]]: ROLLE.volleyball
  }, ROLLE.kontrolle);
  const kraft = r.tage.filter((t) => t.rolle === ROLLE.kraft);
  assert.equal(kraft.length, 2);
  // Und die beiden liegen trotzdem mit Abstand, nicht nebeneinander.
  assert.ok(tageDazwischen(kraft[0].datum, kraft[1].datum) >= 2);
});

test('ein Match am Samstag wird wie ein Volleyballtag eingeplant', () => {
  const tage = wochenTage(MONTAG);
  const r = planeWoche(MONTAG, {
    [tage[0]]: ROLLE.volleyball,
    [tage[5]]: ROLLE.match
  }, ROLLE.kontrolle);
  const rs = rollen(r);
  assert.equal(rs[5], ROLLE.match);
  assert.ok(rs[4] !== ROLLE.kraft, 'Freitag vor dem Match bleibt frei');
  assert.deepEqual(r.gelockert, []);
});

test('nur ein Volleyballtag: die Woche bleibt regelkonform', () => {
  const tage = wochenTage(MONTAG);
  const r = planeWoche(MONTAG, { [tage[2]]: ROLLE.volleyball }, ROLLE.kontrolle);
  assert.deepEqual(r.gelockert, []);
  assert.equal(rollen(r).filter((x) => x === ROLLE.kraft).length, 2);
});

test('drei Volleyballtage lassen nur noch einen Krafttag zu, und das wird gesagt', () => {
  // Mo, Mi, Fr Volleyball: Di und Do liegen je vor einem Volleyballtag, So ist
  // Kontrolltag. Fuer Kraft bleibt nur der Samstag.
  const tage = wochenTage(MONTAG);
  const r = planeWoche(MONTAG, {
    [tage[0]]: ROLLE.volleyball,
    [tage[2]]: ROLLE.volleyball,
    [tage[4]]: ROLLE.volleyball
  }, ROLLE.kontrolle);
  const rs = rollen(r);
  assert.equal(rs.filter((x) => x === ROLLE.kraft).length, 1);
  assert.equal(rs[5], ROLLE.kraft, 'der Samstag');
  assert.deepEqual(r.gelockert, ['H2']);
  assert.ok(r.hinweise.some((h) => /nur einer/.test(h)),
    'sagt, dass nur ein Krafttag bleibt');
  // Die Volleyballtage bleiben trotzdem geschützt.
  assert.ok(rs[1] !== ROLLE.kraft && rs[3] !== ROLLE.kraft);
});

// --- Grenzfaelle: es wird gelockert, nicht geraten ---

test('Volleyball an drei aufeinanderfolgenden Tagen meldet die gelockerte Regel', () => {
  const tage = wochenTage(MONTAG);
  const r = planeWoche(MONTAG, {
    [tage[0]]: ROLLE.volleyball,
    [tage[1]]: ROLLE.volleyball,
    [tage[2]]: ROLLE.volleyball
  }, ROLLE.kontrolle);
  assert.ok(r.gelockert.includes('H1') || r.gelockert.includes('H3'),
    'H1 oder H3 muss gelockert sein');
  assert.ok(r.hinweise.length > 0, 'die Lockerung wird benannt');
  assert.ok(r.hinweise.every((h) => /Gelockert|Krafttage/.test(h)));
});

test('sechs Volleyballtage: kein Platz für zwei Krafttage, wird gemeldet', () => {
  const tage = wochenTage(MONTAG);
  const belastungen = {};
  for (let i = 0; i < 6; i += 1) belastungen[tage[i]] = ROLLE.volleyball;
  const r = planeWoche(MONTAG, belastungen, ROLLE.kontrolle);
  assert.ok(r.gelockert.includes('H2'));
  assert.ok(r.hinweise.some((h) => /Krafttage/.test(h)));
});

test('eine volle Woche Volleyball wird gemeldet statt still verplant', () => {
  const tage = wochenTage(MONTAG);
  const belastungen = {};
  for (const d of tage) belastungen[d] = ROLLE.volleyball;
  const r = planeWoche(MONTAG, belastungen, ROLLE.kontrolle);
  assert.ok(r.hinweise.length > 0);
  assert.ok(r.hinweise[0].includes('kein Tag'));
});

test('ohne Volleyball bleiben zwei Krafttage und ein Kontrolltag', () => {
  const r = planeWoche(MONTAG, {}, ROLLE.kontrolle);
  const rs = rollen(r);
  assert.equal(rs.filter((x) => x === ROLLE.kraft).length, 2);
  assert.equal(rs[6], ROLLE.kontrolle);
  assert.deepEqual(r.gelockert, []);
});

// --- Uebergang zwischen den Wochen ---

test('ein Krafttag am Ende der Vorwoche verschiebt den Montagsplan nicht, meldet aber', () => {
  const r = planeWoche(MONTAG, standardBelastungen(MONTAG), ROLLE.kraft);
  // Montag ist Volleyball, davor lag Kraft: H1 ist verletzt und wird benannt.
  assert.ok(r.gelockert.includes('H1'));
  assert.ok(r.hinweise.some((h) => /Volleyballtag/.test(h)));
});

test('die Rolle der Vorwoche wird berücksichtigt, wenn sie frei war', () => {
  const r = planeWoche(MONTAG, standardBelastungen(MONTAG), ROLLE.regeneration);
  assert.deepEqual(r.gelockert, []);
});

// --- Eigenschaften, die immer gelten muessen ---

test('jede Woche hat sieben Tage in aufsteigender Reihenfolge', () => {
  const faelle = [
    {},
    standardBelastungen(MONTAG),
    { [wochenTage(MONTAG)[5]]: ROLLE.match },
    { [wochenTage(MONTAG)[0]]: ROLLE.volleyball, [wochenTage(MONTAG)[1]]: ROLLE.volleyball }
  ];
  for (const belastungen of faelle) {
    const r = planeWoche(MONTAG, belastungen, null);
    assert.equal(r.tage.length, 7);
    const daten = r.tage.map((t) => t.datum);
    assert.deepEqual(daten, [...daten].sort());
    for (const tag of r.tage) assert.ok(tag.rolle, `${tag.datum} hat eine Rolle`);
  }
});

test('gesetzte Volleyballtage bleiben immer erhalten', () => {
  const tage = wochenTage(MONTAG);
  const belastungen = { [tage[1]]: ROLLE.volleyball, [tage[5]]: ROLLE.match };
  const r = planeWoche(MONTAG, belastungen, null);
  assert.equal(r.tage[1].rolle, ROLLE.volleyball);
  assert.equal(r.tage[5].rolle, ROLLE.match);
});
