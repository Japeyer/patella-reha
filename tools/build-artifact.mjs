// src/index.html ist ein vollstaendiges HTML-Dokument, weil die Web-App auf
// GitHub Pages eines braucht. Ein Artifact dagegen wird in ein eigenes Geruest
// eingebettet und darf kein <html>, <head> oder <body> mitbringen.
//
// Dieses Skript erzeugt aus derselben Quelle die Artifact-Fassung, damit es
// keine zweite Kopie des Markups gibt.
//
// Aufruf: node tools/build-artifact.mjs  →  build/index.html

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const voll = readFileSync('src/index.html', 'utf8');

const nimm = (muster, was) => {
  const treffer = voll.match(muster);
  if (!treffer) throw new Error(`${was} nicht gefunden in src/index.html`);
  return treffer;
};

const titel = nimm(/<title>[\s\S]*?<\/title>/, '<title>')[0];
const schriften = nimm(/<link rel="preconnect"[\s\S]*?fonts\.googleapis\.com\/css2[^>]*>/, 'Schrift-Verweise')[0];
const stil = nimm(/<link rel="stylesheet" href="styles\.css">/, 'styles.css-Verweis')[0];
const koerper = nimm(/<body>([\s\S]*?)<\/body>/, '<body>')[1];

// Der Service Worker gehoert zur installierbaren Web-App und hat im Artifact
// keine Aufgabe; seine Registrierung fliegt daher heraus.
const ohneServiceWorker = koerper.replace(
  /\s*\/\/ Offline nutzbar machen[\s\S]*?\}\n\n/,
  '\n'
);

mkdirSync('build', { recursive: true });
const ergebnis = `${titel}\n${schriften}\n${stil}\n${ohneServiceWorker.trim()}\n`;
writeFileSync('build/index.html', ergebnis);

for (const verboten of ['<html', '<head', '<body', '<!doctype', 'serviceWorker']) {
  if (ergebnis.toLowerCase().includes(verboten.toLowerCase())) {
    throw new Error(`build/index.html enthaelt noch "${verboten}"`);
  }
}

console.log(`build/index.html geschrieben, ${ergebnis.length} Zeichen, ohne Dokumentgeruest und Service Worker.`);
