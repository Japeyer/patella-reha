// Wochenplanung: Volleyballtage setzen, den Rest rechnet die App.
//
// Der Entwurf wird sofort mitgerechnet und angezeigt, damit vor dem Übernehmen
// sichtbar ist, was daraus folgt - einschliesslich der Regeln, die eine
// Verschiebung nicht mehr zulässt.

import { planeWoche, ROLLE, REGELN } from './schedule.js';
import { wochenNummer, phaseFuerWoche } from './kalender.js';
import { wochenTage, wochentagVon, datumKurz, datumLang } from './datum.js';
import {
  zustand, belastungenFuer, wocheAngepasst, setzeWoche, wocheZuruecksetzen,
  wocheAnfuegen, aktualisiere, wochen
} from './state.js';
import { esc } from './ui.js';

const ROLLE_NAME = {
  [ROLLE.volleyball]: 'Volleyball',
  [ROLLE.match]: 'Match',
  [ROLLE.kraft]: 'Kraft',
  [ROLLE.regeneration]: 'Pause',
  [ROLLE.kontrolle]: 'Kontrolle'
};

// Der Entwurf liegt im Zustand, nicht im Speicher: erst Übernehmen schreibt ihn.
function entwurfFuer(montag) {
  if (zustand.wochenEntwurf?.montag !== montag) {
    zustand.wochenEntwurf = { montag, belastungen: { ...belastungenFuer(montag) } };
  }
  return zustand.wochenEntwurf;
}

function vortagRolleVor(montag) {
  const alle = wochen();
  const index = alle.findIndex((w) => w.montag === montag);
  if (index <= 0) return null;
  const vorwoche = alle[index - 1];
  const letzter = vorwoche.tage[vorwoche.tage.length - 1];
  if (!letzter) return null;
  if (letzter.typ === 'match') return ROLLE.match;
  if (letzter.typ.startsWith('volleyball')) return ROLLE.volleyball;
  if (letzter.typ.startsWith('kraft')) return ROLLE.kraft;
  return ROLLE.regeneration;
}

export function wochenEditorMarkup(montag) {
  const entwurf = entwurfFuer(montag);
  const tage = wochenTage(montag);
  const ergebnis = planeWoche(montag, entwurf.belastungen, vortagRolleVor(montag));
  const nummer = wochenNummer(montag);
  const phase = phaseFuerWoche(montag);

  const schalter = tage.map((datum) => {
    const gesetzt = entwurf.belastungen[datum] ?? null;
    return `<div class="wtag">
      <span class="wtag-name">${wochentagVon(datum).slice(0, 2)} ${esc(datumKurz(datum))}</span>
      <div class="wtag-schalter" role="group" aria-label="${esc(wochentagVon(datum))}">
        <button type="button" data-datum="${datum}" data-setzen="volleyball"
          aria-pressed="${gesetzt === ROLLE.volleyball}">Training</button>
        <button type="button" data-datum="${datum}" data-setzen="match"
          aria-pressed="${gesetzt === ROLLE.match}">Match</button>
        <button type="button" data-datum="${datum}" data-setzen="frei"
          aria-pressed="${gesetzt === null}">frei</button>
      </div>
    </div>`;
  }).join('');

  const vorschau = ergebnis.tage.map(({ datum, rolle }) => `<li class="vorschau-tag rolle-${rolle}">
      <span class="vorschau-wochentag">${wochentagVon(datum).slice(0, 2)}</span>
      <span class="vorschau-rolle">${ROLLE_NAME[rolle]}</span>
    </li>`).join('');

  return `<section class="abschnitt">
    <h2>Woche ${nummer} anpassen</h2>
    <p class="leise">${esc(datumLang(montag))} bis ${esc(datumLang(tage[6]))}
      · Umfänge nach Woche ${phase}</p>
    <p class="leise">Setze, an welchen Tagen Volleyball ist. Kraft, Pause und
      Kontrolltag verteilt die App so, dass die Abstände des Plans gewahrt bleiben.</p>

    <div class="wtage">${schalter}</div>

    <h3>Ergibt diese Woche</h3>
    <ul class="vorschau">${vorschau}</ul>

    ${ergebnis.hinweise.length
      ? `<div class="warnkasten">
           <p class="eyebrow">Nicht alle Regeln einhaltbar</p>
           ${ergebnis.hinweise.map((h) => `<p>${esc(h)}</p>`).join('')}
         </div>`
      : '<p class="meldung">Alle Abstandsregeln des Plans bleiben gewahrt.</p>'}

    <details>
      <summary>Nach welchen Regeln wird verteilt?</summary>
      <ul>${Object.values(REGELN).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      <p class="leise">Diese Regeln sind nicht erfunden: sie sind die Wochenstruktur
        des Plandokuments — Montag und Mittwoch Volleyball, Donnerstag und Samstag
        Kraft, Sonntag Kontrolltag — ausgeschrieben.</p>
    </details>

    <menu class="wochen-knoepfe">
      <button type="button" id="woche-uebernehmen" class="haupt">Übernehmen</button>
      <button type="button" id="woche-verwerfen">Verwerfen</button>
      ${wocheAngepasst(montag)
        ? '<button type="button" id="woche-zuruecksetzen">Auf Planvorgabe zurücksetzen</button>'
        : ''}
    </menu>
  </section>`;
}

export function bindeWochenEditor(ziel, montag, beiFertig) {
  ziel.querySelectorAll('.wtag-schalter button').forEach((knopf) => {
    knopf.addEventListener('click', () => {
      const entwurf = entwurfFuer(montag);
      const { datum, setzen } = knopf.dataset;
      if (setzen === 'frei') delete entwurf.belastungen[datum];
      else entwurf.belastungen[datum] = setzen;
      aktualisiere();
    });
  });

  ziel.querySelector('#woche-uebernehmen')?.addEventListener('click', () => {
    setzeWoche(montag, { ...entwurfFuer(montag).belastungen });
    zustand.wochenEntwurf = null;
    beiFertig?.();
  });

  ziel.querySelector('#woche-verwerfen')?.addEventListener('click', () => {
    zustand.wochenEntwurf = null;
    beiFertig?.();
  });

  ziel.querySelector('#woche-zuruecksetzen')?.addEventListener('click', () => {
    wocheZuruecksetzen(montag);
    zustand.wochenEntwurf = null;
    beiFertig?.();
  });
}

export function wocheAnfuegenMarkup() {
  return `<section class="abschnitt">
    <h3>Der Plan reicht weiter als zwei Wochen?</h3>
    <p class="leise">Eine angefügte Woche übernimmt die Umfänge der Woche 2
      unverändert: 15 bis 25 Sprünge, 70 bis 80 Prozent Trainingsdauer. Die App
      steigert nichts von selbst — dein Plandokument endet am 4. Oktober und
      nennt für die Zeit danach keine Zahlen.</p>
    <p class="leise">Es sieht vor, bei ungünstiger Entwicklung Diagnose und
      Belastungsplanung sportmedizinisch überprüfen zu lassen.</p>
    <button type="button" class="fuss-knopf" id="woche-anfuegen">Woche anfügen</button>
  </section>`;
}

export function bindeWocheAnfuegen(ziel, beiAngefuegt) {
  ziel.querySelector('#woche-anfuegen')?.addEventListener('click', () => {
    const montag = wocheAnfuegen();
    beiAngefuegt?.(montag);
  });
}
