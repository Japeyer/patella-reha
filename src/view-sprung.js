// Ansicht "Heute" fuer Tage des Sprungkraft-Blocks. Reihenfolge:
//   1. Was ist heute: Tagesart gross.
//   2. Heute gilt: Ampel des Kontrollsystems und die Verbote des Tages.
//   3. Schmerz erfassen: Morgen, an Belastungstagen Abend.
//   4. Einheiten: Kraft mit Saetzen zum Abhaken, Verschieben, Einfuegen.
//   5. Mehr zum Tag: Wochentexte, Kontrollsystem, Festlegungen.

import { SPRUNG } from './sprung-data.js';
import {
  SPRUNG_START, SPRUNG_ENDE, satzZahl, normalwert, heuteGilt, regelHinweise,
  hinweiseNachAenderung, leitsaetze, hoheBelastung, effektiveEinheiten, verschiebe, fuegeEin
} from './sprung-logik.js';
import { ausgangsschmerz } from './logic.js';
import {
  zustand, alleEintraege, eintragFuer, sprungZustand, setzeWert, setzeDatum,
  oeffneMesspunkt, heutigerPlantag, aktualisiere
} from './state.js';
import {
  verschiebeEinheit, einheitAusfallen, einheitEntfernen, einheitEinfuegen, satzSetzen, sprungtestSetzen
} from './sprung-state.js';
import {
  esc, schmerzFeld, jaNeinFeld, liste, sprungStufenZone, SPRUNG_TYP_GROSS, datumLang, datumKurz
} from './ui.js';

const K = SPRUNG.kontrollsystem;
const SPRUNGUEBUNG = /(CMJ|Approach Jump|Drop Jump)/;
const ZONEN_KLASSE = { gruen: 'antwort-ja', gelb: 'antwort-gelb', rot: 'antwort-nein' };
const RIR_TEXT = 'Reps in Reserve: so viele Wiederholungen wären am Ende des Satzes noch möglich.';

const EINFUEGBAR = [
  { schluessel: 'spiel', art: 'spiel', name: 'Spiel' },
  { schluessel: 'volleyball', art: 'volleyball', name: 'Volleyball' },
  { schluessel: 'kraft-a', art: 'kraft', grundform: 'A', name: 'Beintag A' },
  { schluessel: 'kraft-b', art: 'kraft', grundform: 'B', name: 'Beintag B' },
  { schluessel: 'regeneration', art: 'regeneration', name: 'Regeneration' },
  { schluessel: 'eigene', art: 'eigene', name: 'Eigene' }
];

const zahl = (n) => String(n).replace('.', ',');

// --- 1. Kopf ---

function kopf(tag, liste, i) {
  const istHeute = tag.datum === heutigerPlantag().datum;
  const spiel = tag.einheiten.find((e) => e.art === 'spiel' && !e.ausgefallen);
  const art = SPRUNG_TYP_GROSS[tag.typ] + (spiel?.zeit ? ` ${spiel.zeit}` : '');
  return `<section class="heute-kopf">
    <div class="tagnav">
      <button type="button" id="tag-zurueck" aria-label="Vorheriger Tag" ${i === 0 ? 'disabled' : ''}>‹</button>
      <div class="tagnav-mitte">
        <p class="eyebrow">${istHeute ? 'Heute' : esc(tag.wochentag)} · ${esc(datumLang(tag.datum))}</p>
        <p class="tagesart">${esc(art)}</p>
        <p class="tagesart-zusatz">${tag.woche === 0 ? 'Vorgeschichte' : `Woche ${tag.woche}`}</p>
      </div>
      <button type="button" id="tag-vor" aria-label="Nächster Tag" ${i === liste.length - 1 ? 'disabled' : ''}>›</button>
    </div>
  </section>`;
}

// --- 2. Heute gilt ---

