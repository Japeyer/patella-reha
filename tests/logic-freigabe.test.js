import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAN } from '../src/plan-data.js';
import {
  leerEintrag, ausgangsschmerz, ausgangsWert, freigabeVorab, tagesLeitsaetze, verwieseneRegeln
} from '../src/logic.js';

const tag = (datum) => PLAN.tage.find((t) => t.datum === datum);

// --- Ausgangsschmerz: der hoehere von Ruhe und Treppenabwaertsgehen ---

test('Ausgangsschmerz ist der höhere der beiden Werte', () => {
  assert.equal(ausgangsWert({ ruhe: 1, treppe: 5 }), 5);
  assert.equal(ausgangsWert({ ruhe: 4, treppe: 2 }), 4);
  assert.equal(ausgangsWert({ ruhe: 3, treppe: 3 }), 3);
});

test('Ausgangsschmerz benennt, welche Messung ihn bestimmt', () => {
  assert.equal(ausgangsschmerz({ ruhe: 1, treppe: 5 }).quelle, 'Treppenabwärtsgehen');
  assert.equal(ausgangsschmerz({ ruhe: 4, treppe: 2 }).quelle, 'Ruhe');
  assert.equal(ausgangsschmerz({ ruhe: 3, treppe: 3 }).quelle, 'Ruhe und Treppenabwärtsgehen');
});

test('ein einzelner Wert genügt, der fehlende zählt nicht als null', () => {
  assert.equal(ausgangsWert({ ruhe: 2, treppe: null }), 2);
  assert.equal(ausgangsWert({ ruhe: null, treppe: 6 }), 6);
  assert.equal(ausgangsWert({ ruhe: null, treppe: null }), null);
  assert.equal(ausgangsWert(null), null);
});

test('der Wert 0 gilt als erfasst, nicht als fehlend', () => {
  assert.equal(ausgangsWert({ ruhe: 0, treppe: null }), 0);
  assert.equal(ausgangsschmerz({ ruhe: 0, treppe: 0 }).wert, 0);
});

// --- Freigabe ohne Formular, nur aus den bisherigen Eintraegen ---

const freigabe = (teil) => freigabeVorab({
  tag: tag('2026-09-23'),
  eintrag: leerEintrag('2026-09-23'),
  vergleichMorgen: null,
  letzteZone: null,
  limit: { min: 10, max: 15, quelle: 'Bereich des Plans für diese Woche', hinweis: null },
  ...teil
});

test('ohne Morgenwert fehlt die Grundlage, keine stille Freigabe', () => {
  const r = freigabe({});
  assert.equal(r.stufe, 'angaben-fehlen');
  assert.match(r.ueberschrift, /Morgenwert/);
  assert.equal(r.limit, null);
});

test('Morgenwert bis 3 gibt Sprünge frei, mit Limit des Tages', () => {
  const eintrag = { ...leerEintrag('2026-09-23'), morgen: { ruhe: 2, treppe: 2 } };
  const r = freigabe({ eintrag });
  assert.equal(r.stufe, 'spruenge');
  assert.deepEqual(r.limit, { min: 10, max: 15 });
  assert.match(r.ueberschrift, /Sprünge erlaubt/);
  assert.equal(r.grenzfall, false);
});

test('Morgenwert 3 ist Grenzfall, aber freigegeben', () => {
  const eintrag = { ...leerEintrag('2026-09-23'), morgen: { ruhe: 3, treppe: 1 } };
  const r = freigabe({ eintrag });
  assert.equal(r.stufe, 'spruenge');
  assert.equal(r.grenzfall, true);
});

test('Morgenwert ab 4 sperrt Sprünge im Wortlaut des Plans', () => {
  const eintrag = { ...leerEintrag('2026-09-23'), morgen: { ruhe: 4, treppe: 2 } };
  const r = freigabe({ eintrag });
  assert.equal(r.stufe, 'keine-spruenge');
  assert.ok(r.gruende.includes('der Ausgangsschmerz bereits 4 von 10 oder stärker ist'));
  assert.match(r.ueberschrift, /Technik ohne Sprünge und Oberkörpertraining/);
});

