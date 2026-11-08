import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAN } from '../src/plan-data.js';
import { leerEintrag } from '../src/logic.js';
import { REIHEN, reihenDaten, svgVerlauf } from '../src/chart.js';

const eintraege = {
  '2026-09-21': {
    ...leerEintrag('2026-09-21'),
    morgen: { ruhe: 2, treppe: 2 },
    waehrend: { max: 3, zunahmeProSatz: false }
  },
  '2026-09-23': { ...leerEintrag('2026-09-23'), morgen: { ruhe: 4, treppe: 5 } }
};

test('vier Reihen in fester Reihenfolge, Morgen zuerst', () => {
  assert.deepEqual(REIHEN.map((r) => r.schluessel), ['morgen', 'vor', 'waehrend', 'nach']);
  assert.equal(REIHEN[0].name, 'Morgen');
});

test('die Morgenreihe zeigt den Ausgangsschmerz, nicht nur den Ruhewert', () => {
  const nurTreppe = { morgen: { ruhe: 1, treppe: 6 } };
  assert.equal(REIHEN[0].wert(nurTreppe), 6);
  assert.equal(REIHEN[0].wert(null), null);
});

test('Reihendaten haben einen Punkt pro Plantag', () => {
  const daten = reihenDaten(eintraege, PLAN.tage);
  assert.equal(daten.length, 4);
  for (const reihe of daten) assert.equal(reihe.punkte.length, PLAN.tage.length);
});

test('Tage ohne Eintrag sind null, nicht Nullwerte', () => {
  const daten = reihenDaten(eintraege, PLAN.tage);
  const morgen = daten.find((r) => r.schluessel === 'morgen');
  const bei = (datum) => morgen.punkte.find((p) => p.datum === datum).wert;
  assert.equal(bei('2026-09-18'), null, 'Vorlauftag ohne Eintrag');
  assert.equal(bei('2026-09-21'), 2);
  assert.equal(bei('2026-09-22'), null, '22. September ohne Eintrag');
  // 23. September: Ruhe 4, Treppe 5 - der höhere Wert zählt
  assert.equal(bei('2026-09-23'), 5);
});

test('SVG enthält Zonenbänder, Achse und eine Linie je Reihe mit Werten', () => {
  const svg = svgVerlauf(reihenDaten(eintraege, PLAN.tage), PLAN.tage, { breite: 360, hoehe: 240 });
  assert.match(svg, /^<svg /);
  assert.match(svg, /viewBox="0 0 360 240"/);
  assert.match(svg, /class="zone-gruen"/);
  assert.match(svg, /class="zone-gelb"/);
  assert.match(svg, /class="zone-rot"/);
  assert.match(svg, /class="reihe reihe-morgen"/);
  assert.ok(!/class="reihe reihe-vor"/.test(svg), 'Reihe ohne Werte wird nicht gezeichnet');
});

test('Lücken unterbrechen die Linie statt sie zu überbrücken', () => {
  const svg = svgVerlauf(reihenDaten(eintraege, PLAN.tage), PLAN.tage, { breite: 360, hoehe: 240 });
  const linie = svg.match(/class="reihe reihe-morgen" d="([^"]+)"/)[1];
  const bewegungen = linie.match(/M/g) ?? [];
  assert.equal(bewegungen.length, 2, 'zwei getrennte Abschnitte wegen der Lücke');
});

test('nurMorgen zeichnet ausschliesslich die Morgenreihe', () => {
  const daten = reihenDaten(eintraege, PLAN.tage);
  const svg = svgVerlauf(daten, PLAN.tage, { breite: 360, hoehe: 240, nurMorgen: true });
  assert.match(svg, /reihe-morgen/);
  assert.ok(!/reihe-waehrend/.test(svg));
});

test('Trainingstage sind auf der Zeitachse markiert', () => {
  const svg = svgVerlauf(reihenDaten(eintraege, PLAN.tage), PLAN.tage, { breite: 360, hoehe: 240 });
  const marken = svg.match(/class="tagmarke[^"]*"/g) ?? [];
  const erwartet = PLAN.tage.filter((tag) => tag.typ.startsWith('volleyball')
    || tag.typ === 'kraft-a' || tag.typ === 'kraft-b').length;
  assert.equal(marken.length, erwartet, 'jeder Volleyball- und Krafttag eine Marke');
  assert.equal(erwartet, 9, 'vier Volleyball- und fünf Krafttage');
});

test('Skala reicht immer von 0 bis 10 und markiert die Grenze 3', () => {
  const svg = svgVerlauf(reihenDaten({}, PLAN.tage), PLAN.tage, { breite: 360, hoehe: 240 });
  assert.match(svg, />0</);
  assert.match(svg, />3</);
  assert.match(svg, />10</);
});