function giltBlock(tag, gilt) {
  const istHeute = tag.datum === heutigerPlantag().datum;
  const titel = istHeute ? 'Heute gilt' : `Gilt am ${datumKurz(tag.datum)}`;
  const verbote = leitsaetze(tag.einheiten);
  const verboteListe = verbote.length ? liste(verbote, 'kreuz') : '';

  if (gilt.stufe !== 'zone') {
    return `<section class="antwort antwort-offen">
      <p class="eyebrow">${esc(titel)}</p>
      <p class="antwort-satz">Morgenwert fehlt</p>
      <button type="button" class="antwort-knopf" id="zum-morgen">Morgenwert eintragen</button>
      ${verboteListe}
    </section>`;
  }
  const stand = gilt.quelleDatum !== tag.datum ? ` · Stand ${datumKurz(gilt.quelleDatum)}` : '';
  const [satz, ...weitere] = gilt.konsequenz;
  return `<section class="antwort ${ZONEN_KLASSE[gilt.zone]}">
    <p class="eyebrow">${esc(titel)}${esc(stand)}</p>
    <p class="antwort-satz">${esc(satz)}</p>
    ${weitere.map((t) => `<p class="antwort-grund">${esc(t)}</p>`).join('')}
    <p class="antwort-grund">${esc(gilt.gruende.join(' · '))}</p>
    ${verboteListe}
  </section>`;
}

// --- 3. Schmerz erfassen ---

function messpunkte(tag) {
  const punkte = [{
    schluessel: 'morgen',
    titel: 'Morgen',
    // Die Ja/Nein-Frage gehoert dazu: sonst klappt der Morgen nach dem
    // Treppenwert zu, bevor ein Rot-Ausloeser beantwortet ist.
    vollstaendig: (e) => e.morgen.ruhe != null && e.morgen.treppe != null && e.beschwerdenZunehmend != null,
    kurz: (e) => {
      const a = ausgangsschmerz(e.morgen);
      if (a.wert == null && e.beschwerdenZunehmend !== true) return null;
      const teile = [`Ruhe ${e.morgen.ruhe ?? '—'} · Treppe ${e.morgen.treppe ?? '—'}`];
      if (e.beschwerdenZunehmend === true) teile.push('Beschwerden nehmen zu');
      return teile.join(' · ');
    },
    felder: (datum, e) => `
      ${schmerzFeld({ pfad: 'morgen.ruhe', beschriftung: 'Schmerz in Ruhe', wert: e.morgen.ruhe, id: `sm-${datum}-r`, stufe: sprungStufenZone })}
      ${schmerzFeld({ pfad: 'morgen.treppe', beschriftung: 'Schmerz beim Treppenabwärtsgehen', wert: e.morgen.treppe, id: `sm-${datum}-t`, stufe: sprungStufenZone })}
      ${jaNeinFeld({ pfad: 'beschwerdenZunehmend', beschriftung: 'Beschwerden nehmen zu', wert: e.beschwerdenZunehmend, id: `sm-${datum}-z` })}`
  }];
  if (hoheBelastung(tag.einheiten)) {
    punkte.push({
      schluessel: 'abend',
      titel: 'Abend',
      vollstaendig: (e) => e.abend?.schmerz != null,
      kurz: (e) => (e.abend?.schmerz == null ? null : `${e.abend.schmerz}/10`),
      felder: (datum, e) => schmerzFeld({
        pfad: 'abend.schmerz', beschriftung: 'Schmerz am Abend', wert: e.abend?.schmerz ?? null, id: `sa-${datum}`, stufe: sprungStufenZone
      })
    });
  }
  return punkte;
}

function erfassung(tag) {
  const e = eintragFuer(tag.datum);
  const punkte = messpunkte(tag);
  const ersterOffener = punkte.find((p) => !p.vollstaendig(e));
  const offen = punkte.some((p) => p.schluessel === zustand.offenerMesspunkt)
    ? zustand.offenerMesspunkt
    : ersterOffener?.schluessel ?? null;

  const teile = punkte.map((p) => {
    if (p.schluessel === offen) return `<fieldset><legend>${esc(p.titel)}</legend>${p.felder(tag.datum, e)}</fieldset>`;
    const kurz = p.kurz(e);
    return `<button type="button" class="messzeile${kurz ? ' erledigt' : ''}" data-messpunkt="${p.schluessel}">
      <span class="messzeile-titel">${esc(p.titel)}</span>
      <span class="messzeile-wert">${kurz ? esc(kurz) : 'offen'}</span>
    </button>`;
  });

  return `<section class="abschnitt">
    <h2>Schmerz erfassen</h2>
    ${teile.join('')}
    <div class="messfeld">
      <div class="messfeld-kopf"><label class="label" for="notiz">Notiz</label></div>
      <textarea id="notiz" rows="2">${esc(e.notiz)}</textarea>
    </div>
  </section>`;
}

