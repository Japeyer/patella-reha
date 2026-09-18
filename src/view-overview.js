// Die 14-Tage-Leiste: ein Streifen pro Plantag mit Ampelfarbe, Kürzel und
// Zeichen. Der Plan ist genau zwei Wochen lang, deshalb ersetzt dieser Streifen
// eine Wochen- und eine Monatsansicht vollständig.

import { PLAN } from './plan-data.js';
import { zoneFuerTag } from './logic.js';
import { eintragFuer, folgeMorgenFuer, setzeDatum, heutigerPlantag } from './state.js';
import { esc, TYP_KUERZEL, ZONEN_ZEICHEN, ZONEN_NAME, TYP_NAME } from './ui.js';

export function tagesZone(datum) {
  return zoneFuerTag(eintragFuer(datum), folgeMorgenFuer(datum));
}

const WOCHENTAG_KUERZEL = {
  Montag: 'Mo', Dienstag: 'Di', Mittwoch: 'Mi', Donnerstag: 'Do',
  Freitag: 'Fr', Samstag: 'Sa', Sonntag: 'So'
};

export function tagesLeisteMarkup() {
  const heute = heutigerPlantag().datum;
  const wochen = PLAN.wochen.map((woche) => {
    const tage = PLAN.tage.filter((t) => t.woche === woche.nummer);
    const felder = tage.map((tag) => {
      const befund = tagesZone(tag.datum);
      const istHeute = tag.datum === heute;
      return `<button type="button" class="leiste-feld zone-feld-${befund.zone}${istHeute ? ' heute' : ''}"
        data-datum="${tag.datum}"
        title="${esc(tag.titel)} — ${ZONEN_NAME[befund.zone]}"
        aria-label="${esc(WOCHENTAG_KUERZEL[tag.wochentag])} ${esc(tag.datum.slice(8))}., ${esc(TYP_NAME[tag.typ])}, ${ZONEN_NAME[befund.zone]}">
        <span class="leiste-wochentag">${WOCHENTAG_KUERZEL[tag.wochentag]}</span>
        <span class="leiste-tag">${Number(tag.datum.slice(8))}.</span>
        <span class="leiste-kuerzel">${TYP_KUERZEL[tag.typ]}</span>
        <span class="leiste-zeichen" aria-hidden="true">${ZONEN_ZEICHEN[befund.zone]}</span>
      </button>`;
    }).join('');
    return `<div class="leiste-woche">
      <p class="eyebrow">${esc(woche.titel)}</p>
      <div class="leiste">${felder}</div>
    </div>`;
  }).join('');

  return `<section class="abschnitt">
    <h2>Die zwei Wochen</h2>
    ${wochen}
    <ul class="leiste-legende">
      <li>VB Volleyball</li>
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
    <p class="leise">Tippen öffnet den Tag.</p>
  </section>`;
}

export function bindeLeiste(ziel) {
  ziel.querySelectorAll('.leiste-feld[data-datum]').forEach((feld) => {
    feld.addEventListener('click', () => setzeDatum(feld.dataset.datum));
  });
}
