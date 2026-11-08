// Plandaten des Sprungkraft-Blocks, woertlich uebernommen aus
// docs/plan-sprungkraft-original.txt (Schweizer Schreibweise: ss statt ß).
//
// Diese Datei enthaelt ausschliesslich Daten, keine Logik. Emojis der Quelle
// sind nicht uebernommen; ihre Bedeutung traegt der Einheitstyp. Ausnahme ist
// die Uebersichtstabelle, dort stehen sie wie in der Quelle.
//
// Kennzeichnung eigener Festlegungen:
// - herkunft 'tabelle': Inhalt stammt aus der Uebersichtstabelle, nicht aus
//   dem Wochentext (z. B. Regeneration am Wochenende).
// - ausGrundform: Pausen- und Ausfuehrungshinweis der Grundform (Beintag A/B),
//   uebertragen auf dieselbe Uebung in anderen Wochen. Intensitaeten (RIR)
//   werden nie uebertragen.
// - Titel des Blocks und der Woche 0 ("Vorgeschichte") sind Festlegungen; die
//   Quelle nennt keine.

const AUS_A_CMJ = [{ text: 'Maximale Qualität, 2–3 min Pause.', aus: 'A' }];
const AUS_A_DEADLIFT = [
  { text: '3–5 Minuten Pause.', aus: 'A' },
  { text: 'Kein Grind.', aus: 'A' }
];
const AUS_B_BELT = [{ text: 'Konzentrisch maximale Beschleunigungsabsicht.', aus: 'B' }];
const AUS_B_DROP = [{ text: 'Zunächst 15–20 cm.', aus: 'B' }];

const VORBEHALT_WEIHNACHTEN = '* sofern das reguläre Volleyballtraining über Weihnachten tatsächlich stattfindet.';

const regeneration = (id, datum, texte, herkunft) => ({
  id, datum, art: 'regeneration', titel: 'Regeneration', texte, ...(herkunft ? { herkunft } : {})
});