// --- 4. Einheiten ---

function uebungKarte(einheit, uebung, index, zone, erledigt) {
  const saetze = satzZahl(uebung.angabe) ?? 0;
  const kaestchen = Array.from({ length: saetze }, (_, k) => {
    const nr = k + 1;
    return `<button type="button" class="satz" data-einheit="${esc(einheit.id)}" data-uebung="${index}" data-satz="${nr}"
      aria-pressed="${erledigt >= nr}" aria-label="${esc(uebung.name)}, Satz ${nr} von ${saetze}">${nr}</button>`;
  }).join('');
  const grundform = (uebung.ausGrundform ?? []).map((h) =>
    `<li>${esc(h.text)} <span class="herkunft">aus Beintag ${esc(h.aus)}</span></li>`).join('');
  const zonenHinweis = (zone === 'gelb' || zone === 'rot') && SPRUNGUEBUNG.test(uebung.name)
    ? `<p class="zonen-hinweis zonen-hinweis-${zone}">${esc(K[zone].konsequenz[0])}</p>` : '';
  return `<li class="uebungkarte">
    <div class="uebungkarte-kopf">
      <span class="name">${esc(uebung.name)}</span>
      <span class="angaben">${esc(uebung.angabe)}</span>
    </div>
    ${uebung.hinweise?.length || grundform
      ? `<ul class="hinweise">${(uebung.hinweise ?? []).map((h) => `<li>${esc(h)}</li>`).join('')}${grundform}</ul>` : ''}
    ${zonenHinweis}
    ${saetze ? `<div class="saetze" role="group" aria-label="Sätze ${esc(uebung.name)}">${kaestchen}</div>` : ''}
  </li>`;
}

function sprungtestTeil(einheit) {
  const werte = sprungZustand().sprungtest;
  const feld = (schluessel, name) => `<label class="bestwert">
      <span>${esc(name)}</span>
      <input type="number" inputmode="decimal" min="0" step="0.5" data-sprungtest="${schluessel}"
        value="${esc(werte[schluessel] ?? '')}" aria-label="Bestwert ${esc(name)} in Zentimetern">
      <span>cm</span>
    </label>`;
  return `${einheit.ablauf.map((b) => `<h4>${esc(b.titel)}</h4>${liste(b.zeilen, 'blank')}`).join('')}
    ${einheit.schluss.map((t) => `<p>${esc(t)}</p>`).join('')}
    <div class="bestwerte">${feld('approach', 'Approach Jump')}${feld('cmj', 'CMJ')}</div>`;
}

function aktionVerschieben(einheit) {
  const a = zustand.aktion;
  const s = sprungZustand();
  const ziel = a.datum ?? einheit.datum;
  const neu = verschiebe(s, einheit.id, ziel);
  const hinweise = neu === s ? [] : hinweiseNachAenderung(s, neu);
  return `<div class="aktion">
    <label class="aktion-feld">Neues Datum
      <input type="date" id="aktion-datum" min="${SPRUNG_START}" max="${SPRUNG_ENDE}" value="${esc(ziel)}">
    </label>
    ${hinweiseMarkup(hinweise)}
    <menu class="aktion-knoepfe">
      <button type="button" class="haupt" data-aktion="verschieben-ok" ${ziel === einheit.datum ? 'disabled' : ''}>Verschieben</button>
      <button type="button" data-aktion="abbrechen">Abbrechen</button>
    </menu>
  </div>`;
}

