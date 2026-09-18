import { test } from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeSpeicher, SCHLUESSEL } from '../src/storage.js';

const attrappe = () => {
  const daten = new Map();
  return {
    getItem: (k) => (daten.has(k) ? daten.get(k) : null),
    setItem: (k, v) => daten.set(k, String(v)),
    removeItem: (k) => daten.delete(k)
  };
};

const blockiert = () => ({
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('SecurityError'); },
  removeItem() { throw new Error('SecurityError'); }
});

test('leerer Speicher liefert einen gültigen Anfangszustand', () => {
  const s = erzeugeSpeicher(attrappe());
  const z = s.lies();
  assert.equal(z.version, 1);
  assert.deepEqual(z.eintraege, {});
  assert.deepEqual(z.fortschritt, [null, null, null, null]);
});

test('Eintrag schreiben und wieder lesen', () => {
  const backend = attrappe();
  const s = erzeugeSpeicher(backend);
  s.setzeEintrag('2026-09-21', { morgen: { ruhe: 3, treppe: 4 } });
  const wieder = erzeugeSpeicher(backend).lies();
  assert.equal(wieder.eintraege['2026-09-21'].morgen.ruhe, 3);
  assert.equal(wieder.eintraege['2026-09-21'].morgen.treppe, 4);
  assert.equal(wieder.eintraege['2026-09-21'].spruenge, 0, 'übrige Felder bleiben gesetzt');
});

test('Teilaktualisierung überschreibt keine anderen Messpunkte', () => {
  const s = erzeugeSpeicher(attrappe());
  s.setzeEintrag('2026-09-21', { morgen: { ruhe: 2, treppe: 2 } });
  s.setzeEintrag('2026-09-21', { nach: { schmerz: 5 } });
  const e = s.lies().eintraege['2026-09-21'];
  assert.equal(e.morgen.ruhe, 2);
  assert.equal(e.nach.schmerz, 5);
});

test('Teilaktualisierung eines Messpunkts lässt dessen andere Felder stehen', () => {
  const s = erzeugeSpeicher(attrappe());
  s.setzeEintrag('2026-09-21', { vor: { ruhe: 2, treppe: 3 } });
  s.setzeEintrag('2026-09-21', { vor: { hinken: false } });
  const e = s.lies().eintraege['2026-09-21'];
  assert.equal(e.vor.ruhe, 2);
  assert.equal(e.vor.treppe, 3);
  assert.equal(e.vor.hinken, false);
});

test('Arrays werden ersetzt, nicht gemischt', () => {
  const s = erzeugeSpeicher(attrappe());
  s.setzeEintrag('2026-09-24', { uebungenAbgehakt: ['Split Squat', 'Wadenheben stehend'] });
  s.setzeEintrag('2026-09-24', { uebungenAbgehakt: ['Split Squat'] });
  assert.deepEqual(s.lies().eintraege['2026-09-24'].uebungenAbgehakt, ['Split Squat']);
});

test('blockierter Speicher: App bleibt bedienbar, verfuegbar ist falsch', () => {
  const s = erzeugeSpeicher(blockiert());
  assert.equal(s.verfuegbar, false);
  assert.doesNotThrow(() => s.setzeEintrag('2026-09-21', { morgen: { ruhe: 1 } }));
  assert.equal(s.lies().eintraege['2026-09-21'].morgen.ruhe, 1, 'im Arbeitsspeicher gehalten');
});

test('fehlender Speicher-Backend ist kein Fehler', () => {
  const s = erzeugeSpeicher(null);
  assert.equal(s.verfuegbar, false);
  assert.doesNotThrow(() => s.lies());
});

test('beschädigter Inhalt wird verworfen statt zu werfen', () => {
  const backend = attrappe();
  backend.setItem(SCHLUESSEL, '{kein json');
  const s = erzeugeSpeicher(backend);
  assert.deepEqual(s.lies().eintraege, {});
});

test('Sicherungstext enthält die Werte lesbar', () => {
  const s = erzeugeSpeicher(attrappe());
  s.setzeEintrag('2026-09-21', { morgen: { ruhe: 3, treppe: 4 }, notiz: 'Knie ruhig' });
  const text = s.alsText();
  assert.match(text, /2026-09-21/);
  assert.match(text, /Knie ruhig/);
  assert.match(text, /Patella/);
});

test('Sicherungstext lässt sich wieder einlesen', () => {
  const a = erzeugeSpeicher(attrappe());
  a.setzeEintrag('2026-09-21', { morgen: { ruhe: 3, treppe: 4 } });
  a.setzeEintrag('2026-09-23', { nach: { schmerz: 6 } });
  const text = a.alsText();

  const b = erzeugeSpeicher(attrappe());
  const r = b.ausText(text);
  assert.equal(r.ok, true);
  assert.equal(r.zustand.eintraege['2026-09-21'].morgen.ruhe, 3);
  assert.equal(r.zustand.eintraege['2026-09-23'].nach.schmerz, 6);
});

test('unbrauchbarer Wiederherstellungstext meldet einen Fehler und ändert nichts', () => {
  const s = erzeugeSpeicher(attrappe());
  s.setzeEintrag('2026-09-21', { morgen: { ruhe: 3 } });
  const r = s.ausText('irgendwas');
  assert.equal(r.ok, false);
  assert.ok(r.fehler);
  assert.equal(s.lies().eintraege['2026-09-21'].morgen.ruhe, 3, 'Bestand unberührt');
});

test('abgeschnittene Datenzeile meldet einen Fehler', () => {
  const s = erzeugeSpeicher(attrappe());
  s.setzeEintrag('2026-09-21', { morgen: { ruhe: 3 } });
  const text = s.alsText();
  const r = s.ausText(text.slice(0, text.length - 20));
  assert.equal(r.ok, false);
  assert.ok(r.fehler);
});

test('Fortschritt und Auswertung werden mitgespeichert', () => {
  const backend = attrappe();
  const s = erzeugeSpeicher(backend);
  const z = s.lies();
  s.schreib({ ...z, fortschritt: [true, true, false, null], auswertung: { ruhe: 2 } });
  const wieder = erzeugeSpeicher(backend).lies();
  assert.deepEqual(wieder.fortschritt, [true, true, false, null]);
  assert.deepEqual(wieder.auswertung, { ruhe: 2 });
});
