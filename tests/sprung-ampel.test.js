import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPRUNG } from '../src/sprung-data.js';
import {
  leererSprungZustand, effektiveEinheiten, sprungTage, verschiebe, fuegeEin,
  normalwert, sprungZone, heuteGilt, regelHinweise, hinweiseNachAenderung, leitsaetze
} from '../src/sprung-logik.js';

const K = SPRUNG.kontrollsystem;
const morgen = (ruhe, treppe = null, extra = {}) => ({ morgen: { ruhe, treppe }, ...extra });
const leer = leererSprungZustand();

test('4/10 am Morgen ist rot mit «Keine harte Plyometrie.»', () => {
  const z = sprungZone(morgen(1, 4), null);
  assert.equal(z.zone, 'rot');
  assert.equal(z.wert, 4);
  assert.deepEqual(z.konsequenz, K.rot.konsequenz);
  assert.equal(z.konsequenz[0], 'Keine harte Plyometrie.');
});

test('2 und 3 sind gelb mit «Keine Progression.»', () => {
  assert.equal(sprungZone(morgen(2), null).zone, 'gelb');
  assert.equal(sprungZone(morgen(0, 3), null).zone, 'gelb');
  assert.deepEqual(sprungZone(morgen(3), null).konsequenz, K.gelb.konsequenz);
});

test('1/10 bei Normalwert 0 ist gelb', () => {
  assert.equal(sprungZone(morgen(1), 0).zone, 'gelb');
});

test('1/10 bei Normalwert 0,5 bleibt grün', () => {
  assert.equal(sprungZone(morgen(1), 0.5).zone, 'gruen');
});

test('1/10 ohne Normalwert ist grün', () => {
  const z = sprungZone(morgen(1), null);
  assert.equal(z.zone, 'gruen');
  assert.deepEqual(z.konsequenz, K.gruen.konsequenz);
});

test('Beschwerden nehmen zu ist rot, auch bei 0 und ohne Wert', () => {
  assert.equal(sprungZone(morgen(0, 0, { beschwerdenZunehmend: true }), null).zone, 'rot');
  assert.equal(sprungZone({ beschwerdenZunehmend: true }, null).zone, 'rot');
});

test('ohne Morgenwert ist die Zone offen', () => {
  assert.equal(sprungZone(undefined, null).zone, 'offen');
  assert.equal(sprungZone(morgen(null), 0).zone, 'offen');
});

test('Normalwert braucht 3 Morgen und nimmt den höheren aus Ruhe und Treppe', () => {
  const zwei = { '2026-11-10': morgen(0, 1), '2026-11-11': morgen(0) };
  assert.equal(normalwert(zwei, '2026-11-12'), null);
  const drei = { ...zwei, '2026-11-09': morgen(0, 2) };
  assert.equal(normalwert(drei, '2026-11-12'), 1);
});

test('Normalwert: Median, höchstens 14 Morgen, nur die 28 Tage davor, nicht der Tag selbst', () => {
  const e = {
    '2026-10-01': morgen(9), // ausserhalb der 28 Tage
    '2026-11-09': morgen(0),
    '2026-11-10': morgen(1),
    '2026-11-11': morgen(1),
    '2026-11-12': morgen(0),
    '2026-11-13': morgen(8) // der Tag selbst zaehlt nicht
  };
  assert.equal(normalwert(e, '2026-11-13'), 0.5);
});

test('heuteGilt nimmt den heutigen Morgen', () => {
  const r = heuteGilt({ datum: '2026-11-12', eintraege: { '2026-11-12': morgen(4) }, tage: sprungTage(leer) });
  assert.equal(r.stufe, 'zone');
  assert.equal(r.zone, 'rot');
  assert.equal(r.quelleDatum, '2026-11-12');
});

test('heuteGilt fordert den Morgen nach einem Spiel an', () => {
  const r = heuteGilt({ datum: '2026-11-12', eintraege: { '2026-11-10': morgen(1) }, tage: sprungTage(leer) });
  assert.equal(r.stufe, 'morgen-fehlt');
});

test('heuteGilt nimmt sonst den letzten erfassten Morgen im Block', () => {
  const r = heuteGilt({ datum: '2026-11-15', eintraege: { '2026-11-13': morgen(2) }, tage: sprungTage(leer) });
  assert.equal(r.stufe, 'zone');
  assert.equal(r.zone, 'gelb');
  assert.equal(r.quelleDatum, '2026-11-13');
});

