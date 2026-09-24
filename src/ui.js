// Geteilte Anzeigebausteine. Kein Zustand, kein Speicherzugriff: Werte hinein,
// Markup heraus. Die Views haengen die Ereignisbehandlung an.

export const esc = (wert) => String(wert ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

export const TYP_NAME = {
  'volleyball-reduziert': 'Volleyball reduziert',
  'volleyball-kontrolliert': 'Volleyball kontrolliert',
  match: 'Match',
  'kraft-a': 'Kraft A',
  'kraft-b': 'Kraft B',
  regeneration: 'Regeneration',
  kontrolltag: 'Kontrolltag',
  auswertung: 'Auswertung'
};

// Ein Wort fuer den ersten Blick. "Pause" statt "Regeneration", weil das die
// Frage "was steht heute an" unmittelbar beantwortet.
export const TYP_GROSS = {
  'volleyball-reduziert': 'Volleyball',
  'volleyball-kontrolliert': 'Volleyball',
  match: 'Match',
  'kraft-a': 'Kraft A',
  'kraft-b': 'Kraft B',
  regeneration: 'Pause',
  kontrolltag: 'Kontrolltag',
  auswertung: 'Auswertung'
};

export const TYP_KUERZEL = {
  'volleyball-reduziert': 'VB',
  'volleyball-kontrolliert': 'VB',
  match: 'MA',
  'kraft-a': 'KA',
  'kraft-b': 'KB',
  regeneration: 'Reg',
  kontrolltag: 'Ktr',
  auswertung: 'Ausw'
};

// Farbe allein traegt nie die Information: jede Zone hat zusaetzlich Name und
// Zeichen.
export const ZONEN_NAME = { gruen: 'Grün', gelb: 'Gelb', rot: 'Rot', offen: 'Offen' };
export const ZONEN_ZEICHEN = { gruen: '✓', gelb: '!', rot: '✕', offen: '○' };

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
  'August', 'September', 'Oktober', 'November', 'Dezember'];

export function datumLang(datum) {
  const [jahr, monat, tag] = datum.split('-');
  return `${Number(tag)}. ${MONATE[Number(monat) - 1]} ${jahr}`;
}

export function datumKurz(datum) {
  const [, monat, tag] = datum.split('-');
  return `${Number(tag)}.${Number(monat)}.`;
}

// Zone einer einzelnen Schmerzstufe, fuer die Faerbung der Skala.
export function stufenZone(n) {
  if (n <= 2) return 'gruen';
  if (n === 3) return 'gelb';
  return 'rot';
}

export function zonenMarke(zone, vorlaeufig = false) {
  const zusatz = vorlaeufig ? ' vorläufig' : '';
  return `<span class="zonen-marke marke-${zone}">${ZONEN_ZEICHEN[zone]} ${ZONEN_NAME[zone]}${zusatz}</span>`;
}

// Elf Knoepfe 0 bis 10. Ein erneuter Druck auf den gewaehlten Wert loescht ihn,
// damit ein Fehlgriff nicht als Messwert stehen bleibt.
export function schmerzFeld({ pfad, beschriftung, wert, id }) {
  const knoepfe = Array.from({ length: 11 }, (_, n) => {
    const gewaehlt = wert === n;
    return `<button type="button" id="${id}-${n}" class="stufe-${stufenZone(n)}" `
      + `data-wert="${n}" aria-pressed="${gewaehlt}" `
      + `aria-label="${esc(beschriftung)}: ${n} von 10">${n}</button>`;
  }).join('');
  return `<div class="messfeld">
    <div class="messfeld-kopf">
      <span class="label">${esc(beschriftung)}</span>
      <span class="wert-anzeige">${wert == null ? 'nicht erfasst' : `${wert}/10`}</span>
    </div>
    <div class="skala" role="group" aria-label="${esc(beschriftung)}, 0 bis 10" data-pfad="${pfad}">${knoepfe}</div>
  </div>`;
}

export function jaNeinFeld({ pfad, beschriftung, wert, id, jaText = 'Ja', neinText = 'Nein' }) {
  return `<div class="messfeld">
    <div class="messfeld-kopf">
      <span class="label">${esc(beschriftung)}</span>
      <span class="wert-anzeige">${wert == null ? 'nicht erfasst' : (wert ? jaText : neinText)}</span>
    </div>
    <div class="janein" role="group" aria-label="${esc(beschriftung)}" data-pfad="${pfad}">
      <button type="button" id="${id}-ja" data-bool="ja" aria-pressed="${wert === true}">${jaText}</button>
      <button type="button" id="${id}-nein" data-bool="nein" aria-pressed="${wert === false}">${neinText}</button>
    </div>
  </div>`;
}

// Angaben einer Uebung in der Reihenfolge des Plans. angabe ist der woertliche
// Text der Quelle und hat Vorrang; die strukturierten Felder ergaenzen nur,
// was der Plan zusaetzlich nennt.
export function uebungAngaben(uebung) {
  const teile = [];
  if (uebung.angabe) {
    teile.push(uebung.angabe);
  } else if (uebung.saetze && uebung.dauerSek) {
    const [a, b] = uebung.dauerSek;
    teile.push(a === b
      ? `${uebung.saetze} × ${a} Sekunden`
      : `${uebung.saetze} × ${a} bis ${b} Sekunden`);
  }
  if (uebung.tempo) teile.push(uebung.tempo);
  if (uebung.pauseText) teile.push(uebung.pauseText);
  if (uebung.anstrengung) teile.push(uebung.anstrengung);
  return teile;
}

export function uebungZeile(uebung, abgehakt) {
  const angaben = uebungAngaben(uebung);
  const hinweise = uebung.hinweise ?? [];
  return `<li class="uebung">
    <label>
      <input type="checkbox" data-uebung="${esc(uebung.name)}"${abgehakt ? ' checked' : ''}>
      <span class="name">${esc(uebung.name)}</span>
    </label>
    ${angaben.length ? `<span class="angaben">${esc(angaben.join(' · '))}</span>` : ''}
    ${hinweise.length ? `<ul class="hinweise">${hinweise.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
  </li>`;
}

export const liste = (eintraege, klasse = '') =>
  `<ul${klasse ? ` class="${klasse}"` : ''}>${eintraege.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`;
