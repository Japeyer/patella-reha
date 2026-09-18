# PatellaApp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine Artifact-Web-App, die den bestehenden 2-Wochen-Rehaplan für die Patellarsehne begleitet, mit Schmerztracking als Hauptfunktion, grafischem Verlauf und Wochen- sowie Monatsübersicht.

**Architecture:** Multi-File-Artifact aus statischem HTML, CSS und ES-Modulen ohne Build-Schritt und ohne externe Bibliotheken. Die Plandaten liegen als eine unveränderliche Datenstruktur in `src/plan-data.js`; die Entscheidungslogik des Plans liegt als reine Funktionen in `src/logic.js` und wird mit `node:test` geprüft; Anzeige und Zustand liegen getrennt davon in den View-Modulen. Speicherung ausschliesslich im `localStorage` des Geräts.

**Tech Stack:** HTML, CSS, JavaScript (ES-Module, kein Framework), Inline-SVG für das Diagramm, `node:test` mit Node 24 für die Tests, Artifact-Publishing für die Auslieferung.

**Spec:** `docs/superpowers/specs/2026-09-17-patella-reha-app-design.md`

**Planquelle (verbatim):** `docs/plan-original.txt` — 250 Zeilen, extrahiert aus `PatellaSehneentzündogVerhinderig_260916_230749.sdocx`. Zeilenverweise in diesem Plan beziehen sich darauf.

## Global Constraints

- Der Plan wird inhaltlich **1:1** übernommen. Jeder Text, jede Satz- und Wiederholungszahl, jeder Prozentwert und jede Schmerzschwelle in `src/plan-data.js` muss wörtlich `docs/plan-original.txt` entsprechen. Keine eigenen Trainingsempfehlungen, keine Umformulierungen, keine Ergänzungen.
- Sprache der gesamten Oberfläche: Deutsch, in der Schreibweise der Quelle (Schweizer Schreibweise, „ss" statt „ß": `ausserhalb`, `ausschliesslich`, `Reissen`).
- Keine externen Skripte, Stylesheets, Schriften oder Netzwerkzugriffe. Keine Bibliotheken.
- Daten verlassen das Gerät nicht. Speicherung nur `localStorage`, jeder Zugriff in `try`/`catch`, App bleibt bei blockiertem Speicher vollständig bedienbar.
- Bedienung einhändig im Hochformat ab 360 px Breite; Seitenabstand mindestens 16 px; kein horizontales Scrollen der Seite.
- Hell und dunkel: vollständige Farbpalette als Tokens auf `:root`, Dunkel-Varianten unter `@media (prefers-color-scheme: dark)` mit `:root:not([data-theme="light"])` und unter `:root[data-theme="dark"]`.
- Zonenfarben nie als einziger Informationsträger — immer zusätzlich Text (`Grün` / `Gelb` / `Rot`) oder Form.
- Festgelegte Lesart Schmerzschwelle „höchstens 2 bis 3 von 10": bis 2 erfüllt, 3 erfüllt und als Grenzfall gekennzeichnet, ab 4 nicht erfüllt.
- Festgelegte Lesart Sprunglimit-Bereiche: Hinweis ab Untergrenze, deutliche Warnung ab Obergrenze, keine Sperre.
- Planzeitraum: 2026-09-21 bis 2026-10-04. Datumsschlüssel im Format `YYYY-MM-DD`.
- Kein Git-Repository im Projekt; Tasks enden statt mit einem Commit mit einem vollständigen Testlauf (`node --test`).

---

## File Structure

| Datei | Verantwortung | publiziert |
|---|---|---|
| `package.json` | `{"type":"module"}`, damit Node die `.js`-Module als ESM lädt | nein |
| `src/plan-data.js` | Plandaten: 14 Tage, Zonen, Regeln, Kriterien, Auswertung, Ernährung, Warnzeichen, Quellen. Nur Daten, keine Logik. | ja |
| `src/logic.js` | Reine Funktionen: Zonen, Teilnahme-Gate, Sprunglimit, Reduktionsrechnung, Woche-2-Gate, Auswertungs-Vorbelegung. Kein DOM, kein Speicher. | ja |
| `src/storage.js` | `localStorage`-Zugriff mit Fallback, Sicherungstext erzeugen und einlesen | ja |
| `src/chart.js` | Verlaufsdiagramm als SVG aus Daten. Kein Zustand. | ja |
| `src/view-today.js` | Ansicht „Heute": Messpunkte, Ampel, Gate, Sprungzähler, Übungen | ja |
| `src/view-overview.js` | Ansichten „Woche" und „Monat" | ja |
| `src/view-reference.js` | Nachschlagewerk und Warnzeichen | ja |
| `src/app.js` | Zustand, Navigation, Verlaufsansicht, Sicherungsdialog, Zusammenbau | ja |
| `src/styles.css` | Farbtokens, Layout, Komponenten | ja |
| `src/index.html` | Seitengerüst, Navigation, Einstiegspunkt | ja |
| `tests/plan-data.test.js` | Datentreue gegen `docs/plan-original.txt`, Struktur der 14 Tage | nein |
| `tests/logic.test.js` | Zonen, Gates, Sprunglimit, Reduktion, Auswertung | nein |
| `tests/storage.test.js` | Speicher-Fallback, Sicherungstext hin und zurück | nein |
| `tests/chart.test.js` | Skalierung, Lücken, Zonenbänder | nein |

---

## Task 1: Projektgerüst und Plandaten

**Files:**
- Create: `package.json`
- Create: `src/plan-data.js`
- Test: `tests/plan-data.test.js`

**Interfaces:**
- Consumes: nichts
- Produces: `export const PLAN` mit den Feldern `zeitraum` (`{ von: '2026-09-21', bis: '2026-10-04' }`), `titel`, `volleyballTage`, `ziele`, `zonen`, `volleyballRegeln`, `tage`, `fortschrittskriterien`, `auswertung`, `ernaehrung`, `warnzeichen`, `grundlage`, `quellen`.
  Jeder Eintrag in `PLAN.tage` hat die Form:
  ```js
  {
    datum: '2026-09-21',          // YYYY-MM-DD
    wochentag: 'Montag',
    woche: 1,                      // 1 | 2
    typ: 'volleyball-reduziert',   // 'volleyball-reduziert' | 'volleyball-kontrolliert' | 'kraft-a' | 'kraft-b' | 'regeneration' | 'kontrolltag' | 'auswertung'
    titel: 'Montag, 21. September: Volleyball reduziert',
    bedingungen: [],               // string[] — tagesspezifische Bedingungen im Wortlaut
    bloecke: [                     // Abschnitte des Tages
      { titel: 'Vor dem Volleyball', uebungen: [
        { name: 'Isometrischer Beinstrecker oder Spanish Squat',
          saetze: 5, dauerSek: [30, 45], pauseSek: [90, 120],
          anstrengung: 'etwa 7 von 10', hinweise: [] }
      ]}
    ],
    volleyball: {                  // nur bei Volleyballtagen, sonst null
      anteilDauerProzent: [null, 60],
      spruengeMin: 10, spruengeMax: 15,
      anteilHoeheProzent: [60, 70],
      pauseZwischenSpruengenSek: [20, 30],
      hinweise: []
    },
    funktionstest: null            // nur am 2026-10-03 gesetzt
  }
  ```
  Übungsfelder sind optional und nur gesetzt, wenn der Plan sie nennt: `saetze`, `wiederholungen` (Zahl oder `[min,max]`), `proSeite` (bool), `dauerSek`, `pauseSek`, `tempo`, `anstrengung`, `hinweise`.

- [ ] **Step 1: `package.json` anlegen**

```json
{
  "name": "patella-app",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/"
  }
}
```

- [ ] **Step 2: Den failing Test für Struktur und Datentreue schreiben**

`tests/plan-data.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PLAN } from '../src/plan-data.js';

const quelle = readFileSync(new URL('../docs/plan-original.txt', import.meta.url), 'utf8');
const zeilen = quelle.split('\n').map((z) => z.trim());
const imPlan = (text) => zeilen.includes(text.trim());

test('deckt genau die 14 Plantage ab', () => {
  assert.equal(PLAN.tage.length, 14);
  assert.equal(PLAN.tage[0].datum, '2026-09-21');
  assert.equal(PLAN.tage[13].datum, '2026-10-04');
  const daten = PLAN.tage.map((t) => t.datum);
  assert.equal(new Set(daten).size, 14, 'keine doppelten Datumsangaben');
  assert.deepEqual(daten, [...daten].sort(), 'aufsteigend sortiert');
});

test('jeder Tag hat Wochennummer, Typ und Titel aus der Quelle', () => {
  for (const tag of PLAN.tage) {
    assert.ok(tag.woche === 1 || tag.woche === 2, `${tag.datum}: Woche 1 oder 2`);
    assert.ok(
      ['volleyball-reduziert', 'volleyball-kontrolliert', 'kraft-a', 'kraft-b',
       'regeneration', 'kontrolltag', 'auswertung'].includes(tag.typ),
      `${tag.datum}: bekannter Typ, war ${tag.typ}`
    );
    assert.ok(imPlan(tag.titel), `${tag.datum}: Titel wörtlich in der Quelle: ${tag.titel}`);
  }
});

test('Woche 1 umfasst 21. bis 27. September, Woche 2 den Rest', () => {
  const w1 = PLAN.tage.filter((t) => t.woche === 1).map((t) => t.datum);
  const w2 = PLAN.tage.filter((t) => t.woche === 2).map((t) => t.datum);
  assert.equal(w1.length, 7);
  assert.equal(w2.length, 7);
  assert.equal(w1[0], '2026-09-21');
  assert.equal(w2[0], '2026-09-28');
});

test('Volleyballtage sind Montag und Mittwoch und tragen Umfangsgrenzen', () => {
  const volley = PLAN.tage.filter((t) => t.typ.startsWith('volleyball'));
  assert.deepEqual(volley.map((t) => t.datum),
    ['2026-09-21', '2026-09-23', '2026-09-28', '2026-09-30']);
  for (const tag of volley) {
    assert.ok(tag.volleyball, `${tag.datum}: Umfangsgrenzen vorhanden`);
    assert.ok(tag.volleyball.spruengeMax >= tag.volleyball.spruengeMin);
    assert.deepEqual(tag.volleyball.pauseZwischenSpruengenSek, [20, 30]);
  }
  assert.equal(PLAN.tage.find((t) => t.datum === '2026-09-21').volleyball.spruengeMin, 10);
  assert.equal(PLAN.tage.find((t) => t.datum === '2026-09-21').volleyball.spruengeMax, 15);
  assert.equal(PLAN.tage.find((t) => t.datum === '2026-09-28').volleyball.spruengeMin, 15);
  assert.equal(PLAN.tage.find((t) => t.datum === '2026-09-28').volleyball.spruengeMax, 25);
});

test('Nicht-Volleyballtage haben keine Umfangsgrenzen', () => {
  for (const tag of PLAN.tage.filter((t) => !t.typ.startsWith('volleyball'))) {
    assert.equal(tag.volleyball, null, `${tag.datum}: keine Sprungvorgaben`);
  }
});

test('Zonen tragen die Schwellen und Konsequenzen der Quelle', () => {
  assert.deepEqual(Object.keys(PLAN.zonen), ['gruen', 'gelb', 'rot']);
  for (const [schluessel, zone] of Object.entries(PLAN.zonen)) {
    assert.ok(zone.name, `${schluessel}: Name`);
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
    PLAN.volleyballRegeln.teilnahmeErlaubtWenn,
    PLAN.volleyballRegeln.keineSpruengeWenn,
    PLAN.volleyballRegeln.erlaubt,
    PLAN.volleyballRegeln.nichtErlaubt,
    PLAN.fortschrittskriterien,
    PLAN.warnzeichen,
    PLAN.ernaehrung,
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
});

test('der Orientierungshinweis ist wörtlich vorhanden', () => {
  assert.ok(PLAN.zonenHinweis.startsWith('Wichtig:'));
  assert.ok(imPlan(PLAN.zonenHinweis));
});
```

