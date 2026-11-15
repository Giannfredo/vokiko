# Vokiko – Vokabeltrainer für Klasse 4–8

Vokiko macht aus abfotografierten Vokabellisten im Schulbuch ein digitales Vokabelheft
und fragt die Wörter spielerisch ab. Maskottchen: **Kiko, ein Roter Panda**.
Spezifikation: https://claude.ai/artifact/Ft55XZMdSKqsB6rfLp3tw1

## Zusammenarbeit
- Ich (Daniel) lerne dabei: erkläre jeden Schritt kurz auf Deutsch, bevor du Code änderst.
- Arbeite Schritt für Schritt nach der Roadmap unten; nach jedem Schritt testen und committen.
- Die App-Oberfläche ist komplett auf Deutsch, kindgerecht, aber nicht babyhaft.

## Technik
- Reines HTML, CSS, JavaScript (ES-Module), kein Framework, kein Build-Schritt.
- Starten: `python3 -m http.server 8000` im Projektordner → http://localhost:8000
- Speicher: IndexedDB, **nur** über `js/db.js` (Tabellen `books`, `units`, `vocab`, `sessions`, `answers`; DB_VERSION 2 – neue Tabellen nur in `onupgradeneeded` je nach `oldVersion` anlegen).
- Teilen: Prototyp läuft auf **GitHub Pages** (https://giannfredo.github.io/vokiko/, Repo `Giannfredo/vokiko`, HTTPS, öffentlicher Link für Tester außerhalb des Heimnetzes). Dafür alle Pfade relativ halten (kein führendes `/`), Router nur per `#`-Hash. Repo ist öffentlich → keine Schulbuchfotos oder privaten Daten committen. Veröffentlichen: committen, dann `git push` – nach ca. 1 Min. online. Commits nur mit der noreply-Adresse (ist eingestellt). Fritzbox-Portfreigabe nur als Notlösung (Heimnetz offen, eigenes Zertifikat, Mac muss laufen).
- Später: PWA, danach Capacitor für iOS/Android (gleicher Code).

## Struktur
- `index.html` – Einstieg, lädt `css/style.css` und `js/app.js`
- `js/app.js` – Hash-Router (`#/start`, `#/regal`, `#/buch/:id`, `#/lektion/:id`, `#/ueben/:id`, `#/historie`, `#/foto/:id`)
- `js/db.js` – Speichern/Laden (`books`, `units`, `vocab`, `sessions`, `answers`, `newId()`, `exportAll()`/`importAll()`)
- `js/quiz.js` – Abfrage-Logik ohne HTML (Fragen bauen, Toleranzregeln `checkTyped()`, auswerten, Sterne, Wort-Status)
- `js/history.js` – Statistik ohne HTML (Vergleich „letztes Mal“, Problemwörter, Datum/Dauer)
- `js/ocr.js` – Foto vorbereiten (drehen, markierten Bereich ausschneiden und bis 2× vergrößern, Grün-Kanal als Graubild, max. 2000 px) und Texterkennung mit Tesseract.js 5.1.1 (`recognizeAll()`: ein Worker für alle Bereiche, erst bei Bedarf vom CDN geladen, Wörter mit Sicherheit < 40 verworfen)
- `js/parser.js` – Wortpositionen → Wortpaare ohne HTML: Abschnitte bilden → 3 häufigste Spaltenanfänge → Spalten von oben nach unten abgleichen (`align()`, verträgt schräge/verzerrte Fotos) → Fortsetzungszeilen anhängen → säubern. Spaltenreihenfolge der Bücher: Fremdwort | Deutsch | Beispielsatz
- `js/speech.js` – Aussprache per Web Speech API (`speak(text, SPRACHEN[x].stimme)`)
- `js/utils.js` – `esc()` und `SPRACHEN` (Name, Flagge, Stimme, Akzent-Knöpfe)
- `js/screens/practice.js` – Üben: Modus/Anzahl wählen → Abfrage → Korrekturseite (speichert Übung + Antworten)
- `js/screens/import.js` – Foto-Import: Foto wählen → vorbereiten (drehen, Rahmen um Vokabelbereiche ziehen, mehrere möglich, Pointer-Events) → OCR + Parser je Bereich → Prüfansicht → Speichern (Doppelte werden übersprungen)
- `js/screens/history.js` – Historie: Problemwörter, alle Übungen, Export/Import
- `js/ui/dialog.js` – `confirmDialog()` (eigenes Popup)
- `js/screens/*.js` – ein Modul pro Bildschirm, Signatur `async function renderX(app, ...params)`

## Regeln
- Jeder Text, den Nutzer eingeben, wird mit `esc()` ins HTML eingefügt.
- Nie `alert()`/`confirm()` – immer `confirmDialog()` aus `js/ui/dialog.js`.
- Farben nur über die CSS-Variablen in `:root` (`--rost`, `--orange`, `--creme`, `--braun`, `--gruen`).
- Tippflächen mindestens 48 px hoch.
- IDs mit `newId()` (kein `crypto.randomUUID`, das braucht HTTPS).

## Foto-Import testen
- Beispielfotos liegen in `Photo_Examples/` (HEIC, nicht in Git – Schulbuchseiten sind urheberrechtlich geschützt).
- Chrome kann HEIC nicht öffnen → in Safari testen oder als JPEG exportieren.

## Datenmodell (vocab)
`{ id, unitId, fremd, deutsch, beispiel, status: 'neu'|'in Arbeit'|'sicher', richtigInFolge, fehlerGesamt, erstelltAm }`
Mehrere Bedeutungen in `deutsch` mit `;` getrennt. 3× hintereinander richtig = `sicher`. „fast richtig“ zählt nicht als Fehler.
Problemwort = `fehlerGesamt > 0` und nicht `sicher`. Vergleich „letztes Mal“ = gleiche Lektion **und** gleicher Modus.

## Datenmodell (sessions / answers)
`{ id, unitId, unitIds, modus: 'auswahl'|'fremd-de'|'de-fremd', nurProbleme, gestartetAm, dauerSek, anzahl, fehler, fast }`
`{ id, sessionId, vocabId, gezeigt, eingegeben, ergebnis: 'richtig'|'fast'|'falsch', manuell? }`

## Roadmap
- [x] 0 Mac einrichten
- [x] 1 Grundgerüst und Navigation
- [x] 2 Speichern (Bücher, Lektionen, Vokabeln) + eigenes Lösch-Popup
- [x] 3 Auswahl-Modus „1 aus 3“ mit Korrekturseite am Ende
- [x] 4 Schreib-Modi Fremd→DE und DE→Fremd mit Toleranz (Groß/Klein egal, eine Bedeutung reicht, fehlende Akzente = „fast richtig“), Aussprache per Web Speech API
- [x] 5 Historie: Übungen speichern, „letztes Mal X Fehler, heute Y“, Problemwörter, Export/Import
- [x] 6 Foto-Import mit Tesseract.js + Bereiche markieren + Prüfansicht (läuft; Erkennungsqualität wird noch verbessert)
- [x] 6b Teilen: Prototyp auf GitHub Pages (https://giannfredo.github.io/vokiko/), läuft auch außerhalb des WLANs
- [ ] 7 Design: Kiko-Grafik, Sterne, Konfetti
- [ ] 8 PWA (offline, Homescreen)
- [ ] 9 Capacitor → iPhone/Android
