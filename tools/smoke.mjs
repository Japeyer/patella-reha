// Einmalige Ausfuehrungspruefung ohne Browser: minimaler DOM-Ersatz, damit
// app.js und alle Ansichten wirklich durchlaufen. Faengt fehlende Variablen,
// falsche Feldzugriffe und kaputte Vorlagen. Aufruf: node tools/smoke.mjs

const zuhoerer = [];

function element(name = 'div') {
  const el = {
    tagName: name,
    dataset: {},
    className: '',
    value: '',
    textContent: '',
    hidden: false,
    checked: false,
    _html: '',
    get innerHTML() { return this._html; },
    set innerHTML(wert) {
      if (typeof wert !== 'string') throw new Error(`innerHTML ist kein String: ${typeof wert}`);
      if (wert.includes('undefined')) {
        const stelle = wert.indexOf('undefined');
        throw new Error(`Markup enthaelt "undefined": …${wert.slice(Math.max(0, stelle - 90), stelle + 40)}…`);
      }
      if (wert.includes('[object Object]')) throw new Error('Markup enthaelt [object Object]');
      if (wert.includes('NaN')) throw new Error('Markup enthaelt NaN');
      this._html = wert;
    },
    addEventListener(art, fn) { zuhoerer.push([name, art, fn]); },
    removeEventListener() {},
    setAttribute() {},
    removeAttribute() {},
    getAttribute() { return null; },
    replaceChildren() {},
    appendChild() {},
    closest() { return element(); },
    querySelector() { return element(); },
    querySelectorAll() { return []; },
    showModal() {},
    close() {},
    scrollTo() {}
  };
  return el;
}

const knoten = new Map();
globalThis.document = {
  getElementById(id) {
    if (!knoten.has(id)) knoten.set(id, element(`#${id}`));
    return knoten.get(id);
  },
  createElement: (name) => element(name),
  querySelector: () => element(),
  querySelectorAll: () => []
};
globalThis.window = { scrollTo() {} };

// Speicher-Attrappe, damit der Zustand wie im Browser durch localStorage geht.
const ablage = new Map();
globalThis.localStorage = {
  getItem: (k) => (ablage.has(k) ? ablage.get(k) : null),
  setItem: (k, v) => ablage.set(k, String(v)),
  removeItem: (k) => ablage.delete(k)
};

const { PLAN } = await import('../src/plan-data.js');
const { zustand, setzeWert, setzeFortschritt } = await import('../src/state.js');
await import('../src/app.js');
const { zeichneHeute } = await import('../src/view-today.js');
const { tagesLeisteMarkup, bindeLeiste } = await import('../src/view-overview.js');
const { zeichnePlan, warnzeichenInhalt } = await import('../src/view-reference.js');
const { wochenEditorMarkup } = await import('../src/view-woche.js');
const { setzeWoche, belastungenFuer, oeffneWoche, schliesseWoche, tage: planTage, rehaTage, aktualisiere } =
  await import('../src/state.js');
const { ROLLE } = await import('../src/schedule.js');
const { wochenTage } = await import('../src/datum.js');

const pruefe = (bezeichnung, fn) => {
  try {
    fn();
    console.log(`  ok   ${bezeichnung}`);
    return true;
  } catch (fehler) {
    console.log(`  FEHL ${bezeichnung}: ${fehler.message}`);
    return false;
  }
};

let alleOk = true;
const merke = (ergebnis) => { alleOk = alleOk && ergebnis; };