- [ ] **Step 3: Test laufen lassen und Fehlschlag bestätigen**

Run: `node --test tests/plan-data.test.js`
Expected: FAIL — `Cannot find module '../src/plan-data.js'`

- [ ] **Step 4: `src/plan-data.js` aus der Quelle füllen**

Vorgehen, Zeile für Zeile aus `docs/plan-original.txt`, nichts umformulieren:

| Quelle | Ziel |
|---|---|
| Z. 1–4 | `titel`, `zeitraum`, `volleyballTage`, `ziele` |
| Z. 6–22 | `zonen.gruen` / `zonen.gelb` / `zonen.rot` mit `name`, `merkmale[]`, `konsequenz` |
| Z. 23 | `zonenHinweis` |
| Z. 25–41 | `volleyballRegeln.vorDemAufwaermen[]`, `.teilnahmeErlaubtWenn[]`, `.keineSpruengeWenn[]`, `.sonstNurText` |
| Z. 42–54 | `volleyballRegeln.erlaubt[]` |
| Z. 55–66 | `volleyballRegeln.nichtErlaubt[]` |
| Z. 68–84 | Tag `2026-09-21` |
| Z. 85–90 | Tag `2026-09-22` |
| Z. 91–102 | Tag `2026-09-23` |
| Z. 103–126 | Tag `2026-09-24` |
| Z. 127–132 | Tag `2026-09-25` |
| Z. 133–144 | Tag `2026-09-26` |
| Z. 145–149 | Tag `2026-09-27` |
| Z. 150–154 | `fortschrittskriterien[]` (die vier Punkte nach „Woche 2 nur steigern, wenn:") |
| Z. 156–168 | Tag `2026-09-28` |
| Z. 169–173 | Tag `2026-09-29` |
| Z. 174–181 | Tag `2026-09-30` |
| Z. 182–188 | Tag `2026-10-01` |
| Z. 189–193 | Tag `2026-10-02` |
| Z. 194–206 | Tag `2026-10-03` inklusive `funktionstest` |
| Z. 207–225 | Tag `2026-10-04` und `auswertung` mit `werte[]`, `guteEntwicklung[]`, `unguenstigeEntwicklung[]`, `schluss` |
| Z. 226–232 | `ernaehrung[]` |
| Z. 233–241 | `warnzeichen[]` |
| Z. 242–243 | `grundlage` |
| Z. 244–250 | `quellen[]` |

Kopf der Datei:

```js
// Plandaten, wörtlich übernommen aus docs/plan-original.txt.
// Quelle: PatellaSehneentzündogVerhinderig_260916_230749.sdocx
// Diese Datei enthält ausschliesslich Daten. Jede Änderung muss der Quelle entsprechen.

export const PLAN = Object.freeze({
  titel: '2-Wochen-Plan Patellarsehne',
  zeitraum: { von: '2026-09-21', bis: '2026-10-04',
    text: 'Zeitraum: Montag, 21. September bis Sonntag, 4. Oktober 2026' },
  volleyballTage: 'Volleyball: Montag- und Mittwochabend',
  ziele: 'Ziele: Reizung beruhigen, Kraft erhalten beziehungsweise aufbauen, Sprungbelastung kontrollieren und Reaktion am Folgetag stabilisieren.',
  // ... weiter nach der Tabelle oben
});
```

Beispiel für einen vollständigen Tag, Muster für die übrigen dreizehn:

```js
{
  datum: '2026-09-22',
  wochentag: 'Dienstag',
  woche: 1,
  typ: 'regeneration',
  titel: 'Dienstag, 22. September: Regeneration',
  bedingungen: [],
  bloecke: [{
    titel: null,
    uebungen: [
      { name: '20 bis 30 Minuten lockeres Radfahren, sofern schmerzarm' },
      { name: 'kein Laufen und keine Sprünge' },
      { name: 'optional: 4 × 30 bis 45 Sekunden isometrischer Spanish Squat',
        saetze: 4, dauerSek: [30, 45] },
      { name: 'Schlafziel: 8 bis 9 Stunden' },
      { name: 'Morgenreaktion dokumentieren' }
    ]
  }],
  volleyball: null,
  funktionstest: null
}
```

- [ ] **Step 5: Test laufen lassen und grün bestätigen**

Run: `node --test tests/plan-data.test.js`
Expected: PASS, 8 Tests

- [ ] **Step 6: Vollständigkeit gegen die Quelle prüfen**

Run:
```bash
node -e "
import('./src/plan-data.js').then(({PLAN})=>{
  const fs=require('fs');
  const quelle=fs.readFileSync('docs/plan-original.txt','utf8').split('\n').map(s=>s.trim()).filter(Boolean);
  const daten=JSON.stringify(PLAN);
  const fehlend=quelle.filter(z=>z.length>25 && !daten.includes(z.replace(/\\\\/g,'\\\\\\\\').replace(/\"/g,'\\\\\"')));
  console.log('nicht übernommene Zeilen:', fehlend.length);
  fehlend.forEach(z=>console.log(' -',z.slice(0,100)));
});"
```
Expected: `nicht übernommene Zeilen: 0`. Jede gemeldete Zeile wird in `plan-data.js` nachgetragen, bevor Task 1 als fertig gilt. Überschriften und Gliederungszeilen unter 26 Zeichen sind von der Prüfung ausgenommen, weil sie in Feldnamen aufgehen.

- [ ] **Step 7: Gesamten Testlauf bestätigen**

Run: `node --test`
Expected: PASS

---

## Task 2: Ampel-Engine und Reduktionsrechnung

**Files:**
- Create: `src/logic.js`
- Test: `tests/logic.test.js`

**Interfaces:**
- Consumes: `PLAN` aus `src/plan-data.js`
- Produces:
  ```js
  // Ein Tageseintrag, wie ihn Speicher und Views verwenden:
  // {
  //   datum: 'YYYY-MM-DD',
  //   morgen:   { ruhe: 0..10|null, treppe: 0..10|null },
  //   vor:      { ruhe: 0..10|null, treppe: 0..10|null, stepDownsMoeglich: bool|null, hinken: bool|null },
  //   waehrend: { max: 0..10|null, zunahmeProSatz: bool|null },
  //   nach:     { schmerz: 0..10|null },
  //   spruenge: number, landungVeraendert: bool|null,
  //   schwellungInstabilitaetKraftverlust: bool|null,
  //   uebungenAbgehakt: string[], notiz: string
  // }
  export function leerEintrag(datum)                      // → Eintrag mit allen Feldern null/leer
  export function zoneFuerTag(eintrag, folgeMorgen)        // → { zone, vorlaeufig, gruende, konsequenz }
  //   zone: 'gruen' | 'gelb' | 'rot' | 'offen'
  //   folgeMorgen: { ruhe, treppe } | null
  export function reduzierteBelastung(tag, prozent)        // → { saetze: [...], spruenge: [min,max]|null, prozent }
  ```

- [ ] **Step 1: Failing Tests für die Zonen schreiben**

`tests/logic.test.js`:

```js
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
```

- [ ] **Step 2: Failing Tests für die Reduktionsrechnung ergänzen**

```js
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
```

Rundungsregel, verbindlich: Untergrenze des reduzierten Bereichs = `Math.floor(min * (1 - 0.30))`, Obergrenze = `Math.floor(max * (1 - 0.20))`. Für Woche 1 (10 bis 15) ergibt das 7 bis 12. Satzzahlen: `Math.max(1, Math.floor(saetze * 0.75))` — eine Reduktion um ein Viertel, die Mitte des Bereichs 20 bis 30 Prozent. Der Test oben ist auf diese Werte zu setzen.

- [ ] **Step 3: Tests laufen lassen und Fehlschlag bestätigen**

Run: `node --test tests/logic.test.js`
Expected: FAIL — `Cannot find module '../src/logic.js'`

- [ ] **Step 4: `src/logic.js` implementieren**

```js
import { PLAN } from './plan-data.js';

const hatWert = (v) => v !== null && v !== undefined;

export function leerEintrag(datum) {
  return {
    datum,
    morgen: { ruhe: null, treppe: null },
    vor: { ruhe: null, treppe: null, stepDownsMoeglich: null, hinken: null },
    waehrend: { max: null, zunahmeProSatz: null },
    nach: { schmerz: null },
    spruenge: 0,
    landungVeraendert: null,
    schwellungInstabilitaetKraftverlust: null,
    uebungenAbgehakt: [],
    notiz: ''
  };
}

// Zone nach den Schmerzregeln des Plans, Zeilen 6 bis 22 der Quelle.
// Rot schlägt Gelb, Gelb schlägt Grün. Die 24-Stunden-Reaktion wiegt schwerer
// als der Wert unmittelbar nach der Einheit (Quelle Zeile 23).
export function zoneFuerTag(eintrag, folgeMorgen) {
  const gruende = [];
  const waehrend = eintrag.waehrend?.max;
  const morgenVorher = eintrag.morgen?.ruhe;
  const morgenDanach = folgeMorgen?.ruhe ?? null;

  const keineWerte = !hatWert(waehrend) && !hatWert(eintrag.nach?.schmerz)
    && !hatWert(morgenVorher) && !hatWert(eintrag.vor?.ruhe);
  if (keineWerte) {
    return { zone: 'offen', vorlaeufig: true, gruende: ['Noch keine Werte erfasst.'], konsequenz: '' };
  }

  // Rote Bedingungen
  if (hatWert(waehrend) && waehrend >= 4) {
    gruende.push('Schmerz 4 von 10 oder stärker während der Belastung.');
  }
  if (eintrag.vor?.hinken === true) {
    gruende.push('Hinken oder Ausweichen.');
  }
  if (eintrag.landungVeraendert === true) {
    gruende.push('Veränderte Landung.');
  }
  if (eintrag.schwellungInstabilitaetKraftverlust === true) {
    gruende.push('Schwellung, Instabilität oder Kraftverlust.');
  }
  if (hatWert(morgenDanach) && hatWert(morgenVorher) && morgenDanach - morgenVorher >= 2) {
    gruende.push('Am nächsten Morgen deutlich schlechter.');
  }
  if (gruende.length > 0) {
    return { zone: 'rot', vorlaeufig: false, gruende, konsequenz: PLAN.zonen.rot.konsequenz };
  }

  // Gelbe Bedingungen
  if (hatWert(waehrend) && waehrend === 3) {
    gruende.push('Schmerz 3 von 10.');
  }
  if (eintrag.waehrend?.zunahmeProSatz === true) {
    gruende.push('Beschwerden nehmen innerhalb der Einheit zu.');
  }
  if (hatWert(morgenDanach) && hatWert(morgenVorher) && morgenDanach - morgenVorher === 1) {
    gruende.push('Am nächsten Morgen leicht stärker.');
  }
  if (gruende.length > 0) {
    return {
      zone: 'gelb',
      vorlaeufig: !hatWert(morgenDanach),
      gruende,
      konsequenz: PLAN.zonen.gelb.konsequenz
    };
  }

  return {
    zone: 'gruen',
    vorlaeufig: !hatWert(morgenDanach),
    gruende: ['Schmerz während der Belastung 0 bis 2 von 10, kein Hinken oder Ausweichen.'],
    konsequenz: PLAN.zonen.gruen.konsequenz
  };
}

// Konsequenz der gelben Zone, vorgerechnet: „Nächste Einheit um etwa 20 bis 30
// Prozent reduzieren. Weniger Sätze, Gewicht oder Sprünge." (Quelle Zeile 15)
export function reduzierteBelastung(tag, prozent = [20, 30]) {
  const [unten, oben] = prozent;
  const spruenge = tag.volleyball
    ? [
        Math.floor(tag.volleyball.spruengeMin * (1 - oben / 100)),
        Math.floor(tag.volleyball.spruengeMax * (1 - unten / 100))
      ]
    : null;

  const saetze = [];
  for (const block of tag.bloecke ?? []) {
    for (const uebung of block.uebungen ?? []) {
      if (typeof uebung.saetze === 'number') {
        saetze.push({
          name: uebung.name,
          original: uebung.saetze,
          reduziert: Math.max(1, Math.floor(uebung.saetze * 0.75))
        });
      }
    }
  }
  return { saetze, spruenge, prozent };
}
```

- [ ] **Step 5: Tests laufen lassen und grün bestätigen**

Run: `node --test tests/logic.test.js`
Expected: PASS, 14 Tests

- [ ] **Step 6: Gesamten Testlauf bestätigen**

Run: `node --test`
Expected: PASS

---

## Task 3: Teilnahme-Gate

**Files:**
- Modify: `src/logic.js`
- Modify: `tests/logic.test.js`

**Interfaces:**
- Consumes: `PLAN.volleyballRegeln`, `leerEintrag`
- Produces:
  ```js
  export function teilnahmeGate(eintrag, vergleichMorgen)
  // vergleichMorgen: { ruhe } | null — Morgen nach dem vorherigen Training
  // → {
  //     teilnahme: 'erlaubt' | 'nicht-erfuellt',
  //     spruenge: 'erlaubt' | 'keine',
  //     grenzfall: boolean,          // Ausgangsschmerz genau 3 von 10
  //     ausgeloest: string[],        // Bedingungen im Wortlaut des Plans
  //     offen: string[],             // fehlende Angaben
  //     anzeige: string              // Ergebnissatz
  //   }
  ```

- [ ] **Step 1: Failing Tests schreiben**

```js
import { teilnahmeGate } from '../src/logic.js';

const vorTraining = (teil) => ({
  ...leerEintrag('2026-09-21'),
  vor: { ruhe: 1, treppe: 1, stepDownsMoeglich: true, hinken: false, ...teil.vor },
  ...teil
});

test('Teilnahme mit Sprüngen bei erfüllten Bedingungen', () => {
  const r = teilnahmeGate(vorTraining({}), { ruhe: 1 });
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
  const r = teilnahmeGate(
    vorTraining({ schwellungInstabilitaetKraftverlust: true }), { ruhe: 1 });
  assert.equal(r.teilnahme, 'erlaubt');
  assert.equal(r.spruenge, 'keine');
  assert.ok(r.ausgeloest.includes('Schwellung, Instabilität oder Kraftverlust bestehen'));
  assert.match(r.anzeige, /Technik ohne Sprünge und Oberkörpertraining/);
});

test('deutlich schlechterer Folgetag erlaubt keine Sprünge', () => {
  const r = teilnahmeGate(vorTraining({ vor: { ruhe: 1 } }), { ruhe: 1, deutlichSchlechter: true });
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
  for (const text of r.ausgeloest) {
    assert.ok(
      PLAN.volleyballRegeln.teilnahmeErlaubtWenn.includes(text)
      || PLAN.volleyballRegeln.keineSpruengeWenn.includes(text),
      `Wortlaut aus dem Plan erwartet: ${text}`
    );
  }
});
```

- [ ] **Step 2: Tests laufen lassen und Fehlschlag bestätigen**

Run: `node --test tests/logic.test.js`
Expected: FAIL — `teilnahmeGate is not a function`

- [ ] **Step 3: `teilnahmeGate` implementieren**

```js
// Zwei getrennte Prüfungen wie im Plan (Quelle Zeilen 25 bis 41).
// Prüfung 1: Teilnahme erlaubt, wenn alle vier Bedingungen zutreffen.
// Prüfung 2: keine Sprünge, wenn mindestens eine der vier Bedingungen zutrifft.
// Schwelle „höchstens 2 bis 3 von 10": bis 2 erfüllt, 3 Grenzfall, ab 4 nicht erfüllt.
export function teilnahmeGate(eintrag, vergleichMorgen) {
  const R = PLAN.volleyballRegeln;
  const vor = eintrag.vor ?? {};
  const ausgeloest = [];
  const offen = [];

  if (!hatWert(vor.ruhe)) offen.push('Schmerz in Ruhe vor dem Training');
  if (vor.hinken === null || vor.hinken === undefined) offen.push('Hinken ja oder nein');
  if (vor.stepDownsMoeglich === null || vor.stepDownsMoeglich === undefined) {
    offen.push('5 Step-downs kontrolliert möglich');
  }

  // Prüfung 1
  if (vor.hinken === true) ausgeloest.push(R.teilnahmeErlaubtWenn[0]);
  if (hatWert(vor.ruhe) && vor.ruhe >= 4) ausgeloest.push(R.teilnahmeErlaubtWenn[1]);
  if (hatWert(vor.ruhe) && hatWert(vergleichMorgen?.ruhe) && vor.ruhe > vergleichMorgen.ruhe) {
    ausgeloest.push(R.teilnahmeErlaubtWenn[2]);
  }
  if (vor.stepDownsMoeglich === false) ausgeloest.push(R.teilnahmeErlaubtWenn[3]);
  const teilnahme = ausgeloest.length === 0 && offen.length === 0 ? 'erlaubt' : 'nicht-erfuellt';
  const grenzfall = hatWert(vor.ruhe) && vor.ruhe === 3;

  // Prüfung 2
  const keine = [];
  if (hatWert(vor.ruhe) && vor.ruhe >= 4) keine.push(R.keineSpruengeWenn[0]);
  if (vergleichMorgen?.deutlichSchlechter === true) keine.push(R.keineSpruengeWenn[1]);
  if (eintrag.schwellungInstabilitaetKraftverlust === true) keine.push(R.keineSpruengeWenn[2]);
  if (eintrag.waehrend?.zunahmeProSatz === true) keine.push(R.keineSpruengeWenn[3]);
  const spruenge = keine.length === 0 && offen.length === 0 && teilnahme === 'erlaubt'
    ? 'erlaubt' : 'keine';

  for (const k of keine) if (!ausgeloest.includes(k)) ausgeloest.push(k);

  let anzeige;
  if (offen.length > 0) {
    anzeige = 'Es fehlen noch Angaben vor dem Training. Ohne diese Angaben zeigt der Plan keine Freigabe für Sprünge.';
  } else if (teilnahme === 'erlaubt' && spruenge === 'erlaubt') {
    anzeige = grenzfall
      ? 'Teilnahme mit kontrollierten Sprüngen nach Tagesvorgabe. Ausgangsschmerz 3 von 10 liegt an der Grenze des Plans.'
      : 'Teilnahme mit kontrollierten Sprüngen nach Tagesvorgabe.';
  } else {
    anzeige = 'Keine Sprünge. Der Plan sieht für diesen Fall höchstens Technik ohne Sprünge und Oberkörpertraining vor.';
  }

  return { teilnahme, spruenge, grenzfall, ausgeloest, offen, anzeige };
}
```

Hinweis für die Umsetzung: Die Indizes `teilnahmeErlaubtWenn[0..3]` und `keineSpruengeWenn[0..3]` müssen der Reihenfolge in `plan-data.js` entsprechen — dort in der Reihenfolge der Quelle (Z. 31–34 und Z. 36–39) ablegen. Der Test „ausgelöste Bedingungen stehen im Wortlaut des Plans" deckt Vertauschungen nicht ab; deshalb beim Füllen von `plan-data.js` die Reihenfolge prüfen.

- [ ] **Step 4: Tests laufen lassen und grün bestätigen**

Run: `node --test tests/logic.test.js`
Expected: PASS

- [ ] **Step 5: Gesamten Testlauf bestätigen**

Run: `node --test`
Expected: PASS

---

## Task 4: Sprunglimit und Zählerlogik

**Files:**
- Modify: `src/logic.js`
- Modify: `tests/logic.test.js`

**Interfaces:**
- Consumes: `PLAN.tage`
- Produces:
  ```js
  export function sprungLimit(tag, eintraege)
  // eintraege: Record<datum, Eintrag> — für den Montagsbezug
  // → { min, max, quelle: string, hinweis: string|null }
  export function sprungStatus(anzahl, limit)
  // → { stufe: 'frei' | 'hinweis' | 'warnung' | 'ueber', text: string }
  export function sprungAbstand(letzterZeitstempel, jetzt)
  // → { sekunden: number|null, zuKurz: boolean, text: string }
  ```

- [ ] **Step 1: Failing Tests schreiben**

```js
import { sprungLimit, sprungStatus, sprungAbstand } from '../src/logic.js';

const tag = (datum) => PLAN.tage.find((t) => t.datum === datum);

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
```

Festlegung für `zuKurz`: wahr, wenn weniger als 20 Sekunden vergangen sind; zwischen 20 und 30 Sekunden ein neutraler Hinweis auf den Bereich, ab 30 Sekunden ohne Hinweis. Der Plan nennt „mindestens 20 bis 30 Sekunden"; die Untergrenze ist die harte Grenze.

- [ ] **Step 2: Tests laufen lassen und Fehlschlag bestätigen**

Run: `node --test tests/logic.test.js`
Expected: FAIL — `sprungLimit is not a function`

- [ ] **Step 3: Implementieren**

```js
const MONTAG_DER_WOCHE = { 1: '2026-09-21', 2: '2026-09-28' };

// Woche 1: keine Steigerung innerhalb derselben Woche (Quelle Zeile 98).
// Woche 2: höchstens 10 Prozent mehr als Montag (Quelle Zeile 177).
export function sprungLimit(tag, eintraege = {}) {
  if (!tag.volleyball) return null;
  const basis = { min: tag.volleyball.spruengeMin, max: tag.volleyball.spruengeMax,
    quelle: 'Bereich des Plans für diese Woche', hinweis: null };
  if (tag.wochentag !== 'Mittwoch') return basis;

  const montag = eintraege[MONTAG_DER_WOCHE[tag.woche]];
  const gezaehlt = montag?.spruenge ?? 0;
  if (!gezaehlt) {
    return { ...basis, hinweis: 'Für den Montag dieser Woche ist keine Sprungzahl erfasst. Es gilt der Bereich des Plans.' };
  }
  const faktor = tag.woche === 2 ? 1.1 : 1;
  const max = Math.floor(gezaehlt * faktor);
  return {
    min: Math.min(basis.min, max),
    max,
    quelle: tag.woche === 2
      ? `Montagszahl ${gezaehlt} plus höchstens 10 Prozent`
      : `Montagszahl ${gezaehlt}, keine Steigerung innerhalb derselben Woche`,
    hinweis: null
  };
}

export function sprungStatus(anzahl, limit) {
  if (!limit) return { stufe: 'frei', text: '' };
  if (anzahl > limit.max) {
    return { stufe: 'ueber', text: `${anzahl} Sprünge — über der Obergrenze von ${limit.max}.` };
  }
  if (anzahl >= limit.max) {
    return { stufe: 'warnung', text: `${anzahl} von ${limit.max} Sprüngen — Obergrenze erreicht.` };
  }
  if (anzahl >= limit.min) {
    return { stufe: 'hinweis', text: `${anzahl} Sprünge — Untergrenze ${limit.min} erreicht, Obergrenze ${limit.max}.` };
  }
  return { stufe: 'frei', text: `${anzahl} von ${limit.min} bis ${limit.max} Sprüngen.` };
}

export function sprungAbstand(letzterZeitstempel, jetzt = Date.now()) {
  if (!letzterZeitstempel) return { sekunden: null, zuKurz: false, text: '' };
  const sekunden = Math.floor((jetzt - letzterZeitstempel) / 1000);
  if (sekunden < 20) {
    return { sekunden, zuKurz: true,
      text: `Erst ${sekunden} Sekunden seit dem letzten Sprung. Der Plan sieht mindestens 20 bis 30 Sekunden vor.` };
  }
  if (sekunden < 30) {
    return { sekunden, zuKurz: false,
      text: `${sekunden} Sekunden seit dem letzten Sprung. Der Plan nennt 20 bis 30 Sekunden.` };
  }
  return { sekunden, zuKurz: false, text: `${sekunden} Sekunden seit dem letzten Sprung.` };
}
```

- [ ] **Step 4: Tests laufen lassen und grün bestätigen**

Run: `node --test tests/logic.test.js`
Expected: PASS

- [ ] **Step 5: Gesamten Testlauf bestätigen**

Run: `node --test`
Expected: PASS

---

## Task 5: Fortschritts-Gate und Auswertung

**Files:**
- Modify: `src/logic.js`
- Modify: `tests/logic.test.js`

**Interfaces:**
- Consumes: `PLAN.fortschrittskriterien`, `PLAN.auswertung`, `zoneFuerTag`
- Produces:
  ```js
  export function fortschrittsGate(antworten)
  // antworten: [bool|null, bool|null, bool|null, bool|null] — Reihenfolge wie PLAN.fortschrittskriterien
  // → { freigegeben: boolean, offen: string[], nichtErfuellt: string[], anzeige: string }
  export function fortschrittsVorschlag(eintraege)
  // → [bool|null × 4] — Vorbelegung aus erfassten Werten, null wenn nicht ableitbar
  export function auswertungVorschlag(eintraege)
  // → { ruhe, treppe, nachVolleyball, morgenDanach, abgeklungen24h, landungGangNormal }
  export function umfangFuerWoche2(freigegeben, tag)
  // → { spruengeMin, spruengeMax, anteilDauerProzent, hinweis }
  ```

- [ ] **Step 1: Failing Tests schreiben**

```js
import { fortschrittsGate, fortschrittsVorschlag, auswertungVorschlag, umfangFuerWoche2 }
  from '../src/logic.js';

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
  const montagW2 = PLAN.tage.find((t) => t.datum === '2026-09-28');
  const r = umfangFuerWoche2(false, montagW2);
  assert.equal(r.spruengeMin, 10);
  assert.equal(r.spruengeMax, 15);
  assert.match(r.hinweis, /Woche 1/);
});

test('Woche 2 mit Freigabe zeigt die Umfänge von Woche 2', () => {
  const montagW2 = PLAN.tage.find((t) => t.datum === '2026-09-28');
  const r = umfangFuerWoche2(true, montagW2);
  assert.equal(r.spruengeMin, 15);
  assert.equal(r.spruengeMax, 25);
});
```

- [ ] **Step 2: Tests laufen lassen und Fehlschlag bestätigen**

Run: `node --test tests/logic.test.js`
Expected: FAIL — `fortschrittsGate is not a function`

- [ ] **Step 3: Implementieren**

```js
// Fortschrittskriterien des Kontrolltags (Quelle Zeilen 150 bis 154).
export function fortschrittsGate(antworten) {
  const K = PLAN.fortschrittskriterien;
  const offen = K.filter((_, i) => antworten[i] === null || antworten[i] === undefined);
  const nichtErfuellt = K.filter((_, i) => antworten[i] === false);
  const freigegeben = offen.length === 0 && nichtErfuellt.length === 0;
  const anzeige = freigegeben
    ? 'Alle vier Kriterien erfüllt. Woche 2 gibt die höheren Umfänge frei.'
    : 'Nicht alle Kriterien erfüllt. Der Plan sieht vor, den Umfang von Woche 1 zu wiederholen oder vollständig ohne Sprünge zu trainieren.';
  return { freigegeben, offen, nichtErfuellt, anzeige };
}

export function fortschrittsVorschlag(eintraege) {
  const morgenWerte = Object.values(eintraege)
    .map((e) => e.morgen?.ruhe).filter(hatWert);
  const letzteDrei = morgenWerte.slice(-3);
  const alltagNichtZugenommen = morgenWerte.length >= 2
    ? letzteDrei[letzteDrei.length - 1] <= letzteDrei[0] : null;
  const morgenHoechstens2 = morgenWerte.length > 0
    ? letzteDrei.every((w) => w <= 2) : null;
  return [alltagNichtZugenommen, morgenHoechstens2, null, null];
}

export function auswertungVorschlag(eintraege) {
  const letzter = eintraege['2026-10-04'];
  const vortag = eintraege['2026-10-03'];
  return {
    ruhe: letzter?.morgen?.ruhe ?? null,
    treppe: letzter?.morgen?.treppe ?? null,
    nachVolleyball: eintraege['2026-09-30']?.nach?.schmerz ?? null,
    morgenDanach: letzter?.morgen?.ruhe ?? null,
    abgeklungen24h: null,
    landungGangNormal: vortag?.landungVeraendert === null ? null : !vortag?.landungVeraendert
  };
}

const WOCHE1_MONTAG = '2026-09-21';

export function umfangFuerWoche2(freigegeben, tag) {
  if (freigegeben) {
    return {
      spruengeMin: tag.volleyball.spruengeMin,
      spruengeMax: tag.volleyball.spruengeMax,
      anteilDauerProzent: tag.volleyball.anteilDauerProzent,
      hinweis: null
    };
  }
  const w1 = PLAN.tage.find((t) => t.datum === WOCHE1_MONTAG);
  return {
    spruengeMin: w1.volleyball.spruengeMin,
    spruengeMax: w1.volleyball.spruengeMax,
    anteilDauerProzent: w1.volleyball.anteilDauerProzent,
    hinweis: 'Fortschrittskriterien nicht erfüllt: Umfang von Woche 1 wiederholen oder vollständig ohne Sprünge trainieren.'
  };
}
```

- [ ] **Step 4: Tests laufen lassen und grün bestätigen**

Run: `node --test tests/logic.test.js`
Expected: PASS

- [ ] **Step 5: Gesamten Testlauf bestätigen**

Run: `node --test`
Expected: PASS

---

## Task 6: Speicherung und Sicherungstext

**Files:**
- Create: `src/storage.js`
- Test: `tests/storage.test.js`

**Interfaces:**
- Consumes: `leerEintrag`
- Produces:
  ```js
  export const SCHLUESSEL = 'patella-app-v1';
  export function erzeugeSpeicher(backend)   // backend: localStorage-artig oder null
  // → {
  //     verfuegbar: boolean,
  //     lies(): { version: 1, eintraege: Record<datum, Eintrag>, fortschritt: (bool|null)[], auswertung: object|null },
  //     schreib(zustand): boolean,
  //     setzeEintrag(datum, teil): Zustand,
  //     alsText(): string,
  //     ausText(text): { ok: boolean, fehler: string|null, zustand: object|null }
  //   }
  ```

- [ ] **Step 1: Failing Tests schreiben**

`tests/storage.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeSpeicher, SCHLUESSEL } from '../src/storage.js';
import { leerEintrag } from '../src/logic.js';

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
```

- [ ] **Step 2: Tests laufen lassen und Fehlschlag bestätigen**

Run: `node --test tests/storage.test.js`
Expected: FAIL — `Cannot find module '../src/storage.js'`

- [ ] **Step 3: Implementieren**

Der Sicherungstext ist bewusst zweiteilig: ein lesbarer Kopf für die Physiotherapie und eine maschinenlesbare Zeile für das Wiederherstellen.

```js
import { leerEintrag } from './logic.js';

export const SCHLUESSEL = 'patella-app-v1';
const MARKE = 'PATELLA-DATEN-V1:';

const leererZustand = () => ({ version: 1, eintraege: {}, fortschritt: [null, null, null, null], auswertung: null });

export function erzeugeSpeicher(backend) {
  let verfuegbar = false;
  try {
    if (backend) {
      backend.setItem(SCHLUESSEL + '-probe', '1');
      backend.removeItem(SCHLUESSEL + '-probe');
      verfuegbar = true;
    }
  } catch { verfuegbar = false; }

  let zustand = leererZustand();
  try {
    const rohdaten = backend?.getItem(SCHLUESSEL);
    if (rohdaten) {
      const geparst = JSON.parse(rohdaten);
      if (geparst && geparst.version === 1 && geparst.eintraege) zustand = geparst;
    }
  } catch { zustand = leererZustand(); }

  const sichern = () => {
    try { backend?.setItem(SCHLUESSEL, JSON.stringify(zustand)); return true; }
    catch { return false; }
  };

  const tiefMischen = (ziel, teil) => {
    for (const [k, v] of Object.entries(teil)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        ziel[k] = tiefMischen({ ...(ziel[k] ?? {}) }, v);
      } else {
        ziel[k] = v;
      }
    }
    return ziel;
  };

  return {
    get verfuegbar() { return verfuegbar; },
    lies: () => zustand,
    schreib(neu) { zustand = neu; return sichern(); },
    setzeEintrag(datum, teil) {
      const vorhanden = zustand.eintraege[datum] ?? leerEintrag(datum);
      zustand.eintraege[datum] = tiefMischen({ ...vorhanden }, teil);
      sichern();
      return zustand;
    },
    alsText() {
      const zeilen = ['Patella-Reha — Schmerzprotokoll', ''];
      for (const datum of Object.keys(zustand.eintraege).sort()) {
        const e = zustand.eintraege[datum];
        const teile = [
          e.morgen?.ruhe != null ? `Morgen Ruhe ${e.morgen.ruhe}/10` : null,
          e.morgen?.treppe != null ? `Morgen Treppe ${e.morgen.treppe}/10` : null,
          e.vor?.ruhe != null ? `vor dem Training ${e.vor.ruhe}/10` : null,
          e.waehrend?.max != null ? `während ${e.waehrend.max}/10` : null,
          e.nach?.schmerz != null ? `nach dem Training ${e.nach.schmerz}/10` : null,
          e.spruenge ? `${e.spruenge} Sprünge` : null,
          e.notiz ? `Notiz: ${e.notiz}` : null
        ].filter(Boolean);
        zeilen.push(`${datum}: ${teile.join(', ') || 'kein Eintrag'}`);
      }
      zeilen.push('', 'Zum Wiederherstellen die folgende Zeile mitkopieren:', MARKE + JSON.stringify(zustand));
      return zeilen.join('\n');
    },
    ausText(text) {
      const stelle = String(text).indexOf(MARKE);
      if (stelle === -1) {
        return { ok: false, fehler: 'Im eingefügten Text fehlt die Datenzeile. Bitte den vollständigen Sicherungstext einfügen.', zustand: null };
      }
      try {
        const geparst = JSON.parse(text.slice(stelle + MARKE.length).trim());
        if (!geparst || geparst.version !== 1 || !geparst.eintraege) throw new Error('Format');
        return { ok: true, fehler: null, zustand: geparst };
      } catch {
        return { ok: false, fehler: 'Die Datenzeile ist unvollständig oder beschädigt. Es wurde nichts geändert.', zustand: null };
      }
    }
  };
}
```

- [ ] **Step 4: Tests laufen lassen und grün bestätigen**

Run: `node --test tests/storage.test.js`
Expected: PASS, 9 Tests

- [ ] **Step 5: Gesamten Testlauf bestätigen**

Run: `node --test`
Expected: PASS

---

## Task 7: Verlaufsdiagramm als SVG

**Files:**
- Create: `src/chart.js`
- Test: `tests/chart.test.js`

**Interfaces:**
- Consumes: `PLAN.tage`
- Produces:
  ```js
  export const REIHEN = [
    { schluessel: 'morgen',   pfad: ['morgen', 'ruhe'],     name: 'Morgen' },
    { schluessel: 'vor',      pfad: ['vor', 'ruhe'],        name: 'Vor dem Training' },
    { schluessel: 'waehrend', pfad: ['waehrend', 'max'],    name: 'Während des Trainings' },
    { schluessel: 'nach',     pfad: ['nach', 'schmerz'],    name: 'Nach dem Training' }
  ];
  export function reihenDaten(eintraege, tage)
  // → [{ schluessel, name, punkte: [{ datum, index, wert|null }] }]
  export function svgVerlauf(daten, tage, optionen)
  // optionen: { breite, hoehe, nurMorgen: boolean }
  // → string (SVG-Markup)
  ```

- [ ] **Step 1: Failing Tests schreiben**

`tests/chart.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAN } from '../src/plan-data.js';
import { leerEintrag } from '../src/logic.js';
import { REIHEN, reihenDaten, svgVerlauf } from '../src/chart.js';

const eintraege = {
  '2026-09-21': { ...leerEintrag('2026-09-21'), morgen: { ruhe: 2, treppe: 2 }, waehrend: { max: 3, zunahmeProSatz: false } },
  '2026-09-23': { ...leerEintrag('2026-09-23'), morgen: { ruhe: 4, treppe: 5 } }
};

test('vier Reihen in fester Reihenfolge', () => {
  assert.deepEqual(REIHEN.map((r) => r.schluessel), ['morgen', 'vor', 'waehrend', 'nach']);
});

test('Reihendaten haben einen Punkt pro Plantag', () => {
  const daten = reihenDaten(eintraege, PLAN.tage);
  assert.equal(daten.length, 4);
  for (const reihe of daten) assert.equal(reihe.punkte.length, 14);
});

test('Tage ohne Eintrag sind null, nicht null-Werte', () => {
  const daten = reihenDaten(eintraege, PLAN.tage);
  const morgen = daten.find((r) => r.schluessel === 'morgen');
  assert.equal(morgen.punkte[0].wert, 2);
  assert.equal(morgen.punkte[1].wert, null, '22. September ohne Eintrag');
  assert.equal(morgen.punkte[2].wert, 4);
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
  assert.equal(marken.length, 8, 'vier Volleyball- und vier Krafttage');
});

test('Skala reicht immer von 0 bis 10', () => {
  const svg = svgVerlauf(reihenDaten({}, PLAN.tage), PLAN.tage, { breite: 360, hoehe: 240 });
  assert.match(svg, />0</);
  assert.match(svg, />10</);
});
```

- [ ] **Step 2: Tests laufen lassen und Fehlschlag bestätigen**

Run: `node --test tests/chart.test.js`
Expected: FAIL — `Cannot find module '../src/chart.js'`

- [ ] **Step 3: Implementieren**

```js
export const REIHEN = [
  { schluessel: 'morgen', pfad: ['morgen', 'ruhe'], name: 'Morgen' },
  { schluessel: 'vor', pfad: ['vor', 'ruhe'], name: 'Vor dem Training' },
  { schluessel: 'waehrend', pfad: ['waehrend', 'max'], name: 'Während des Trainings' },
  { schluessel: 'nach', pfad: ['nach', 'schmerz'], name: 'Nach dem Training' }
];

const lies = (objekt, pfad) => pfad.reduce((o, k) => (o == null ? null : o[k]), objekt) ?? null;

export function reihenDaten(eintraege, tage) {
  return REIHEN.map((reihe) => ({
    schluessel: reihe.schluessel,
    name: reihe.name,
    punkte: tage.map((tag, index) => ({
      datum: tag.datum,
      index,
      wert: lies(eintraege[tag.datum] ?? null, reihe.pfad)
    }))
  }));
}

const RAND = { oben: 12, rechts: 10, unten: 28, links: 26 };

export function svgVerlauf(daten, tage, optionen = {}) {
  const breite = optionen.breite ?? 360;
  const hoehe = optionen.hoehe ?? 240;
  const innenBreite = breite - RAND.links - RAND.rechts;
  const innenHoehe = hoehe - RAND.oben - RAND.unten;
  const x = (i) => RAND.links + (tage.length === 1 ? 0 : (i * innenBreite) / (tage.length - 1));
  const y = (w) => RAND.oben + innenHoehe - (w / 10) * innenHoehe;

  const band = (von, bis, klasse) =>
    `<rect class="${klasse}" x="${RAND.links}" y="${y(bis)}" width="${innenBreite}" height="${y(von) - y(bis)}"/>`;

  const teile = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${breite} ${hoehe}" role="img" aria-label="Schmerzverlauf über die 14 Plantage">`,
    band(0, 2, 'zone-gruen'),
    band(2, 3, 'zone-gelb'),
    band(3, 10, 'zone-rot')
  ];

  for (const wert of [0, 2, 3, 5, 10]) {
    teile.push(`<line class="raster" x1="${RAND.links}" y1="${y(wert)}" x2="${breite - RAND.rechts}" y2="${y(wert)}"/>`);
    teile.push(`<text class="achse" x="${RAND.links - 6}" y="${y(wert) + 4}" text-anchor="end">${wert}</text>`);
  }

  tage.forEach((tag, i) => {
    if (tag.typ === 'regeneration' || tag.typ === 'kontrolltag' || tag.typ === 'auswertung') return;
    const klasse = tag.typ.startsWith('volleyball') ? 'tagmarke tagmarke-volleyball' : 'tagmarke tagmarke-kraft';
    teile.push(`<line class="${klasse}" x1="${x(i)}" y1="${RAND.oben}" x2="${x(i)}" y2="${RAND.oben + innenHoehe}"/>`);
  });

  const sichtbar = optionen.nurMorgen ? daten.filter((r) => r.schluessel === 'morgen') : daten;
  for (const reihe of sichtbar) {
    const mitWert = reihe.punkte.filter((p) => p.wert !== null);
    if (mitWert.length === 0) continue;

    let d = '';
    let offen = false;
    for (const punkt of reihe.punkte) {
      if (punkt.wert === null) { offen = false; continue; }
      d += `${offen ? 'L' : 'M'}${x(punkt.index).toFixed(1)} ${y(punkt.wert).toFixed(1)} `;
      offen = true;
    }
    teile.push(`<path class="reihe reihe-${reihe.schluessel}" d="${d.trim()}" fill="none"/>`);
    for (const punkt of mitWert) {
      teile.push(`<circle class="punkt punkt-${reihe.schluessel}" cx="${x(punkt.index).toFixed(1)}" cy="${y(punkt.wert).toFixed(1)}" r="3" data-datum="${punkt.datum}"><title>${reihe.name} am ${punkt.datum}: ${punkt.wert} von 10</title></circle>`);
    }
  }

  tage.forEach((tag, i) => {
    if (i % 2 !== 0) return;
    teile.push(`<text class="achse" x="${x(i)}" y="${hoehe - 8}" text-anchor="middle">${tag.datum.slice(8)}.${tag.datum.slice(5, 7)}.</text>`);
  });

  teile.push('</svg>');
  return teile.join('');
}
```

Die Linienfarben, Strichmuster und Punktformen kommen aus `styles.css` über die Klassen `reihe-morgen`, `reihe-vor`, `reihe-waehrend`, `reihe-nach`; jede Reihe erhält zusätzlich zur Farbe ein eigenes Strichmuster, damit sie ohne Farbe unterscheidbar bleibt.

- [ ] **Step 4: Tests laufen lassen und grün bestätigen**

Run: `node --test tests/chart.test.js`
Expected: PASS, 8 Tests

- [ ] **Step 5: Gesamten Testlauf bestätigen**

Run: `node --test`
Expected: PASS

---

## Task 8: Seitengerüst, Stile und Verlaufsansicht

**Files:**
- Create: `src/index.html`
- Create: `src/styles.css`
- Create: `src/app.js`

**Interfaces:**
- Consumes: `PLAN`, `erzeugeSpeicher`, `reihenDaten`, `svgVerlauf`, `zoneFuerTag`
- Produces:
  ```js
  // src/app.js
  export const zustand = { ansicht, gewaehltesDatum, nurMorgen, speicher };
  export function heutigerPlantag(heute)   // → Tag aus PLAN.tage, nächstliegender bei Datum ausserhalb
  export function zeichne()                // rendert die aktive Ansicht in #inhalt
  export function wechsleAnsicht(name)     // 'verlauf' | 'heute' | 'woche' | 'monat' | 'plan'
  export function setzeDatum(datum)
  export function eintragFuer(datum)       // → Eintrag aus dem Speicher oder leerEintrag
  export function folgeMorgenFuer(datum)   // → { ruhe, treppe } | null
  ```

- [ ] **Step 1: `src/index.html` anlegen**

Ohne `<html>`, `<head>` und `<body>`, weil das Artifact-Publishing die Seite einbettet. Beginnt mit `<title>` und `<style>`-Verweis:

```html
<title>Patella-Reha</title>
<link rel="stylesheet" href="styles.css">