export const SPRUNG = Object.freeze({
  titel: 'Sprungkraft und Patellasehne',
  von: '2026-11-07',
  planVon: '2026-11-09',
  bis: '2027-01-03',

  einleitung: 'Ja. Mit den Spielterminen aus den Bildern würde ich den Plan stärker auf Leistungsfähigkeit im Volleyball, Regeneration und Patellasehnen-Management ausrichten. Weil montags keine Belt-Squat-Maschine vorhanden ist, kommt der schwere Belt Squat auf Freitag, während montags nur dann Krafttraining stattfindet, wenn kein Spiel ansteht und genügend Erholung vorhanden ist.',

  spieleTitel: 'Aus den Bildern lese ich folgende Spiele:',
  spiele: [
    { datum: '2026-11-07', zeit: '16:00', text: 'Sa., 07.11.2026, 16:00' },
    { datum: '2026-11-11', zeit: '20:00', text: 'Mi., 11.11.2026, 20:00' },
    { datum: '2026-11-25', zeit: '20:00', text: 'Mi., 25.11.2026, 20:00' },
    { datum: '2026-11-30', zeit: '20:00', text: 'Mo., 30.11.2026, 20:00' },
    { datum: '2026-12-07', zeit: '19:30', text: 'Mo., 07.12.2026, 19:30' },
    { datum: '2026-12-12', zeit: '18:30', text: 'Sa., 12.12.2026, 18:30' }
  ],
  volleyballText: 'Dazu kommen normalerweise Volleyballtrainings Montag und Mittwoch. Dadurch hat sie bereits zwei regelmässige Sprungbelastungen pro Woche. Ich würde deshalb nicht versuchen, noch zwei grosse Plyometrieeinheiten oben draufzusetzen.',

  grundstruktur: {
    titel: 'Grundstruktur',
    einleitung: 'Wir verwenden weiterhin dieselben Übungen:',
    uebungen: [
      'Countermovement / Volleyball Approach Jumps',
      'Drop Jumps',
      'Belt Squat',
      'Conventional Deadlift',
      'Bulgarian Split Squat',
      'Romanian Deadlift',
      'Nordic Curl',
      'Calf Raise'
    ],
    schluss: 'Aber nicht jede Übung muss jede Woche vorkommen.'
  },

  prioritaeten: {
    titel: 'Prioritäten',
    punkte: [
      'Spiele',
      'Volleyballtraining',
      'Erholung / Patellasehne',
      'qualitativ hochwertige Sprungreize',
      'Maximalkraft erhalten/steigern',
      'zusätzliches Trainingsvolumen'
    ],
    fehler: 'Der Fehler wäre, sechs Wochen lang Krafttraining aggressiv progressiv zu steigern und dabei ihre sportliche Gesamtbelastung zu ignorieren.'
  },

  grundformen: {
    A: {
      titel: 'Beintag A: Montag vor Volleyball',
      texte: ['Nur an spielfreien Montagen.', 'Da kein Belt Squat verfügbar ist:'],
      uebungen: [
        { name: 'CMJ', angabe: '3 × 2', hinweise: ['Maximale Qualität, 2–3 min Pause.'] },
        { name: 'Conventional Deadlift', angabe: '3 × 3', hinweise: ['2–3 RIR', '3–5 Minuten Pause.', 'Kein Grind.'] },
        { name: 'Bulgarian Split Squat', angabe: '2 × 5 je Bein', hinweise: ['2–3 RIR'] },
        { name: 'Calf Raise', angabe: '2 × 6–8' }
      ],
      schluss: [
        'Danach Volleyball',
        'Das ist absichtlich eine kleine Krafttrainingseinheit.',
        'Keine RDLs, Nordics, Drop Jumps oder riesigen Sprungvolumina zusätzlich.'
      ]
    },
    B: {
      titel: 'Beintag B: Freitag',
      texte: ['Hier steht die Belt-Squat-Maschine zur Verfügung und diese Einheit ist normalerweise ihr wichtigster Krafttag.'],
      uebungen: [
        { name: 'Volleyball Approach Jump', angabe: '4 × 2', hinweise: ['Maximal.'] },
        { name: 'Drop Jump', angabe: '3 × 2', hinweise: ['Zunächst 15–20 cm.'] },
        { name: 'Belt Squat', angabe: '4 × 4', hinweise: ['Schwer, aber 2 RIR.', 'Konzentrisch maximale Beschleunigungsabsicht.'] },
        { name: 'Romanian Deadlift', angabe: '3 × 5', hinweise: ['2–3 RIR.'] },
        { name: 'Nordic', angabe: '2 × 4' },
        { name: 'Calf Raise', angabe: '2 × 6–8' }
      ],
      schluss: []
    }
  },

  anpassungTitel: 'Jetzt die entscheidende Anpassung an ihren Spielplan',

  wochen: [
    {
      nummer: 0,
      titel: 'Vorgeschichte',
      texte: [],
      einheiten: [
        { id: 'w0-sa-spiel', datum: '2026-11-07', art: 'spiel', titel: 'Spiel', zeit: '16:00', texte: [] }
      ]
    },

    {
      nummer: 1,
      titel: 'Woche 1 | 9.–15. November',
      texte: [
        'Sie kommt aus dem Spiel vom Samstag, 07.11.',
        'Ausserdem:',
        'Mittwoch 11.11., 20:00 → SPIEL',
        'Wir verwenden Woche 1 als Übergangs-/Regenerationswoche.'
      ],
      einheiten: [
        {
          id: 'w1-mo-vb', datum: '2026-11-09', art: 'volleyball', titel: 'Volleyball',
          texte: [
            'Kein Bein-Krafttraining davor.',
            'Das Spiel liegt nur zwei Tage später. Hier bringt uns eine schwere Einheit wenig, zusätzliche Ermüdung aber durchaus.'
          ]
        },
        {
          id: 'w1-mi-spiel', datum: '2026-11-11', art: 'spiel', titel: 'Spiel', zeit: '20:00',
          texte: ['Kein zusätzliches Beintraining.']
        },
        {
          id: 'w1-fr-kraft', datum: '2026-11-13', art: 'kraft', titel: 'Beintag',
          einleitung: ['Sehr moderater Einstieg:'],
          uebungen: [
            { name: 'Approach Jump', angabe: '3×2' },
            { name: 'Belt Squat', angabe: '3×5 @ 3 RIR', ausGrundform: AUS_B_BELT },
            { name: 'RDL', angabe: '2×5 @ 3 RIR' },
            { name: 'Calf Raise', angabe: '2×8' }
          ],
          texte: ['Keine Drop Jumps.', 'Keine Nordics.']
        },
        regeneration('w1-sa-reg', '2026-11-14', ['Regeneration'], 'tabelle'),
        regeneration('w1-so-reg', '2026-11-15', ['Regeneration'], 'tabelle')
      ]
    },

    {
      nummer: 2,
      titel: 'Woche 2 | 16.–22. November',
      texte: ['Keine Spiele auf euren Bildern.'],
      einheiten: [
        {
          id: 'w2-mo-kraft', datum: '2026-11-16', art: 'kraft', titel: 'Beintag',
          einleitung: ['Vor Volleyball:'],
          uebungen: [
            { name: 'CMJ', angabe: '3×2', ausGrundform: AUS_A_CMJ },
            { name: 'Deadlift', angabe: '3×3 @ 3 RIR', ausGrundform: AUS_A_DEADLIFT },
            { name: 'Bulgarian Split Squat', angabe: '2×5 @ 3 RIR' },
            { name: 'Calf Raise', angabe: '2×8' }
          ],
          texte: ['→ danach Volleyball']
        },
        { id: 'w2-mo-vb', datum: '2026-11-16', art: 'volleyball', titel: 'Volleyball', texte: [] },
        { id: 'w2-mi-vb', datum: '2026-11-18', art: 'volleyball', titel: 'Volleyball', texte: ['Sonst kein Beintraining.'] },
        {
          id: 'w2-fr-kraft', datum: '2026-11-20', art: 'kraft', titel: 'Beintag',
          einleitung: [],
          uebungen: [
            { name: 'Approach Jump', angabe: '4×2' },
            { name: 'Drop Jump', angabe: '3×2 aus 15–20 cm' },
            { name: 'Belt Squat', angabe: '4×4 @ 2–3 RIR', ausGrundform: AUS_B_BELT },
            { name: 'RDL', angabe: '3×5' },
            { name: 'Nordic', angabe: '2×4' },
            { name: 'Calf Raise', angabe: '2×8' }
          ],
          texte: []
        },
        regeneration('w2-sa-reg', '2026-11-21', ['Beine regenerieren.']),
        regeneration('w2-so-reg', '2026-11-22', ['Beine regenerieren.'])
      ]
    },

    {
      nummer: 3,
      titel: 'Woche 3 | 23.–29. November',
      texte: ['Mittwoch 25.11., 20:00 → SPIEL', 'Deshalb ändern wir die Belastung erneut.'],
      einheiten: [
        {
          id: 'w3-mo-vb', datum: '2026-11-23', art: 'volleyball', titel: 'Volleyball',
          texte: [
            'Kein Krafttraining davor.',
            'Zwei Tage vor einem Spiel brauchen wir keinen schweren Deadlift.'
          ]
        },
        { id: 'w3-mi-spiel', datum: '2026-11-25', art: 'spiel', titel: 'Spiel', zeit: '20:00', texte: [] },
        regeneration('w3-do-reg', '2026-11-26', ['Regeneration.']),
        {
          id: 'w3-fr-kraft', datum: '2026-11-27', art: 'kraft', titel: 'Beintag',
          einleitung: [
            'Hier müssen wir bereits das nächste Problem beachten:',
            'Montag 30.11. ist wieder ein Spiel.',
            'Deshalb ebenfalls keine normale schwere Freitags-Einheit.',
            'Nur:'
          ],
          uebungen: [
            { name: 'Approach Jump', angabe: '3×2' },
            { name: 'Belt Squat', angabe: '3×3 @ 3 RIR', ausGrundform: AUS_B_BELT },
            { name: 'RDL', angabe: '2×4 @ 3–4 RIR' },
            { name: 'Calf Raise', angabe: '2×6' }
          ],
          texte: ['Keine Drop Jumps.', 'Keine Nordics.', 'Kein Training bis zum Versagen.']
        },
        regeneration('w3-sa-reg', '2026-11-28', ['Regeneration'], 'tabelle'),
        regeneration('w3-so-reg', '2026-11-29', ['Regeneration'], 'tabelle')
      ]
    },

    {
      nummer: 4,
      titel: 'Woche 4 | 30. November–6. Dezember',
      texte: ['Montag 30.11., 20:00 SPIEL'],
      einheiten: [
        { id: 'w4-mo-spiel', datum: '2026-11-30', art: 'spiel', titel: 'Spiel', zeit: '20:00', texte: ['Kein Gym davor.'] },
        regeneration('w4-di-reg', '2026-12-01', ['Regeneration.']),
        {
          id: 'w4-mi-vb', datum: '2026-12-02', art: 'volleyball', titel: 'Volleyball',
          texte: ['Wenn das normale Volleyballtraining stattfindet, würde ich die Beinbelastung dort wenn möglich moderat halten.']
        },
        {
          id: 'w4-fr-kraft', datum: '2026-12-04', art: 'kraft', titel: 'Beintag',
          einleitung: [
            'Jetzt wäre theoretisch Krafttraining möglich.',
            'ABER:',
            'Montag 07.12. ist schon wieder ein Spiel.',
            'Also:'
          ],
          uebungen: [
            { name: 'Approach Jump', angabe: '3×2' },
            { name: 'Belt Squat', angabe: '3×3 @ 3 RIR', ausGrundform: AUS_B_BELT },
            { name: 'RDL', angabe: '2×5 @ 3 RIR' },
            { name: 'Calf Raise', angabe: '2×6' }
          ],
          texte: ['Keine Drop Jumps.', 'Keine Nordics.']
        },
        regeneration('w4-sa-reg', '2026-12-05', ['Regeneration.']),
        regeneration('w4-so-reg', '2026-12-06', ['Regeneration.'])
      ]
    },

    {
      nummer: 5,
      titel: 'Woche 5 | 7.–13. Dezember',
      texte: ['Das ist die schwierigste Woche.'],
      einheiten: [
        { id: 'w5-mo-spiel', datum: '2026-12-07', art: 'spiel', titel: 'Spiel', zeit: '19:30', texte: ['Kein Gym.'] },
        regeneration('w5-di-reg', '2026-12-08', ['Komplette Beinregeneration.']),
        {
          id: 'w5-mi-vb', datum: '2026-12-09', art: 'volleyball', titel: 'Volleyballtraining',
          texte: [
            'Hier würde ich, sofern organisatorisch möglich, zusätzliche maximale Sprünge vermeiden.',
            'Der Samstag ist wichtiger.'
          ]
        },
        regeneration('w5-fr-reg', '2026-12-11', [
          'Kein Beintraining.',
          'Der Freitag ist ein schlechter Zeitpunkt für RDLs, schwere Belt Squats oder Nordics.',
          'Am Freitag höchstens leicht bewegen, wenn ihr das ohnehin gut bekommt.'
        ]),
        { id: 'w5-sa-spiel', datum: '2026-12-12', art: 'spiel', titel: 'Spiel', zeit: '18:30', texte: [] }
      ]
    },

    {
      nummer: 6,
      titel: 'Woche 6 | 14.–20. Dezember',
      texte: [
        'Jetzt kommen wir aus dem dichtesten Spielblock heraus.',
        'Das ist der Zeitpunkt, an dem das eigentliche Sprungkrafttraining wieder aggressiver werden kann.'
      ],
      einheiten: [
        {
          id: 'w6-mo-kraft', datum: '2026-12-14', art: 'kraft', titel: 'Beintag',
          einleitung: [],
          uebungen: [
            { name: 'CMJ', angabe: '3×2', ausGrundform: AUS_A_CMJ },
            { name: 'Deadlift', angabe: '3×3 @ ~2 RIR', ausGrundform: AUS_A_DEADLIFT },
            { name: 'Bulgarian Split Squat', angabe: '2×5' },
            { name: 'Calf Raise', angabe: '2×6–8' }
          ],
          texte: ['→ Volleyball']
        },
        { id: 'w6-mo-vb', datum: '2026-12-14', art: 'volleyball', titel: 'Volleyball', texte: [] },
        { id: 'w6-mi-vb', datum: '2026-12-16', art: 'volleyball', titel: 'Volleyball', texte: [] },
        {
          id: 'w6-fr-kraft', datum: '2026-12-18', art: 'kraft', titel: 'Beintag',
          einleitung: [],
          uebungen: [
            { name: 'Drop Jump', angabe: '3×2', ausGrundform: AUS_B_DROP },
            { name: 'Approach Jump', angabe: '4×2 maximal' },
            { name: 'Belt Squat', angabe: '4×4 @ 2 RIR', ausGrundform: AUS_B_BELT },
            { name: 'RDL', angabe: '3×5' },
            { name: 'Nordic', angabe: '2×4' },
            { name: 'Calf Raise', angabe: '2×6' }
          ],
          texte: ['Jetzt können wir endlich wieder einen richtigen Trainingsreiz setzen.']
        },
        regeneration('w6-sa-reg', '2026-12-19', ['Regeneration'], 'tabelle'),
        regeneration('w6-so-reg', '2026-12-20', ['Regeneration'], 'tabelle')
      ]
    },

    {
      nummer: 7,
      titel: 'Woche 7 | 21.–27. Dezember',
      texte: ['Vorausgesetzt, es gibt keine weiteren Spiele, die auf den Bildern nicht aufgeführt sind:'],
      einheiten: [
        {
          id: 'w7-mo-kraft', datum: '2026-12-21', art: 'kraft', titel: 'Beintag',
          einleitung: [],
          uebungen: [
            { name: 'CMJ', angabe: '3×2 maximal', ausGrundform: AUS_A_CMJ },
            { name: 'Deadlift', angabe: '3×3 @ 1–2 RIR', ausGrundform: AUS_A_DEADLIFT },
            { name: 'Bulgarian Split Squat', angabe: '2×5 @ 2 RIR' },
            { name: 'Calf Raise', angabe: '2×6' }
          ],
          texte: []
        },
        { id: 'w7-mo-vb', datum: '2026-12-21', art: 'volleyball', titel: 'Volleyball', texte: [], herkunft: 'tabelle' },
        {
          id: 'w7-mi-vb', datum: '2026-12-23', art: 'volleyball', titel: 'Volleyball',
          texte: ['Falls Volleyballtraining stattfindet:', 'Kein Gym.'],
          vorbehalt: VORBEHALT_WEIHNACHTEN
        },
        {
          id: 'w7-fr-kraft', datum: '2026-12-25', art: 'kraft', titel: 'Beintag',
          einleitung: [],
          uebungen: [
            { name: 'Drop Jump', angabe: '4×2', ausGrundform: AUS_B_DROP },
            { name: 'Approach Jump', angabe: '5×2' },
            { name: 'Belt Squat', angabe: '4×3 @ 1–2 RIR', ausGrundform: AUS_B_BELT },
            { name: 'RDL', angabe: '2×5' },
            { name: 'Nordic', angabe: '2×4' },
            { name: 'Calf Raise', angabe: '2×6' }
          ],
          texte: [
            'Das ist die leistungsorientierteste Trainingswoche des Blocks.',
            'Aber auch hier kein Muskelversagen.'
          ]
        },
        regeneration('w7-sa-reg', '2026-12-26', ['Regeneration'], 'tabelle'),
        regeneration('w7-so-reg', '2026-12-27', ['Regeneration'], 'tabelle')
      ]
    },

    {
      nummer: 8,
      titel: 'Woche 8 | 28. Dezember–3. Januar',
      texte: ['Jetzt reduzieren wir die Ermüdung drastisch.'],
      einheiten: [
        {
          id: 'w8-mo-kraft', datum: '2026-12-28', art: 'kraft', titel: 'Beintag',
          einleitung: [],
          uebungen: [
            { name: 'CMJ', angabe: '3×2', hinweise: ['Maximal.'], ausGrundform: AUS_A_CMJ },
            { name: 'Conventional Deadlift', angabe: '2×2 @ 3 RIR', ausGrundform: AUS_A_DEADLIFT },
            { name: 'Bulgarian Split Squat', angabe: '1×4 pro Bein @ ~3 RIR' }
          ],
          texte: ['Fertig.']
        },
        {
          id: 'w8-mo-vb', datum: '2026-12-28', art: 'volleyball', titel: 'Volleyball',
          texte: ['Wenn Volleyball stattfindet, entsprechend vorsichtig mit zusätzlichem Sprungvolumen.']
        },
        {
          id: 'w8-mi-vb', datum: '2026-12-30', art: 'volleyball', titel: 'Volleyball',
          texte: ['Volleyball oder komplette Erholung.', 'Keine zusätzliche Beinkrafteinheit.'],
          vorbehalt: VORBEHALT_WEIHNACHTEN
        },
        {
          id: 'w8-fr-sprungtest', datum: '2027-01-01', art: 'sprungtest', titel: 'Sprungtest',
          einleitung: ['Wenn die Sehne ruhig ist und am Donnerstag/Freitagmorgen keine ungewöhnliche Reaktion zeigt:'],
          ablauf: [
            { titel: 'Warm-up', zeilen: ['5–10 Minuten.'] },
            {
              titel: 'Dann:',
              zeilen: [
                'Pogos leicht',
                '→ 3 submaximale Approach Jumps',
                '→ 2 × ca. 80 %',
                '→ 1 × ca. 90 %',
                'Dann vollständige Erholung.'
              ]
            },
            {
              titel: 'Approach Jump',
              zeilen: ['#1 100 %', '3–5 min Pause', '#2 100 %', '3–5 min Pause', '#3 100 %', 'Optional Versuch 4.']
            }
          ],
          schluss: ['Danach könnt ihr zusätzlich einen CMJ testen.', 'Bestwert notieren.'],
          texte: []
        },
        regeneration('w8-sa-reg', '2027-01-02', ['Erholung'], 'tabelle'),
        regeneration('w8-so-reg', '2027-01-03', ['Erholung'], 'tabelle')
      ]
    }
  ],

  uebersicht: {
    titel: 'Gesamter 8-Wochen-Plan auf einen Blick',
    kopf: ['Woche', 'Mo', 'Mi', 'Fr', 'Wochenende'],
    zeilen: [
      ['1', 'VB, kein Gym', '🏆 Spiel', '🟡 leicht', 'Regeneration'],
      ['2', '🏋️ + VB', 'VB', '🔴 Beine', 'Regeneration'],
      ['3', 'VB', '🏆 Spiel', '🟡 leicht', 'Regeneration'],
      ['4', '🏆 Spiel', 'VB', '🟡 leicht', 'Regeneration'],
      ['5', '🏆 Spiel', 'VB leicht', '🟢 kein Leg Day', '🏆 Sa. Spiel'],
      ['6', '🏋️ + VB', 'VB', '🔴 Beine', 'Regeneration'],
      ['7', '🏋️ + VB', 'VB*', '🔴 Beine', 'Regeneration'],
      ['8', '🟡 sehr wenig', 'VB/Erholung*', '🚀 Test', 'Erholung']
    ],
    fussnote: VORBEHALT_WEIHNACHTEN
  },

  volumen: {
    titel: 'Warum ich das Volumen gegenüber unserem vorherigen Plan deutlich reduziert habe',
    texte: [
      'Das ist eine bewusste Korrektur.',
      'Bei zwei Volleyballtrainings pro Woche plus Spielen hat die Patellasehne bereits eine beträchtliche Menge an:'
    ],
    liste: ['Absprüngen', 'Landungen', 'kurzen Bodenkontakten', 'Beschleunigungen', 'Richtungswechseln'],
    schluss: [
      'Ein Approach Jump im Gym und ein Wettkampfsprung sind für die Gesamtbelastung nicht getrennte Welten.',
      'Das zusätzliche Krafttraining muss deshalb die Lücken schliessen und nicht mit Volleyball um Erholungsressourcen konkurrieren.'
    ]
  },

  kontrollsystem: {
    titel: 'Patellasehne: unser Kontrollsystem',
    einleitung: 'Das ist bei ihr wahrscheinlich wichtiger als ein exakt geplantes Gewicht.',
    zeitpunkt: 'Jeden Morgen nach einer hohen Belastung:',
    gruen: {
      bedingung: '0–1/10 und wie üblich',
      konsequenz: ['Plan normal fortführen.']
    },
    gelb: {
      bedingung: '2–3/10 oder merklich mehr als ihr persönlicher Normalwert',
      konsequenz: [
        'Keine Progression.',
        'Sprungvolumen reduzieren und keinen zusätzlichen maximalen Sprungreiz erzwingen.'
      ]
    },
    rot: {
      bedingung: '>3/10 oder zunehmende Beschwerden',
      konsequenz: [
        'Keine harte Plyometrie.',
        'Wenn Beschwerden bestehen bleiben oder sich verschlechtern, Rücksprache mit der behandelnden Physiotherapie/Sportmedizin.'
      ]
    },
    hinweise: [
      'Wichtig: 0/10 während eines Trainings bedeutet nicht automatisch, dass die Belastungsmenge optimal war. Deshalb interessiert mich bei ihr besonders die Reaktion am Abend und am nächsten Morgen.',
      'Progressive Sehnenbelastung ist bei Patellatendinopathie gut begründet, aber ich bin nicht 100 % sicher, dass eine bestimmte Schmerzgrenze universell die Belastbarkeit einer individuellen Patellasehne vorhersagt. Deshalb verwenden wir Schmerz zusammen mit Verlauf und 24-h-Reaktion.'
    ]
  },

  regeneration: {
    titel: 'Ein entscheidender Punkt zur Regeneration',
    texte: [
      'Ich würde während des Spielblocks keine geplanten Deadlift- oder Belt-Squat-PRs machen.',
      'Wenn beispielsweise:',
      'Mittwoch Spiel → Freitag Belt Squats → Montag Spiel',
      'vorliegt, ist der Freitag nicht der Zeitpunkt für:',
      '5×5 Belt Squat @ 0 RIR + Nordics + RDL + Drop Jumps.',
      'Der potentielle zusätzliche Trainingsreiz ist den möglichen Verlust an Frische nicht wert.',
      'Stattdessen wollen wir zwischen den Spielen gerade genug Krafttraining erhalten, damit Maximalkraft und Power nicht verloren gehen, und den grösseren Entwicklungsreiz anschliessend in den Wochen mit mehr Abstand setzen.'
    ]
  },

  schlafErnaehrung: {
    titel: 'Schlaf und Ernährung gehören damit zum Plan',
    texte: [
      'Bei zwei Trainings plus Spielen würde ich 8+ Stunden Schlaf anstreben, besonders in den 1–2 Nächten vor und nach Spielen. Eine Metaanalyse bei Athleten zeigt einen relevanten Zusammenhang zwischen unzureichendem Schlaf und verschlechterter Leistungsfähigkeit bzw. Regeneration.',
      'Protein würde ich über den Tag verteilen und insgesamt etwa 1,6 g/kg Körpergewicht/Tag als sinnvollen Zielwert setzen. Deutlich höhere Mengen sind für Muskelaufbau nicht zuverlässig besser, wobei individuelle Anforderungen variieren können.',
      'Und besonders an Volleyball-/Spieltagen würde ich nicht bewusst Kohlenhydrate sparen, weil Volleyball wiederholte hochintensive Aktionen verlangt.'
    ]
  },

  quellen: {
    titel: 'Wissenschaftliche Grundlage',
    liste: [
      'Breda SJ et al. Effectiveness of progressive tendon-loading exercise therapy in patients with patellar tendinopathy. British Journal of Sports Medicine. 2021;55:501–509.',
      'Malliaras P et al. Patellar tendon adaptation in relation to load-intensity and contraction type. Medicine & Science in Sports & Exercise. 2015;47:1893–1903.',
      'Markovic G. Does plyometric training improve vertical jump height? British Journal of Sports Medicine. 2007;41:349–355.',
      'de Villarreal ESS et al. Determining variables of plyometric training for improving vertical jump height performance. Journal of Strength and Conditioning Research. 2009;23:495–506.',
      'Suchomel TJ, Nimphius S, Stone MH. The Importance of Muscular Strength in Athletic Performance. Sports Medicine. 2016;46:1419–1449.',
      'Morton RW et al. Protein supplementation and resistance training-induced gains in muscle mass and strength. British Journal of Sports Medicine. 2018;52:376–384.'
    ]
  },

  wichtigsteAenderung: {
    titel: 'Meine wichtigste Änderung gegenüber dem ursprünglichen Plan',
    texte: [
      'Ich würde sie während des Spielblocks nicht versuchen lassen, jede Woche gleichzeitig stärker, explosiver UND umfangreicher zu trainieren.',
      'Bis zum 12. Dezember lautet die Strategie:',
      'Spielleistung + Sehne gesund halten + Kraft erhalten + kleine Qualitätsreize.',
      'Nach dem letzten auf den Bildern sichtbaren Spiel:',
      'Kraft + explosive Qualität gezielt erhöhen.',
      'Und in Woche 8:',
      'Ermüdung massiv reduzieren und die neu aufgebaute Leistung abrufen.',
      'Das ist für eine Volleyballspielerin mit zwei Volleyballtagen pro Woche und einer Vorgeschichte mit Patellasehnenschmerzen aus meiner Sicht deutlich sinnvoller als ein klassischer starrer 8-Wochen-Gymplan.'
    ]
  }
});