function einheitKarte(einheit, zone, aktionOffen) {
  const saetze = sprungZustand().saetze[einheit.id] ?? {};
  const marken = [];
  if (einheit.verschoben) marken.push(`verschoben vom ${datumKurz(einheit.planDatum)}`);
  if (einheit.eingefuegt) marken.push('eingefügt');
  if (einheit.herkunft === 'tabelle') marken.push('aus der Übersicht');
  if (einheit.ausgefallen) marken.push('fällt aus');
  const titel = einheit.titel + (einheit.zeit ? ` ${einheit.zeit}` : '');

  const knoepfe = [];
  if (!einheit.ausgefallen) knoepfe.push('<button type="button" data-aktion="verschieben">Verschieben</button>');
  if (einheit.verschoben) knoepfe.push(`<button type="button" data-aktion="zurueck">Zurück auf ${esc(datumKurz(einheit.planDatum))}</button>`);
  if (einheit.eingefuegt) knoepfe.push('<button type="button" data-aktion="entfernen">Entfernen</button>');
  else knoepfe.push(einheit.ausgefallen
    ? '<button type="button" data-aktion="zurueckholen">Zurückholen</button>'
    : '<button type="button" data-aktion="ausfallen">Fällt aus</button>');

  const inhalt = einheit.ausgefallen ? '' : `
    ${(einheit.einleitung ?? []).map((t) => `<p>${esc(t)}</p>`).join('')}
    ${einheit.uebungen?.length
      ? `<ul class="uebungkarten">${einheit.uebungen.map((u, i) => uebungKarte(einheit, u, i, zone, saetze[i] ?? 0)).join('')}</ul>` : ''}
    ${einheit.art === 'sprungtest' && (zone === 'gelb' || zone === 'rot')
      ? `<p class="zonen-hinweis zonen-hinweis-${zone}">${esc(K[zone].konsequenz[0])}</p>` : ''}
    ${einheit.art === 'sprungtest' ? sprungtestTeil(einheit) : ''}
    ${einheit.texte.length ? liste(einheit.texte, 'einheit-texte') : ''}
    ${einheit.vorbehalt ? `<p class="leise">${esc(einheit.vorbehalt)}</p>` : ''}
    ${einheit.uebungen?.some((u) => /RIR/.test(u.angabe) || (u.hinweise ?? []).some((h) => /RIR/.test(h)))
      ? `<details class="rir"><summary>RIR</summary><p>${esc(RIR_TEXT)} <span class="herkunft">Begriffserklärung</span></p></details>` : ''}`;

  return `<article class="einheit einheit-${esc(einheit.art)}${einheit.ausgefallen ? ' einheit-ausgefallen' : ''}" data-einheit="${esc(einheit.id)}">
    <div class="einheit-kopf">
      <h3>${esc(titel)}</h3>
      ${marken.length ? `<span class="einheit-marke">${esc(marken.join(' · '))}</span>` : ''}
    </div>
    ${inhalt}
    ${aktionOffen ? aktionVerschieben(einheit) : `<div class="einheit-aktionen">${knoepfe.join('')}</div>`}
  </article>`;
}

function hinweiseMarkup(hinweise) {
  if (!hinweise.length) return '';
  return `<div class="warnkasten">
    <p class="eyebrow">Hinweis aus dem Plan</p>
    ${hinweise.map((h) => `<p>${h.datum ? `${esc(datumKurz(h.datum))}: ` : ''}${esc(h.text)}</p>`).join('')}
  </div>`;
}

function einfuegenMarkup(tag) {
  const a = zustand.aktion;
  if (a?.art !== 'einfuegen') {
    return `<button type="button" class="einfuegen-knopf" data-aktion="einfuegen-oeffnen">Einheit einfügen</button>`;
  }
  const wahl = EINFUEGBAR.find((x) => x.schluessel === a.wahl) ?? null;
  const s = sprungZustand();
  const vorschau = wahl
    ? fuegeEin(s, { datum: tag.datum, art: wahl.art, grundform: wahl.grundform })
    : null;
  const hinweise = vorschau?.id ? hinweiseNachAenderung(s, vorschau.zustand) : [];
  return `<div class="aktion">
    <p class="eyebrow">Einfügen am ${esc(datumKurz(tag.datum))}</p>
    <div class="wahl" role="group" aria-label="Art der Einheit">
      ${EINFUEGBAR.map((x) => `<button type="button" data-aktion="wahl" data-wahl="${x.schluessel}"
        aria-pressed="${a.wahl === x.schluessel}">${esc(x.name)}</button>`).join('')}
    </div>
    ${wahl?.art === 'spiel' ? `<label class="aktion-feld">Zeit
        <input type="time" id="aktion-zeit" value="${esc(a.zeit ?? '')}"></label>` : ''}
    ${wahl?.art === 'eigene' ? `<label class="aktion-feld">Bezeichnung
        <input type="text" id="aktion-text" maxlength="80" value="${esc(a.text ?? '')}"></label>` : ''}
    ${hinweiseMarkup(hinweise)}
    <menu class="aktion-knoepfe">
      <button type="button" class="haupt" data-aktion="einfuegen-ok" ${wahl ? '' : 'disabled'}>Einfügen</button>
      <button type="button" data-aktion="abbrechen">Abbrechen</button>
    </menu>
  </div>`;
}

