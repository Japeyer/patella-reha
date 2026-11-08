// Plan-Ansicht des Sprungkraft-Blocks: Uebersichtstabelle, Wochen mit ihren
// Tagen (tippen oeffnet den Tag), Spiele und der Nachschlag. Alles im
// Wortlaut der Plandaten.

import { SPRUNG } from './sprung-data.js';
import { wochen, heutigerPlantag, setzeDatum } from './state.js';
import { esc, liste, datumKurz } from './ui.js';
import { wochentagVon } from './datum.js';

const K = SPRUNG.kontrollsystem;

function tabelle() {
  const u = SPRUNG.uebersicht;
  return `<div class="tabelle-rahmen">
    <table class="uebersicht">
      <thead><tr>${u.kopf.map((k) => `<th scope="col">${esc(k)}</th>`).join('')}</tr></thead>
      <tbody>${u.zeilen.map((z) => `<tr>${z.map((zelle, i) => (i === 0
        ? `<th scope="row">${esc(zelle)}</th>`
        : `<td>${esc(zelle)}</td>`)).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>
  <p class="leise">${esc(u.fussnote)}</p>`;
}

function einheitKurz(e) {
  const teile = [e.titel + (e.zeit ? ` ${e.zeit}` : '')];
  if (e.uebungen?.length) teile.push(e.uebungen.map((u) => `${u.name} ${u.angabe}`).join(', '));
  const marke = e.ausgefallen ? ' (fällt aus)' : e.verschoben ? ' (verschoben)' : e.eingefuegt ? ' (eingefügt)' : '';
  return teile.join(': ') + marke;
}

function wochenMarkup() {
  const heute = heutigerPlantag();
  return wochen().filter((w) => w.block === 'sprung').map((w) => {
    const offen = heute.block === 'sprung' && heute.woche === w.woche;
    const zeilen = w.tage.filter((t) => t.einheiten.length).map((t) => `<button type="button" class="planzeile" data-datum="${t.datum}">
        <span class="planzeile-datum">${esc(wochentagVon(t.datum).slice(0, 2))} ${esc(datumKurz(t.datum))}</span>
        <span class="planzeile-inhalt">${t.einheiten.map((e) => `<span${e.ausgefallen ? ' class="gestrichen"' : ''}>${esc(einheitKurz(e))}</span>`).join('')}</span>
      </button>`).join('');
    return `<details${offen ? ' open' : ''}>
      <summary>${esc(w.titel)}</summary>
      ${w.texte.length ? liste(w.texte, 'blank') : ''}
      ${zeilen}
    </details>`;
  }).join('');
}

function spieleMarkup() {
  const spiele = wochen().filter((w) => w.block === 'sprung')
    .flatMap((w) => w.tage.flatMap((t) => t.einheiten.filter((e) => e.art === 'spiel')));
  return liste(spiele.map((e) => `${wochentagVon(e.datum).slice(0, 2)} ${datumKurz(e.datum)}${e.zeit ? ` ${e.zeit}` : ''}`
    + (e.ausgefallen ? ' (fällt aus)' : e.eingefuegt ? ' (eingefügt)' : '')), 'blank');
}

function grundform(g) {
  return `${liste(g.texte, 'blank')}
    <ul class="blank">${g.uebungen.map((u) => `<li><strong>${esc(u.name)}</strong> ${esc(u.angabe)}${
      u.hinweise?.length ? ` · ${esc(u.hinweise.join(' '))}` : ''}</li>`).join('')}</ul>
    ${g.schluss.length ? liste(g.schluss, 'blank') : ''}`;
}

const zonenkarte = (z, name) => `<div class="zonenkarte zonenkarte-${z}">
  <h4>${esc(name)}: ${esc(K[z].bedingung)}</h4>
  ${liste(K[z].konsequenz)}
</div>`;

export function sprungPlanMarkup() {
  return `<section class="abschnitt">
      <h2>${esc(SPRUNG.titel)}</h2>
      <h3>${esc(SPRUNG.uebersicht.titel)}</h3>
      ${tabelle()}
    </section>

    <section class="abschnitt">
      <h2>Wochen</h2>
      ${wochenMarkup()}
    </section>

    <section class="abschnitt">
      <h2>Spiele</h2>
      ${spieleMarkup()}
    </section>

    <section class="abschnitt">
      <details>
        <summary>Ausgangslage</summary>
        <p>${esc(SPRUNG.einleitung)}</p>
        <p>${esc(SPRUNG.volleyballText)}</p>
        <p class="eyebrow">${esc(SPRUNG.grundstruktur.titel)}</p>
        <p>${esc(SPRUNG.grundstruktur.einleitung)}</p>
        ${liste(SPRUNG.grundstruktur.uebungen)}
        <p>${esc(SPRUNG.grundstruktur.schluss)}</p>
      </details>
      <details>
        <summary>${esc(SPRUNG.prioritaeten.titel)}</summary>
        <ol>${SPRUNG.prioritaeten.punkte.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
        <p>${esc(SPRUNG.prioritaeten.fehler)}</p>
      </details>
      <details>
        <summary>${esc(SPRUNG.grundformen.A.titel)}</summary>
        ${grundform(SPRUNG.grundformen.A)}
      </details>
      <details>
        <summary>${esc(SPRUNG.grundformen.B.titel)}</summary>
        ${grundform(SPRUNG.grundformen.B)}
      </details>
      <details open>
        <summary>${esc(K.titel)}</summary>
        <p>${esc(K.einleitung)}</p>
        <p class="eyebrow">${esc(K.zeitpunkt)}</p>
        ${zonenkarte('gruen', 'Grün')}
        ${zonenkarte('gelb', 'Gelb')}
        ${zonenkarte('rot', 'Rot')}
        ${K.hinweise.map((h) => `<p class="leise">${esc(h)}</p>`).join('')}
      </details>
      <details>
        <summary>${esc(SPRUNG.volumen.titel)}</summary>
        ${liste(SPRUNG.volumen.texte, 'blank')}
        ${liste(SPRUNG.volumen.liste)}
        ${liste(SPRUNG.volumen.schluss, 'blank')}
      </details>
      <details>
        <summary>${esc(SPRUNG.regeneration.titel)}</summary>
        ${liste(SPRUNG.regeneration.texte, 'blank')}
      </details>
      <details>
        <summary>${esc(SPRUNG.schlafErnaehrung.titel)}</summary>
        ${SPRUNG.schlafErnaehrung.texte.map((t) => `<p>${esc(t)}</p>`).join('')}
      </details>
      <details>
        <summary>${esc(SPRUNG.wichtigsteAenderung.titel)}</summary>
        ${liste(SPRUNG.wichtigsteAenderung.texte, 'blank')}
      </details>
      <details>
        <summary>${esc(SPRUNG.quellen.titel)}</summary>
        ${liste(SPRUNG.quellen.liste, 'quellen')}
      </details>
    </section>`;
}

export function bindeSprungPlan(ziel) {
  ziel.querySelectorAll('.planzeile[data-datum]').forEach((zeile) => {
    zeile.addEventListener('click', () => setzeDatum(zeile.dataset.datum));
  });
}
