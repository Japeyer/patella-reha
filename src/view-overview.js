// Die Tagesleiste: ein Feld pro Plantag mit Ampelfarbe, Kürzel und Zeichen,
// gruppiert nach Wochen. Wächst mit, wenn Wochen angefügt oder angepasst werden.

import { zoneFuerTag } from './logic.js';
import { sprungZone, normalwert } from './sprung-logik.js';
import { eintragFuer, folgeMorgenFuer, setzeDatum, heutigerPlantag, wochen, alleEintraege } from './state.js';
import {
  esc, TYP_KUERZEL, ZONEN_ZEICHEN, ZONEN_NAME, TYP_NAME, SPRUNG_TYP_KUERZEL, SPRUNG_TYP_GROSS
} from './ui.js';
import { wochentagIndex, wochentagVon } from './datum.js';

export function tagesZone(datum) {
  return zoneFuerTag(eintragFuer(datum), folgeMorgenFuer(datum));
}

// Im Sprungkraft-Block bewertet die Ampel den Morgen des Tages selbst.
function zoneFuer(tag) {
  if (tag.block !== 'sprung') return tagesZone(tag.datum);
  const eintraege = alleEintraege();
  return sprungZone(eintraege[tag.datum], normalwert(eintraege, tag.datum));
}

const WOCHENTAG_KUERZEL = {
  Montag: 'Mo', Dienstag: 'Di', Mittwoch: 'Mi', Donnerstag: 'Do',
  Freitag: 'Fr', Samstag: 'Sa', Sonntag: 'So'
};

function wochenTitel(woche) {
  if (woche.block === 'sprung') return woche.titel;
  if (woche.woche === 0) return 'Vorlauf ab Freitag, 18. September';
  if (woche.woche === 1) return 'Woche 1: Belastung beruhigen und Kraft einführen';
  if (woche.woche === 2) return 'Woche 2: Vorsichtige Progression';
  return `Woche ${woche.woche}`;
}

export function tagesLeisteMarkup(block = 'reha') {
  const heute = heutigerPlantag().datum;
  const sprung = block === 'sprung';

  const bloecke = wochen().filter((w) => w.block === block).map((woche) => {
    // Eine angebrochene Woche wird auf ihre Wochentagsspalten geschoben, damit
    // die Leiste als Kalender lesbar bleibt.
    const versatz = wochentagIndex(woche.tage[0].datum);
    const leer = Array.from({ length: versatz },
      () => '<div class="leiste-feld leer" aria-hidden="true"></div>').join('');

    const felder = woche.tage.map((tag) => {
      const befund = zoneFuer(tag);
      const istHeute = tag.datum === heute;
      const kuerzel = WOCHENTAG_KUERZEL[wochentagVon(tag.datum)];
      const artName = sprung ? SPRUNG_TYP_GROSS[tag.typ] : (TYP_NAME[tag.typ] ?? tag.typ);
      const artKuerzel = sprung ? SPRUNG_TYP_KUERZEL[tag.typ] : (TYP_KUERZEL[tag.typ] ?? '?');
      return `<button type="button" class="leiste-feld zone-feld-${befund.zone}${istHeute ? ' heute' : ''}"
        data-datum="${tag.datum}"
        title="${esc(tag.titel)} — ${ZONEN_NAME[befund.zone]}"
        aria-label="${kuerzel} ${Number(tag.datum.slice(8))}., ${esc(artName)}, ${ZONEN_NAME[befund.zone]}">
        <span class="leiste-wochentag">${kuerzel}</span>
        <span class="leiste-tag">${Number(tag.datum.slice(8))}.</span>
        <span class="leiste-kuerzel">${esc(artKuerzel)}</span>
        <span class="leiste-zeichen" aria-hidden="true">${ZONEN_ZEICHEN[befund.zone]}</span>
      </button>`;
    }).join('');

    if (sprung) {
      return `<div class="leiste-woche">
        <p class="eyebrow">${esc(wochenTitel(woche))}</p>
        <div class="leiste">${leer}${felder}</div>
      </div>`;
    }

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

  const zonenLegende = `<ul class="leiste-legende">
      <li>${ZONEN_ZEICHEN.gruen} grün</li>
      <li>${ZONEN_ZEICHEN.gelb} gelb</li>
      <li>${ZONEN_ZEICHEN.rot} rot</li>
      <li>${ZONEN_ZEICHEN.offen} kein Eintrag</li>
    </ul>`;

  if (sprung) {
    return `<section class="abschnitt">
      <h2>Alle Tage</h2>
      ${bloecke}
      <ul class="leiste-legende">
        <li>SP Spiel</li>
        <li>VB Volleyball</li>
        <li>B Beintag</li>
        <li>B+V Beintag + Volleyball</li>
        <li>Reg Regeneration</li>
        <li>Test Sprungtest</li>
        <li>E Eigene</li>
      </ul>
      ${zonenLegende}
    </section>`;
  }

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
