import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAN } from '../src/plan-data.js';
import { leerEintrag, zoneFuerTag, reduzierteBelastung } from '../src/logic.js';

const eintrag = (teil) => ({ ...leerEintrag('2026-09-21'), ...teil });

test('leerer Eintrag ergibt offene Zone', () => {
  const r = zoneFuerTag(leerEintrag('2026-09-21'), null);
  assert.equal(r.zone, 'offen');
});

test('grün: Schmerz 2, kein Hinken, Folgemorgen gleich oder besser', () => {
  const r = zoneFuerTag(eintrag({
    morgen: { ruhe: 2, treppe: 2 },
    vor: { ruhe: 2, treppe: 2, stepDownsMoeglich: true, hinken: false },
    waehrend: { max: 2, zunahmeProSatz: false },
    nach: { schmerz: 2 }
  }), { ruhe: 2, treppe: 2 });
  assert.equal(r.zone, 'gruen');
  assert.equal(r.vorlaeufig, false);
  assert.equal(r.konsequenz, PLAN.zonen.gruen.konsequenz);
});

test('grün endet bei 2: Schmerz 3 ist gelb', () => {
  const r = zoneFuerTag(eintrag({
    waehrend: { max: 3, zunahmeProSatz: true },
    nach: { schmerz: 3 }
  }), { ruhe: 3 });
  assert.equal(r.zone, 'gelb');
  assert.equal(r.konsequenz, PLAN.zonen.gelb.konsequenz);
});

test('rot ab Schmerz 4 während der Belastung', () => {
  const r = zoneFuerTag(eintrag({ waehrend: { max: 4, zunahmeProSatz: false } }), { ruhe: 2 });
  assert.equal(r.zone, 'rot');
  assert.equal(r.konsequenz, PLAN.zonen.rot.konsequenz);
});

test('rot bei Hinken trotz niedrigem Schmerz', () => {
  const r = zoneFuerTag(eintrag({
    vor: { ruhe: 1, treppe: 1, stepDownsMoeglich: true, hinken: true },
    waehrend: { max: 1, zunahmeProSatz: false }
  }), { ruhe: 1 });
  assert.equal(r.zone, 'rot');
  assert.ok(r.gruende.some((g) => /Hinken/.test(g)));
});

test('rot bei veränderter Landung trotz niedrigem Schmerz', () => {
  const r = zoneFuerTag(eintrag({
    waehrend: { max: 2, zunahmeProSatz: false },
    landungVeraendert: true
  }), { ruhe: 2 });
  assert.equal(r.zone, 'rot');
  assert.ok(r.gruende.some((g) => /Landung/.test(g)));
});

test('rot bei deutlich schlechterem Folgemorgen', () => {
  const r = zoneFuerTag(eintrag({
    morgen: { ruhe: 2, treppe: 2 },
    waehrend: { max: 2, zunahmeProSatz: false }
  }), { ruhe: 5 });
  assert.equal(r.zone, 'rot');
  assert.ok(r.gruende.some((g) => /Morgen/.test(g)));
});

test('gelb bei leicht schlechterem Folgemorgen', () => {
  const r = zoneFuerTag(eintrag({
    morgen: { ruhe: 2, treppe: 2 },
    waehrend: { max: 2, zunahmeProSatz: false }
  }), { ruhe: 3 });
  assert.equal(r.zone, 'gelb');
});

test('fehlender Folgemorgen ergibt eine vorläufige Zone', () => {
  const r = zoneFuerTag(eintrag({ waehrend: { max: 2, zunahmeProSatz: false } }), null);
  assert.equal(r.zone, 'gruen');
  assert.equal(r.vorlaeufig, true);
});

test('Zunahme von Satz zu Satz allein ist gelb, nicht rot', () => {
  const r = zoneFuerTag(eintrag({ waehrend: { max: 2, zunahmeProSatz: true } }), { ruhe: 2 });
  assert.equal(r.zone, 'gelb');
});

test('Gründe sind immer gefüllt und nennen die auslösende Bedingung', () => {
  const r = zoneFuerTag(eintrag({ waehrend: { max: 6, zunahmeProSatz: true } }), { ruhe: 2 });
  assert.ok(r.gruende.length > 0);
  assert.ok(r.gruende.some((g) => /4 von 10/.test(g)));
});

test('Reduktion um 20 bis 30 Prozent auf Sprünge des Tages', () => {
  const montagW1 = PLAN.tage.find((t) => t.datum === '2026-09-21');
  const r = reduzierteBelastung(montagW1, [20, 30]);
  // 10 minus 30 % = 7, 15 minus 20 % = 12
  assert.deepEqual(r.spruenge, [7, 12]);
  assert.deepEqual(r.prozent, [20, 30]);
});

test('Reduktion auf Satzzahlen der Kraftübungen', () => {
  const kraftA = PLAN.tage.find((t) => t.datum === '2026-09-24');
  const r = reduzierteBelastung(kraftA, [20, 30]);
  assert.ok(r.saetze.length > 0);
  const beinpresse = r.saetze.find((s) => /Beinpresse/.test(s.name));
  assert.equal(beinpresse.original, 3);
  assert.equal(beinpresse.reduziert, 2);
});

test('Regenerationstag hat keine reduzierbaren Sprünge', () => {
  const ruhetag = PLAN.tage.find((t) => t.datum === '2026-09-22');
  const r = reduzierteBelastung(ruhetag, [20, 30]);
  assert.equal(r.spruenge, null);
});
