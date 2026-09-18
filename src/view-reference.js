// Nachschlagewerk und Warnzeichen. Alles im Wortlaut der Plandaten.

import { PLAN } from './plan-data.js';
import { esc, liste } from './ui.js';

const zonenkarte = (schluessel, zone) => `<div class="zonenkarte zonenkarte-${schluessel}">
  <h4>${esc(zone.name)}</h4>
  ${liste(zone.merkmale)}
  <p class="konsequenz">${esc(zone.konsequenz)}</p>
</div>`;

export function zeichnePlan(ziel) {
  ziel.innerHTML = `
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
