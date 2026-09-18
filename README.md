# Patella-Reha

**App: https://japeyer.github.io/patella-reha/**

Begleiter für den 2-Wochen-Rehaplan der Patellarsehne, 21. September bis
4. Oktober 2026.

Der Startbildschirm beantwortet drei Fragen in dieser Reihenfolge: was steht
heute an, was ist heute im Volleyball erlaubt, und welcher Schmerzwert ist als
nächster fällig. Alles Weitere — Übungen, Sprungzähler, Befundbegründung,
Fortschritts-Gate, Auswertungsbogen — liegt unter "Mehr zum Tag" eine Ebene
tiefer. Drei Ansichten: Heute, Verlauf, Plan.

## Messmethodik

Der Plan erhebt vor jeder Belastung zwei Zahlen und eine Funktionsprüfung:

| Messung | Art | Quelle |
|---|---|---|
| Schmerz in Ruhe | 0–10 | Z. 27 |
| Schmerz beim Treppenabwärtsgehen | 0–10 | Z. 28 |
| 5 langsame einbeinige Kniebeugen oder Step-downs | kontrolliert möglich ja/nein | Z. 29, 35 |

Das *Abwärts* ist die exzentrische Belastungsrichtung und damit der
eigentliche Lasttest der Sehne; Treppensteigen aufwärts und Stehen stehen
nicht im Plan. Ruheschmerz allein ist bei Tendinopathie ein schwacher
Indikator, deshalb kombiniert der Plan ihn mit einem Lasttest und überwacht
Treppen als eigene Dimension ("Alltag oder Treppen werden zunehmend
schmerzhaft", Z. 222).

**Ausgangsschmerz** ist der höhere der beiden Zahlen. Diese Festlegung steuert
die Volleyball-Freigabe, den 24-Stunden-Vergleich und die Linie im Verlauf.
Begründung: Ruhe 1 bei Treppe 5 beschreibt ein gereiztes Knie, das die
Ruhezahl allein freigeben würde. Der Plan nennt in der Teilnahmeregel den
"Ausgangsschmerz" erst, nachdem er beide Werte erhoben hat (Z. 27–33).

Die Schmerzgrenzen *während* der Belastung sind im Plan getrennt geregelt und
werden dort angezeigt, wo sie gelten: Isometrie "Knieposition so wählen, dass
der Schmerz höchstens 2 bis 3 von 10 beträgt" (Z. 74), Kraft "Schmerz
höchstens 3 von 10" (Z. 125), Funktionstest "Nur bei Alltagsschmerz höchstens
1 bis 2 von 10" (Z. 202).

## Volleyball-Freigabe

Die Freigabe wird aus den bereits erfassten Werten berechnet, ohne dass vorher
ein Formular ausgefüllt werden muss. Sperrgründe, alle aus dem Plan:

- Ausgangsschmerz heute 4 von 10 oder stärker (Z. 37)
- Folgetag nach der letzten Belastung deutlich schlechter (Z. 38)
- Schwellung, Instabilität oder Kraftverlust (Z. 39)
- letzte Einheit in der roten Zone (Z. 22)
- Hinken oder nicht kontrollierbare Step-downs im Check vor dem Training (Z. 32, 35)

War die letzte Einheit **gelb**, enthält das genannte Sprunglimit bereits die
Reduktion um 20 bis 30 Prozent aus Z. 15. Der Check vor dem Training kann
zusätzlich sperren, hebt aber nie eine Sperre auf.

## Als App verwenden

Die App ist eine Progressive Web App: über den Browser aufrufen und zum
Startbildschirm hinzufügen, danach startet sie wie eine installierte App im
Vollbild und läuft auch ohne Netz.

**Android, Chrome:** Seite öffnen, Menü (drei Punkte), *App installieren* oder
*Zum Startbildschirm zufügen*.
**Samsung Internet:** Menü, *Seite hinzufügen zu*, *Startbildschirm*.
**iPhone, Safari:** Teilen-Symbol, *Zum Home-Bildschirm*.

Offline sorgt `src/sw.js` dafür, dass alle Dateien auf dem Gerät liegen — in
der Halle ist der Empfang oft schlecht, und die Freigabe muss trotzdem da sein.
**Nach jeder Änderung an den Dateien die `VERSION` in `src/sw.js` erhöhen,
sonst behalten bereits installierte Geräte den alten Stand.

Die Schmerzdaten liegen im `localStorage` und damit an der Adresse, unter der
die App geöffnet wurde. Wer die App unter einer neuen Adresse aufruft, startet
mit leerem Protokoll; zum Umziehen den Sicherungstext kopieren und unter der
neuen Adresse wiederherstellen.

## Veröffentlichen

GitHub Pages liefert `src/` unverändert aus, es gibt keinen Bauschritt. Der
Workflow `.github/workflows/pages.yml` führt vor jeder Veröffentlichung die
Tests, die Datentreueprüfung und den Ansichtsdurchlauf aus und bricht ab, wenn
etwas fehlschlägt.

Für ein Artifact auf claude.ai erzeugt `node tools/build-artifact.mjs` aus
derselben Quelle die eingebettete Fassung ohne Dokumentgerüst
(`build/index.html`), damit es keine zweite Kopie des Markups gibt.

## Herkunft der Plandaten

Der Plan wurde aus `PatellaSehneentzündogVerhinderig_260916_230749.sdocx`
(Samsung Notes) extrahiert und liegt verbatim in `docs/plan-original.txt`,
250 Zeilen. `src/plan-data.js` überträgt diese Quelle unverändert in eine
Datenstruktur: jeder Text, jede Satz- und Wiederholungszahl, jeder Prozentwert
und jede Schmerzschwelle entspricht der Quelle. Die App leitet keine eigenen
Trainingsempfehlungen ab.

Zwei Stellen, an denen der Plan einen Bereich nennt und Code eine eindeutige
Grenze braucht, sind ausdrücklich festgelegt und in der App als solche
gekennzeichnet:

- Schwelle „Ausgangsschmerz höchstens 2 bis 3 von 10": bis 2 erfüllt, 3 erfüllt
  und als Grenzfall markiert, ab 4 nicht erfüllt.
- Sprunglimit-Bereiche: Hinweis ab Untergrenze, deutliche Warnung ab
  Obergrenze, keine Sperre.

Die Regel „mindestens 20 bis 30 Sekunden zwischen einzelnen Sprüngen" steht in
der Quelle nur beim Montag der Woche 1 und wird deshalb nur dort angezeigt,
nicht auf alle Volleyballtage verallgemeinert.

## Daten

Alles liegt im `localStorage` des jeweiligen Geräts und verlässt es nicht. Der
Knopf „Daten sichern oder wiederherstellen" gibt den Bestand als Text aus –
lesbar für die Physiotherapie und gleichzeitig wieder einlesbar. Bei
blockiertem Website-Speicher bleibt die App bedienbar und weist darauf hin,
dass nichts behalten wird.

## Dateien

| Datei | Verantwortung |
|---|---|
| `src/plan-data.js` | Plandaten, wörtlich aus der Quelle. Nur Daten. |
| `src/logic.js` | Reine Funktionen: Zonen, Teilnahme-Gate, Sprunglimit, Reduktion, Fortschritts-Gate, Auswertung |
| `src/storage.js` | `localStorage` mit Fallback, Sicherungstext |
| `src/chart.js` | Verlaufsdiagramm als SVG |
| `src/state.js` | Zustand, Datenzugriff, Kalenderbezüge |
| `src/ui.js` | Geteilte Anzeigebausteine |
| `src/view-today.js` | Ansicht „Heute" — Tagesart, Freigabe, Erfassung, „Mehr zum Tag" |
| `src/view-overview.js` | Die 14-Tage-Leiste |
| `src/view-reference.js` | Nachschlagewerk und Warnzeichen |
| `src/app.js` | Verlaufsansicht, Navigation, Dialoge |
| `src/index.html` | Vollständiges Dokument mit Manifest- und Icon-Verweisen |
| `src/manifest.webmanifest` | Name, Icons, Vollbildstart |
| `src/sw.js` | Service Worker für die Offline-Nutzung |
| `tools/make-icons.mjs` | Erzeugt die PNG-Icons ohne Bibliothek |
| `tools/build-artifact.mjs` | Artifact-Fassung aus `src/index.html` |

## Prüfen

```
node --test                    # 100 Tests: Datentreue, Ausgangsschmerz, Zonen, Gates, Freigabe, Speicher, Diagramm
node tools/vollstaendigkeit.mjs  # prüft, dass jede Quellzeile übernommen ist
node tools/smoke.mjs             # führt alle Ansichten ohne Browser aus
```

Lokal ansehen:

```
node -e "const{createServer}=require('http'),{readFileSync}=require('fs');createServer((q,s)=>{try{const p=q.url==='/'?'/index.html':q.url;const t=p.endsWith('.css')?'text/css':p.endsWith('.js')?'text/javascript':'text/html';s.writeHead(200,{'content-type':t});s.end(readFileSync('src'+p));}catch{s.writeHead(404);s.end();}}).listen(8123,()=>console.log('http://localhost:8123'))"
```

## Abgrenzung

Die App ist ein Protokoll- und Nachschlagewerkzeug für einen bereits
bestehenden, selbst erstellten Plan. Sie stellt keine Diagnose und ersetzt
keine physiotherapeutische oder ärztliche Beurteilung. Wo der Plan eine
Abklärung vorsieht, zeigt die App diesen Hinweis unverändert an.

## Unterlagen

- Design: `docs/superpowers/specs/2026-09-17-patella-reha-app-design.md`
- Umsetzungsplan: `docs/superpowers/plans/2026-09-17-patella-app.md`
