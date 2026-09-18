import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PLAN } from '../src/plan-data.js';

const quelle = readFileSync(new URL('../docs/plan-original.txt', import.meta.url), 'utf8');
const zeilen = quelle.split('\n').map((z) => z.trim());
const imPlan = (text) => zeilen.includes(String(text).trim());

// Die drei Vorlauftage stehen nicht im Dokument; sie uebernehmen nur dessen
// Wochenmuster. Fuer die Treuepruefung zaehlen die Tage aus der Quelle.
const quellTage = PLAN.tage.filter((tag) => tag.herkunft !== 'ergaenzt');
const vorlaufTage = PLAN.tage.filter((tag) => tag.herkunft === 'ergaenzt');

test('deckt die 14 Plantage plus drei Vorlauftage ab', () => {
  assert.equal(PLAN.tage.length, 17);
  assert.equal(quellTage.length, 14);
  assert.equal(vorlaufTage.length, 3);
  assert.equal(PLAN.tage[0].datum, '2026-09-18');
  assert.equal(quellTage[0].datum, '2026-09-21');
  assert.equal(PLAN.tage[16].datum, '2026-10-04');
  const daten = PLAN.tage.map((t) => t.datum);
  assert.equal(new Set(daten).size, 17, 'keine doppelten Datumsangaben');
  assert.deepEqual(daten, [...daten].sort(), 'aufsteigend sortiert');
});

test('der Vorlauf spiegelt das Wochenmuster des Plans', () => {
  assert.deepEqual(
    vorlaufTage.map((t) => [t.datum, t.wochentag, t.typ]),
    [
      ['2026-09-18', 'Freitag', 'regeneration'],
      ['2026-09-19', 'Samstag', 'kraft-b'],
      ['2026-09-20', 'Sonntag', 'kontrolltag']
    ]
  );
  // Jeder Vorlauftag nennt seinen Vorbildtag, und der hat denselben Typ.
  for (const tag of vorlaufTage) {
    const vorbild = PLAN.tage.find((v) => v.datum === tag.vorbildTag);
    assert.ok(vorbild, `${tag.datum}: Vorbildtag vorhanden`);
    assert.equal(vorbild.typ, tag.typ, `${tag.datum}: gleicher Typ wie ${tag.vorbildTag}`);
    assert.equal(vorbild.wochentag, tag.wochentag, `${tag.datum}: gleicher Wochentag`);
  }
});

test('die Vorlauftage übernehmen die Übungen ihres Vorbildtags wörtlich', () => {
  for (const tag of vorlaufTage) {
    const vorbild = PLAN.tage.find((v) => v.datum === tag.vorbildTag);
    const namen = (t) => t.bloecke.flatMap((b) => b.uebungen.map((u) => u.name));
    assert.deepEqual(namen(tag), namen(vorbild), `${tag.datum}: gleiche Übungen`);
    assert.deepEqual(tag.bedingungen, vorbild.bedingungen, `${tag.datum}: gleiche Bedingungen`);
    // Und damit steht jeder Text weiterhin wörtlich in der Quelle.
    for (const name of namen(tag)) assert.ok(imPlan(name), `wörtlich erwartet: ${name}`);
  }
});

test('Vorlauftage sind als ergänzt gekennzeichnet, Quelltage nicht', () => {
  for (const tag of quellTage) assert.equal(tag.herkunft, undefined, `${tag.datum}`);
  for (const tag of vorlaufTage) assert.equal(tag.herkunft, 'ergaenzt', `${tag.datum}`);
});

test('jeder Tag hat Wochennummer, Typ und Titel aus der Quelle', () => {
  for (const tag of quellTage) {
    assert.ok(tag.woche === 1 || tag.woche === 2, `${tag.datum}: Woche 1 oder 2`);
    assert.ok(
      ['volleyball-reduziert', 'volleyball-kontrolliert', 'kraft-a', 'kraft-b',
        'regeneration', 'kontrolltag', 'auswertung'].includes(tag.typ),
      `${tag.datum}: bekannter Typ, war ${tag.typ}`
    );
    assert.ok(imPlan(tag.titel), `${tag.datum}: Titel wörtlich in der Quelle: ${tag.titel}`);
  }
});

test('der Vorlauf ist Woche 0', () => {
  for (const tag of vorlaufTage) assert.equal(tag.woche, 0, tag.datum);
  assert.equal(PLAN.wochen[0].nummer, 0);
  assert.equal(PLAN.wochen[0].ergaenzt, true);
  assert.equal(PLAN.wochen.length, 3);
});

test('Woche 1 umfasst 21. bis 27. September, Woche 2 den Rest', () => {
  const w1 = PLAN.tage.filter((t) => t.woche === 1).map((t) => t.datum);
  const w2 = PLAN.tage.filter((t) => t.woche === 2).map((t) => t.datum);
  assert.equal(w1.length, 7);
  assert.equal(w2.length, 7);
  assert.equal(w1[0], '2026-09-21');
  assert.equal(w2[0], '2026-09-28');
});

test('Wochentage stimmen mit dem Kalender überein', () => {
  const namen = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  for (const tag of PLAN.tage) {
    const echt = namen[new Date(`${tag.datum}T12:00:00Z`).getUTCDay()];
    assert.equal(tag.wochentag, echt, `${tag.datum} ist ein ${echt}`);
  }
});