function einheitenBlock(tag, zone) {
  const hinweise = regelHinweise(tag.datum, effektiveEinheiten(sprungZustand()));
  const offenId = zustand.aktion?.art === 'verschieben' ? zustand.aktion.id : null;
  return `<section class="abschnitt">
    <h2>${tag.einheiten.length ? 'Einheiten' : 'Keine Einheit im Plan'}</h2>
    ${hinweiseMarkup(hinweise)}
    ${tag.einheiten.map((e) => einheitKarte(e, zone, e.id === offenId)).join('')}
    ${einfuegenMarkup(tag)}
  </section>`;
}

// --- 5. Mehr zum Tag ---

function mehrZumTag(tag) {
  const woche = SPRUNG.wochen.find((w) => w.nummer === tag.woche);
  const normal = normalwert(alleEintraege(), tag.datum);
  const zonenkarte = (z, name) => `<div class="zonenkarte zonenkarte-${z}">
      <h4>${esc(name)}: ${esc(K[z].bedingung)}</h4>
      ${liste(K[z].konsequenz)}
    </div>`;
  return `<section class="abschnitt">
    <details id="mehr-zum-tag"${zustand.mehrOffen ? ' open' : ''}>
      <summary>Mehr zum Tag</summary>
      ${woche.texte.length ? `<h3>${esc(woche.titel)}</h3>${liste(woche.texte, 'blank')}` : ''}
      <h3>${esc(K.titel)}</h3>
      <p class="leise">${esc(K.zeitpunkt)}</p>
      ${zonenkarte('gruen', 'Grün')}
      ${zonenkarte('gelb', 'Gelb')}
      ${zonenkarte('rot', 'Rot')}
      ${K.hinweise.map((h) => `<p class="leise">${esc(h)}</p>`).join('')}
      <h4>Festlegungen der App</h4>
      ${liste([
        'Morgenwert ist der höhere Wert aus Ruhe und Treppe abwärts.',
        'Persönlicher Normalwert: Median der letzten bis zu 14 Morgen der vergangenen 28 Tage, ab 3 Werten. Merklich mehr heisst mindestens 1 Punkt darüber.',
        normal == null ? 'Normalwert heute: noch nicht berechenbar.' : `Normalwert heute: ${zahl(normal)}/10.`,
        'Hohe Belastung: Spiel, Volleyball, Beintag, Sprungtest.'
      ], 'leise')}
    </details>
  </section>`;
}

// --- Zusammenbau ---

