// Erzeugt die App-Icons als PNG, ohne Bibliothek. Motiv: die drei Schmerzzonen
// als Baender, darueber eine Linie, die aus Rot nach Gruen faellt - also genau
// das, was die App zeigt.
//
// Aufruf: node tools/make-icons.mjs

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

// --- PNG-Kodierung ---

const CRC_TABELLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(puffer) {
  let c = 0xffffffff;
  for (const byte of puffer) c = CRC_TABELLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(typ, daten) {
  const laenge = Buffer.alloc(4);
  laenge.writeUInt32BE(daten.length);
  const koerper = Buffer.concat([Buffer.from(typ, 'ascii'), daten]);
  const pruefsumme = Buffer.alloc(4);
  pruefsumme.writeUInt32BE(crc32(koerper));
  return Buffer.concat([laenge, koerper, pruefsumme]);
}

function png(breite, hoehe, pixel) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(breite, 0);
  ihdr.writeUInt32BE(hoehe, 4);
  ihdr[8] = 8;   // Bittiefe
  ihdr[9] = 6;   // RGBA
  const zeilen = Buffer.alloc(hoehe * (breite * 4 + 1));
  for (let y = 0; y < hoehe; y += 1) {
    const ziel = y * (breite * 4 + 1);
    zeilen[ziel] = 0; // Filter "none"
    pixel.copy(zeilen, ziel + 1, y * breite * 4, (y + 1) * breite * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(zeilen, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// --- Zeichnen ---

const GRUND = [22, 25, 29];
const BAND_GRUEN = [34, 78, 56];
const BAND_GELB = [88, 70, 22];
const BAND_ROT = [96, 38, 34];
const LINIE = [245, 247, 250];

function leinwand(groesse) {
  const pixel = Buffer.alloc(groesse * groesse * 4);
  const setze = (x, y, farbe) => {
    if (x < 0 || y < 0 || x >= groesse || y >= groesse) return;
    const i = (y * groesse + x) * 4;
    pixel[i] = farbe[0];
    pixel[i + 1] = farbe[1];
    pixel[i + 2] = farbe[2];
    pixel[i + 3] = 255;
  };
  return { pixel, setze };
}

// Abstand eines Punktes zur Strecke, fuer eine Linie mit echter Dicke.
function abstandZurStrecke(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const laenge = dx * dx + dy * dy;
  const t = laenge === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / laenge));
  const nx = ax + t * dx;
  const ny = ay + t * dy;
  return Math.hypot(px - nx, py - ny);
}

function zeichne(groesse) {
  const { pixel, setze } = leinwand(groesse);

  // Baender: oben rot, Mitte gelb, unten gruen - wie die Skala in der App,
  // bei der 10 oben und 0 unten liegt.
  for (let y = 0; y < groesse; y += 1) {
    const anteil = y / groesse;
    let farbe = GRUND;
    if (anteil < 0.5) farbe = BAND_ROT;
    else if (anteil < 0.62) farbe = BAND_GELB;
    else farbe = BAND_GRUEN;
    for (let x = 0; x < groesse; x += 1) setze(x, y, farbe);
  }

  // Linie: faellt aus der roten Zone in die gruene. Bleibt innerhalb der
  // mittleren 70 Prozent, damit sie auch als maskierbares Icon nicht
  // angeschnitten wird.
  const rand = groesse * 0.16;
  const spanne = groesse - 2 * rand;
  const punkte = [
    [rand, rand + spanne * 0.08],
    [rand + spanne * 0.25, rand + spanne * 0.3],
    [rand + spanne * 0.5, rand + spanne * 0.24],
    [rand + spanne * 0.75, rand + spanne * 0.62],
    [rand + spanne, rand + spanne * 0.88]
  ];
  const dicke = groesse * 0.032;

  for (let y = 0; y < groesse; y += 1) {
    for (let x = 0; x < groesse; x += 1) {
      let naechster = Infinity;
      for (let i = 0; i < punkte.length - 1; i += 1) {
        const [ax, ay] = punkte[i];
        const [bx, by] = punkte[i + 1];
        naechster = Math.min(naechster, abstandZurStrecke(x + 0.5, y + 0.5, ax, ay, bx, by));
      }
      if (naechster <= dicke) setze(x, y, LINIE);
    }
  }

  // Punkte auf den Stuetzstellen, damit die Linie als Messreihe lesbar bleibt.
  const radius = groesse * 0.052;
  for (const [cx, cy] of punkte) {
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= radius) setze(x, y, LINIE);
      }
    }
  }

  return png(groesse, groesse, pixel);
}

const ZIELE = [
  ['src/icon-192.png', 192],
  ['src/icon-512.png', 512],
  ['src/apple-touch-icon.png', 180]
];

for (const [pfad, groesse] of ZIELE) {
  const daten = zeichne(groesse);
  writeFileSync(pfad, daten);
  console.log(`${pfad} — ${groesse}×${groesse}, ${daten.length} Bytes`);
}
