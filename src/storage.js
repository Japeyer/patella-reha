// Speicherung ausschliesslich im Browser des Geraets. Nichts verlaesst das
// Geraet. Jeder Zugriff ist abgesichert, damit die App auch bei blockiertem
// Website-Speicher, im privaten Fenster oder in einer Vorschau vollstaendig
// bedienbar bleibt - dann ohne Speicherung.

import { leerEintrag } from './logic.js';

export const SCHLUESSEL = 'patella-app-v1';
const MARKE = 'PATELLA-DATEN-V1:';

const leererZustand = () => ({
  version: 1,
  eintraege: {},
  fortschritt: [null, null, null, null],
  auswertung: null
});

const tiefMischen = (ziel, teil) => {
  for (const [k, v] of Object.entries(teil)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      ziel[k] = tiefMischen({ ...(ziel[k] ?? {}) }, v);
    } else {
      ziel[k] = v;
    }
  }
  return ziel;
};

export function erzeugeSpeicher(backend) {
  let verfuegbar = false;
  try {
    if (backend) {
      backend.setItem(`${SCHLUESSEL}-probe`, '1');
      backend.removeItem(`${SCHLUESSEL}-probe`);
      verfuegbar = true;
    }
  } catch {
    verfuegbar = false;
  }

  let zustand = leererZustand();
  try {
    const rohdaten = backend?.getItem(SCHLUESSEL);
    if (rohdaten) {
      const geparst = JSON.parse(rohdaten);
      if (geparst && geparst.version === 1 && geparst.eintraege) {
        zustand = { ...leererZustand(), ...geparst };
      }
    }
  } catch {
    zustand = leererZustand();
  }

  const sichern = () => {
    try {
      backend?.setItem(SCHLUESSEL, JSON.stringify(zustand));
      return true;
    } catch {
      return false;
    }
  };

  return {
    get verfuegbar() { return verfuegbar; },

    lies: () => zustand,

    schreib(neu) {
      zustand = neu;
      return sichern();
    },

    setzeEintrag(datum, teil) {
      const vorhanden = zustand.eintraege[datum] ?? leerEintrag(datum);
      zustand.eintraege[datum] = tiefMischen({ ...vorhanden }, teil);
      sichern();
      return zustand;
    },

    // Zweiteilig: lesbarer Kopf fuer die Physiotherapie, darunter eine
    // maschinenlesbare Zeile fuer das Wiederherstellen.
    alsText() {
      const zeilen = ['Patella-Reha — Schmerzprotokoll', ''];
      for (const datum of Object.keys(zustand.eintraege).sort()) {
        const e = zustand.eintraege[datum];
        const teile = [
          e.morgen?.ruhe != null ? `Morgen Ruhe ${e.morgen.ruhe}/10` : null,
          e.morgen?.treppe != null ? `Morgen Treppe ${e.morgen.treppe}/10` : null,
          e.vor?.ruhe != null ? `vor dem Training ${e.vor.ruhe}/10` : null,
          e.waehrend?.max != null ? `während ${e.waehrend.max}/10` : null,
          e.nach?.schmerz != null ? `nach dem Training ${e.nach.schmerz}/10` : null,
          e.spruenge ? `${e.spruenge} Sprünge` : null,
          e.landungVeraendert === true ? 'Landung verändert' : null,
          e.schwellungInstabilitaetKraftverlust === true ? 'Schwellung, Instabilität oder Kraftverlust' : null,
          e.notiz ? `Notiz: ${e.notiz}` : null
        ].filter(Boolean);
        zeilen.push(`${datum}: ${teile.join(', ') || 'kein Eintrag'}`);
      }
      zeilen.push('', 'Zum Wiederherstellen die folgende Zeile mitkopieren:',
        MARKE + JSON.stringify(zustand));
      return zeilen.join('\n');
    },

    ausText(text) {
      const stelle = String(text).indexOf(MARKE);
      if (stelle === -1) {
        return {
          ok: false,
          fehler: 'Im eingefügten Text fehlt die Datenzeile. Bitte den vollständigen Sicherungstext einfügen.',
          zustand: null
        };
      }
      try {
        const geparst = JSON.parse(String(text).slice(stelle + MARKE.length).trim());
        if (!geparst || geparst.version !== 1 || !geparst.eintraege) throw new Error('Format');
        return { ok: true, fehler: null, zustand: { ...leererZustand(), ...geparst } };
      } catch {
        return {
          ok: false,
          fehler: 'Die Datenzeile ist unvollständig oder beschädigt. Es wurde nichts geändert.',
          zustand: null
        };
      }
    }
  };
}
