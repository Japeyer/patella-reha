# PatellaApp — Design

Datum: 2026-09-17
Status: freigegeben zur Planung

## Zweck

Eine App, die den bestehenden 2-Wochen-Rehaplan für die Patellarsehne
(21. September bis 4. Oktober 2026) begleitet. Hauptfunktion ist das
Schmerztracking mit grafischer Verlaufsdarstellung; dazu kommen Wochen- und
Monatsübersicht, der Tagesplan, die Entscheidungshilfen aus dem Plan und das
Nachschlagewerk.

Der Plan wird inhaltlich unverändert übernommen. Quelle ist
`docs/plan-original.txt`, verbatim aus
`PatellaSehneentzündogVerhinderig_260916_230749.sdocx` extrahiert. Die App gibt
ausschliesslich wieder, was dort steht, und leitet keine eigenen
Trainingsempfehlungen ab. Alle Texte, Sätze, Wiederholungszahlen, Prozentwerte
und Schwellen werden wörtlich aus dieser Datei in die Plandaten übertragen.

## Nicht-Ziele

Kein Konto, keine Anmeldung. Keine Erinnerungen oder Push-Benachrichtigungen.
Keine Kalender-Anbindung, keine Übungsvideos, keine Geräte-Synchronisierung,
keine Auswertung durch Dritte. Keine Verallgemeinerung auf andere Verletzungen
oder andere Sportarten.

## Plattform und Technik

Eine publizierte Artifact-Web-Seite, die am Handy im Browser läuft und auf den
Homescreen gelegt werden kann. Keine externen Bibliotheken, kein
Netzwerkzugriff; das Diagramm wird als Inline-SVG gezeichnet. Bedienung
einhändig am Hochformat-Handy, Darstellung in hellem und dunklem Systemthema.

Aufgeteilt in HTML, CSS und ES-Module: Plandaten, Entscheidungslogik,
Speicherung, Diagramm und Ansichten je in einer eigenen Datei. Grund für die
Aufteilung statt einer einzelnen Datei: die Entscheidungslogik des Plans liegt
damit in reinen Funktionen, die ohne Browser mit `node:test` prüfbar sind — das
verlangt der Abschnitt „Prüfung" — und jede Datei bleibt einzeln überschaubar.
Artifact-Publishing unterstützt mehrere Dateien nebeneinander. Sollten die
Module in der Artifact-Umgebung nicht laden, werden sie in eine einzelne
`index.html` eingebettet; die Funktionen bleiben dabei unverändert.

Grund für die Datenstruktur: eine Verlängerung auf Woche 3 und 4 ist damit ein
Anfügen von Tagesobjekten, ohne Eingriff in die Logik.

## Datenmodell

### Plandaten (fest, Teil der Datei)