<header class="kopf">
  <h1>Patella-Reha</h1>
  <p class="zeitraum" id="kopf-zeitraum"></p>
  <button type="button" class="warn-knopf" id="knopf-warnzeichen">Warnzeichen</button>
</header>

<nav class="nav" id="nav" aria-label="Ansichten">
  <button type="button" data-ansicht="verlauf" aria-current="page">Verlauf</button>
  <button type="button" data-ansicht="heute">Heute</button>
  <button type="button" data-ansicht="woche">Woche</button>
  <button type="button" data-ansicht="monat">Monat</button>
  <button type="button" data-ansicht="plan">Plan</button>
</nav>

<main id="inhalt" tabindex="-1"></main>

<p class="hinweis-speicher" id="hinweis-speicher" hidden></p>

<footer class="fuss">
  <button type="button" id="knopf-sicherung">Daten sichern</button>
  <p class="abgrenzung">Diese App protokolliert den selbst erstellten Plan und ersetzt keine
    physiotherapeutische oder ärztliche Beurteilung.</p>
</footer>

<dialog id="dialog-sicherung"></dialog>
<dialog id="dialog-warnzeichen"></dialog>

<script type="module" src="app.js"></script>
```

- [ ] **Step 2: `src/styles.css` anlegen**

Vollständige Palette auf `:root`, Dunkelvarianten zweifach abgesichert:

```css
:root {
  --grund: #f7f7f5;
  --flaeche: #ffffff;
  --rand: #e0dedb;
  --text: #1c1b19;
  --text-leise: #5f5c58;
  --gruen: #2f7d4f;
  --gelb: #a8760d;
  --rot: #b3261e;
  --zone-gruen: rgba(47, 125, 79, 0.10);
  --zone-gelb: rgba(168, 118, 13, 0.12);
  --zone-rot: rgba(179, 38, 30, 0.10);
  --reihe-morgen: #1f5fa8;
  --reihe-vor: #6a4fa3;
  --reihe-waehrend: #b3261e;
  --reihe-nach: #2f7d4f;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --grund: #16181a;
    --flaeche: #1f2225;
    --rand: #343a3f;
    --text: #f0efed;
    --text-leise: #a8a5a0;
    --gruen: #6fcf97;
    --gelb: #e0b050;
    --rot: #f08880;
    --zone-gruen: rgba(111, 207, 151, 0.12);
    --zone-gelb: rgba(224, 176, 80, 0.14);
    --zone-rot: rgba(240, 136, 128, 0.12);
    --reihe-morgen: #7bb2f0;
    --reihe-vor: #b49ae8;
    --reihe-waehrend: #f08880;
    --reihe-nach: #6fcf97;
  }
}

