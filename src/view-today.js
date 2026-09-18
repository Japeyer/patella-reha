// Ansicht "Heute" - der Startbildschirm. Drei Blöcke, in dieser Reihenfolge:
//   1. Was ist heute: die Tagesart, gross und unuebersehbar.
//   2. Die Antwort: an Volleyballtagen die Freigabe samt erlaubten Inhalten,
//      berechnet aus den bisherigen Eintraegen; sonst die Leitsaetze des Tages.
//   3. Schmerz erfassen: nur der als naechster faellige Messpunkt ist offen.
// Alles Weitere liegt unter "Mehr zum Tag".

import { PLAN } from './plan-data.js';
import {
  zoneFuerTag, freigabeVorab, tagesLeitsaetze, ausgangsschmerz, sprungLimit,
  sprungStatus, sprungAbstand, reduzierteBelastung, fortschrittsGate,
  fortschrittsVorschlag, auswertungVorschlag, umfangFuerWoche2
} from './logic.js';
import {
  zustand, alleEintraege, eintragFuer, tagFuer, folgeMorgenFuer, vergleichMorgenFuer,
  letzteTrainingsZone, setzeWert, schalteUebung, istTrainingstag, setzeDatum,
  oeffneMesspunkt, fortschrittAntworten, setzeFortschritt, auswertungWerte,
  setzeAuswertung, heutigerPlantag
} from './state.js';
import {
  esc, schmerzFeld, jaNeinFeld, uebungZeile, zonenMarke, liste,
  TYP_NAME, TYP_GROSS, datumLang, ZONEN_NAME
} from './ui.js';

const KONTROLLTAG = '2026-09-27';
const AUSWERTUNGSTAG = '2026-10-04';

function naechsteEinheit(datum) {
  const i = PLAN.tage.findIndex((t) => t.datum === datum);
  return PLAN.tage.slice(i + 1).find(istTrainingstag) ?? null;
}

const woche2Freigabe = () => fortschrittsGate(fortschrittAntworten()).freigegeben;

// Sprunggrenzen des Tages: in Woche 2 entscheidet zuerst das Fortschritts-Gate
// ueber die Umfaenge, danach greift die Mittwochsregel.
function grenzenFuer(tag) {
  const basis = sprungLimit(tag, alleEintraege());
  if (!basis || tag.woche !== 2) return basis;
  const umfang = umfangFuerWoche2(woche2Freigabe(), tag);
  if (!umfang.hinweis) return basis;
  const ersatz = {
    ...tag,
    volleyball: { ...tag.volleyball, spruengeMin: umfang.spruengeMin, spruengeMax: umfang.spruengeMax }
  };
  return { ...sprungLimit(ersatz, alleEintraege()), hinweis: umfang.hinweis };
}

// --- Block 1: was ist heute ---

function tagesKopf(tag, i) {
  const istHeute = tag.datum === heutigerPlantag().datum;
  const befund = zoneFuerTag(eintragFuer(tag.datum), folgeMorgenFuer(tag.datum));
  return `<section class="heute-kopf">
    <div class="tagnav">
      <button type="button" id="tag-zurueck" aria-label="Vorheriger Tag" ${i === 0 ? 'disabled' : ''}>‹</button>
      <div class="tagnav-mitte">
        <p class="eyebrow">${istHeute ? 'Heute' : esc(tag.wochentag)} · ${esc(datumLang(tag.datum))}</p>
        <p class="tagesart">${esc(TYP_GROSS[tag.typ])}</p>
        <p class="tagesart-zusatz">${esc(TYP_NAME[tag.typ])} · Woche ${tag.woche}</p>
      </div>
      <button type="button" id="tag-vor" aria-label="Nächster Tag" ${i === PLAN.tage.length - 1 ? 'disabled' : ''}>›</button>
    </div>
    <p class="kopf-zone">Befund: ${zonenMarke(befund.zone, befund.vorlaeufig)}</p>
  </section>`;
}

// --- Block 2: die Antwort ---

