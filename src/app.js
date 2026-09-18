// Einstiegspunkt. Start ist "Heute"; der Verlauf trägt die eine Linie und die
// 14-Tage-Leiste, der Plan das Nachschlagewerk.

import { PLAN } from './plan-data.js';
import { REIHEN, reihenDaten, svgVerlauf } from './chart.js';
import {
  zustand, registriereZeichner, aktualisiere, alleEintraege,
  aktuellesDatum, setzeDatum, wechsleAnsicht
} from './state.js';
import { zeichneHeute } from './view-today.js';
import { tagesLeisteMarkup, bindeLeiste } from './view-overview.js';
import { zeichnePlan, warnzeichenInhalt } from './view-reference.js';
import { esc } from './ui.js';

function zeichneVerlauf(ziel) {
  const daten = reihenDaten(alleEintraege(), PLAN.tage);
  const erfasst = daten.reduce((summe, r) => summe + r.punkte.filter((p) => p.wert !== null).length, 0);
  const sichtbar = zustand.nurMorgen ? REIHEN.slice(0, 1) : REIHEN;

  ziel.innerHTML = `
    <section class="abschnitt">
      <h2>Morgenschmerz über die zwei Wochen</h2>
      <p class="leise">Der höhere Wert aus Ruhe und Treppenabwärtsgehen. Diese Reihe
        zeigt am deutlichsten, ob es besser oder schlechter wird.</p>
      <div class="diagramm">${svgVerlauf(daten, PLAN.tage, { breite: 360, hoehe: 200, nurMorgen: zustand.nurMorgen })}</div>
      ${zustand.nurMorgen ? '' : `<ul class="legende">
        ${sichtbar.map((r) => `<li class="legende-${r.schluessel}">${esc(r.name)}</li>`).join('')}
      </ul>`}
      <label class="schalter" for="schalter-alle">
        <input type="checkbox" id="schalter-alle"${zustand.nurMorgen ? '' : ' checked'}>
        Alle vier Messpunkte zeigen
      </label>
      ${erfasst === 0 ? '<p class="leise">Noch keine Werte erfasst.</p>' : ''}
    </section>
    ${tagesLeisteMarkup()}
  `;

  ziel.querySelector('#schalter-alle').addEventListener('change', (ereignis) => {
    zustand.nurMorgen = !ereignis.target.checked;
    aktualisiere();
  });
  ziel.querySelectorAll('circle[data-datum]').forEach((punkt) => {
    punkt.addEventListener('click', () => setzeDatum(punkt.dataset.datum));
  });
  bindeLeiste(ziel);
}

const ANSICHTEN = {
  heute: (ziel) => zeichneHeute(ziel, aktuellesDatum()),
  verlauf: zeichneVerlauf,
  plan: zeichnePlan
};

// Jede Ansicht bekommt einen frischen Wrapper. Damit verschwinden die
// delegierten Ereignisbehandlungen der Views mit ihrem Container, statt sich
// bei jedem Neuzeichnen auf #inhalt zu stapeln.
function zeichne() {
  const behaelter = document.getElementById('inhalt');
  const ziel = document.createElement('div');
  ziel.className = 'ansicht';
  ANSICHTEN[zustand.ansicht](ziel);
  behaelter.replaceChildren(ziel);
  document.querySelectorAll('#nav button').forEach((knopf) => {
    if (knopf.dataset.ansicht === zustand.ansicht) knopf.setAttribute('aria-current', 'page');
    else knopf.removeAttribute('aria-current');
  });
}

registriereZeichner(zeichne);

document.getElementById('nav').addEventListener('click', (ereignis) => {
  const knopf = ereignis.target.closest('button[data-ansicht]');
  if (!knopf) return;
  wechsleAnsicht(knopf.dataset.ansicht);
  window.scrollTo({ top: 0 });
});

// Sicherung: lesbarer Text zum Kopieren, dazu die Wiederherstellung.
const dialogSicherung = document.getElementById('dialog-sicherung');
document.getElementById('knopf-sicherung').addEventListener('click', () => {
  dialogSicherung.innerHTML = `
    <form method="dialog" class="dialog-inhalt">
      <h2>Daten sichern</h2>
      <p>Diesen Text kopieren und an einem sicheren Ort ablegen. Er dient auch als
        Ausdruck für die Physiotherapie. Die Daten liegen nur auf diesem Gerät und
        können verloren gehen, wenn du die Website-Daten löschst.</p>
      <textarea id="sicherung-text" rows="9" readonly></textarea>
      <h3>Wiederherstellen</h3>
      <p>Einen früher gesicherten Text hier einfügen. Der bisherige Bestand wird
        dabei ersetzt.</p>
      <textarea id="wiederherstellen-text" rows="3" placeholder="Sicherungstext einfügen"></textarea>
      <p class="fehler" id="sicherung-fehler" hidden></p>
      <menu>
        <button type="button" id="knopf-wiederherstellen">Wiederherstellen</button>
        <button value="zu" class="haupt">Schliessen</button>
      </menu>
    </form>`;
  dialogSicherung.querySelector('#sicherung-text').value = zustand.speicher.alsText();

  dialogSicherung.querySelector('#knopf-wiederherstellen').addEventListener('click', () => {
    const feld = dialogSicherung.querySelector('#wiederherstellen-text');
    const meldung = dialogSicherung.querySelector('#sicherung-fehler');
    const ergebnis = zustand.speicher.ausText(feld.value);
    if (!ergebnis.ok) {
      meldung.textContent = ergebnis.fehler;
      meldung.hidden = false;
      return;
    }
    zustand.speicher.schreib(ergebnis.zustand);
    dialogSicherung.close();
    aktualisiere();
  });

  dialogSicherung.showModal();
});

const dialogWarn = document.getElementById('dialog-warnzeichen');
document.getElementById('knopf-warnzeichen').addEventListener('click', () => {
  dialogWarn.innerHTML = warnzeichenInhalt();
  dialogWarn.showModal();
});

if (!zustand.speicher.verfuegbar) {
  const hinweis = document.getElementById('hinweis-speicher');
  hinweis.textContent = 'Dieses Gerät erlaubt keinen Website-Speicher. Die App funktioniert, die Eingaben werden aber beim Schliessen nicht behalten.';
  hinweis.hidden = false;
}

zustand.ansicht = 'heute';
zeichne();