:root[data-theme="dark"] { /* dieselben Werte wie im Media-Block */ }

body { background: var(--grund); color: var(--text); }
```

Weiter: Layout mit `padding-block` am Wrapper und 16 px Seitenabstand am `body`, Kopf sticky mit `top: env(safe-area-inset-top, 0px)`, Schieberegler und Zahlenknöpfe mit Trefferfläche mindestens 44 px, Diagrammklassen `zone-*`, `raster`, `achse`, `reihe-*` (jede Reihe mit eigenem `stroke-dasharray`), `tagmarke-*`, Zonenkarten `karte-gruen` / `karte-gelb` / `karte-rot` mit Farbe **und** Textkennzeichnung, Tabellen in `overflow-x: auto`.

- [ ] **Step 3: `src/app.js` mit Zustand, Navigation und Verlaufsansicht anlegen**

```js
import { PLAN } from './plan-data.js';
import { leerEintrag, zoneFuerTag } from './logic.js';
import { erzeugeSpeicher } from './storage.js';
import { reihenDaten, svgVerlauf, REIHEN } from './chart.js';
import { zeichneHeute } from './view-today.js';
import { zeichneWoche, zeichneMonat } from './view-overview.js';
import { zeichnePlan, warnzeichenInhalt } from './view-reference.js';