test('Volleyballtage sind Montag und Mittwoch und tragen Umfangsgrenzen', () => {
  const volley = PLAN.tage.filter((t) => t.typ.startsWith('volleyball'));
  assert.deepEqual(volley.map((t) => t.datum),
    ['2026-09-21', '2026-09-23', '2026-09-28', '2026-09-30']);
  for (const tag of volley) {
    assert.ok(tag.volleyball, `${tag.datum}: Umfangsgrenzen vorhanden`);
    assert.ok(tag.volleyball.spruengeMax >= tag.volleyball.spruengeMin);
  }
  const finde = (d) => PLAN.tage.find((t) => t.datum === d).volleyball;
  assert.equal(finde('2026-09-21').spruengeMin, 10);
  assert.equal(finde('2026-09-21').spruengeMax, 15);
  assert.equal(finde('2026-09-28').spruengeMin, 15);
  assert.equal(finde('2026-09-28').spruengeMax, 25);
});

test('die Sprungpause steht nur dort, wo der Plan sie nennt', () => {
  const finde = (d) => PLAN.tage.find((t) => t.datum === d).volleyball;
  assert.deepEqual(finde('2026-09-21').pauseZwischenSpruengenSek, [20, 30]);
  assert.equal(finde('2026-09-23').pauseZwischenSpruengenSek, null);
  assert.equal(finde('2026-09-28').pauseZwischenSpruengenSek, null);
  assert.deepEqual(finde('2026-09-28').pauseZwischenBloeckenMin, [3, 5]);
  assert.equal(finde('2026-09-30').pauseZwischenSpruengenSek, null);
});

test('Nicht-Volleyballtage haben keine Umfangsgrenzen', () => {
  for (const tag of PLAN.tage.filter((t) => !t.typ.startsWith('volleyball'))) {
    assert.equal(tag.volleyball, null, `${tag.datum}: keine Sprungvorgaben`);
  }
});

test('Zonen tragen die Schwellen und Konsequenzen der Quelle', () => {
  assert.deepEqual(Object.keys(PLAN.zonen), ['gruen', 'gelb', 'rot']);
  for (const [schluessel, zone] of Object.entries(PLAN.zonen)) {
    assert.ok(imPlan(zone.name), `${schluessel}: Name wörtlich in der Quelle`);
    assert.ok(zone.merkmale.length > 0, `${schluessel}: Merkmale`);
    for (const m of zone.merkmale) {
      assert.ok(imPlan(m), `${schluessel}: Merkmal wörtlich in der Quelle: ${m}`);
    }
    assert.ok(imPlan(zone.konsequenz), `${schluessel}: Konsequenz wörtlich: ${zone.konsequenz}`);
  }
});

test('Regeln, Kriterien, Warnzeichen und Quellen stammen wörtlich aus der Quelle', () => {
  const listen = [
    PLAN.volleyballRegeln.vorDemAufwaermen,
    PLAN.volleyballRegeln.teilnahmeErlaubtWenn,
    PLAN.volleyballRegeln.keineSpruengeWenn,
    PLAN.volleyballRegeln.erlaubt,
    PLAN.volleyballRegeln.nichtErlaubt,
    PLAN.fortschrittskriterien,
    PLAN.warnzeichen,
    PLAN.ernaehrung,
    PLAN.auswertung.werte,
    PLAN.auswertung.guteEntwicklung,
    PLAN.auswertung.unguenstigeEntwicklung,
    PLAN.quellen
  ];
  for (const liste of listen) {
    assert.ok(Array.isArray(liste) && liste.length > 0);
    for (const eintrag of liste) {
      assert.ok(imPlan(eintrag), `wörtlich in der Quelle erwartet: ${eintrag}`);
    }
  }
  assert.equal(PLAN.fortschrittskriterien.length, 4);
  assert.equal(PLAN.quellen.length, 6);
  assert.equal(PLAN.volleyballRegeln.teilnahmeErlaubtWenn.length, 4);
  assert.equal(PLAN.volleyballRegeln.keineSpruengeWenn.length, 4);
  assert.equal(PLAN.auswertung.werte.length, 6);
});

test('die Reihenfolge der Gate-Bedingungen entspricht der Quelle', () => {
  const zeile = (n) => zeilen[n - 1];
  assert.deepEqual(PLAN.volleyballRegeln.teilnahmeErlaubtWenn,
    [zeile(32), zeile(33), zeile(34), zeile(35)]);
  assert.deepEqual(PLAN.volleyballRegeln.keineSpruengeWenn,
    [zeile(37), zeile(38), zeile(39), zeile(40)]);
  assert.deepEqual(PLAN.fortschrittskriterien,
    [zeile(151), zeile(152), zeile(153), zeile(154)]);
});

test('der Orientierungshinweis ist wörtlich vorhanden', () => {
  assert.ok(PLAN.zonenHinweis.startsWith('Wichtig:'));
  assert.ok(imPlan(PLAN.zonenHinweis));
});

test('Übungsangaben sind mit den strukturierten Feldern verträglich', () => {
  for (const tag of PLAN.tage) {
    for (const block of tag.bloecke) {
      for (const uebung of block.uebungen) {
        assert.ok(uebung.name, `${tag.datum}: Übung ohne Namen`);
        if (typeof uebung.saetze === 'number') {
          assert.ok(uebung.saetze > 0 && uebung.saetze <= 6, `${tag.datum}: ${uebung.name}`);
        }
        if (uebung.dauerSek) {
          assert.equal(uebung.dauerSek.length, 2);
          assert.ok(uebung.dauerSek[0] <= uebung.dauerSek[1]);
        }
      }
    }
  }
});