Pro Tag: Datum, Wochentag, Wochennummer, Einheitstyp
(`volleyball-reduziert`, `volleyball-kontrolliert`, `kraft-a`, `kraft-b`,
`regeneration`, `kontrolltag`, `auswertung`), Titel wie im Plan, Liste der
Übungen mit Sätzen, Wiederholungen, Tempo, Pause und Anstrengungsangabe, die
tagesspezifischen Bedingungen als Text (zum Beispiel „Nur springen, wenn der
Dienstagmorgen beziehungsweise Mittwochmorgen nicht schlechter war"), sowie bei
Volleyballtagen die Umfangsgrenzen: Anteil der normalen Trainingsdauer,
Sprunglimit, Anteil der normalen Sprunghöhe, Mindestpause zwischen Sprüngen.

Getrennt davon, ebenfalls fest: die Schmerzzonen-Definitionen, die Regeln für
die Volleyballtrainings (Teilnahmeentscheidung, erlaubte Inhalte, nicht erlaubte
Inhalte), die Fortschrittskriterien für Woche 2, der Auswertungsbogen, die
Abschnitte zu Ernährung und Regeneration, die Red-Flag-Liste und die
wissenschaftliche Grundlage mit den sechs Quellen.

### Tageseinträge (veränderlich, vom Nutzer)

Ein Eintrag pro Datum mit vier Messpunkten:

| Messpunkt | Felder | Fällig |
|---|---|---|
| Morgen | Schmerz in Ruhe 0–10, Schmerz beim Treppenabwärtsgehen 0–10 (optional) | jeden Tag |
| Vor dem Training | Schmerz in Ruhe 0–10, Schmerz Treppe 0–10, 5 Step-downs kontrolliert möglich ja/nein, Hinken ja/nein | an Trainingstagen |
| Während des Trainings | höchster Schmerz 0–10, Zunahme von Satz zu Satz beziehungsweise Block zu Block ja/nein | an Trainingstagen |
| Nach dem Training | Schmerz direkt danach 0–10 | an Trainingstagen |

Zusätzlich pro Tag: gezählte Sprünge, Landung oder Gang verändert ja/nein,
Schwellung oder Instabilität oder Kraftverlust ja/nein, abgehakte Übungen,
freie Notiz.

Der Morgenwert eines Tages ist gleichzeitig die 24-Stunden-Reaktion auf die
Einheit des Vortags. Es gibt kein separates Feld dafür; die Auswertung liest den
Folgetags-Morgenwert. An Regenerations-, Kontroll- und Auswertungstagen ist nur
der Morgenblock fällig.

### Speicherung

Ausschliesslich im Browserspeicher des Geräts (`localStorage`), unter einem
Schlüssel, in einem Objekt mit Versionsfeld. Jeder Zugriff in `try`/`catch`,
damit die App auch bei blockiertem Website-Speicher oder im privaten Fenster
vollständig bedienbar bleibt — dann ohne Speicherung, mit sichtbarem Hinweis.

Weil Browserspeicher verloren gehen kann, gibt es einen Sicherungs-Knopf: er
zeigt alle Einträge als Text zum Kopieren und nimmt eingefügten Text wieder auf
(Wiederherstellen). Derselbe Text dient als Ausdruck für die Physiotherapie.
Die Daten verlassen das Gerät nur, wenn der Nutzer sie selbst kopiert und
weitergibt.

## Logik

### Ampel-Engine

Eine reine Funktion: Eingabe sind der Tageseintrag und der Morgeneintrag des
Folgetags, Ausgabe sind Zone und Konsequenz. Die Schwellen stammen unverändert
aus dem Plan.

Grün, wenn der Schmerz während der Belastung 0 bis 2 von 10 beträgt, kein
Hinken oder Ausweichen vorliegt und der Wert am nächsten Morgen gleich oder
besser ist als am Vortag. Konsequenz: geplante Belastung beibehalten.

Gelb, wenn der Schmerz 3 von 10 beträgt, die Beschwerden innerhalb der Einheit
etwas zunehmen, und der nächste Morgen leicht stärker, aber innerhalb von 24
Stunden wieder auf Ausgangsniveau ist. Konsequenz: nächste Einheit um etwa 20
bis 30 Prozent reduzieren, weniger Sätze, Gewicht oder Sprünge. Die App rechnet
das für die konkret nächste Einheit vor: reduzierte Satzzahl und reduziertes
Sprunglimit als Bereich, mit dem Originalwert daneben.

Rot, wenn der Schmerz 4 von 10 oder stärker ist, von Satz zu Satz deutlich
zunimmt, die Landung verändert ist oder Hinken oder Kraftverlust vorliegt, der
nächste Morgen deutlich schlechter ist, oder die Beschwerden nach 24 Stunden
nicht wieder auf dem vorherigen Niveau sind. Konsequenz: Sprünge und
schmerzauslösende Übungen stoppen, Belastung zurückstufen, physiotherapeutisch
beziehungsweise sportmedizinisch beurteilen lassen.

Solange der Folgetags-Morgenwert fehlt, wird die Zone als vorläufig aus den
Tageswerten bestimmt und als vorläufig gekennzeichnet. Die App zeigt an jeder
Zonenanzeige den Hinweis aus dem Plan: die Schmerzgrenzen sind
Orientierungswerte, nicht vollständig validiert, und die 24-Stunden-Reaktion ist
wichtiger als der Schmerz unmittelbar nach der Einheit.

### Teilnahme-Gate vor Volleyball

An Volleyballtagen eine Abfrage vor dem Aufwärmen: Schmerz in Ruhe, Schmerz beim
Treppenabwärtsgehen, 5 langsame einbeinige Kniebeugen oder Step-downs
durchgeführt und kontrolliert möglich, Hinken, Vergleich mit dem Zustand am
Morgen nach dem vorherigen Training.

Der Plan enthält hier zwei getrennte Prüfungen, und die App hält sie getrennt.

Prüfung 1, Teilnahme erlaubt, wenn alle vier Bedingungen zutreffen: kein Hinken
vorhanden, Ausgangsschmerz höchstens 2 bis 3 von 10, Knie nicht schlechter als
am Vortag, Kniebeugen beziehungsweise Step-downs kontrolliert möglich.

Prüfung 2, keine Sprünge, wenn mindestens eine der vier Bedingungen zutrifft:
Ausgangsschmerz bereits 4 von 10 oder stärker, Folgetag nach der letzten
Belastung deutlich schlechter, Schwellung oder Instabilität oder Kraftverlust
vorhanden, Knie schmerzt beim Aufwärmen zunehmend.

Aus der Kombination ergibt sich die Anzeige: Teilnahme mit kontrollierten
Sprüngen nach Tagesvorgabe, wenn Prüfung 1 erfüllt ist und Prüfung 2 nicht
auslöst. Teilnahme ohne Sprünge, wenn Prüfung 1 erfüllt ist und Prüfung 2
auslöst — höchstens Technik ohne Sprünge und Oberkörpertraining. Löst Prüfung 1
aus, gilt dasselbe: der Plan sieht für diesen Fall höchstens Technik ohne
Sprünge und Oberkörpertraining vor. In jedem Fall wird benannt, welche
Bedingung die Anzeige ausgelöst hat.

Lesart der Schwelle „höchstens 2 bis 3 von 10", festgelegt statt offen
gelassen: bis 2 erfüllt, 3 als Grenzfall erfüllt und als Grenzfall
gekennzeichnet, ab 4 nicht erfüllt. Diese Festlegung steht auch in der App am
betreffenden Feld, damit die Herkunft der Grenze erkennbar bleibt.

Daneben stehen die beiden Listen aus dem Plan: was während der
Volleyballtrainings erlaubt ist und was vorläufig nicht erlaubt ist.

Die App spricht kein Verbot aus, das über den Plan hinausgeht, und blockiert
nichts; sie zeigt, was der Plan für die eingegebene Lage vorsieht.

### Sprungzähler

An Volleyballtagen ein Tipp-Zähler mit dem Limit des Tages: in Woche 1 maximal
10 bis 15 submaximale beidbeinige Sprünge, in Woche 2 maximal 15 bis 25
kontrollierte Sprünge. Am Mittwoch der Woche 1 gilt als Limit die am Montag
gezählte Sprungzahl, ohne Steigerung innerhalb derselben Woche; am Mittwoch der
Woche 2 die Montagszahl oder höchstens 10 Prozent mehr. Fehlt die Montagszahl,
gilt der Bereich des Plans für diese Woche, mit Hinweis, dass der Montagswert
fehlt.

Umgang mit dem Bereich, festgelegt statt offen gelassen: beim Erreichen der
Untergrenze ein ruhiger Hinweis, beim Erreichen der Obergrenze eine deutliche
Warnung, darüber eine bleibende Warnung. Keine Sperre; der Zähler lässt sich
weiter betätigen und auch korrigieren. Der Zähler zeigt die Sekunden seit dem
letzten Sprung und weist darauf hin, wenn weniger als 20 bis 30 Sekunden
vergangen sind.

### Fortschritts-Gate für Woche 2

Am Kontrolltag, Sonntag dem 27. September, die vier Kriterien aus dem Plan als
Abfrage: Alltagsschmerzen haben nicht zugenommen, Morgenbeschwerden sind
höchstens 2 von 10, Beschwerden nach Belastungen gehen innerhalb von 24 Stunden
zurück, keine Veränderung des Gang- oder Landemusters. Sind alle erfüllt, gibt
Woche 2 die höheren Umfänge frei. Sonst zeigt Woche 2 die Umfänge von Woche 1
beziehungsweise den Hinweis, vollständig ohne Sprünge zu trainieren. Die
Entscheidung ist jederzeit im Kontrolltag änderbar.

Wo die App die Kriterien aus vorhandenen Einträgen selbst beantworten kann, sind
die Felder vorbelegt und bleiben überschreibbar.

### Auswertung am 4. Oktober

Der Auswertungsbogen des Plans mit seinen sechs Werten: Schmerz in Ruhe, Schmerz
beim Treppenabwärtsgehen, Schmerz nach Volleyball, Schmerz am Morgen danach,
Beschwerden innerhalb von 24 Stunden abgeklungen ja/nein, Landung und Gang
normal ja/nein. Aus den erfassten Daten vorbelegt, überschreibbar. Daneben die
beiden Listen „Gute Entwicklung" und „Ungünstige Entwicklung" wörtlich, mit dem
Schlusshinweis, bei ungünstiger Entwicklung Diagnose und Belastungsplanung
sportmedizinisch überprüfen zu lassen.

## Ansichten

**Verlauf (Startbildschirm).** Ein Liniendiagramm über die 14 Tage mit den vier
Messreihen Morgen, vor dem Training, während des Trainings, nach dem Training,
farblich unterscheidbar und auch ohne Farbe lesbar. Die Zonen liegen als
Hintergrundbänder dahinter: 0 bis 2 grün, 3 gelb, ab 4 rot. Trainingstage sind
auf der Zeitachse markiert, damit erkennbar bleibt, welcher Ausschlag zu welcher
Einheit gehört. Umschaltbar auf die Ansicht „nur Morgenwerte". Fehlende Tage
sind Lücken, nicht Nullwerte. Tippen auf einen Punkt öffnet den Tag.

**Heute.** Datum, Einheit des Tages, die vier Messpunkte als Eingabeblöcke in
zeitlicher Reihenfolge, die Tagesampel mit Konsequenz, an Trainingstagen das
Teilnahme-Gate und der Sprungzähler, darunter die Übungen des Tages mit Sätzen,
Wiederholungen, Tempo und Pausen zum Abhaken sowie die tagesspezifischen
Bedingungen im Wortlaut.

**Woche.** Sieben Spalten Montag bis Sonntag mit Einheitstyp, den erfassten
Werten und der Tagesampel als Farbe. Umschaltbar zwischen Woche 1 und Woche 2.

**Monat.** Kalendergitter über September und Oktober 2026. Jeder Plantag ein
Feld mit Kürzel der Einheit und Ampelfarbe; Tage ohne Eintrag sind als offen
erkennbar, Tage ausserhalb des Plans neutral. Tippen öffnet den Tag.

**Nachschlagewerk.** Schmerzregeln mit allen drei Zonen, Regeln für die
Volleyballtrainings mit beiden Listen, Ernährung und Regeneration,
wissenschaftliche Grundlage mit den sechs Quellenangaben — jeweils im Wortlaut
des Plans.

**Warnzeichen.** Aus jeder Ansicht erreichbar: die Liste „Wann zeitnah ärztlich
abklären?" im Wortlaut, mit dem Hinweis, dass die App keine ärztliche
Beurteilung ersetzt.

## Fehlerfälle

Kein Eintrag für einen Tag: die Ansichten zeigen die Lücke als Lücke, das
Diagramm unterbricht die Linie, die Ampel bleibt leer statt grün. Kein
Folgetags-Morgenwert: Zone vorläufig, entsprechend gekennzeichnet. Speicher
nicht verfügbar: App bleibt bedienbar, Hinweis, dass nichts gespeichert wird.
Aufruf vor dem 21. September oder nach dem 4. Oktober: die App zeigt den
nächstliegenden Plantag und erlaubt die Navigation zu jedem Tag. Unvollständiger
Wiederherstellungstext: Abbruch mit Meldung, vorhandene Daten bleiben unberührt.

## Prüfung

Die Ampel-Engine, das Teilnahme-Gate, das Fortschritts-Gate und die
Reduktionsrechnung sind reine Funktionen ohne Zustand und werden mit Testfällen
aus dem Plan geprüft: je ein Fall pro Zone, die Grenzfälle 2/3 und 3/4, fehlende
Folgetagswerte, Hinken bei sonst grünen Werten, veränderte Landung bei sonst
grünen Werten. Die Plandaten werden gegen `docs/plan-original.txt` abgeglichen,
sodass jede Zahl und jeder Text der Quelle entspricht.

## Abgrenzung des Inhalts

Die App ist ein Protokoll- und Nachschlagewerkzeug für einen bereits
bestehenden, selbst erstellten Plan. Sie stellt keine Diagnose, ersetzt keine
physiotherapeutische oder ärztliche Beurteilung und passt den Plan nicht
eigenständig an. Wo der Plan eine Abklärung vorsieht, zeigt die App diesen
Hinweis unverändert an.

## Verlängerung

Nach dem 4. Oktober können weitere Wochen als Daten angefügt werden. Die Regeln,
Zonen und Gates bleiben unverändert; nur Tagesobjekte mit ihren Umfangsgrenzen
kommen hinzu. Das ist kein Teil dieser Umsetzung, aber die Datenstruktur hält es
offen.