test('ein hoher Treppenwert sperrt, auch wenn der Ruhewert niedrig ist', () => {
  const eintrag = { ...leerEintrag('2026-09-23'), morgen: { ruhe: 1, treppe: 5 } };
  const r = freigabe({ eintrag });
  assert.equal(r.stufe, 'keine-spruenge');
  // Die Gruende bleiben reiner Planwortlaut; welche Messung die Sperre ausloest,
  // steht in der Erlaeuterung.
  assert.ok(r.gruende.includes('der Ausgangsschmerz bereits 4 von 10 oder stärker ist'));
  assert.match(r.erlaeuterung, /Treppenabwärtsgehen/);
  assert.match(r.erlaeuterung, /5 von 10/);
});

test('deutlich schlechterer Folgetag nach dem letzten Training sperrt', () => {
  const eintrag = { ...leerEintrag('2026-09-23'), morgen: { ruhe: 2, treppe: 2 } };
  const r = freigabe({ eintrag, vergleichMorgen: { ruhe: 2, deutlichSchlechter: true } });
  assert.equal(r.stufe, 'keine-spruenge');
  assert.ok(r.gruende.includes('der Folgetag nach der letzten Belastung deutlich schlechter war'));
});

test('rote Zone beim letzten Training sperrt', () => {
  const eintrag = { ...leerEintrag('2026-09-23'), morgen: { ruhe: 2, treppe: 2 } };
  const r = freigabe({ eintrag, letzteZone: 'rot' });
  assert.equal(r.stufe, 'keine-spruenge');
  assert.ok(r.gruende.some((g) => /Rote Zone|stoppen/.test(g)));
});

test('Schwellung, Instabilität oder Kraftverlust sperrt', () => {
  const eintrag = {
    ...leerEintrag('2026-09-23'),
    morgen: { ruhe: 1, treppe: 1 },
    schwellungInstabilitaetKraftverlust: true
  };
  const r = freigabe({ eintrag });
  assert.equal(r.stufe, 'keine-spruenge');
  assert.ok(r.gruende.includes('Schwellung, Instabilität oder Kraftverlust bestehen'));
});

test('der Check vor dem Training verschärft, hebt aber nichts auf', () => {
  const eintrag = {
    ...leerEintrag('2026-09-23'),
    morgen: { ruhe: 1, treppe: 1 },
    vor: { ruhe: 1, treppe: 1, stepDownsMoeglich: false, hinken: null }
  };
  const r = freigabe({ eintrag });
  assert.equal(r.stufe, 'keine-spruenge');
  assert.ok(r.gruende.includes('Kniebeugen beziehungsweise Step-downs kontrolliert möglich sind'));
});

test('Hinken vor dem Training sperrt', () => {
  const eintrag = {
    ...leerEintrag('2026-09-23'),
    morgen: { ruhe: 1, treppe: 1 },
    vor: { ruhe: 1, treppe: 1, stepDownsMoeglich: true, hinken: true }
  };
  assert.equal(freigabe({ eintrag }).stufe, 'keine-spruenge');
});

test('gesperrt ohne Limit, freigegeben mit Limit', () => {
  const gesperrt = freigabe({ eintrag: { ...leerEintrag('2026-09-23'), morgen: { ruhe: 6, treppe: 6 } } });
  assert.equal(gesperrt.limit, null);
  const frei = freigabe({ eintrag: { ...leerEintrag('2026-09-23'), morgen: { ruhe: 1, treppe: 1 } } });
  assert.ok(frei.limit);
});

test('gelbe Vorwoche reduziert das Limit um 20 bis 30 Prozent', () => {
  const eintrag = { ...leerEintrag('2026-09-23'), morgen: { ruhe: 1, treppe: 1 } };
  const r = freigabe({ eintrag, letzteZone: 'gelb' });
  assert.equal(r.stufe, 'spruenge');
  // 10 minus 30 % = 7, 15 minus 20 % = 12
  assert.deepEqual(r.limit, { min: 7, max: 12 });
  assert.match(r.ueberschrift, /7 bis 12/);
  assert.ok(r.gruende.includes(PLAN.zonen.gelb.konsequenz));
});

test('grüne Vorwoche lässt das Limit unangetastet', () => {
  const eintrag = { ...leerEintrag('2026-09-23'), morgen: { ruhe: 1, treppe: 1 } };
  const r = freigabe({ eintrag, letzteZone: 'gruen' });
  assert.deepEqual(r.limit, { min: 10, max: 15 });
  assert.deepEqual(r.gruende, []);
});

