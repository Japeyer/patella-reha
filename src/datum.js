// Datumsrechnung, rein und ohne Zeitzonenfallen: alles laeuft ueber UTC-Mittag,
// damit Sommerzeitwechsel keine Tage verschieben.

export const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
  'August', 'September', 'Oktober', 'November', 'Dezember'];

const alsDate = (datum) => new Date(`${datum}T12:00:00Z`);

const alsText = (date) => date.toISOString().slice(0, 10);

export function wochentagVon(datum) {
  // getUTCDay: 0 = Sonntag. Die Woche beginnt hier am Montag.
  return WOCHENTAGE[(alsDate(datum).getUTCDay() + 6) % 7];
}

export function wochentagIndex(datum) {
  return (alsDate(datum).getUTCDay() + 6) % 7;
}

export function datumPlus(datum, tage) {
  const d = alsDate(datum);
  d.setUTCDate(d.getUTCDate() + tage);
  return alsText(d);
}

export function montagDerWoche(datum) {
  return datumPlus(datum, -wochentagIndex(datum));
}

export function wochenTage(montag) {
  return Array.from({ length: 7 }, (_, i) => datumPlus(montag, i));
}

export function tageDazwischen(von, bis) {
  return Math.round((alsDate(bis) - alsDate(von)) / 86400000);
}

export function monatTag(datum) {
  const [, monat, tag] = datum.split('-');
  return { monat: Number(monat), tag: Number(tag) };
}

export function datumLang(datum) {
  const { monat, tag } = monatTag(datum);
  return `${tag}. ${MONATE[monat - 1]} ${datum.slice(0, 4)}`;
}

export function datumKurz(datum) {
  const { monat, tag } = monatTag(datum);
  return `${tag}.${monat}.`;
}

// "Freitag, 18. September" - die Form, in der die Tagestitel des Plans stehen.
export function titelDatum(datum) {
  const { monat, tag } = monatTag(datum);
  return `${wochentagVon(datum)}, ${tag}. ${MONATE[monat - 1]}`;
}