test('die Zonen sind benannt, nicht nur gefärbt', () => {
  const svg = svgVerlauf(reihenDaten({}, PLAN.tage), PLAN.tage, { breite: 360, hoehe: 240 });
  assert.match(svg, />grün</);
  assert.match(svg, />gelb</);
  assert.match(svg, />rot</);
});

test('der letzte erfasste Punkt ist hervorgehoben', () => {
  const svg = svgVerlauf(reihenDaten(eintraege, PLAN.tage), PLAN.tage, { breite: 360, hoehe: 240 });
  const hervorgehoben = svg.match(/punkt-zuletzt/g) ?? [];
  assert.equal(hervorgehoben.length, 2, 'je Reihe mit Werten genau ein Endpunkt');
});

test('Punkte tragen das Datum für die Auswahl und einen Titel', () => {
  const svg = svgVerlauf(reihenDaten(eintraege, PLAN.tage), PLAN.tage, { breite: 360, hoehe: 240 });
  assert.match(svg, /data-datum="2026-09-21"/);
  assert.match(svg, /<title>Morgen am 2026-09-21: 2 von 10<\/title>/);
});

test('leere Daten ergeben ein gültiges SVG ohne Linien', () => {
  const svg = svgVerlauf(reihenDaten({}, PLAN.tage), PLAN.tage, { breite: 360, hoehe: 240 });
  assert.match(svg, /<\/svg>$/);
  assert.ok(!/class="reihe /.test(svg));
});

// --- Sprungkraft-Block ---

test('Sprung-Reihen: Morgen und Abend', async () => {
  const { REIHEN_SPRUNG } = await import('../src/chart.js');
  assert.deepEqual(REIHEN_SPRUNG.map((r) => r.schluessel), ['morgen', 'abend']);
  assert.equal(REIHEN_SPRUNG[0].wert({ morgen: { ruhe: 1, treppe: 3 } }), 3);
  assert.equal(REIHEN_SPRUNG[1].wert({ abend: { schmerz: 2 } }), 2);
  assert.equal(REIHEN_SPRUNG[1].wert({}), null);
});

test('Sprung-Bänder folgen dem Kontrollsystem: grün bis 1, gelb 2 bis 3, rot ab 4', async () => {
  const { BAENDER_SPRUNG } = await import('../src/chart.js');
  assert.deepEqual(BAENDER_SPRUNG.map((b) => [b.name, b.von, b.bis]),
    [['grün', 0, 1.5], ['gelb', 1.5, 3.5], ['rot', 3.5, 10]]);
});

test('Sprung-Diagramm markiert Spiele und beschriftet wöchentlich', async () => {
  const { REIHEN_SPRUNG, BAENDER_SPRUNG, sprungMarke } = await import('../src/chart.js');
  const { sprungTage, leererSprungZustand } = await import('../src/sprung-logik.js');
  const tage = sprungTage(leererSprungZustand());
  const svg = svgVerlauf(reihenDaten({}, tage, REIHEN_SPRUNG), tage,
    { breite: 360, hoehe: 200, baender: BAENDER_SPRUNG, marke: sprungMarke, skala: [0, 2, 10], beschriftungAlle: 7 });
  assert.equal((svg.match(/tagmarke-spiel/g) ?? []).length, 6);
  assert.match(svg, />2</);
  assert.ok(!/>3</.test(svg), 'Grenze 3 gehört zum Reha-Block');
  const beschriftungen = (svg.match(/class="achse" x="[^"]+" y="19[0-9]/g) ?? []).length;
  assert.ok(beschriftungen <= 10, `${beschriftungen} Datumsbeschriftungen`);
  assert.match(svg, /über 58 Tage/);
});

test('die letzte Datumsbeschriftung überlappt keine reguläre', async () => {
  const { REIHEN_SPRUNG, BAENDER_SPRUNG, sprungMarke } = await import('../src/chart.js');
  const { sprungTage, leererSprungZustand } = await import('../src/sprung-logik.js');
  const tage = sprungTage(leererSprungZustand());
  const svg = svgVerlauf(reihenDaten({}, tage, REIHEN_SPRUNG), tage,
    { breite: 360, hoehe: 200, baender: BAENDER_SPRUNG, marke: sprungMarke, skala: [0, 2, 10], beschriftungAlle: 7 });
  assert.match(svg, />3\.1\.</);
  assert.ok(!/>2\.1\.</.test(svg), '2.1. liegt direkt neben 3.1.');
});