const backend = (() => { try { return globalThis.localStorage ?? null; } catch { return null; } })();

export const zustand = {
  ansicht: 'verlauf',
  gewaehltesDatum: null,
  nurMorgen: false,
  speicher: erzeugeSpeicher(backend)
};

export function heutigerPlantag(heute = new Date()) {
  const key = heute.toISOString().slice(0, 10);
  return PLAN.tage.find((t) => t.datum === key)
    ?? (key < PLAN.zeitraum.von ? PLAN.tage[0] : PLAN.tage[PLAN.tage.length - 1]);
}

export function eintragFuer(datum) {
  return zustand.speicher.lies().eintraege[datum] ?? leerEintrag(datum);
}

export function folgeMorgenFuer(datum) {
  const i = PLAN.tage.findIndex((t) => t.datum === datum);
  const naechster = PLAN.tage[i + 1];
  if (!naechster) return null;
  const e = zustand.speicher.lies().eintraege[naechster.datum];
  return e?.morgen?.ruhe == null ? null : e.morgen;
}

function zeichneVerlauf(ziel) {
  const eintraege = zustand.speicher.lies().eintraege;
  const daten = reihenDaten(eintraege, PLAN.tage);
  ziel.innerHTML = `
    <section class="karte">
      <h2>Schmerzverlauf</h2>
      <div class="diagramm">${svgVerlauf(daten, PLAN.tage, { breite: 360, hoehe: 240, nurMorgen: zustand.nurMorgen })}</div>
      <label class="schalter">
        <input type="checkbox" id="schalter-morgen" ${zustand.nurMorgen ? 'checked' : ''}>
        Nur Morgenwerte
      </label>
      <ul class="legende">${(zustand.nurMorgen ? REIHEN.slice(0, 1) : REIHEN)
        .map((r) => `<li class="legende-${r.schluessel}">${r.name}</li>`).join('')}</ul>
      <p class="leise">${PLAN.zonenHinweis}</p>
    </section>`;
  ziel.querySelector('#schalter-morgen').addEventListener('change', (e) => {
    zustand.nurMorgen = e.target.checked;
    zeichne();
  });
  ziel.querySelectorAll('circle[data-datum]').forEach((punkt) => {
    punkt.addEventListener('click', () => setzeDatum(punkt.dataset.datum));
  });
}