function freigabeBlock(tag) {
  const f = freigabeVorab({
    tag,
    eintrag: eintragFuer(tag.datum),
    vergleichMorgen: vergleichMorgenFuer(tag.datum),
    letzteZone: letzteTrainingsZone(tag.datum),
    limit: grenzenFuer(tag)
  });
  const klasse = { spruenge: 'antwort-ja', 'keine-spruenge': 'antwort-nein', 'angaben-fehlen': 'antwort-offen' }[f.stufe];
  const pause = tag.volleyball?.pauseZwischenSpruengenSek;
  const bloecke = tag.volleyball?.pauseZwischenBloeckenMin;

  return `<section class="antwort ${klasse}">
    <p class="eyebrow">Volleyball heute</p>
    <p class="antwort-satz">${esc(f.ueberschrift)}</p>
    <p class="antwort-grund">${esc(f.erlaeuterung)}</p>
    ${f.gruende.length ? `<ul class="antwort-gruende">${f.gruende.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>` : ''}
    ${f.stufe === 'spruenge' && pause
      ? `<p class="antwort-grund">Mindestens ${pause[0]} bis ${pause[1]} Sekunden zwischen einzelnen Sprüngen.</p>` : ''}
    ${f.stufe === 'spruenge' && bloecke
      ? `<p class="antwort-grund">Zwischen sprungintensiven Blöcken mindestens ${bloecke[0]} bis ${bloecke[1]} Minuten ohne Sprünge.</p>` : ''}
    ${f.stufe === 'angaben-fehlen'
      ? '<button type="button" class="antwort-knopf" id="zum-morgen">Morgenwert eintragen</button>' : ''}
  </section>

  <section class="abschnitt">
    <h2>Heute erlaubt</h2>
    ${liste(PLAN.volleyballRegeln.erlaubt, 'haken')}
    <details>
      <summary>${esc(PLAN.volleyballRegeln.nichtErlaubtTitel)}</summary>
      ${liste(PLAN.volleyballRegeln.nichtErlaubt, 'kreuz')}
    </details>
  </section>`;
}

function leitsatzBlock(tag) {
  const saetze = tagesLeitsaetze(tag);
  return `<section class="antwort antwort-neutral">
    <p class="eyebrow">Heute gilt</p>
    ${liste(saetze, 'haken')}
  </section>`;
}

// --- Block 3: Schmerz erfassen ---

// Reihenfolge der Messpunkte. vollstaendig sagt, ob der Punkt erledigt ist;
// der erste unerledigte ist offen, alle anderen stehen als Zeile.
const MESSPUNKTE = [
  {
    schluessel: 'morgen',
    titel: 'Morgen',
    nurTrainingstag: false,
    vollstaendig: (e) => e.morgen.ruhe != null && e.morgen.treppe != null,
    kurz: (e) => {
      const a = ausgangsschmerz(e.morgen);
      if (a.wert == null) return null;
      return `Ruhe ${e.morgen.ruhe ?? '—'} · Treppe ${e.morgen.treppe ?? '—'} → Ausgangsschmerz ${a.wert}`;
    },
    felder: (datum, e) => `
      ${schmerzFeld({ pfad: 'morgen.ruhe', beschriftung: 'Schmerz in Ruhe', wert: e.morgen.ruhe, id: `m-${datum}-r` })}
      ${schmerzFeld({ pfad: 'morgen.treppe', beschriftung: 'Schmerz beim Treppenabwärtsgehen', wert: e.morgen.treppe, id: `m-${datum}-t` })}
      <p class="leise">Der höhere der beiden Werte ist der Ausgangsschmerz und entscheidet über die Freigabe.</p>`
  },
  {
    schluessel: 'vor',
    titel: 'Vor dem Training',
    nurTrainingstag: true,
    vollstaendig: (e) => e.vor.ruhe != null && e.vor.treppe != null
      && e.vor.stepDownsMoeglich != null && e.vor.hinken != null,
    kurz: (e) => {
      const a = ausgangsschmerz(e.vor);
      if (a.wert == null) return null;
      return `Ausgangsschmerz ${a.wert} · Step-downs ${e.vor.stepDownsMoeglich === null ? '—' : (e.vor.stepDownsMoeglich ? 'möglich' : 'nicht möglich')}`;
    },
    felder: (datum, e) => `
      ${schmerzFeld({ pfad: 'vor.ruhe', beschriftung: 'Schmerz in Ruhe', wert: e.vor.ruhe, id: `v-${datum}-r` })}
      ${schmerzFeld({ pfad: 'vor.treppe', beschriftung: 'Schmerz beim Treppenabwärtsgehen', wert: e.vor.treppe, id: `v-${datum}-t` })}
      ${jaNeinFeld({ pfad: 'vor.stepDownsMoeglich', beschriftung: '5 langsame einbeinige Kniebeugen oder Step-downs kontrolliert möglich', wert: e.vor.stepDownsMoeglich, id: `v-${datum}-s` })}
      ${jaNeinFeld({ pfad: 'vor.hinken', beschriftung: 'Hinken oder Ausweichen', wert: e.vor.hinken, id: `v-${datum}-h` })}
      ${jaNeinFeld({ pfad: 'schwellungInstabilitaetKraftverlust', beschriftung: 'Schwellung, Instabilität oder Kraftverlust', wert: e.schwellungInstabilitaetKraftverlust, id: `v-${datum}-w` })}`
  },
  {
    schluessel: 'waehrend',
    titel: 'Während des Trainings',
    nurTrainingstag: true,
    vollstaendig: (e) => e.waehrend.max != null,
    kurz: (e) => (e.waehrend.max == null ? null : `Höchster Wert ${e.waehrend.max}`),
    felder: (datum, e) => `
      ${schmerzFeld({ pfad: 'waehrend.max', beschriftung: 'Höchster Schmerz', wert: e.waehrend.max, id: `w-${datum}-m` })}
      ${jaNeinFeld({ pfad: 'waehrend.zunahmeProSatz', beschriftung: 'Nimmt von Satz zu Satz beziehungsweise Block zu Block zu', wert: e.waehrend.zunahmeProSatz, id: `w-${datum}-z` })}`
  },
  {
    schluessel: 'nach',
    titel: 'Nach dem Training',
    nurTrainingstag: true,
    vollstaendig: (e) => e.nach.schmerz != null,
    kurz: (e) => (e.nach.schmerz == null ? null : `Direkt danach ${e.nach.schmerz}`),
    felder: (datum, e) => `
      ${schmerzFeld({ pfad: 'nach.schmerz', beschriftung: 'Schmerz direkt danach', wert: e.nach.schmerz, id: `n-${datum}-s` })}
      ${jaNeinFeld({ pfad: 'landungVeraendert', beschriftung: 'Landung oder Gang verändert', wert: e.landungVeraendert, id: `n-${datum}-l` })}`
  }
];

function erfassungBlock(tag) {
  const e = eintragFuer(tag.datum);
  const punkte = MESSPUNKTE.filter((p) => !p.nurTrainingstag || istTrainingstag(tag));
  const ersterOffener = punkte.find((p) => !p.vollstaendig(e));
  const offener = zustand.offenerMesspunkt
    && punkte.some((p) => p.schluessel === zustand.offenerMesspunkt)
    ? zustand.offenerMesspunkt
    : ersterOffener?.schluessel ?? null;

  const teile = punkte.map((punkt) => {
    if (punkt.schluessel === offener) {
      return `<fieldset><legend>${esc(punkt.titel)}</legend>${punkt.felder(tag.datum, e)}</fieldset>`;
    }
    const kurz = punkt.kurz(e);
    return `<button type="button" class="messzeile${kurz ? ' erledigt' : ''}" data-messpunkt="${punkt.schluessel}">
      <span class="messzeile-titel">${esc(punkt.titel)}</span>
      <span class="messzeile-wert">${kurz ? esc(kurz) : 'offen'}</span>
    </button>`;
  });

  return `<section class="abschnitt">
    <h2>Schmerz erfassen</h2>
    ${teile.join('')}
    <div class="messfeld">
      <div class="messfeld-kopf"><span class="label">Notiz</span></div>
      <textarea id="notiz" rows="2" placeholder="Was auffällig war">${esc(e.notiz)}</textarea>
    </div>
  </section>`;
}

// --- Mehr zum Tag ---

function zaehlerInhalt(tag) {
  const e = eintragFuer(tag.datum);
  const limit = grenzenFuer(tag);
  const stand = sprungStatus(e.spruenge, limit);
  const abstand = tag.volleyball?.pauseZwischenSpruengenSek && zustand.letzterAbstand
    ? zustand.letzterAbstand
    : { text: '', zuKurz: false };

  return `<h3>Sprungzähler</h3>
    <div class="zaehler-stand">
      <span class="zaehler-zahl">${e.spruenge}</span>
      <span class="zaehler-limit">von ${limit.min} bis ${limit.max}<br>${esc(limit.quelle)}</span>
    </div>
    ${stand.text ? `<p class="stand-${stand.stufe}">${esc(stand.text)}</p>` : ''}
    ${limit.hinweis ? `<p class="leise">${esc(limit.hinweis)}</p>` : ''}
    <div class="zaehler-knoepfe">
      <button type="button" class="zaehler-plus" id="sprung-plus">Sprung zählen</button>
      <button type="button" class="zaehler-minus" id="sprung-minus" ${e.spruenge ? '' : 'disabled'}>−1</button>
    </div>
    ${abstand.text ? `<p class="${abstand.zuKurz ? 'stand-warnung' : 'leise'}">${esc(abstand.text)}</p>` : ''}`;
}

function uebungenInhalt(tag) {
  if (!tag.bloecke.length) return '';
  const abgehakt = eintragFuer(tag.datum).uebungenAbgehakt;
  const bloecke = tag.bloecke.map((block) => `
    ${block.titel ? `<h4>${esc(block.titel)}</h4>` : ''}
    ${block.einleitung ? `<p class="leise">${esc(block.einleitung)}</p>` : ''}
    <ul class="uebungen">${block.uebungen.map((u) => uebungZeile(u, abgehakt.includes(u.name))).join('')}</ul>
  `).join('');
  const test = tag.funktionstest;
  return `${bloecke}
    ${test ? `
      <h4>${esc(test.titel)}</h4>
      <p class="leise">${esc(test.bedingung)}</p>
      ${liste(test.uebungen)}
      <p class="leise">${esc(test.hinweis)}</p>` : ''}`;
}

function befundInhalt(tag) {
  const eintrag = eintragFuer(tag.datum);
  const befund = zoneFuerTag(eintrag, folgeMorgenFuer(tag.datum));
  const teile = [`<h3>Befund und Begründung</h3>`, `<p>${zonenMarke(befund.zone, befund.vorlaeufig)}</p>`];
  if (befund.konsequenz) teile.push(`<p><strong>${esc(befund.konsequenz)}</strong></p>`);
  if (befund.gruende.length) teile.push(liste(befund.gruende, 'blank'));
  if (befund.vorlaeufig && befund.zone !== 'offen') {
    teile.push('<p class="leise">Vorläufig: der Morgenwert des Folgetags fehlt noch. Der Plan gewichtet die 24-Stunden-Reaktion stärker als den Wert unmittelbar nach der Einheit.</p>');
  }
  if (befund.zone === 'gelb') {
    const einheit = naechsteEinheit(tag.datum);
    if (einheit) {
      const r = reduzierteBelastung(einheit, [20, 30]);
      const zeilen = [];
      if (r.spruenge) {
        zeilen.push(`Sprünge: ${r.spruenge[0]} bis ${r.spruenge[1]} statt ${einheit.volleyball.spruengeMin} bis ${einheit.volleyball.spruengeMax}`);
      }
      for (const s of r.saetze) zeilen.push(`${s.name}: ${s.reduziert} statt ${s.original} Sätze`);
      if (zeilen.length) {
        teile.push(`<p class="eyebrow">Vorgerechnet für ${esc(TYP_NAME[einheit.typ])} am ${esc(datumLang(einheit.datum))}</p>`);
        teile.push(liste(zeilen, 'blank'));
      }
    }
  }
  teile.push(`<p class="leise">${esc(PLAN.zonenHinweis)}</p>`);
  return teile.join('');
}

function fortschrittInhalt() {
  const antworten = fortschrittAntworten();
  const vorschlag = fortschrittsVorschlag(alleEintraege());
  const g = fortschrittsGate(antworten);
  const felder = PLAN.fortschrittskriterien.map((kriterium, i) => {
    const wert = antworten[i] ?? null;
    const hinweis = wert === null && vorschlag[i] !== null
      ? `<p class="leise">Aus den erfassten Werten spricht dafür: ${vorschlag[i] ? 'ja' : 'nein'}. Bitte bestätigen.</p>`
      : '';
    return jaNeinFeld({ pfad: `fortschritt.${i}`, beschriftung: kriterium, wert, id: `fk-${i}` }) + hinweis;
  }).join('');
  return `<h3>${esc(PLAN.fortschrittTitel)}</h3>
    ${felder}
    <p><strong>${esc(g.anzeige)}</strong></p>
    ${g.nichtErfuellt.length ? `<p class="eyebrow">Nicht erfüllt</p>${liste(g.nichtErfuellt)}` : ''}
    ${g.offen.length ? `<p class="eyebrow">Noch offen</p>${liste(g.offen)}` : ''}`;
}

const AUSWERTUNG_FELDER = [
  { feld: 'ruhe', art: 'schmerz', beschriftung: 'Schmerz in Ruhe' },
  { feld: 'treppe', art: 'schmerz', beschriftung: 'Schmerz beim Treppenabwärtsgehen' },
  { feld: 'nachVolleyball', art: 'schmerz', beschriftung: 'Schmerz nach Volleyball' },
  { feld: 'morgenDanach', art: 'schmerz', beschriftung: 'Schmerz am Morgen danach' },
  { feld: 'abgeklungen24h', art: 'bool', beschriftung: 'Beschwerden innerhalb von 24 Stunden abgeklungen' },
  { feld: 'landungGangNormal', art: 'bool', beschriftung: 'Landung und Gang normal' }
];

function auswertungInhalt() {
  const gespeichert = auswertungWerte();
  const vorschlag = auswertungVorschlag(alleEintraege());
  const felder = AUSWERTUNG_FELDER.map(({ feld, art, beschriftung }) => {
    const wert = gespeichert[feld] ?? vorschlag[feld] ?? null;
    return art === 'schmerz'
      ? schmerzFeld({ pfad: `auswertung.${feld}`, beschriftung, wert, id: `aw-${feld}` })
      : jaNeinFeld({ pfad: `auswertung.${feld}`, beschriftung, wert, id: `aw-${feld}` });
  }).join('');
  return `<h3>Auswertung</h3>
    <p class="leise">${esc(PLAN.auswertung.einleitung)} Vorbelegt aus den erfassten Werten, überschreibbar.</p>
    ${felder}
    <div class="zonenkarte zonenkarte-gruen">
      <h4>${esc(PLAN.auswertung.guteEntwicklungTitel)}</h4>
      ${liste(PLAN.auswertung.guteEntwicklung)}
    </div>
    <div class="zonenkarte zonenkarte-rot">
      <h4>${esc(PLAN.auswertung.unguenstigeEntwicklungTitel)}</h4>
      ${liste(PLAN.auswertung.unguenstigeEntwicklung)}
      <p class="konsequenz">${esc(PLAN.auswertung.schluss)}</p>
    </div>`;
}

function mehrZumTag(tag) {
  const stuecke = [];
  if (tag.volleyball) stuecke.push(zaehlerInhalt(tag));
  if (tag.bloecke.length) stuecke.push(`<h3>Einheit des Tages</h3>${uebungenInhalt(tag)}`);
  if (tag.bedingungen.length) {
    stuecke.push(`<h3>Bedingungen für diesen Tag</h3>${liste(tag.bedingungen)}`);
  }
  stuecke.push(befundInhalt(tag));
  if (tag.datum === KONTROLLTAG) stuecke.push(fortschrittInhalt());
  if (tag.datum === AUSWERTUNGSTAG) stuecke.push(auswertungInhalt());

  return `<section class="abschnitt">
    <details id="mehr-zum-tag"${zustand.mehrOffen ? ' open' : ''}>
      <summary>Mehr zum Tag</summary>
      ${stuecke.join('')}
    </details>
  </section>`;
}

// --- Zusammenbau ---

export function zeichneHeute(ziel, datum) {
  const tag = tagFuer(datum) ?? PLAN.tage[0];
  const i = PLAN.tage.findIndex((t) => t.datum === tag.datum);

  ziel.innerHTML = `
    ${tagesKopf(tag, i)}
    ${tag.volleyball ? freigabeBlock(tag) : leitsatzBlock(tag)}
    ${erfassungBlock(tag)}
    ${mehrZumTag(tag)}
  `;

  ziel.querySelector('#tag-zurueck')?.addEventListener('click', () => setzeDatum(PLAN.tage[i - 1].datum));
  ziel.querySelector('#tag-vor')?.addEventListener('click', () => setzeDatum(PLAN.tage[i + 1].datum));
  ziel.querySelector('#zum-morgen')?.addEventListener('click', () => oeffneMesspunkt('morgen'));

  ziel.addEventListener('click', (ereignis) => {
    const zeile = ereignis.target.closest('.messzeile');
    if (zeile) { oeffneMesspunkt(zeile.dataset.messpunkt); return; }

    const skalaKnopf = ereignis.target.closest('.skala button');
    if (skalaKnopf) {
      const pfad = skalaKnopf.parentElement.dataset.pfad;
      const wert = Number(skalaKnopf.dataset.wert);
      const bereits = skalaKnopf.getAttribute('aria-pressed') === 'true';
      schreibe(tag.datum, pfad, bereits ? null : wert);
      return;
    }
    const boolKnopf = ereignis.target.closest('.janein button');
    if (boolKnopf) {
      const pfad = boolKnopf.parentElement.dataset.pfad;
      const ja = boolKnopf.dataset.bool === 'ja';
      const bereits = boolKnopf.getAttribute('aria-pressed') === 'true';
      schreibe(tag.datum, pfad, bereits ? null : ja);
    }
  });

  ziel.querySelectorAll('.uebung input[type="checkbox"]').forEach((kasten) => {
    kasten.addEventListener('change', () => schalteUebung(tag.datum, kasten.dataset.uebung));
  });

  const notiz = ziel.querySelector('#notiz');
  notiz?.addEventListener('change', () => {
    zustand.speicher.setzeEintrag(tag.datum, { notiz: notiz.value });
  });

  // Merkt sich, ob "Mehr zum Tag" offen war, damit ein Neuzeichnen es nicht zuklappt.
  const mehr = ziel.querySelector('#mehr-zum-tag');
  mehr?.addEventListener('toggle', () => { zustand.mehrOffen = mehr.open; });

  ziel.querySelector('#sprung-plus')?.addEventListener('click', () => {
    const vorheriger = zustand.letzterSprung;
    zustand.letzterSprung = Date.now();
    zustand.letzterAbstand = vorheriger ? sprungAbstand(vorheriger, zustand.letzterSprung) : null;
    setzeWert(tag.datum, 'spruenge', eintragFuer(tag.datum).spruenge + 1);
  });
  ziel.querySelector('#sprung-minus')?.addEventListener('click', () => {
    setzeWert(tag.datum, 'spruenge', Math.max(0, eintragFuer(tag.datum).spruenge - 1));
  });
}

// Fortschritt und Auswertung liegen nicht im Tageseintrag, sondern daneben.
function schreibe(datum, pfad, wert) {
  if (pfad.startsWith('fortschritt.')) { setzeFortschritt(Number(pfad.split('.')[1]), wert); return; }
  if (pfad.startsWith('auswertung.')) { setzeAuswertung(pfad.split('.')[1], wert); return; }
  setzeWert(datum, pfad, wert);
}
