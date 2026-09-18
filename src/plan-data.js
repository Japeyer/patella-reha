// Plandaten, woertlich uebernommen aus docs/plan-original.txt.
// Quelle: PatellaSehneentzuendogVerhinderig_260916_230749.sdocx
//
// Diese Datei enthaelt ausschliesslich Daten, keine Logik. Jeder Text stammt
// unveraendert aus der Quelle; die Zeilenangaben in den Kommentaren verweisen
// auf docs/plan-original.txt. Strukturierte Felder (saetze, dauerSek, ...)
// dienen der Logik; die Anzeige verwendet die woertlichen Felder name, angabe,
// tempo und hinweise.

export const PLAN = Object.freeze({
  // Z. 1-4
  titel: '2-Wochen-Plan Patellarsehne',
  zeitraum: {
    von: '2026-09-21',
    bis: '2026-10-04',
    text: 'Zeitraum: Montag, 21. September bis Sonntag, 4. Oktober 2026'
  },
  volleyballTage: 'Volleyball: Montag- und Mittwochabend',
  ziele: 'Ziele: Reizung beruhigen, Kraft erhalten beziehungsweise aufbauen, Sprungbelastung kontrollieren und Reaktion am Folgetag stabilisieren.',

  // Z. 5-22
  zonenTitel: 'Schmerzregeln für alle Einheiten',
  zonen: {
    gruen: {
      name: 'Grüne Zone',
      merkmale: [
        'Schmerz während der Belastung: 0 bis 2 von 10',
        'Kein Hinken oder Ausweichen',
        'Am nächsten Morgen gleich oder besser als am Vortag'
      ],
      konsequenz: 'Geplante Belastung beibehalten.'
    },
    gelb: {
      name: 'Gelbe Zone',
      merkmale: [
        'Schmerz: 3 von 10',
        'Beschwerden nehmen innerhalb der Einheit etwas zu',
        'Am nächsten Morgen leicht stärker, aber innerhalb von 24 Stunden wieder auf Ausgangsniveau'
      ],
      konsequenz: 'Nächste Einheit um etwa 20 bis 30 Prozent reduzieren. Weniger Sätze, Gewicht oder Sprünge.'
    },
    rot: {
      name: 'Rote Zone',
      merkmale: [
        'Schmerz: 4 von 10 oder stärker',
        'Schmerz nimmt von Satz zu Satz deutlich zu',
        'Veränderte Landung, Hinken oder Kraftverlust',
        'Am nächsten Morgen deutlich schlechter',
        'Beschwerden sind nach 24 Stunden nicht wieder auf dem vorherigen Niveau'
      ],
      konsequenz: 'Sprünge und schmerzauslösende Übungen stoppen. Belastung zurückstufen und physiotherapeutisch beziehungsweise sportmedizinisch beurteilen lassen.'
    }
  },
  // Z. 23
  zonenHinweis: 'Wichtig: Die Schmerzgrenzen sind Orientierungswerte und nicht vollständig validiert speziell für jede Patellatendinopathie. Die 24-Stunden-Reaktion ist wichtiger als der Schmerz unmittelbar nach der Einheit.',

  // Z. 24-66
  volleyballRegeln: {
    titel: 'Regeln für die Volleyballtrainings',
    teilnahmeTitel: 'Vor jedem Training: Teilnahmeentscheidung',
    vorDemAufwaermenTitel: 'Vor dem Aufwärmen:',
    vorDemAufwaermen: [
      'Schmerz in Ruhe dokumentieren: __/10',
      'Schmerz beim Treppenabwärtsgehen: __/10',
      '5 langsame einbeinige Kniebeugen oder Step-downs durchführen',
      'Mit dem Zustand am Morgen nach dem vorherigen Training vergleichen'
    ],
    teilnahmeErlaubtTitel: 'Teilnahme erlaubt, wenn:',
    teilnahmeErlaubtWenn: [
      'kein Hinken vorhanden ist',
      'der Ausgangsschmerz höchstens 2 bis 3 von 10 beträgt',
      'das Knie nicht schlechter ist als am Vortag',
      'Kniebeugen beziehungsweise Step-downs kontrolliert möglich sind'
    ],
    keineSpruengeTitel: 'Keine Sprünge, wenn:',
    keineSpruengeWenn: [
      'der Ausgangsschmerz bereits 4 von 10 oder stärker ist',
      'der Folgetag nach der letzten Belastung deutlich schlechter war',
      'Schwellung, Instabilität oder Kraftverlust bestehen',
      'das Knie beim Aufwärmen zunehmend schmerzt'
    ],
    sonstNurText: 'In diesem Fall sind höchstens Technik ohne Sprünge und Oberkörpertraining sinnvoll.',
    erlaubtTitel: 'Während der Volleyballtrainings erlaubt',
    erlaubt: [
      'normales allgemeines Aufwärmen ohne Sprungserien',
      'lockeres Laufen, sofern schmerzarm',
      'Mobilisation von Hüfte und Sprunggelenk',
      'Annahme und Abwehr',
      'Zuspiel aus stabilem Stand',
      'Aufschlag aus dem Stand',
      'taktische Übungen ohne Sprung',
      'Technikübungen mit begrenzten Laufwegen',
      'Block- und Angriffstechnik zunächst ohne Absprung',
      'in Woche 2 kontrollierte Sprünge, aber nur bei erfüllten Fortschrittskriterien',
      'Pausen nach kurzen Belastungsblöcken',
      'Training sofort anpassen, wenn der Schmerz von Block zu Block steigt'
    ],
    nichtErlaubtTitel: 'Vorläufig nicht erlaubt',
    nichtErlaubt: [
      'wiederholte Maximalsprünge',
      'intensive Blocksprungserien',
      'Angriffssprünge in hoher Wiederholungszahl',
      'Strafsprünge',
      'Plyometrik oder Sprungkraftzirkel',
      'einbeinige Weit- oder Tiefsprünge',
      'Drop Jumps und Tiefsprünge',
      'zusätzliche Sprünge ausserhalb der geplanten Übungen',
      'Sprints mit abruptem Abstoppen, falls schmerzhaft',
      'Training bis zur Erschöpfung',
      'Schmerzmittel, um trotz Beschwerden normal weiterzutrainieren'
    ]
  },

  // Z. 67 und Z. 155
  wochen: [
    { nummer: 1, titel: 'Woche 1: Belastung beruhigen und Kraft einführen' },
    { nummer: 2, titel: 'Woche 2: Vorsichtige Progression' }
  ],

  tage: [
    // Z. 68-84
    {
      datum: '2026-09-21',
      wochentag: 'Montag',
      woche: 1,
      typ: 'volleyball-reduziert',
      titel: 'Montag, 21. September: Volleyball reduziert',
      bedingungen: [
        'Wenn das Knie bereits vor Trainingsbeginn deutlich symptomatisch ist, diese Woche gar keine Volleyballsprünge.'
      ],
      bloecke: [
        {
          titel: 'Vor dem Volleyball',
          einleitung: null,
          uebungen: [
            {
              name: 'Isometrischer Beinstrecker oder Spanish Squat',
              angabe: '5 × 30 bis 45 Sekunden',
              saetze: 5,
              dauerSek: [30, 45],
              pauseSek: [90, 120],
              pauseText: '90 bis 120 Sekunden Pause',
              anstrengung: 'Anstrengung etwa 7 von 10',
              hinweise: [
                'Knieposition so wählen, dass der Schmerz höchstens 2 bis 3 von 10 beträgt',
                'Isometrische Belastung kann kurzfristig schmerzlindernd wirken, allerdings reagieren nicht alle Personen gleich darauf. Die spätere Forschung zeigte diesbezüglich unterschiedliche individuelle Resultate.'
              ]
            }
          ]
        },
        {
          titel: 'Volleyball',
          einleitung: null,
          uebungen: [
            { name: 'Gesamtteilnahme höchstens etwa 60 Prozent der normalen Trainingsdauer' },
            { name: 'erste Hälfte überwiegend ohne Sprünge' },
            { name: 'maximal 10 bis 15 submaximale beidbeinige Sprünge' },
            { name: 'ungefähr 60 bis 70 Prozent der normalen Sprunghöhe' },
            { name: 'mindestens 20 bis 30 Sekunden zwischen einzelnen Sprüngen' },
            { name: 'keine Maximalsprünge und keine Sprungserien' },
            { name: 'bei zunehmendem Schmerz direkt auf Technik ohne Sprünge wechseln' }
          ]
        }
      ],
      volleyball: {
        anteilDauerProzent: [null, 60],
        spruengeMin: 10,
        spruengeMax: 15,
        anteilHoeheProzent: [60, 70],
        pauseZwischenSpruengenSek: [20, 30],
        pauseZwischenBloeckenMin: null
      },
      funktionstest: null
    },

    // Z. 85-90
    {
      datum: '2026-09-22',
      wochentag: 'Dienstag',
      woche: 1,
      typ: 'regeneration',
      titel: 'Dienstag, 22. September: Regeneration',
      bedingungen: [],
      bloecke: [
        {
          titel: null,
          einleitung: null,
          uebungen: [
            { name: '20 bis 30 Minuten lockeres Radfahren, sofern schmerzarm' },
            { name: 'kein Laufen und keine Sprünge' },
            {
              name: 'optional: 4 × 30 bis 45 Sekunden isometrischer Spanish Squat',
              saetze: 4,
              dauerSek: [30, 45]
            },
            { name: 'Schlafziel: 8 bis 9 Stunden' },
            { name: 'Morgenreaktion dokumentieren' }
          ]
        }
      ],
      volleyball: null,
      funktionstest: null
    },

    // Z. 91-102
    {
      datum: '2026-09-23',
      wochentag: 'Mittwoch',
      woche: 1,
      typ: 'volleyball-reduziert',
      titel: 'Mittwoch, 23. September: Volleyball reduziert',
      bedingungen: [
        'Nur springen, wenn der Dienstagmorgen beziehungsweise Mittwochmorgen nicht schlechter war.',
        'Falls die Beschwerden nach Montag länger als 24 Stunden verstärkt waren: Mittwoch keine Sprünge, nur schmerzarmer Technikteil.'
      ],
      bloecke: [
        {
          titel: 'Vor dem Training',
          einleitung: null,
          uebungen: [
            {
              name: '5 × 30 bis 45 Sekunden isometrischer Beinstrecker oder Spanish Squat',
              saetze: 5,
              dauerSek: [30, 45],
              pauseSek: [90, 120],
              pauseText: '90 bis 120 Sekunden Pause'
            }
          ]
        },
        {
          titel: 'Volleyball',
          einleitung: null,
          uebungen: [
            { name: 'höchstens 60 bis 70 Prozent der normalen Trainingsdauer' },
            { name: 'maximal dieselbe Sprungzahl wie am Montag' },
            { name: 'keine Steigerung innerhalb derselben Woche' },
            { name: 'keine Maximal-, Tief- oder Ermüdungssprünge' },
            { name: 'Schwerpunkt Annahme, Abwehr, Zuspiel und Aufschlag aus dem Stand' }
          ]
        }
      ],
      volleyball: {
        anteilDauerProzent: [60, 70],
        spruengeMin: 10,
        spruengeMax: 15,
        anteilHoeheProzent: null,
        pauseZwischenSpruengenSek: null,
        pauseZwischenBloeckenMin: null
      },
      funktionstest: null
    },

    // Z. 103-126
    {
      datum: '2026-09-24',
      wochentag: 'Donnerstag',
      woche: 1,
      typ: 'kraft-a',
      titel: 'Donnerstag, 24. September: Kraft A',
      bedingungen: ['Alle Wiederholungen langsam und kontrolliert.'],
      bloecke: [
        {
          titel: 'Aufwärmen',
          einleitung: null,
          uebungen: [
            { name: '8 bis 10 Minuten lockeres Fahrrad' },
            { name: '2 leichte Vorbereitungssätze pro Hauptübung' }
          ]
        },
        {
          titel: 'Hauptteil',
          einleitung: null,
          uebungen: [
            {
              name: 'Beinpresse oder Kniebeuge',
              angabe: '3 × 10 Wiederholungen',
              saetze: 3,
              wiederholungen: 10,
              tempo: '3 Sekunden absenken, 1 Sekunde halten, 2 Sekunden hoch'
            },
            {
              name: 'Split Squat',
              angabe: '3 × 8 pro Seite',
              saetze: 3,
              wiederholungen: 8,
              proSeite: true,
              hinweise: ['Vorderes und hinteres Bein stabil halten']
            },
            {
              name: 'Beinstrecker, falls verfügbar und tolerierbar',
              angabe: '3 × 10',
              saetze: 3,
              wiederholungen: 10,
              hinweise: ['Langsame Bewegung, nicht explosiv']
            },
            {
              name: 'Wadenheben stehend',
              angabe: '3 × 12',
              saetze: 3,
              wiederholungen: 12
            },
            {
              name: 'Seitliches Hüfttraining, beispielsweise Band Walk',
              angabe: '2 × 12 bis 15 pro Seite',
              saetze: 2,
              wiederholungen: [12, 15],
              proSeite: true
            }
          ]
        },
        {
          titel: 'Belastung',
          einleitung: null,
          uebungen: [
            { name: 'letzte 2 bis 3 Wiederholungen sollen anstrengend sein' },
            { name: 'dennoch technisch sauber' },
            { name: 'Schmerz höchstens 3 von 10' },
            { name: 'nicht bis zum Muskelversagen trainieren' }
          ]
        }
      ],
      volleyball: null,
      funktionstest: null
    },

    // Z. 127-132
    {
      datum: '2026-09-25',
      wochentag: 'Freitag',
      woche: 1,
      typ: 'regeneration',
      titel: 'Freitag, 25. September: Regeneration',
      bedingungen: [],
      bloecke: [
        {
          titel: null,
          einleitung: null,
          uebungen: [
            { name: 'Alltag normal, sofern nicht schmerzverstärkend' },
            { name: 'optional 20 bis 30 Minuten lockeres Radfahren' },
            { name: 'kein Sprungtraining' },
            { name: 'keine schweren Knieübungen' },
            { name: 'bei Bedarf isometrische Übung 4 × 30 Sekunden', saetze: 4, dauerSek: [30, 30] }
          ]
        }
      ],
      volleyball: null,
      funktionstest: null
    },

    // Z. 133-144
    {
      datum: '2026-09-26',
      wochentag: 'Samstag',
      woche: 1,
      typ: 'kraft-b',
      titel: 'Samstag, 26. September: Kraft B',
      bedingungen: ['Gleiches Tempo und gleiche Schmerzregeln wie am Donnerstag.'],
      bloecke: [
        {
          titel: null,
          einleitung: null,
          uebungen: [
            {
              name: 'Beinpresse oder Goblet Squat',
              angabe: '3 × 8 bis 10',
              saetze: 3,
              wiederholungen: [8, 10]
            },
            {
              name: 'Rückwärts-Ausfallschritt',
              angabe: '3 × 8 pro Seite',
              saetze: 3,
              wiederholungen: 8,
              proSeite: true
            },
            {
              name: 'Beinstrecker oder Spanish Squat mit Zusatzlast',
              angabe: '3 × 10 beziehungsweise 4 × 30 Sekunden',
              saetze: 3,
              wiederholungen: 10
            },
            {
              name: 'Rumänisches Kreuzheben',
              angabe: '3 × 8 bis 10',
              saetze: 3,
              wiederholungen: [8, 10]
            },
            {
              name: 'Wadenheben sitzend oder stehend',
              angabe: '3 × 12',
              saetze: 3,
              wiederholungen: 12
            }
          ]
        }
      ],
      volleyball: null,
      funktionstest: null
    },

    // Z. 145-149
    {
      datum: '2026-09-27',
      wochentag: 'Sonntag',
      woche: 1,
      typ: 'kontrolltag',
      titel: 'Sonntag, 27. September: Kontrolltag',
      bedingungen: [],
      bloecke: [
        {
          titel: null,
          einleitung: null,
          uebungen: [
            { name: 'kein Sprungtraining' },
            { name: 'lockerer Spaziergang oder Fahrrad' },
            { name: 'Schmerz in Ruhe und beim Treppenabwärtsgehen notieren' },
            { name: 'mit dem vorherigen Sonntag beziehungsweise Wochenbeginn vergleichen' }
          ]
        }
      ],
      volleyball: null,
      funktionstest: null
    },

    // Z. 156-168
    {
      datum: '2026-09-28',
      wochentag: 'Montag',
      woche: 2,
      typ: 'volleyball-kontrolliert',
      titel: 'Montag, 28. September: Volleyball kontrolliert',
      bedingungen: [
        'Wenn Woche 1 nicht gut vertragen wurde: Umfang von Woche 1 wiederholen oder vollständig ohne Sprünge trainieren.'
      ],
      bloecke: [
        {
          titel: 'Vor dem Training',
          einleitung: null,
          uebungen: [
            {
              name: '5 × 30 bis 45 Sekunden isometrischer Beinstrecker oder Spanish Squat',
              saetze: 5,
              dauerSek: [30, 45]
            }
          ]
        },
        {
          titel: 'Volleyball',
          einleitung: 'Wenn alle Fortschrittskriterien erfüllt sind:',
          uebungen: [
            { name: '70 bis maximal 80 Prozent der normalen Trainingsdauer' },
            { name: 'maximal 15 bis 25 kontrollierte Sprünge' },
            { name: 'überwiegend beidbeinig' },
            { name: 'ungefähr 70 bis 80 Prozent der maximalen Höhe' },
            { name: 'keine Sprungserien bis zur Ermüdung' },
            { name: 'keine Tiefsprünge' },
            { name: 'zwischen sprungintensiven Blöcken mindestens 3 bis 5 Minuten ohne Sprünge' }
          ]
        }
      ],
      volleyball: {
        anteilDauerProzent: [70, 80],
        spruengeMin: 15,
        spruengeMax: 25,
        anteilHoeheProzent: [70, 80],
        pauseZwischenSpruengenSek: null,
        pauseZwischenBloeckenMin: [3, 5]
      },
      funktionstest: null
    },

    // Z. 169-173
    {
      datum: '2026-09-29',
      wochentag: 'Dienstag',
      woche: 2,
      typ: 'regeneration',
      titel: 'Dienstag, 29. September: Regeneration',
      bedingungen: [],
      bloecke: [
        {
          titel: null,
          einleitung: null,
          uebungen: [
            { name: '20 bis 30 Minuten lockeres Fahrrad' },
            {
              name: 'optional 4 × 30 bis 45 Sekunden isometrische Belastung',
              saetze: 4,
              dauerSek: [30, 45]
            },
            { name: 'keine zusätzliche Plyometrie' },
            { name: 'Morgenreaktion dokumentieren' }
          ]
        }
      ],
      volleyball: null,
      funktionstest: null
    },

    // Z. 174-181
    {
      datum: '2026-09-30',
      wochentag: 'Mittwoch',
      woche: 2,
      typ: 'volleyball-kontrolliert',
      titel: 'Mittwoch, 30. September: Volleyball kontrolliert',
      bedingungen: [
        'Nur steigern, wenn die Reaktion nach Montag innerhalb von 24 Stunden abgeklungen ist.',
        'Wenn Montag eine deutliche Folgereaktion ausgelöst hat: Mittwoch keine Sprünge.'
      ],
      bloecke: [
        {
          titel: null,
          einleitung: null,
          uebungen: [
            { name: '70 bis 80 Prozent der normalen Trainingsdauer' },
            { name: 'maximal gleiche Sprungzahl wie Montag oder höchstens 10 Prozent mehr' },
            { name: 'weiterhin keine Maximalsprungserien' },
            { name: 'kurze Spielsituationen sind möglich, sofern Sprungzahl aktiv begrenzt wird' },
            { name: 'Training beenden beziehungsweise auf Technik umstellen, sobald der Schmerz steigt' }
          ]
        }
      ],
      volleyball: {
        anteilDauerProzent: [70, 80],
        spruengeMin: 15,
        spruengeMax: 25,
        anteilHoeheProzent: null,
        pauseZwischenSpruengenSek: null,
        pauseZwischenBloeckenMin: null
      },
      funktionstest: null
    },

    // Z. 182-188
    {
      datum: '2026-10-01',
      wochentag: 'Donnerstag',
      woche: 2,
      typ: 'kraft-a',
      titel: 'Donnerstag, 1. Oktober: Kraft A',
      bedingungen: [
        'Wenn Woche 1 gut vertragen wurde, Gewicht um ungefähr 5 bis 10 Prozent erhöhen. Nicht gleichzeitig Gewicht, Wiederholungen und Sätze steigern.'
      ],
      bloecke: [
        {
          titel: null,
          einleitung: null,
          uebungen: [
            { name: 'Beinpresse oder Kniebeuge', angabe: '4 × 8', saetze: 4, wiederholungen: 8 },
            { name: 'Split Squat', angabe: '3 × 8 pro Seite', saetze: 3, wiederholungen: 8, proSeite: true },
            { name: 'Beinstrecker', angabe: '3 × 8 bis 10', saetze: 3, wiederholungen: [8, 10] },
            { name: 'Wadenheben', angabe: '4 × 10', saetze: 4, wiederholungen: 10 },
            { name: 'Seitliches Hüfttraining', angabe: '2 × 15', saetze: 2, wiederholungen: 15 }
          ]
        }
      ],
      volleyball: null,
      funktionstest: null
    },

    // Z. 189-193
    {
      datum: '2026-10-02',
      wochentag: 'Freitag',
      woche: 2,
      typ: 'regeneration',
      titel: 'Freitag, 2. Oktober: Regeneration',
      bedingungen: [],
      bloecke: [
        {
          titel: null,
          einleitung: null,
          uebungen: [
            { name: 'lockeres Fahrrad oder Spaziergang' },
            { name: 'keine Sprünge' },
            { name: 'keine schweren Knieübungen' },
            { name: 'Schlaf und ausreichende Energiezufuhr priorisieren' }
          ]
        }
      ],
      volleyball: null,
      funktionstest: null
    },

    // Z. 194-206
    {
      datum: '2026-10-03',
      wochentag: 'Samstag',
      woche: 2,
      typ: 'kraft-b',
      titel: 'Samstag, 3. Oktober: Kraft B und Funktionstest',
      bedingungen: [],
      bloecke: [
        {
          titel: 'Kraft',
          einleitung: null,
          uebungen: [
            { name: 'Goblet Squat oder Beinpresse', angabe: '4 × 8', saetze: 4, wiederholungen: 8 },
            { name: 'Rückwärts-Ausfallschritt', angabe: '3 × 8 pro Seite', saetze: 3, wiederholungen: 8, proSeite: true },
            { name: 'Spanish Squat oder Beinstrecker', angabe: '3 × 8 bis 10', saetze: 3, wiederholungen: [8, 10] },
            { name: 'Rumänisches Kreuzheben', angabe: '3 × 8', saetze: 3, wiederholungen: 8 },
            { name: 'Wadenheben', angabe: '4 × 10', saetze: 4, wiederholungen: 10 }
          ]
        }
      ],
      volleyball: null,
      funktionstest: {
        titel: 'Optionaler Funktionstest',
        bedingung: 'Nur bei Alltagsschmerz höchstens 1 bis 2 von 10:',
        uebungen: [
          '10 langsame beidbeinige Kniebeugen',
          '10 kontrollierte Step-downs pro Seite',
          '10 kleine beidbeinige Sprünge auf der Stelle'
        ],
        hinweis: 'Test abbrechen, wenn der Schmerz deutlich zunimmt oder sich die Landung verändert. Entscheidend ist erneut die Reaktion am Sonntagmorgen.'
      }
    },

    // Z. 207-214
    {
      datum: '2026-10-04',
      wochentag: 'Sonntag',
      woche: 2,
      typ: 'auswertung',
      titel: 'Sonntag, 4. Oktober: Auswertung',
      bedingungen: [],
      bloecke: [],
      volleyball: null,
      funktionstest: null
    }
  ],

  // Z. 150-154
  fortschrittTitel: 'Woche 2 nur steigern, wenn:',
  fortschrittskriterien: [
    'Alltagsschmerzen nicht zugenommen haben',
    'Morgenbeschwerden höchstens 2 von 10 sind',
    'Beschwerden nach Belastungen innerhalb von 24 Stunden zurückgehen',
    'keine Veränderung des Gang- oder Landemusters vorhanden ist'
  ],

  // Z. 208-225
  auswertung: {
    einleitung: 'Folgende Werte notieren:',
    werte: [
      'Schmerz in Ruhe: __/10',
      'Schmerz beim Treppenabwärtsgehen: __/10',
      'Schmerz nach Volleyball: __/10',
      'Schmerz am Morgen danach: __/10',
      'Beschwerden innerhalb von 24 Stunden abgeklungen: Ja / Nein',
      'Landung und Gang normal: Ja / Nein'
    ],
    guteEntwicklungTitel: 'Gute Entwicklung',
    guteEntwicklung: [
      'Morgenbeschwerden nehmen ab',
      'Schmerz beginnt im Training später oder gar nicht',
      'keine Zunahme von Woche zu Woche',
      'Kraftübungen werden gut vertragen'
    ],
    unguenstigeEntwicklungTitel: 'Ungünstige Entwicklung',
    unguenstigeEntwicklung: [
      'Schmerz beginnt immer früher',
      'Alltag oder Treppen werden zunehmend schmerzhaft',
      'Beschwerden bleiben über 24 bis 48 Stunden verstärkt',
      'Sprungzahl muss trotz Reduktion weiter gesenkt werden'
    ],
    schluss: 'Dann sollte die Diagnose und Belastungsplanung bei einer sportmedizinisch erfahrenen Physiotherapeutin oder einem Sportarzt überprüft werden.'
  },

  // Z. 226-232
  ernaehrungTitel: 'Ernährung und Regeneration',
  ernaehrung: [
    'Keine aggressive Gewichtsabnahme während der Rehabilitation',
    'ausreichende Gesamtenergie und Kohlenhydrate für Training und Regeneration',
    'Protein über den Tag verteilt, für sportlich Aktive typischerweise etwa 1,6 g/kg Körpergewicht täglich; höhere Mengen sind nicht automatisch besser',
    'optional 10 bis 15 g Gelatine oder Kollagen mit etwas Vitamin C etwa 30 bis 60 Minuten vor der Reha: biologisch plausibel, aber die klinische Wirksamkeit speziell bei Patellatendinopathie ist nicht sicher nachgewiesen',
    '8 bis 9 Stunden Schlaf anstreben',
    'keine Schmerzmittel einsetzen, um die erlaubte Belastung künstlich zu erhöhen'
  ],

  // Z. 233-241
  warnzeichenTitel: 'Wann zeitnah ärztlich abklären?',
  warnzeichen: [
    'plötzliches Schnappen oder Reissen',
    'deutliche Schwellung oder Bluterguss',
    'Streckdefizit oder Wegknicken',
    'starker Ruheschmerz oder Nachtschmerz',
    'Fieber oder gerötetes, überwärmtes Knie',
    'präziser Schmerz nach einem einzelnen Unfall',
    'keine klare Besserung trotz konsequenter Reduktion',
    'Beschwerden werden innerhalb der zwei Wochen zunehmend stärker'
  ],

  // Z. 242-250
  grundlageTitel: 'Wissenschaftliche Grundlage',
  grundlage: 'Der Plan orientiert sich an progressiver Sehnenbelastung und Belastungssteuerung. Progressive Tendon-Loading-Programme können bei Patellatendinopathie günstiger sein als ausschliesslich exzentrische Übungen; Heavy-Slow-Resistance ist ebenfalls gut untersucht. Isometrische Übungen können kurzfristig Schmerzen reduzieren, der Effekt ist aber nicht bei allen Personen reproduzierbar.',
  quellenTitel: 'Peer-reviewte Quellen:',
  quellen: [
    'Breda SJ et al. Effectiveness of progressive tendon-loading exercise therapy in patients with patellar tendinopathy: a randomised clinical trial. British Journal of Sports Medicine. 2021;55:501–509.',
    'Kongsgaard M et al. Corticosteroid injections, eccentric decline squat training and heavy slow resistance training in patellar tendinopathy. Scandinavian Journal of Medicine & Science in Sports. 2009;19:790–802.',
    'Malliaras P et al. Patellar tendon loading programs: a systematic review comparing clinical outcomes and identifying potential mechanisms for effectiveness. Sports Medicine. 2013;43:267–286.',
    'Rio E et al. Isometric exercise induces analgesia and reduces inhibition in patellar tendinopathy. British Journal of Sports Medicine. 2015;49:1277–1283.',
    'van Ark M et al. Do isometric and isotonic exercise programs reduce pain in athletes with patellar tendinopathy in-season? Journal of Science and Medicine in Sport. 2016;19:702–706.',
    'Shaw G et al. Vitamin C-enriched gelatin supplementation before intermittent activity augments collagen synthesis. American Journal of Clinical Nutrition. 2017;105:136–143.'
  ]
});
