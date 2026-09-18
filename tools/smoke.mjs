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
merke(pruefe('14-Tage-Leiste', () => {
  const markup = tagesLeisteMarkup();
  if (!markup.includes('leiste-feld')) throw new Error('keine Felder');
  if ((markup.match(/leiste-feld/g) ?? []).length !== 14) throw new Error('nicht 14 Felder');
  if (markup.includes('undefined')) throw new Error('undefined im Markup');
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
merke(pruefe('14-Tage-Leiste mit Werten', () => {
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