test('jeder Grund steht im Wortlaut des Plans', () => {
  const alleTexte = [
    ...PLAN.volleyballRegeln.teilnahmeErlaubtWenn,
    ...PLAN.volleyballRegeln.keineSpruengeWenn,
    ...PLAN.zonen.rot.merkmale,
    PLAN.zonen.rot.konsequenz,
    PLAN.zonen.gelb.konsequenz,
    ...PLAN.tage.flatMap((t) => t.bedingungen)
  ];
  const faelle = [
    { morgen: { ruhe: 5, treppe: 5 } },
    { morgen: { ruhe: 1, treppe: 1 } },
    { morgen: { ruhe: 1, treppe: 1 }, schwellungInstabilitaetKraftverlust: true },
    { morgen: { ruhe: 1, treppe: 1 }, vor: { ruhe: 1, treppe: 1, stepDownsMoeglich: false, hinken: true } }
  ];
  for (const teil of faelle) {
    const r = freigabe({ eintrag: { ...leerEintrag('2026-09-23'), ...teil } });
    for (const grund of r.gruende) {
      assert.ok(alleTexte.includes(grund), `Wortlaut aus dem Plan erwartet: ${grund}`);
    }
  }
});

// --- Leitsaetze der Nicht-Volleyballtage ---

test('Regenerationstag nennt seine Verbote im Wortlaut', () => {
  const saetze = tagesLeitsaetze(tag('2026-09-25'));
  assert.ok(saetze.includes('kein Sprungtraining'));
  assert.ok(saetze.includes('keine schweren Knieübungen'));
});

test('Kraft A nennt Bedingung und Schmerzgrenze', () => {
  const saetze = tagesLeitsaetze(tag('2026-09-24'));
  assert.ok(saetze.includes('Alle Wiederholungen langsam und kontrolliert.'));
  assert.ok(saetze.includes('Schmerz höchstens 3 von 10'));
  assert.ok(saetze.includes('nicht bis zum Muskelversagen trainieren'));
});

test('Kraft B nennt den Verweis auf den Donnerstag', () => {
  const saetze = tagesLeitsaetze(tag('2026-09-26'));
  assert.ok(saetze.includes('Gleiches Tempo und gleiche Schmerzregeln wie am Donnerstag.'));
});

test('Leitsätze sind nie leer und stammen wörtlich aus dem Tag', () => {
  for (const t of PLAN.tage) {
    const saetze = tagesLeitsaetze(t);
    assert.ok(saetze.length > 0, `${t.datum}: mindestens ein Leitsatz`);
    const erlaubt = [
      ...t.bedingungen,
      ...t.bloecke.flatMap((b) => b.uebungen.map((u) => u.name)),
      PLAN.auswertung.einleitung
    ];
    for (const satz of saetze) {
      assert.ok(erlaubt.includes(satz), `${t.datum}: ${satz} stammt nicht aus diesem Tag`);
    }
  }
});

// --- Aufgeloester Verweis von Kraft B auf Kraft A ---

test('Kraft B löst den Verweis auf den Donnerstag auf', () => {
  const r = verwieseneRegeln(tag('2026-09-19'));
  assert.ok(r, 'Regeln vorhanden');
  assert.equal(r.von, 'Donnerstag, 24. September: Kraft A');
  assert.ok(r.saetze.includes('Schmerz höchstens 3 von 10'));
  assert.ok(r.saetze.includes('nicht bis zum Muskelversagen trainieren'));
  assert.equal(r.tempo, '3 Sekunden absenken, 1 Sekunde halten, 2 Sekunden hoch');
});

test('nur Kraft-B-Tage tragen den Verweis', () => {
  assert.equal(verwieseneRegeln(tag('2026-09-24')), null, 'Kraft A nicht');
  assert.equal(verwieseneRegeln(tag('2026-09-18')), null, 'Pause nicht');
  assert.equal(verwieseneRegeln(tag('2026-09-21')), null, 'Volleyball nicht');
  for (const d of ['2026-09-19', '2026-09-26', '2026-10-03']) {
    assert.ok(verwieseneRegeln(tag(d)), `${d} trägt den Verweis`);
  }
});
