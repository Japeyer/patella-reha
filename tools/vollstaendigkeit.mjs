// Entwicklungswerkzeug, kein Test: prueft, ob jede inhaltstragende Zeile der
// Quellen in den Plandaten vorkommt. Aufruf: node tools/vollstaendigkeit.mjs
//   1. Reha-Plan:      docs/plan-original.txt          -> src/plan-data.js
//   2. Sprungkraft:    docs/plan-sprungkraft-original.txt -> src/sprung-data.js
import { readFileSync } from 'node:fs';
import { PLAN } from '../src/plan-data.js';
import { SPRUNG } from '../src/sprung-data.js';

const lies = (pfad) => readFileSync(new URL(pfad, import.meta.url), 'utf8');

// Heuhaufen: alle Textwerte der Plandaten, plus die zusammengesetzten Formen
// "Name: Angabe" und "Name" + Angabe, weil die Quelle beides in einer Zeile
// fuehrt. Tabellenzeilen (Arrays aus Strings) zusaetzlich mit Leerzeichen verbunden.
function heuhaufen(daten, normal = (t) => t.trim()) {
  const texte = new Set();
  const sammle = (wert) => {
    if (typeof wert === 'string') { texte.add(normal(wert)); return; }
    if (Array.isArray(wert)) {
      if (wert.length && wert.every((w) => typeof w === 'string')) texte.add(normal(wert.join(' ')));
      wert.forEach(sammle);
      return;
    }
    if (wert && typeof wert === 'object') {
      if (wert.name && wert.angabe) {
        texte.add(normal(`${wert.name}: ${wert.angabe}`));
        texte.add(normal(`${wert.name} ${wert.angabe}`));
      }
      Object.values(wert).forEach(sammle);
    }
  };
  sammle(daten);
  return texte;
}

function bericht(titel, geprueft, fehlend) {
  console.log(`${titel}: Quellzeilen geprueft ${geprueft}, nicht uebernommen ${fehlend.length}`);
  for (const z of fehlend) console.log(' -', z);
  return fehlend.length;
}

// --- 1. Reha-Plan (unveraendert: Gliederungszeilen unter 26 Zeichen gehen in Feldnamen auf)
const KURZ = 26;
const rehaTexte = heuhaufen(PLAN);
const rehaZeilen = lies('../docs/plan-original.txt').split('\n').map((z) => z.trim()).filter(Boolean)
  .filter((z) => z.length >= KURZ);
const rehaFehlend = rehaZeilen.filter((z) => !rehaTexte.has(z));

// --- 2. Sprungkraft: jede Zeile, ohne Mindestlaenge
// Normalform: Schweizer ss, ohne Emojis, Leerraum zusammengefasst, ohne
// Aufzaehlungsnummer am Zeilenanfang ("1. CMJ" -> "CMJ").
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
const normal = (t) => String(t)
  .replace(/ß/g, 'ss')
  .replace(EMOJI, '')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/^\d+\.\s+/, '');

// Gliederung der Quelle, die als Struktur in den Daten steckt (Datum, Art,
// Feldname) statt als Text. Jede Zeile hier ist bewusst nicht als Text gefuehrt.
const STRUKTUR = new Set([
  // Wochentags- und Datumskoepfe: stecken im Datum der Einheit
  'Montag', 'Mittwoch', 'Freitag', 'Dienstag', 'Donnerstag', 'Wochenende',
  'Montag 09.11.', 'Mittwoch 11.11.', 'Freitag 13.11.',
  'Montag 23.11.', 'Mittwoch 25.11.', 'Freitag 27.11.', 'Freitag 04.12.',
  'Montag 07.12., 19:30', 'Samstag 12.12., 18:30',
  'Freitag: Sprungtest',
  // Einheitsart: steckt in art/titel der Einheit
  'SPIEL', 'Volleyballtraining.',
  // Ueberleitungen ohne eigenen Inhalt
  'Aber:', 'Denn:'
]);

const sprungTexte = heuhaufen(SPRUNG, normal);
const sprungQuelle = lies('../docs/plan-sprungkraft-original.txt').split('\n').map(normal).filter(Boolean);
const sprungFehlend = sprungQuelle.filter((z) => !STRUKTUR.has(z) && !sprungTexte.has(z));

// Gegenprobe: jede Strukturzeile muss in der Quelle vorkommen, sonst ist die
// Liste veraltet und koennte echte Luecken verdecken.
const ueberzaehlig = [...STRUKTUR].filter((z) => !sprungQuelle.includes(z));

let fehler = 0;
fehler += bericht('Reha-Plan', rehaZeilen.length, rehaFehlend);
fehler += bericht('Sprungkraft', sprungQuelle.length, sprungFehlend);
if (ueberzaehlig.length) {
  console.log('Strukturzeilen ohne Gegenstueck in der Quelle:');
  for (const z of ueberzaehlig) console.log(' -', z);
  fehler += ueberzaehlig.length;
}
process.exit(fehler === 0 ? 0 : 1);
