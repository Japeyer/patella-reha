// Nachschlagewerk und Warnzeichen. Alles im Wortlaut der Plandaten.

import { PLAN } from './plan-data.js';
import { esc, liste } from './ui.js';
import { zustand, schliesseWoche, oeffneWoche } from './state.js';
import {
  wochenEditorMarkup, bindeWochenEditor, wocheAnfuegenMarkup, bindeWocheAnfuegen
} from './view-woche.js';
import { wochen } from './state.js';
import { datumLang } from './datum.js';

const zonenkarte = (schluessel, zone) => `<div class="zonenkarte zonenkarte-${schluessel}">
  <h4>${esc(zone.name)}</h4>
  ${liste(zone.merkmale)}
  <p class="konsequenz">${esc(zone.konsequenz)}</p>
</div>`;

function wochenUebersichtMarkup() {
  const liste = wochen().map((w) => `<button type="button" class="wochenzeile" data-woche="${w.montag}">
      <span class="wochenzeile-name">Woche ${w.woche}${w.angepasst ? ' · angepasst' : ''}</span>
      <span class="wochenzeile-datum">ab ${esc(datumLang(w.montag))}</span>
    </button>`).join('');
  return `<section class="abschnitt">
    <h2>Wochenplanung</h2>
    <p class="leise">Verschiebt sich ein Training wegen eines Matches oder einer
      geänderten Hallenzeit, setze hier die Volleyballtage neu — Kraft und
      Regeneration ordnen sich an.</p>
    ${liste}
  </section>`;
}

export function zeichnePlan(ziel) {
  // Ist eine Woche offen, tritt der Editor an die Stelle des Nachschlagewerks.
  if (zustand.offeneWoche) {
    ziel.innerHTML = wochenEditorMarkup(zustand.offeneWoche);
    bindeWochenEditor(ziel, zustand.offeneWoche, schliesseWoche);
    return;
  }

  ziel.innerHTML = `${wochenUebersichtMarkup()}${wocheAnfuegenMarkup()}` + `
    <section class="abschnitt">
      <h2>${esc(PLAN.titel)}</h2>
      <p class="leise">${esc(PLAN.zeitraum.text)}</p>
      <p class="leise">${esc(PLAN.volleyballTage)}</p>
      <p>${esc(PLAN.ziele)}</p>
    </section>

    <section class="abschnitt">
      <details open>
        <summary>${esc(PLAN.zonenTitel)}</summary>
        ${zonenkarte('gruen', PLAN.zonen.gruen)}
        ${zonenkarte('gelb', PLAN.zonen.gelb)}
        ${zonenkarte('rot', PLAN.zonen.rot)}
        <p class="leise">${esc(PLAN.zonenHinweis)}</p>
      </details>

      <details>
        <summary>${esc(PLAN.volleyballRegeln.titel)}</summary>
        <h4>${esc(PLAN.volleyballRegeln.teilnahmeTitel)}</h4>
        <p class="eyebrow">${esc(PLAN.volleyballRegeln.vorDemAufwaermenTitel)}</p>
        ${liste(PLAN.volleyballRegeln.vorDemAufwaermen)}
        <p class="eyebrow">${esc(PLAN.volleyballRegeln.teilnahmeErlaubtTitel)}</p>
        ${liste(PLAN.volleyballRegeln.teilnahmeErlaubtWenn)}
        <p class="eyebrow">${esc(PLAN.volleyballRegeln.keineSpruengeTitel)}</p>
        ${liste(PLAN.volleyballRegeln.keineSpruengeWenn)}
        <p>${esc(PLAN.volleyballRegeln.sonstNurText)}</p>
        <h4>${esc(PLAN.volleyballRegeln.erlaubtTitel)}</h4>
        ${liste(PLAN.volleyballRegeln.erlaubt)}
        <h4>${esc(PLAN.volleyballRegeln.nichtErlaubtTitel)}</h4>
        ${liste(PLAN.volleyballRegeln.nichtErlaubt)}
      </details>

      <details>
        <summary>${esc(PLAN.fortschrittTitel)}</summary>
        ${liste(PLAN.fortschrittskriterien)}
      </details>

      <details>
        <summary>${esc(PLAN.ernaehrungTitel)}</summary>
        ${liste(PLAN.ernaehrung)}
      </details>

      <details>
        <summary>${esc(PLAN.grundlageTitel)}</summary>
        <p>${esc(PLAN.grundlage)}</p>
        <p class="eyebrow">${esc(PLAN.quellenTitel)}</p>
        ${liste(PLAN.quellen, 'quellen')}
      </details>

      <details>
        <summary>${esc(PLAN.warnzeichenTitel)}</summary>
        ${liste(PLAN.warnzeichen, 'warnliste')}
      </details>
    </section>
  `;

  ziel.querySelectorAll('.wochenzeile[data-woche]').forEach((zeile) => {
    zeile.addEventListener('click', () => oeffneWoche(zeile.dataset.woche));
  });
  bindeWocheAnfuegen(ziel, (montag) => oeffneWoche(montag));
}

export function warnzeichenInhalt() {
  return `<form method="dialog" class="dialog-inhalt">
    <h2>${esc(PLAN.warnzeichenTitel)}</h2>
    ${liste(PLAN.warnzeichen, 'warnliste')}
    <p class="leise">Diese App ersetzt keine ärztliche Beurteilung. Bei einem dieser
      Zeichen sieht der Plan eine zeitnahe Abklärung vor.</p>
    <menu>
      <button value="zu" class="haupt">Schliessen</button>
    </menu>
  </form>`;
}