test('heuteGilt ohne Werte ist offen, Reha-Werte zählen nicht', () => {
  const r = heuteGilt({ datum: '2026-11-15', eintraege: { '2026-10-04': morgen(5) }, tage: sprungTage(leer) });
  assert.equal(r.stufe, 'offen');
});

test('der unveränderte Plan löst keinen Hinweis aus', () => {
  const alle = effektiveEinheiten(leer);
  for (const tag of sprungTage(leer)) assert.deepEqual(regelHinweise(tag.datum, alle), [], tag.datum);
});

test('Kraft Fr 27.11. auf So 29.11. ergibt R1 mit dem Wortlaut des Plans', () => {
  const s = verschiebe(leer, 'w3-fr-kraft', '2026-11-29');
  const h = regelHinweise('2026-11-29', effektiveEinheiten(s));
  assert.deepEqual(h.map((x) => x.regel), ['R1']);
  assert.equal(h[0].text, 'Der Freitag ist ein schlechter Zeitpunkt für RDLs, schwere Belt Squats oder Nordics.');
  assert.equal(h[0].einheitId, 'w3-fr-kraft');
});

test('Kraft zwei Tage vor einem Spiel ergibt R2', () => {
  const s = verschiebe(leer, 'w3-fr-kraft', '2026-11-28');
  assert.deepEqual(regelHinweise('2026-11-28', effektiveEinheiten(s)).map((x) => x.regel), ['R2']);
});

test('Kraft am Spieltag ergibt R3', () => {
  const s = verschiebe(leer, 'w3-fr-kraft', '2026-11-30');
  const h = regelHinweise('2026-11-30', effektiveEinheiten(s));
  assert.ok(h.some((x) => x.regel === 'R3' && x.text === 'Kein Gym davor.'));
});

test('Beintag B am Montag mit Volleyball ergibt R4 und R5', () => {
  const s = verschiebe(leer, 'w2-fr-kraft', '2026-11-16');
  const regeln = regelHinweise('2026-11-16', effektiveEinheiten(s)).filter((x) => x.einheitId === 'w2-fr-kraft').map((x) => x.regel);
  assert.deepEqual(regeln, ['R4', 'R5']);
});

test('eingefügtes Spiel macht die Krafteinheit am Vortag zu R1', () => {
  const { zustand } = fuegeEin(leer, { datum: '2026-11-21', art: 'spiel', zeit: '15:00' });
  const h = regelHinweise('2026-11-20', effektiveEinheiten(zustand));
  assert.deepEqual(h.map((x) => [x.regel, x.einheitId]), [['R1', 'w2-fr-kraft']]);
});

test('ausgefallene Einheiten lösen keine Hinweise aus', () => {
  const s = { ...verschiebe(leer, 'w3-fr-kraft', '2026-11-29'), ausgefallen: ['w3-fr-kraft'] };
  assert.deepEqual(regelHinweise('2026-11-29', effektiveEinheiten(s)), []);
});

test('hinweiseNachAenderung meldet nur neue Hinweise mit Datum', () => {
  const neu = verschiebe(leer, 'w3-fr-kraft', '2026-11-29');
  const h = hinweiseNachAenderung(leer, neu);
  assert.deepEqual(h.map((x) => [x.regel, x.datum]), [['R1', '2026-11-29']]);
  assert.deepEqual(hinweiseNachAenderung(neu, neu), []);
});

test('Leitsätze sind die Verbote der aktiven Einheiten', () => {
  const tag = sprungTage(leer).find((t) => t.datum === '2026-11-13');
  assert.deepEqual(leitsaetze(tag.einheiten), ['Keine Drop Jumps.', 'Keine Nordics.']);
  const mo = sprungTage(leer).find((t) => t.datum === '2026-11-09');
  assert.deepEqual(leitsaetze(mo.einheiten), ['Kein Bein-Krafttraining davor.']);
});

test('heuteGilt verträgt die gemischte Tagesliste aus Reha- und Sprung-Tagen', () => {
  const rehaTag = { datum: '2026-11-06', woche: 7, typ: 'regeneration', bloecke: [] };
  const r = heuteGilt({ datum: '2026-11-07', eintraege: {}, tage: [rehaTag, ...sprungTage(leer)] });
  assert.equal(r.stufe, 'offen');
});