const ANSICHTEN = {
  verlauf: zeichneVerlauf,
  heute: (ziel) => zeichneHeute(ziel, zustand.gewaehltesDatum ?? heutigerPlantag().datum),
  woche: zeichneWoche,
  monat: zeichneMonat,
  plan: zeichnePlan
};

export function zeichne() {
  const ziel = document.getElementById('inhalt');
  ANSICHTEN[zustand.ansicht](ziel);
  document.querySelectorAll('#nav button').forEach((b) => {
    if (b.dataset.ansicht === zustand.ansicht) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
}

export function wechsleAnsicht(name) { zustand.ansicht = name; zeichne(); }
export function setzeDatum(datum) { zustand.gewaehltesDatum = datum; wechsleAnsicht('heute'); }

document.getElementById('kopf-zeitraum').textContent = PLAN.zeitraum.text;
document.getElementById('nav').addEventListener('click', (e) => {
  const knopf = e.target.closest('button[data-ansicht]');
  if (knopf) wechsleAnsicht(knopf.dataset.ansicht);
});
if (!zustand.speicher.verfuegbar) {
  const hinweis = document.getElementById('hinweis-speicher');
  hinweis.textContent = 'Dieses Gerät erlaubt keinen Website-Speicher. Die App funktioniert, die Eingaben werden aber beim Schliessen nicht behalten.';
  hinweis.hidden = false;
}
zeichne();
```

- [ ] **Step 4: Sicherungsdialog und Warnzeichen-Dialog anbinden**

Im selben Modul, unterhalb der Navigation:

```js
const dialogSicherung = document.getElementById('dialog-sicherung');
document.getElementById('knopf-sicherung').addEventListener('click', () => {
  dialogSicherung.innerHTML = `
    <form method="dialog" class="dialog-inhalt">
      <h2>Daten sichern</h2>
      <p>Diesen Text kopieren und an einem sicheren Ort ablegen. Er dient auch als Ausdruck für die Physiotherapie.</p>
      <textarea id="sicherung-text" rows="10" readonly></textarea>
      <h3>Wiederherstellen</h3>
      <p>Einen früher gesicherten Text hier einfügen. Der bisherige Bestand wird dabei ersetzt.</p>
      <textarea id="wiederherstellen-text" rows="4" placeholder="Sicherungstext einfügen"></textarea>
      <p class="fehler" id="sicherung-fehler" hidden></p>
      <menu>
        <button type="button" id="knopf-wiederherstellen">Wiederherstellen</button>
        <button value="zu">Schliessen</button>
      </menu>
    </form>`;
  dialogSicherung.querySelector('#sicherung-text').value = zustand.speicher.alsText();
  dialogSicherung.querySelector('#knopf-wiederherstellen').addEventListener('click', () => {
    const feld = dialogSicherung.querySelector('#wiederherstellen-text');
    const meldung = dialogSicherung.querySelector('#sicherung-fehler');
    const ergebnis = zustand.speicher.ausText(feld.value);
    if (!ergebnis.ok) { meldung.textContent = ergebnis.fehler; meldung.hidden = false; return; }
    zustand.speicher.schreib(ergebnis.zustand);
    dialogSicherung.close();
    zeichne();
  });
  dialogSicherung.showModal();
});

const dialogWarn = document.getElementById('dialog-warnzeichen');
document.getElementById('knopf-warnzeichen').addEventListener('click', () => {
  dialogWarn.innerHTML = warnzeichenInhalt();
  dialogWarn.showModal();
});
```

- [ ] **Step 5: Im Browser prüfen**

Run: `node --test` (muss weiterhin PASS sein), dann die Seite lokal öffnen:
```bash
node -e "const{createServer}=require('http'),{readFileSync}=require('fs');createServer((q,s)=>{try{const p=q.url==='/'?'/index.html':q.url;const t=p.endsWith('.css')?'text/css':p.endsWith('.js')?'text/javascript':'text/html';s.writeHead(200,{'content-type':t});s.end(readFileSync('src'+p));}catch{s.writeHead(404);s.end();}}).listen(8123,()=>console.log('http://localhost:8123'))"
```
Expected: Verlaufsansicht mit leerem Diagramm, Zonenbändern, Achse 0 bis 10, funktionierender Navigation; Konsole ohne Fehler. Der Testserver ist ein Hilfsmittel und wird nicht publiziert.

- [ ] **Step 6: Gesamten Testlauf bestätigen**

Run: `node --test`
Expected: PASS

---

## Task 9: Ansicht „Heute"

**Files:**
- Create: `src/view-today.js`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `PLAN`, `zoneFuerTag`, `teilnahmeGate`, `sprungLimit`, `sprungStatus`, `sprungAbstand`, `reduzierteBelastung`, `fortschrittsGate`, `umfangFuerWoche2`, `eintragFuer`, `folgeMorgenFuer`, `zustand`
- Produces: `export function zeichneHeute(ziel, datum)`

- [ ] **Step 1: Gerüst mit Tagesnavigation und Messpunkten schreiben**

Aufbau der Ansicht, von oben nach unten:

1. Tagesnavigation: vorheriger Tag, Datum mit Wochentag, nächster Tag; ausserhalb des Plans deaktiviert.
2. Tageskarte: `tag.titel`, Einheitstyp als Etikett, `tag.bedingungen` als Liste im Wortlaut.
3. Ampelkarte: Ergebnis von `zoneFuerTag(eintragFuer(datum), folgeMorgenFuer(datum))` mit Zonenname als Text, Gründen und Konsequenz; bei `vorlaeufig` der Zusatz „vorläufig, der Morgenwert von morgen fehlt noch"; bei Gelb die vorgerechnete Reduktion aus `reduzierteBelastung(naechsteEinheit, [20, 30])`; darunter `PLAN.zonenHinweis`.
4. Vier Messpunktblöcke in zeitlicher Reihenfolge. Jeder Block ist ein `<fieldset>` mit `<legend>`; die Blöcke „vor", „während" und „nach" sind an Nicht-Trainingstagen nicht vorhanden.
5. Nur an Volleyballtagen: Teilnahme-Gate und Sprungzähler.
6. Übungen des Tages je Block mit Sätzen, Wiederholungen, Tempo, Pause und Abhak-Kästchen.
7. Am 27. September zusätzlich das Fortschritts-Gate, am 4. Oktober der Auswertungsbogen.
8. Notizfeld.

Schmerzeingabe als wiederverwendbares Stück, elf Knöpfe 0 bis 10 statt eines Schiebereglers, weil damit ohne Ziehen exakt getroffen wird:

```js
function schmerzFeld(id, beschriftung, wert, beiAenderung) {
  const knoepfe = Array.from({ length: 11 }, (_, n) =>
    `<button type="button" class="wert${wert === n ? ' gewaehlt' : ''}" data-wert="${n}"
      aria-pressed="${wert === n}">${n}</button>`).join('');
  return `<div class="schmerzfeld" id="${id}">
      <span class="beschriftung">${beschriftung}</span>
      <div class="werte" role="group" aria-label="${beschriftung}, 0 bis 10">${knoepfe}</div>
      <span class="wert-anzeige">${wert == null ? 'nicht erfasst' : `${wert} von 10`}</span>
    </div>`;
}
```

Jede Eingabe schreibt über `zustand.speicher.setzeEintrag(datum, teil)` und ruft danach `zeichne()`, sodass Ampel, Gate und Zähler unmittelbar nachziehen.

- [ ] **Step 2: Teilnahme-Gate und Sprungzähler einbauen**

```js
function gateKarte(datum, tag) {
  const eintrag = eintragFuer(datum);
  const vergleich = vergleichMorgenFuer(datum); // Morgen nach dem vorherigen Training
  const g = teilnahmeGate(eintrag, vergleich);
  const klasse = g.spruenge === 'erlaubt' ? 'karte-gruen' : 'karte-rot';
  return `<section class="karte ${klasse}">
      <h3>Teilnahmeentscheidung</h3>
      <p class="ergebnis">${g.anzeige}</p>
      ${g.offen.length ? `<p class="leise">Offen: ${g.offen.join(', ')}.</p>` : ''}
      ${g.ausgeloest.length ? `<ul class="gruende">${g.ausgeloest.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
      <details><summary>Während des Trainings erlaubt</summary>
        <ul>${PLAN.volleyballRegeln.erlaubt.map((t) => `<li>${t}</li>`).join('')}</ul></details>
      <details><summary>Vorläufig nicht erlaubt</summary>
        <ul>${PLAN.volleyballRegeln.nichtErlaubt.map((t) => `<li>${t}</li>`).join('')}</ul></details>
    </section>`;
}
```

Zähler: `sprungLimit(tag, alleEintraege)` liefert den Bereich, bei Tagen der Woche 2 zuvor durch `umfangFuerWoche2(freigegeben, tag)` ersetzt, wenn das Fortschritts-Gate keine Freigabe erteilt hat. Ein Tipp-Knopf erhöht `spruenge` und merkt den Zeitstempel im Modulzustand (nicht im Speicher, weil er nur während der Einheit gebraucht wird); `sprungStatus` und `sprungAbstand` liefern die Texte. Ein Minus-Knopf korrigiert nach unten. Beim Erreichen der Obergrenze wechselt die Karte auf `karte-rot` und zeigt `sprungStatus(...).text`.

- [ ] **Step 3: Übungsliste, Fortschritts-Gate und Auswertungsbogen einbauen**

Übungszeile aus den Feldern der Plandaten, ohne Umformulierung:

```js
function uebungZeile(datum, uebung) {
  const angaben = [
    uebung.saetze && uebung.wiederholungen
      ? `${uebung.saetze} × ${Array.isArray(uebung.wiederholungen)
          ? `${uebung.wiederholungen[0]} bis ${uebung.wiederholungen[1]}` : uebung.wiederholungen}${uebung.proSeite ? ' pro Seite' : ''}`
      : null,
    uebung.saetze && uebung.dauerSek
      ? `${uebung.saetze} × ${uebung.dauerSek[0]} bis ${uebung.dauerSek[1]} Sekunden` : null,
    uebung.tempo,
    uebung.pauseSek ? `${uebung.pauseSek[0]} bis ${uebung.pauseSek[1]} Sekunden Pause` : null,
    uebung.anstrengung ? `Anstrengung ${uebung.anstrengung}` : null
  ].filter(Boolean);
  const abgehakt = eintragFuer(datum).uebungenAbgehakt.includes(uebung.name);
  return `<li class="uebung">
      <label><input type="checkbox" data-uebung="${uebung.name}" ${abgehakt ? 'checked' : ''}>
        <span class="name">${uebung.name}</span></label>
      ${angaben.length ? `<span class="angaben">${angaben.join(' · ')}</span>` : ''}
      ${uebung.hinweise?.length ? `<ul class="hinweise">${uebung.hinweise.map((h) => `<li>${h}</li>`).join('')}</ul>` : ''}
    </li>`;
}
```

Fortschritts-Gate am 27. September: die vier Kriterien aus `PLAN.fortschrittskriterien` als Ja-Nein-Paare, vorbelegt aus `fortschrittsVorschlag(eintraege)` und überschreibbar; die Antworten liegen in `zustand.speicher.lies().fortschritt`. Ergebnis aus `fortschrittsGate(antworten)` mit `anzeige` und den nicht erfüllten Punkten im Wortlaut.

Auswertungsbogen am 4. Oktober: die sechs Werte aus `PLAN.auswertung.werte` als Felder, vorbelegt aus `auswertungVorschlag(eintraege)`, gespeichert unter `auswertung`; darunter die Listen `guteEntwicklung` und `unguenstigeEntwicklung` im Wortlaut und `PLAN.auswertung.schluss`.

- [ ] **Step 4: Im Browser prüfen**

Testserver aus Task 8 starten und für jeden der sieben Tagestypen prüfen: Messpunkte vorhanden beziehungsweise korrekt ausgeblendet, Eingabe wird nach dem Neuladen behalten, Ampel wechselt bei Werten 2, 3 und 4, Teilnahme-Gate zeigt die drei Ergebnisse, Zähler warnt an der Obergrenze, kein horizontales Scrollen bei 360 px Breite.

Expected: alle Punkte erfüllt, Konsole ohne Fehler.

- [ ] **Step 5: Gesamten Testlauf bestätigen**

Run: `node --test`
Expected: PASS

---

## Task 10: Ansichten „Woche", „Monat" und Nachschlagewerk

**Files:**
- Create: `src/view-overview.js`
- Create: `src/view-reference.js`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `PLAN`, `zoneFuerTag`, `eintragFuer`, `folgeMorgenFuer`, `setzeDatum`, `zustand`
- Produces:
  ```js
  // src/view-overview.js
  export function zeichneWoche(ziel)
  export function zeichneMonat(ziel)
  export function tagesZone(datum)   // → Ergebnis von zoneFuerTag für die Farbgebung
  // src/view-reference.js
  export function zeichnePlan(ziel)
  export function warnzeichenInhalt()   // → string, Markup für den Dialog
  ```

- [ ] **Step 1: Wochensicht schreiben**

Umschalter Woche 1 / Woche 2, darunter die sieben Tage als Liste von Karten, nicht als Tabelle, weil sieben Spalten auf 360 px nicht lesbar sind. Jede Tageskarte zeigt: Wochentag und Datum, Einheitstyp, die erfassten Werte als Kürzel (`Morgen 2 · vor 1 · während 3 · nach 3`), fehlende Werte als „—", die Tagesampel als farbige Kante **und** als Textkennzeichnung, bei Volleyballtagen die gezählten Sprünge gegen das Limit. Tippen ruft `setzeDatum(datum)`.

Zusätzlich eine Kopfzeile mit der Wochenüberschrift aus dem Plan (`Woche 1: Belastung beruhigen und Kraft einführen`, `Woche 2: Vorsichtige Progression`) im Wortlaut.

- [ ] **Step 2: Monatssicht schreiben**

Zwei Kalendergitter, September und Oktober 2026, jeweils sieben Spalten ab Montag. Jede Zelle: Tageszahl, bei Plantagen ein Kürzel des Einheitstyps (`VB`, `KA`, `KB`, `Reg`, `Ktr`, `Ausw`) und die Ampelfarbe als Hintergrund mit einem Zeichen als zusätzlicher Träger (`○` offen, `✓` grün, `!` gelb, `✕` rot). Tage ausserhalb des Plans neutral und nicht anwählbar. Legende darunter. Zellen mindestens 40 px hoch, Gitter mit `aria-label` und den Kürzeln als `title`.

Der September 2026 beginnt an einem Dienstag, der Oktober an einem Donnerstag; die Gitter werden aus `Date` berechnet, nicht hart gesetzt.

- [ ] **Step 3: Nachschlagewerk schreiben**

`zeichnePlan(ziel)` gibt in dieser Reihenfolge, jeweils im Wortlaut der Plandaten, aus: Titel, Zeitraum, Volleyballtage, Ziele; die drei Zonen als Karten mit Merkmalen und Konsequenz; `zonenHinweis`; die Regeln für die Volleyballtrainings mit `vorDemAufwaermen`, `teilnahmeErlaubtWenn`, `keineSpruengeWenn`, `erlaubt`, `nichtErlaubt`; Ernährung und Regeneration; wissenschaftliche Grundlage und die sechs Quellen. Alles als `<details>`-Abschnitte, damit die Seite am Handy kurz bleibt; der erste Abschnitt offen.

`warnzeichenInhalt()` liefert die Liste `PLAN.warnzeichen` im Wortlaut mit der Überschrift „Wann zeitnah ärztlich abklären?", dem Hinweis, dass die App keine ärztliche Beurteilung ersetzt, und einem Schliessen-Knopf.

- [ ] **Step 4: Im Browser prüfen**

Testserver starten und prüfen: Wochenumschalter funktioniert, Tippen auf einen Tag öffnet „Heute" mit dem richtigen Datum, Monatsgitter zeigt beide Monate mit korrekten Wochentagen (21. September ist ein Montag, 4. Oktober ein Sonntag), Ampelzeichen und Farben stimmen mit der Wochensicht überein, Nachschlagewerk zeigt alle Abschnitte, Warnzeichen-Dialog öffnet und schliesst, kein horizontales Scrollen bei 360 px.

Expected: alle Punkte erfüllt.

- [ ] **Step 5: Gesamten Testlauf bestätigen**

Run: `node --test`
Expected: PASS

---

## Task 11: Abschlussprüfung und Veröffentlichung

**Files:**
- Modify: alle `src/`-Dateien nach Befund
- Create: `README.md`

**Interfaces:**
- Consumes: das fertige `src/`-Verzeichnis
- Produces: veröffentlichtes Artifact, URL im README notiert

- [ ] **Step 1: Datentreue abschliessend prüfen**

Run: `node --test tests/plan-data.test.js` und die Vollständigkeitsprüfung aus Task 1, Step 6.
Expected: PASS und `nicht übernommene Zeilen: 0`

- [ ] **Step 2: Gesamten Testlauf bestätigen**

Run: `node --test`
Expected: PASS, alle Dateien ohne Fehlschlag

- [ ] **Step 3: Durchgang durch die Pflichtpunkte der Spec**

Am Testserver, mit Notizen zum Ergebnis je Punkt: Verlauf als Startbildschirm mit vier Reihen und Zonenbändern; Umschalter „nur Morgenwerte"; vier Messpunkte an Trainingstagen, ein Messpunkt an Regenerationstagen; Ampel mit Konsequenz und vorläufiger Kennzeichnung; Reduktionsrechnung bei Gelb; Teilnahme-Gate mit allen drei Ergebnissen; Sprungzähler mit Limit, Abstandshinweis und Warnung; Fortschritts-Gate am 27. September mit Auswirkung auf Woche 2; Auswertungsbogen am 4. Oktober; Wochen- und Monatssicht; Nachschlagewerk; Warnzeichen; Sicherung und Wiederherstellung; blockierter Speicher mit Hinweis; hell und dunkel; 360 px ohne horizontales Scrollen.

- [ ] **Step 4: `README.md` schreiben**

Inhalt: Zweck, Herkunft der Plandaten mit Hinweis auf `docs/plan-original.txt`, Struktur der Dateien, `node --test` als Testbefehl, der Testserver-Befehl, die Artifact-URL, und der Hinweis, dass die Daten ausschliesslich im Browser des Geräts liegen.

- [ ] **Step 5: Als Artifact veröffentlichen**

Vor dem Publizieren die `artifact-design`-Skill laden, wie es das Artifact-Werkzeug verlangt. Dann veröffentlichen mit `file_path` auf `src/index.html` und `files` für `styles.css`, `plan-data.js`, `logic.js`, `storage.js`, `chart.js`, `view-today.js`, `view-overview.js`, `app.js`; `favicon` einmalig setzen; `description` in einem Satz.

Sollten die ES-Module in der Artifact-Umgebung nicht laden, ist der Rückfallweg eine einzelne `index.html`, in die die Module als `<script type="module">`-Blöcke in Abhängigkeitsreihenfolge eingebettet werden — die Importzeilen entfallen dabei, die Funktionen bleiben unverändert. Die Tests laufen weiter gegen die Dateien in `src/`.

- [ ] **Step 6: Veröffentlichte Seite prüfen**

Die publizierte URL öffnen und stichprobenweise bestätigen: Seite lädt ohne Konsolenfehler, Diagramm zeichnet, eine Eingabe wird nach dem Neuladen behalten, Navigation zwischen allen fünf Ansichten funktioniert, Warnzeichen-Dialog öffnet.
Expected: alle Punkte erfüllt; das Ergebnis wird berichtet, ein Fehlschlag behoben statt gemeldet.

---

## Self-Review

**Spec coverage**

| Spec-Abschnitt | Task |
|---|---|
| Zweck, 1:1-Übernahme | 1, 11 |
| Nicht-Ziele | durchgehend, keine Aufgabe fügt sie hinzu |
| Plattform und Technik | 8, 11 |
| Datenmodell Plandaten | 1 |
| Datenmodell Tageseinträge, vier Messpunkte | 2 (`leerEintrag`), 9 (Eingabe) |
| 24-Stunden-Reaktion über Folgetags-Morgenwert | 2 (`zoneFuerTag`), 8 (`folgeMorgenFuer`) |
| Speicherung, Fallback, Sicherungstext | 6, 8 |
| Ampel-Engine, Zonen, vorläufige Zone | 2 |
| Reduktionsrechnung bei Gelb | 2, 9 |
| Teilnahme-Gate, zwei Prüfungen, Grenzfall 3 | 3, 9 |
| Sprungzähler, Limits, Abstand | 4, 9 |
| Fortschritts-Gate, Auswirkung auf Woche 2 | 5, 9 |
| Auswertung am 4. Oktober | 5, 9 |
| Verlaufsansicht, Zonenbänder, Lücken, nur Morgenwerte | 7, 8 |
| Ansicht Heute | 9 |
| Wochen- und Monatssicht | 10 |
| Nachschlagewerk, Warnzeichen | 10 |
| Fehlerfälle | 2 (offene Zone), 6 (Speicher, Wiederherstellung), 7 (Lücken), 8 (Datum ausserhalb) |
| Prüfung, Testfälle aus dem Plan | 1 bis 7 |
| Abgrenzung des Inhalts | 8 (Fusszeile), 10 (Warnzeichen) |
| Verlängerung offenhalten | 1 (Datenstruktur) |

Keine Lücke offen.

**Placeholder scan**

Kein „TBD", kein „TODO", kein „siehe Task N". Die Tasks 9 und 10 geben für die Ansichten Struktur, Reihenfolge, Klassennamen und die Schlüsselfunktionen als Code vor, statt das vollständige Markup abzuschreiben; die Logik, die geprüft werden muss, liegt vollständig in den Tasks 2 bis 7 mit Test und Implementierung.

**Type consistency**

Geprüft: `leerEintrag` liefert genau die Felder, die `zoneFuerTag`, `teilnahmeGate`, `auswertungVorschlag`, `reihenDaten` und `storage.setzeEintrag` lesen. `sprungLimit` gibt `{min, max, quelle, hinweis}`, und `sprungStatus` erwartet genau `{min, max}` daraus. `zoneFuerTag` erhält `folgeMorgen` als `{ruhe, treppe}`, `folgeMorgenFuer` liefert dieses Format oder `null`. `teilnahmeGate` erwartet `vergleichMorgen` mit `{ruhe, deutlichSchlechter}` — das Feld `deutlichSchlechter` wird in Task 9 aus dem Vergleich der Morgenwerte gesetzt und ist in Task 3 getestet. `umfangFuerWoche2` und `sprungLimit` liefern beide Sprunggrenzen; Task 9 legt fest, dass `umfangFuerWoche2` zuerst greift und `sprungLimit` auf dessen Werten arbeitet. `reihenDaten` und `svgVerlauf` verwenden dieselben Reihenschlüssel wie die CSS-Klassen in Task 8.
