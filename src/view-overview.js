// Die Tagesleiste: ein Feld pro Plantag mit Ampelfarbe, Kürzel und Zeichen,
// gruppiert nach Wochen. Wächst mit, wenn Wochen angefügt oder angepasst werden.

import { zoneFuerTag } from './logic.js';
import { eintragFuer, folgeMorgenFuer, setzeDatum, heutigerPlantag, wochen } from './state.js';
import { esc, TYP_KUERZEL, ZONEN_ZEICHEN, ZONEN_NAME, TYP_NAME } from './ui.js';
import { wochentagIndex, wochentagVon } from './datum.js';

export function tagesZone(datum) {
  return zoneFuerTag(eintragFuer(datum), folgeMorgenFuer(datum));
}

const WOCHENTAG_KUERZEL = {
  Montag: 'Mo', Dienstag: 'Di', Mittwoch: 'Mi', Donnerstag: 'Do',
  Freitag: 'Fr', Samstag: 'Sa', Sonntag: 'So'
};

function wochenTitel(woche) {
  if (woche.woche === 0) return 'Vorlauf ab Freitag, 18. September';
  if (woche.woche === 1) return 'Woche 1: Belastung beruhigen und Kraft einführen';
  if (woche.woche === 2) return 'Woche 2: Vorsichtige Progression';
  return `Woche ${woche.woche}`;
}

export function tagesLeisteMarkup() {
  const heute = heutigerPlantag().datum;

  const bloecke = wochen().map((woche) => {
    // Eine angebrochene Woche wird auf ihre Wochentagsspalten geschoben, damit
    // die Leiste als Kalender lesbar bleibt.
    const versatz = wochentagIndex(woche.tage[0].datum);
    const leer = Array.from({ length: versatz },
      () => '<div class="leiste-feld leer" aria-hidden="true"></div>').join('');

    const felder = woche.tage.map((tag) => {
      const befund = tagesZone(tag.datum);
      const istHeute = tag.datum === heute;
      const kuerzel = WOCHENTAG_KUERZEL[wochentagVon(tag.datum)];
      return `<button type="button" class="leiste-feld zone-feld-${befund.zone}${istHeute ? ' heute' : ''}"
        data-datum="${tag.datum}"
        title="${esc(tag.titel)} — ${ZONEN_NAME[befund.zone]}"
        aria-label="${kuerzel} ${Number(tag.datum.slice(8))}., ${esc(TYP_NAME[tag.typ] ?? tag.typ)}, ${ZONEN_NAME[befund.zone]}">
        <span class="leiste-wochentag">${kuerzel}</span>
        <span class="leiste-tag">${Number(tag.datum.slice(8))}.</span>
        <span class="leiste-kuerzel">${TYP_KUERZEL[tag.typ] ?? '?'}</span>
        <span class="leiste-zeichen" aria-hidden="true">${ZONEN_ZEICHEN[befund.zone]}</span>
      </button>`;
    }).join('');

    const marken = [];
    if (woche.woche === 0) marken.push('ergänzt');
    if (woche.angepasst) marken.push('angepasst');

    return `<div class="leiste-woche">
      <button type="button" class="leiste-kopf" data-woche="${woche.montag}">
        <span class="eyebrow">${esc(wochenTitel(woche))}${marken.length ? ` · ${marken.join(' · ')}` : ''}</span>
        <span class="leiste-kopf-pfeil" aria-hidden="true">anpassen ›</span>
      </button>
      <div class="leiste">${leer}${felder}</div>
      ${woche.hinweise.map((h) => `<p class="leiste-hinweis">${esc(h)}</p>`).join('')}
    </div>`;
  }).join('');

  return `<section class="abschnitt">
    <h2>Alle Tage</h2>
    ${bloecke}
    <ul class="leiste-legende">
      <li>VB Volleyball</li>
      <li>MA Match</li>
      <li>KA Kraft A</li>
      <li>KB Kraft B</li>
      <li>Reg Pause</li>
      <li>Ktr Kontrolltag</li>
      <li>Ausw Auswertung</li>
    </ul>
    <ul class="leiste-legende">
      <li>${ZONEN_ZEICHEN.gruen} grün</li>
      <li>${ZONEN_ZEICHEN.gelb} gelb</li>
      <li>${ZONEN_ZEICHEN.rot} rot</li>
      <li>${ZONEN_ZEICHEN.offen} kein Eintrag</li>
    </ul>
    <p class="leise">Tippen öffnet den Tag, der Wochentitel öffnet die Wochenplanung.</p>
  </section>`;
}

export function bindeLeiste(ziel, beiWoche) {
  ziel.querySelectorAll('.leiste-feld[data-datum]').forEach((feld) => {
    feld.addEventListener('click', () => setzeDatum(feld.dataset.datum));
  });
  ziel.querySelectorAll('.leiste-kopf[data-woche]').forEach((kopf) => {
    kopf.addEventListener('click', () => beiWoche?.(kopf.dataset.woche));
  });
}
