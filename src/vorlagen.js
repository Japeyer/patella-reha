// Vorlagen: welcher dokumentierte Tag liefert den Inhalt fuer eine gerechnete
// Rolle. Es wird nichts neu formuliert - ein gerechneter Tag ist die Kopie eines
// Tages aus dem Plandokument, mit neuem Datum und ausgewiesener Herkunft.

import { PLAN } from './plan-data.js';
import { ROLLE } from './schedule.js';
import { wochentagVon, titelDatum } from './datum.js';
import { TYP_NAME } from './ui.js';

// Phase 1 = Woche 1 des Dokuments, Phase 2 = Woche 2. Ab dem 5. Oktober laeuft
// alles weiter in Phase 2: die Umfaenge der Woche 2 unveraendert, ohne
// erfundene Steigerung.
export const VORLAGEN = {
  1: {
    [ROLLE.volleyball]: { erster: '2026-09-21', weitere: '2026-09-23' },
    [ROLLE.match]: { erster: '2026-09-21', weitere: '2026-09-23' },
    [ROLLE.kraft]: { erster: '2026-09-24', weitere: '2026-09-26' },
    [ROLLE.regeneration]: { erster: '2026-09-25', weitere: '2026-09-25' },
    [ROLLE.kontrolle]: { erster: '2026-09-27', weitere: '2026-09-27' }
  },
  2: {
    [ROLLE.volleyball]: { erster: '2026-09-28', weitere: '2026-09-30' },
    [ROLLE.match]: { erster: '2026-09-28', weitere: '2026-09-30' },
    [ROLLE.kraft]: { erster: '2026-10-01', weitere: '2026-10-03' },
    [ROLLE.regeneration]: { erster: '2026-10-02', weitere: '2026-10-02' },
    // Der Sonntag der Woche 2 ist im Dokument die Auswertung; fuer laufende
    // Wochen ist der Kontrolltag der Woche 1 die richtige Vorlage.
    [ROLLE.kontrolle]: { erster: '2026-09-27', weitere: '2026-09-27' }
  }
};

const tagMitDatum = (datum) => PLAN.tage.find((t) => t.datum === datum);

/**
 * Baut einen Tag aus einer Vorlage.
 * @param rolle      Rolle aus ROLLE
 * @param zielDatum  YYYY-MM-DD
 * @param phase      1 oder 2
 * @param nummer     Der wievielte Tag dieser Rolle in der Woche (0-basiert)
 * @param woche      Wochennummer fuer die Anzeige
 */
export function tagAusVorlage(rolle, zielDatum, phase, nummer, woche) {
  const auswahl = VORLAGEN[phase][rolle];
  const vorlageDatum = nummer === 0 ? auswahl.erster : auswahl.weitere;
  const vorlage = tagMitDatum(vorlageDatum);

  // Ein Match ist ein Volleyballtag mit eigenem Etikett: gleiche Sprungregeln,
  // gleiche Umfaenge. Der Plan kennt keine eigenen Zahlen fuer Matches, also
  // werden auch keine erfunden.
  const typ = rolle === ROLLE.match ? 'match' : vorlage.typ;
  const name = rolle === ROLLE.match ? 'Match' : TYP_NAME[vorlage.typ];

  return {
    ...vorlage,
    datum: zielDatum,
    wochentag: wochentagVon(zielDatum),
    woche,
    typ,
    titel: `${titelDatum(zielDatum)}: ${name}`,
    herkunft: 'gerechnet',
    vorlageVon: vorlageDatum,
    rolle
  };
}