export function zeichneSprungHeute(ziel, tag, liste, i) {
  const gilt = heuteGilt({ datum: tag.datum, eintraege: alleEintraege(), tage: liste });
  const zone = gilt.stufe === 'zone' ? gilt.zone : null;

  ziel.innerHTML = `
    ${kopf(tag, liste, i)}
    ${giltBlock(tag, gilt)}
    ${erfassung(tag)}
    ${einheitenBlock(tag, zone)}
    ${mehrZumTag(tag)}
  `;

  ziel.querySelector('#tag-zurueck')?.addEventListener('click', () => setzeDatum(liste[i - 1].datum));
  ziel.querySelector('#tag-vor')?.addEventListener('click', () => setzeDatum(liste[i + 1].datum));
  ziel.querySelector('#zum-morgen')?.addEventListener('click', () => oeffneMesspunkt('morgen'));

  ziel.addEventListener('click', (ereignis) => {
    const zeile = ereignis.target.closest('.messzeile');
    if (zeile) { oeffneMesspunkt(zeile.dataset.messpunkt); return; }

    const skala = ereignis.target.closest('.skala button');
    if (skala) {
      const bereits = skala.getAttribute('aria-pressed') === 'true';
      setzeWert(tag.datum, skala.parentElement.dataset.pfad, bereits ? null : Number(skala.dataset.wert));
      return;
    }
    const janein = ereignis.target.closest('.janein button');
    if (janein) {
      const bereits = janein.getAttribute('aria-pressed') === 'true';
      setzeWert(tag.datum, janein.parentElement.dataset.pfad, bereits ? null : janein.dataset.bool === 'ja');
      return;
    }
    const satz = ereignis.target.closest('.satz');
    if (satz) {
      const nr = Number(satz.dataset.satz);
      const bereits = satz.getAttribute('aria-pressed') === 'true';
      // Tippen auf den letzten erledigten Satz nimmt ihn zurueck.
      const naechsterNicht = satz.nextElementSibling?.getAttribute('aria-pressed') !== 'true';
      satzSetzen(satz.dataset.einheit, Number(satz.dataset.uebung), bereits && naechsterNicht ? nr - 1 : nr);
      return;
    }
    const knopf = ereignis.target.closest('[data-aktion]');
    if (knopf) behandleAktion(knopf, tag);
  });

  ziel.querySelector('#notiz')?.addEventListener('change', (ereignis) => {
    zustand.speicher.setzeEintrag(tag.datum, { notiz: ereignis.target.value });
  });
  ziel.querySelectorAll('[data-sprungtest]').forEach((feld) => {
    feld.addEventListener('change', () => {
      sprungtestSetzen(feld.dataset.sprungtest, feld.value === '' ? null : Number(feld.value));
    });
  });
  ziel.querySelector('#aktion-datum')?.addEventListener('change', (ereignis) => {
    zustand.aktion = { ...zustand.aktion, datum: ereignis.target.value };
    aktualisiere();
  });
  ziel.querySelector('#aktion-zeit')?.addEventListener('input', (ereignis) => {
    zustand.aktion = { ...zustand.aktion, zeit: ereignis.target.value };
  });
  ziel.querySelector('#aktion-text')?.addEventListener('input', (ereignis) => {
    zustand.aktion = { ...zustand.aktion, text: ereignis.target.value };
  });

  const mehr = ziel.querySelector('#mehr-zum-tag');
  mehr?.addEventListener('toggle', () => { zustand.mehrOffen = mehr.open; });
}

function behandleAktion(knopf, tag) {
  const karte = knopf.closest('[data-einheit]');
  const id = karte?.dataset.einheit;
  const einheit = tag.einheiten.find((e) => e.id === id);
  switch (knopf.dataset.aktion) {
    case 'verschieben':
      zustand.aktion = { art: 'verschieben', id, datum: einheit?.datum };
      aktualisiere();
      break;
    case 'verschieben-ok': {
      const ziel = zustand.aktion?.datum;
      zustand.aktion = null;
      verschiebeEinheit(id, ziel);
      if (ziel && ziel !== tag.datum && ziel >= SPRUNG_START && ziel <= SPRUNG_ENDE) setzeDatum(ziel);
      break;
    }
    case 'zurueck':
      verschiebeEinheit(id, einheit.planDatum);
      break;
    case 'ausfallen':
      einheitAusfallen(id, true);
      break;
    case 'zurueckholen':
      einheitAusfallen(id, false);
      break;
    case 'entfernen':
      einheitEntfernen(id);
      break;
    case 'einfuegen-oeffnen':
      zustand.aktion = { art: 'einfuegen', wahl: null };
      aktualisiere();
      break;
    case 'wahl':
      zustand.aktion = { ...zustand.aktion, wahl: knopf.dataset.wahl };
      aktualisiere();
      break;
    case 'einfuegen-ok': {
      const wahl = EINFUEGBAR.find((x) => x.schluessel === zustand.aktion?.wahl);
      const { zeit, text } = zustand.aktion ?? {};
      zustand.aktion = null;
      if (wahl) einheitEinfuegen({ datum: tag.datum, art: wahl.art, grundform: wahl.grundform, zeit, text });
      else aktualisiere();
      break;
    }
    case 'abbrechen':
      zustand.aktion = null;
      aktualisiere();
      break;
    default:
      break;
  }
}

