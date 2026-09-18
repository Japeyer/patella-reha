// Verlaufsdiagramm als SVG. Reine Funktionen: Daten hinein, Markup heraus.
//
// Standard ist eine einzige Linie: der Ausgangsschmerz am Morgen, also der
// hoehere Wert aus Ruhe und Treppenabwaertsgehen. Das ist die Reihe, an der
// Besserung oder Verschlechterung ueber die zwei Wochen sichtbar wird. Die
// uebrigen drei Reihen sind zuschaltbar.

import { ausgangsWert } from './logic.js';

export const REIHEN = [
  { schluessel: 'morgen', name: 'Morgen', wert: (e) => ausgangsWert(e?.morgen) },
  { schluessel: 'vor', name: 'Vor dem Training', wert: (e) => ausgangsWert(e?.vor) },
  { schluessel: 'waehrend', name: 'Während des Trainings', wert: (e) => e?.waehrend?.max ?? null },
  { schluessel: 'nach', name: 'Nach dem Training', wert: (e) => e?.nach?.schmerz ?? null }
];

export function reihenDaten(eintraege, tage) {
  return REIHEN.map((reihe) => ({
    schluessel: reihe.schluessel,
    name: reihe.name,
    punkte: tage.map((tag, index) => ({
      datum: tag.datum,
      index,
      wert: reihe.wert(eintraege[tag.datum] ?? null)
    }))
  }));
}

const RAND = { oben: 10, rechts: 40, unten: 26, links: 22 };

// Zonenbaender nach den Schmerzregeln: 0 bis 2 gruen, 3 gelb, ab 4 rot.
// Die Grenzen liegen bei 2,5 und 3,5, weil 3 noch gelb und 4 schon rot ist.
const BAENDER = [
  { von: 0, bis: 2.5, klasse: 'zone-gruen', name: 'grün', mitte: 1.25 },
  { von: 2.5, bis: 3.5, klasse: 'zone-gelb', name: 'gelb', mitte: 3 },
  { von: 3.5, bis: 10, klasse: 'zone-rot', name: 'rot', mitte: 6.75 }
];

export function svgVerlauf(daten, tage, optionen = {}) {
  const breite = optionen.breite ?? 360;
  const hoehe = optionen.hoehe ?? 200;
  const innenBreite = breite - RAND.links - RAND.rechts;
  const innenHoehe = hoehe - RAND.oben - RAND.unten;
  const x = (i) => RAND.links + (tage.length === 1 ? 0 : (i * innenBreite) / (tage.length - 1));
  const y = (w) => RAND.oben + innenHoehe - (w / 10) * innenHoehe;

  const teile = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${breite} ${hoehe}" role="img" aria-label="Schmerzverlauf über die 14 Plantage, Skala 0 bis 10, mit den Zonen grün, gelb und rot">`
  ];

  // Baender mit Namen am rechten Rand: die Zone ist damit lesbar und nicht nur
  // farblich angedeutet.
  for (const band of BAENDER) {
    teile.push(`<rect class="${band.klasse}" x="${RAND.links}" y="${y(band.bis).toFixed(1)}" width="${innenBreite}" height="${(y(band.von) - y(band.bis)).toFixed(1)}"/>`);
    teile.push(`<text class="zonenschrift zonenschrift-${band.name}" x="${breite - RAND.rechts + 5}" y="${(y(band.mitte) + 3).toFixed(1)}">${band.name}</text>`);
  }

  // Nur drei Marken auf der Skala: 0, die Grenze 3, und 10.
  for (const wert of [0, 3, 10]) {
    teile.push(`<line class="raster" x1="${RAND.links}" y1="${y(wert).toFixed(1)}" x2="${breite - RAND.rechts}" y2="${y(wert).toFixed(1)}"/>`);
    teile.push(`<text class="achse" x="${RAND.links - 5}" y="${(y(wert) + 3.5).toFixed(1)}" text-anchor="end">${wert}</text>`);
  }

  tage.forEach((tag, i) => {
    if (!tag.typ.startsWith('volleyball') && tag.typ !== 'kraft-a' && tag.typ !== 'kraft-b') return;
    const klasse = tag.typ.startsWith('volleyball')
      ? 'tagmarke tagmarke-volleyball'
      : 'tagmarke tagmarke-kraft';
    teile.push(`<line class="${klasse}" x1="${x(i).toFixed(1)}" y1="${RAND.oben}" x2="${x(i).toFixed(1)}" y2="${RAND.oben + innenHoehe}"/>`);
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

    const letzter = mitWert[mitWert.length - 1];
    for (const punkt of mitWert) {
      const zuletzt = punkt === letzter;
      teile.push(`<circle class="punkt punkt-${reihe.schluessel}${zuletzt ? ' punkt-zuletzt' : ''}" cx="${x(punkt.index).toFixed(1)}" cy="${y(punkt.wert).toFixed(1)}" r="${zuletzt ? 5 : 3.5}" data-datum="${punkt.datum}"><title>${reihe.name} am ${punkt.datum}: ${punkt.wert} von 10</title></circle>`);
    }
  }

  // Beschriftung nur an jedem dritten Tag, damit die Achse ruhig bleibt.
  tage.forEach((tag, i) => {
    if (i % 3 !== 0 && i !== tage.length - 1) return;
    teile.push(`<text class="achse" x="${x(i).toFixed(1)}" y="${hoehe - 7}" text-anchor="middle">${Number(tag.datum.slice(8))}.${Number(tag.datum.slice(5, 7))}.</text>`);
  });

  teile.push('</svg>');
  return teile.join('');
}