console.log('Ansichten mit leerem Speicher:');
merke(pruefe('Start (über app.js beim Laden gezeichnet)', () => {
  if (!document.getElementById('inhalt')) throw new Error('kein Inhaltsbehälter');
}));
merke(pruefe('Tagesleiste', () => {
  const markup = tagesLeisteMarkup();
  const felder = (markup.match(/data-datum="/g) ?? []).length;
  if (felder !== PLAN.tage.length) throw new Error(`${felder} Felder statt ${PLAN.tage.length}`);
  if (markup.includes('undefined')) throw new Error('undefined im Markup');
  // Der Vorlauf beginnt an einem Freitag und braucht vier leere Spalten davor.
  const leere = (markup.match(/leiste-feld leer/g) ?? []).length;
  if (leere !== 4) throw new Error(`${leere} leere Spalten statt 4`);
}));
merke(pruefe('Plan', () => zeichnePlan(element())));
merke(pruefe('Warnzeichen-Dialog', () => {
  const markup = warnzeichenInhalt();
  if (!markup.includes('Warnzeichen') && !markup.includes('abklären')) throw new Error('Inhalt fehlt');
}));

console.log('\nAlle 14 Tage in der Ansicht Heute, leerer Speicher:');
for (const tag of PLAN.tage) {
  merke(pruefe(`${tag.datum} ${tag.typ}`, () => zeichneHeute(element(), tag.datum)));
}

console.log('\nSprungkraft-Block in der Ansicht Heute, leerer Speicher:');
const sprungTageListe = planTage().filter((t) => t.block === 'sprung');
merke(pruefe('58 Sprung-Tage vom 7.11.2026 bis 3.1.2027', () => {
  if (sprungTageListe.length !== 58) throw new Error(`${sprungTageListe.length} Tage`);
}));
for (const tag of sprungTageListe) {
  merke(pruefe(`${tag.datum} ${tag.typ}`, () => zeichneHeute(element(), tag.datum)));
}

const zeichne = (datum) => { const el = element(); zeichneHeute(el, datum); return el.innerHTML; };
const enthaelt = (markup, ...texte) => {
  for (const t of texte) if (!markup.includes(t)) throw new Error(`fehlt: ${t}`);
};
merke(pruefe('13.11. zeigt die Einstiegseinheit mit Sätzen', () => {
  const m = zeichne('2026-11-13');
  enthaelt(m, 'Belt Squat', '3×5 @ 3 RIR', 'Keine Nordics.', 'Konzentrisch maximale Beschleunigungsabsicht.', 'aus Beintag B', 'class="satz"', 'RIR');
}));
merke(pruefe('9.11. zeigt das Verbot des Tages', () => enthaelt(zeichne('2026-11-09'), 'Kein Bein-Krafttraining davor.')));
merke(pruefe('12.11. fordert den Morgen nach dem Spiel an', () => enthaelt(zeichne('2026-11-12'), 'Morgenwert fehlt')));

const sprungState = await import('../src/sprung-state.js');
setzeWert('2026-11-12', 'morgen.ruhe', 2);
setzeWert('2026-11-12', 'morgen.treppe', 4);
setzeWert('2026-11-11', 'abend.schmerz', 3);
sprungState.satzSetzen('w1-fr-kraft', 0, 2);
merke(pruefe('12.11. rot nach 4/10', () => enthaelt(zeichne('2026-11-12'), 'Keine harte Plyometrie.', 'antwort-nein')));
merke(pruefe('13.11. Sprungübung trägt die rote Konsequenz', () => enthaelt(zeichne('2026-11-13'), 'zonen-hinweis-rot', 'aria-pressed="true"')));
setzeWert('2026-11-13', 'beschwerdenZunehmend', true);
merke(pruefe('Morgen mit zunehmenden Beschwerden', () => enthaelt(zeichne('2026-11-13'), 'Beschwerden nehmen zu')));

sprungState.verschiebeEinheit('w3-fr-kraft', '2026-11-29');
merke(pruefe('verschobene Krafteinheit am 29.11. mit Hinweis R1', () => {
  enthaelt(zeichne('2026-11-29'), 'verschoben vom 27.11.', 'Der Freitag ist ein schlechter Zeitpunkt', 'Zurück auf 27.11.');
}));
const eingefuegt = sprungState.einheitEinfuegen({ datum: '2026-11-17', art: 'kraft', grundform: 'B' });
merke(pruefe('eingefügter Beintag B am 17.11.', () => {
  if (!eingefuegt) throw new Error('keine ID');
  enthaelt(zeichne('2026-11-17'), 'Beintag B: Freitag', 'eingefügt', 'Entfernen', 'Volleyball Approach Jump');
}));
sprungState.einheitAusfallen('w2-mi-vb', true);
merke(pruefe('ausgefallenes Volleyball am 18.11.', () => enthaelt(zeichne('2026-11-18'), 'fällt aus', 'Zurückholen')));
sprungState.sprungtestSetzen('approach', 305);
merke(pruefe('Sprungtest am 1.1.2027 mit Bestwert', () => enthaelt(zeichne('2027-01-01'), 'Bestwert notieren.', 'value="305"')));

// Review W1: die Ja/Nein-Frage gehoert zum Morgen und bleibt offen, bis sie beantwortet ist.
setzeWert('2026-11-10', 'morgen.ruhe', 1);
setzeWert('2026-11-10', 'morgen.treppe', 1);
merke(pruefe('Frage «Beschwerden nehmen zu» bleibt nach Ruhe und Treppe offen', () => enthaelt(zeichne('2026-11-10'), 'sm-2026-11-10-z-ja')));
setzeWert('2026-11-10', 'beschwerdenZunehmend', false);
merke(pruefe('Morgen nach der Antwort erledigt', () => {
  if (zeichne('2026-11-10').includes('sm-2026-11-10-z-ja')) throw new Error('Morgen bleibt offen');
}));
// Review W2: auch der Sprungtest traegt bei Gelb oder Rot die Konsequenz.
setzeWert('2027-01-01', 'morgen.ruhe', 5);
merke(pruefe('Sprungtest trägt bei Rot den Ampel-Hinweis', () => enthaelt(zeichne('2027-01-01'), 'zonen-hinweis-rot')));
// Review H3: Werte aus einer (bearbeiteten) Sicherung werden maskiert.
const vorSicherung = zustand.speicher.lies();
zustand.speicher.schreib({ ...vorSicherung, sprung: { ...vorSicherung.sprung, sprungtest: { approach: '"><b>x' } } });
merke(pruefe('Sprungtest-Wert aus einer Sicherung wird maskiert', () => {
  if (zeichne('2027-01-01').includes('"><b>')) throw new Error('nicht maskiert');
}));
zustand.speicher.schreib(vorSicherung);

zustand.aktion = { art: 'verschieben', id: 'w2-fr-kraft', datum: '2026-11-16' };
merke(pruefe('Verschieben-Vorschau zeigt R4 und R5', () => {
  enthaelt(zeichne('2026-11-20'), 'aktion-datum', 'Weil montags keine Belt-Squat-Maschine', 'Keine RDLs, Nordics, Drop Jumps');
}));
zustand.aktion = { art: 'einfuegen', wahl: 'spiel', zeit: '19:00' };
merke(pruefe('Einfügen-Vorschau für ein Spiel am 21.11.', () => {
  enthaelt(zeichne('2026-11-21'), 'aktion-zeit', 'Hinweis aus dem Plan', 'Der Freitag ist ein schlechter Zeitpunkt');
}));
zustand.aktion = { art: 'einfuegen', wahl: 'eigene', text: '<b>' };
merke(pruefe('Einfügen eigener Einheit maskiert Eingaben', () => enthaelt(zeichne('2026-11-21'), 'aktion-text', '&lt;b&gt;')));
zustand.aktion = null;

console.log('\nMit Werten gefüllt:');
setzeWert('2026-09-21', 'morgen.ruhe', 2);
setzeWert('2026-09-21', 'vor.ruhe', 2);
setzeWert('2026-09-21', 'vor.hinken', false);
setzeWert('2026-09-21', 'vor.stepDownsMoeglich', true);
setzeWert('2026-09-21', 'waehrend.max', 3);
setzeWert('2026-09-21', 'waehrend.zunahmeProSatz', true);
setzeWert('2026-09-21', 'nach.schmerz', 3);
setzeWert('2026-09-21', 'spruenge', 14);
setzeWert('2026-09-22', 'morgen.ruhe', 4);
setzeWert('2026-09-23', 'morgen.ruhe', 3);
setzeWert('2026-09-23', 'vor.ruhe', 5);
setzeWert('2026-09-24', 'waehrend.max', 6);
setzeWert('2026-09-24', 'landungVeraendert', true);
setzeWert('2026-09-26', 'notiz', 'Test mit <Zeichen> & "Anführung"');

merke(pruefe('Montag 21.9. gelb mit Reduktionsrechnung', () => zeichneHeute(element(), '2026-09-21')));
merke(pruefe('Mittwoch 23.9. Gate mit Vergleichswert', () => zeichneHeute(element(), '2026-09-23')));
merke(pruefe('Donnerstag 24.9. rot', () => zeichneHeute(element(), '2026-09-24')));
merke(pruefe('Samstag 26.9. mit Notiz und Sonderzeichen', () => zeichneHeute(element(), '2026-09-26')));
merke(pruefe('Tagesleiste mit Werten', () => {
  const markup = tagesLeisteMarkup();
  if (!/zone-feld-(gruen|gelb|rot)/.test(markup)) throw new Error('keine Ampelfarbe gesetzt');
}));

setzeFortschritt(0, true);
setzeFortschritt(1, true);
setzeFortschritt(2, true);
setzeFortschritt(3, true);
merke(pruefe('Kontrolltag mit Freigabe', () => zeichneHeute(element(), '2026-09-27')));
merke(pruefe('Montag 28.9. nach Freigabe', () => zeichneHeute(element(), '2026-09-28')));
setzeFortschritt(1, false);
merke(pruefe('Montag 28.9. ohne Freigabe', () => zeichneHeute(element(), '2026-09-28')));
merke(pruefe('Mittwoch 30.9. ohne Freigabe', () => zeichneHeute(element(), '2026-09-30')));
merke(pruefe('Auswertungstag 4.10.', () => zeichneHeute(element(), '2026-10-04')));

console.log('');
console.log('Wochenplanung:');
merke(pruefe('Editor für jede vorhandene Woche', () => {
  for (const montag of ['2026-09-21', '2026-09-28']) {
    const markup = wochenEditorMarkup(montag);
    if (!markup.includes('wtag-schalter')) throw new Error(montag + ': keine Schalter');
    if (markup.includes('undefined')) throw new Error(montag + ': undefined im Markup');
    schliesseWoche();
  }
}));

// "Woche anfuegen" gibt es seit dem Sprungkraft-Block nicht mehr. Geraete, die
// vorher Wochen angefuegt haben, tragen sie aber im Wochenplan; das wird hier
// direkt so gespeichert.
const vorherTage = planTage().length;
const neueWoche = '2026-10-05';
setzeWoche(neueWoche, belastungenFuer(neueWoche));
merke(pruefe('angefügte Woche erweitert den Plan um sieben Tage', () => {
  if (planTage().length !== vorherTage + 7) throw new Error('nicht sieben Tage mehr');
  if (neueWoche !== '2026-10-05') throw new Error('falscher Montag: ' + neueWoche);
}));

merke(pruefe('jeder Tag der angefügten Woche zeichnet', () => {
  for (const tag of planTage().filter((t) => t.datum >= '2026-10-05')) {
    zeichneHeute(element(), tag.datum);
  }
}));

const w3 = wochenTage('2026-10-05');
setzeWoche('2026-10-05', { [w3[1]]: ROLLE.volleyball, [w3[5]]: ROLLE.match });
merke(pruefe('verschobene Woche enthält das Match am richtigen Tag', () => {
  const match = planTage().find((t) => t.typ === 'match');
  if (!match) throw new Error('kein Match im Plan');
  if (match.datum !== w3[5]) throw new Error('Match am falschen Tag: ' + match.datum);
  zeichneHeute(element(), match.datum);
}));

merke(pruefe('Tagesleiste weist die Anpassung aus', () => {
  const markup = tagesLeisteMarkup();
  if (!markup.includes('angepasst')) throw new Error('Anpassung nicht ausgewiesen');
  const felder = (markup.match(/data-datum="/g) ?? []).length;
  if (felder !== rehaTage().length) throw new Error('Feldzahl ' + felder);
}));

merke(pruefe('Planansicht mit offener und geschlossener Woche', () => {
  oeffneWoche('2026-10-05');
  zeichnePlan(element());
  schliesseWoche();
  zeichnePlan(element());
}));

console.log('\nVerlauf und Plan mit beiden Blöcken:');
merke(pruefe('Tagesleiste Sprungkraft mit 58 Feldern und Ampel', () => {
  const markup = tagesLeisteMarkup('sprung');
  const felder = (markup.match(/data-datum="/g) ?? []).length;
  if (felder !== 58) throw new Error(`${felder} Felder`);
  if (!markup.includes('zone-feld-rot')) throw new Error('rote Zone vom 12.11. fehlt');
  // Der 7.11. ist ein Samstag: fuenf leere Spalten davor.
  const leere = (markup.match(/leiste-feld leer/g) ?? []).length;
  if (leere !== 5) throw new Error(`${leere} leere Spalten statt 5`);
}));
for (const block of ['sprung', 'reha']) {
  merke(pruefe(`Verlauf ${block}`, () => {
    zustand.ansicht = 'verlauf';
    zustand.verlaufBlock = block;
    aktualisiere();
  }));
}
zustand.verlaufBlock = null;
merke(pruefe('Plan mit Übersichtstabelle, Wochen und eingeklapptem Reha-Plan', () => {
  const el = element();
  zeichnePlan(el);
  for (const t of ['Gesamter 8-Wochen-Plan auf einen Blick', 'Woche 8 | 28. Dezember–3. Januar', 'Reha-Plan 21. September bis 4. Oktober', 'planzeile', 'Beintag B: Freitag']) {
    if (!el.innerHTML.includes(t)) throw new Error(`fehlt: ${t}`);
  }
  if (el.innerHTML.includes('woche-anfuegen')) throw new Error('Woche anfügen sollte entfallen');
}));

console.log('\nSicherung:');
merke(pruefe('Text erzeugen und wieder einlesen', () => {
  const text = zustand.speicher.alsText();
  const r = zustand.speicher.ausText(text);
  if (!r.ok) throw new Error(r.fehler);
  if (r.zustand.eintraege['2026-09-21'].spruenge !== 14) throw new Error('Sprungzahl verloren');
}));

console.log(`\nEreignisbehandlungen angemeldet: ${zuhoerer.length}`);
console.log(alleOk ? '\nAlle Pfade laufen.' : '\nFehler vorhanden.');
process.exit(alleOk ? 0 : 1);
