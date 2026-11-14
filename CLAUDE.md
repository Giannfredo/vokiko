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
- Speicher: IndexedDB, **nur** über `js/db.js` (Tabellen `books`, `units`, `vocab`).
- Später: PWA, danach Capacitor für iOS/Android (gleicher Code).

## Struktur
- `index.html` – Einstieg, lädt `css/style.css` und `js/app.js`
- `js/app.js` – Hash-Router (`#/start`, `#/regal`, `#/buch/:id`, `#/lektion/:id`, `#/ueben/:id`)
- `js/db.js` – Speichern/Laden (`books`, `units`, `vocab`, `newId()`)
- `js/quiz.js` – Abfrage-Logik ohne HTML (Fragen bauen, auswerten, Sterne, Wort-Status)
- `js/utils.js` – `esc()` und `SPRACHEN`
- `js/ui/dialog.js` – `confirmDialog()` (eigenes Popup)
- `js/screens/*.js` – ein Modul pro Bildschirm, Signatur `async function renderX(app, ...params)`

## Regeln
- Jeder Text, den Nutzer eingeben, wird mit `esc()` ins HTML eingefügt.
- Nie `alert()`/`confirm()` – immer `confirmDialog()` aus `js/ui/dialog.js`.
- Farben nur über die CSS-Variablen in `:root` (`--rost`, `--orange`, `--creme`, `--braun`, `--gruen`).
- Tippflächen mindestens 48 px hoch.
- IDs mit `newId()` (kein `crypto.randomUUID`, das braucht HTTPS).

## Datenmodell (vocab)
`{ id, unitId, fremd, deutsch, beispiel, status: 'neu'|'in Arbeit'|'sicher', richtigInFolge, fehlerGesamt, erstelltAm }`
Mehrere Bedeutungen in `deutsch` mit `;` getrennt. 3× hintereinander richtig = `sicher`.

## Roadmap
- [x] 0 Mac einrichten
- [x] 1 Grundgerüst und Navigation
- [x] 2 Speichern (Bücher, Lektionen, Vokabeln) + eigenes Lösch-Popup
- [x] 3 Auswahl-Modus „1 aus 3“ mit Korrekturseite am Ende
- [ ] 4 Schreib-Modi Fremd→DE und DE→Fremd mit Toleranz (Groß/Klein egal, eine Bedeutung reicht, fehlende Akzente = „fast richtig“), Aussprache per Web Speech API
- [ ] 5 Historie: Übungen speichern, „letztes Mal X Fehler, heute Y“, Problemwörter, Export/Import
- [ ] 6 Foto-Import mit Tesseract.js + Prüfansicht
- [ ] 7 Design: Kiko-Grafik, Sterne, Konfetti
- [ ] 8 PWA (offline, Homescreen)
- [ ] 9 Capacitor → iPhone/Android
