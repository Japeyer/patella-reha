// Datensicherheit beim Update: ein Geraet mit dem heutigen Speicherstand muss
// nach dem Update alles unveraendert behalten. Der Zustand laeuft hier wie im
// Browser durch eine localStorage-Attrappe.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeSpeicher, SCHLUESSEL } from '../src/storage.js';
import { PLAN } from '../src/plan-data.js';
import { leererSprungZustand } from '../src/sprung-logik.js';

const attrappe = (start = {}) => {
  const daten = new Map(Object.entries(start));
  return {
    getItem: (k) => (daten.has(k) ? daten.get(k) : null),
    setItem: (k, v) => daten.set(k, String(v)),
    removeItem: (k) => daten.delete(k)
  };
};

// So sieht ein Geraet aus, das die Reha mitgeschrieben und eine Woche angefuegt hat.
const ALT = {
  version: 1,
  eintraege: {
    '2026-09-21': {
      datum: '2026-09-21',
      morgen: { ruhe: 2, treppe: 3 },
      vor: { ruhe: 2, treppe: 3, stepDownsMoeglich: true, hinken: false },
      waehrend: { max: 3, zunahmeProSatz: false },
      nach: { schmerz: 3 },
      spruenge: 12,
      landungVeraendert: false,
      schwellungInstabilitaetKraftverlust: false,
      uebungenAbgehakt: ['Spanish Squat'],
      notiz: 'gut'
    },
    '2026-10-04': { datum: '2026-10-04', morgen: { ruhe: 1, treppe: 1 } }
  },
  fortschritt: [true, true, true, false],
  auswertung: { ruhe: 1, treppe: 1 },
  wochenplan: { '2026-10-05': { belastungen: { '2026-10-05': 'volleyball' } } }
};

globalThis.localStorage = attrappe({ [SCHLUESSEL]: JSON.stringify(ALT) });
const state = await import('../src/state.js');
const sprungState = await import('../src/sprung-state.js');
const gespeichert = () => JSON.parse(globalThis.localStorage.getItem(SCHLUESSEL));

test('heutiger Bestand lädt unverändert', () => {
  const speicher = erzeugeSpeicher(attrappe({ [SCHLUESSEL]: JSON.stringify(ALT) }));
  assert.deepEqual(speicher.lies(), ALT);
  assert.deepEqual(state.zustand.speicher.lies(), ALT);
});

test('der heutige Bestand ist nach dem Laden im Reha-Teil sichtbar', () => {
  assert.equal(state.eintragFuer('2026-09-21').spruenge, 12);
  assert.ok(state.tage().some((t) => t.datum === '2026-10-05'), 'angefügte Woche bleibt');
});

test('Sprung-Änderungen lassen Reha-Daten im Speicher unverändert', () => {
  sprungState.verschiebeEinheit('w2-fr-kraft', '2026-11-21');
  sprungState.satzSetzen('w2-fr-kraft', 2, 3);
  state.setzeWert('2026-11-09', 'abend.schmerz', 3);
  const jetzt = gespeichert();
  assert.equal(jetzt.version, 1);
  for (const datum of Object.keys(ALT.eintraege)) assert.deepEqual(jetzt.eintraege[datum], ALT.eintraege[datum]);
  assert.deepEqual(jetzt.fortschritt, ALT.fortschritt);
  assert.deepEqual(jetzt.auswertung, ALT.auswertung);
  assert.deepEqual(jetzt.wochenplan, ALT.wochenplan);
  assert.deepEqual(jetzt.sprung.verschoben, { 'w2-fr-kraft': '2026-11-21' });
  assert.deepEqual(jetzt.sprung.saetze, { 'w2-fr-kraft': { 2: 3 } });
});

test('Sicherung mit sprung hin und zurück', () => {
  const text = state.zustand.speicher.alsText();
  const r = state.zustand.speicher.ausText(text);
  assert.ok(r.ok);
  assert.deepEqual(r.zustand.sprung, gespeichert().sprung);
  assert.deepEqual(r.zustand.eintraege, gespeichert().eintraege);
});

test('lesbarer Teil der Sicherung zeigt Abend und zunehmende Beschwerden', () => {
  state.setzeWert('2026-11-10', 'beschwerdenZunehmend', true);
  sprungState.sprungtestSetzen('approach', 312);
  const text = state.zustand.speicher.alsText();
  assert.match(text, /2026-11-09: .*Abend 3\/10/);
  assert.match(text, /2026-11-10: .*Beschwerden nehmen zu/);
  assert.match(text, /Sprungtest: Approach Jump 312 cm/);
});

test('alte Sicherung ohne sprung ergibt leeren Sprung-Zustand', () => {
  state.zustand.speicher.schreib(structuredClone(ALT));
  assert.deepEqual(state.sprungZustand(), leererSprungZustand());
  assert.equal(state.tage().find((t) => t.datum === '2026-11-20').typ, 'kraft');
});

test('tage() hängt die Sprung-Tage an die Reha-Tage', () => {
  state.zustand.speicher.schreib({ version: 1, eintraege: {}, fortschritt: [null, null, null, null], auswertung: null });
  const t = state.tage();
  assert.equal(t.length, PLAN.tage.length + 58);
  assert.deepEqual(state.rehaTage().map((x) => x.datum), PLAN.tage.map((x) => x.datum));
  assert.equal(t[PLAN.tage.length].datum, '2026-11-07');
});

test('Reha-Wochen gehen bis vor den Sprung-Block', () => {
  state.zustand.speicher.schreib({ ...structuredClone(ALT), wochenplan: { '2026-11-02': { belastungen: {} } } });
  assert.ok(state.rehaTage().every((t) => t.datum < '2026-11-07'));
  const wochen = state.wochen();
  assert.ok(wochen.every((w) => w.tage.length > 0));
  assert.equal(wochen.filter((w) => w.block === 'sprung').length, 9);
});

test('folgeMorgenFuer(4.10.) findet keinen Sprung-Tag', () => {
  state.zustand.speicher.schreib({ version: 1, eintraege: {}, fortschritt: [null, null, null, null], auswertung: null });
  state.setzeWert('2026-11-07', 'morgen.ruhe', 5);
  assert.equal(state.folgeMorgenFuer('2026-10-04'), null);
});

test('am 8.11.2026 ist der Sprung-Tag der heutige Plantag', () => {
  assert.equal(state.heutigerPlantag(new Date(2026, 10, 8, 9)).datum, '2026-11-08');
  assert.equal(state.heutigerPlantag(new Date(2026, 9, 20, 9)).datum, '2026-10-04');
});
