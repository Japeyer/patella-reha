// Entwicklungswerkzeug, kein Test: prueft, ob jede inhaltstragende Zeile der
// Quelle in den Plandaten vorkommt. Aufruf: node tests/vollstaendigkeit.mjs
import { readFileSync } from 'node:fs';
import { PLAN } from '../src/plan-data.js';

const quelle = readFileSync(new URL('../docs/plan-original.txt', import.meta.url), 'utf8');
const zeilen = quelle.split('\n').map((z) => z.trim()).filter(Boolean);

// Heuhaufen: alle Textwerte der Plandaten, plus die zusammengesetzten Formen
// "Name: Angabe" und "Name" + Angabe, weil die Quelle beides in einer Zeile fuehrt.
const texte = new Set();
const sammle = (wert) => {
  if (typeof wert === 'string') { texte.add(wert.trim()); return; }
  if (Array.isArray(wert)) { wert.forEach(sammle); return; }
  if (wert && typeof wert === 'object') {
    if (wert.name && wert.angabe) {
      texte.add(`${wert.name}: ${wert.angabe}`.trim());
      texte.add(`${wert.name} ${wert.angabe}`.trim());
    }
    Object.values(wert).forEach(sammle);
  }
};
sammle(PLAN);

const KURZ = 26; // Gliederungszeilen darunter gehen in Feldnamen auf
const fehlend = zeilen.filter((z) => z.length >= KURZ && !texte.has(z));

console.log(`Quellzeilen geprueft: ${zeilen.filter((z) => z.length >= KURZ).length}`);
console.log(`nicht uebernommene Zeilen: ${fehlend.length}`);
for (const z of fehlend) console.log(' -', z);
process.exit(fehlend.length === 0 ? 0 : 1);
