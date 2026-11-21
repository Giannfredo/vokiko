import { books, units, vocab, sessions, exportAll, checkImport, importAll } from '../db.js';
import { esc, SPRACHEN } from '../utils.js';
import { confirmDialog } from '../ui/dialog.js';
import { stars } from '../quiz.js';
import { MODUS_NAMEN, problemWords, formatDauer, formatDatum } from '../history.js';
import { icon } from '../ui/icons.js';

export async function renderHistory(app) {
  // Alles laden und Nachschlage-Tabellen bauen: id → Lektion, id → Buch
  const unitById = new Map((await units.all()).map((u) => [u.id, u]));
  const bookById = new Map((await books.all()).map((b) => [b.id, b]));
  const label = (unitId) => {
    const unit = unitById.get(unitId);
    const book = unit && bookById.get(unit.bookId);
    return book ? `${SPRACHEN[book.sprache].chip} ${esc(book.titel)} · ${esc(unit.name)}` : 'Gelöschte Lektion';
  };

  const liste = await sessions.all();
  const probleme = problemWords(await vocab.all(), 10);

  const sessionRows = liste.map((s) => {
    const st = stars(s.fehler, s.anzahl);
    return `
      <li class="card session">
        <div class="session-head">
          <strong>${label(s.unitId)}</strong>
          <span class="stars-small">${'★'.repeat(st)}<span class="off">${'★'.repeat(3 - st)}</span></span>
        </div>
        <small>${formatDatum(s.gestartetAm)} · ${MODUS_NAMEN[s.modus]}${s.nurProbleme ? ` · ${icon('ziel')} Problemwörter` : ''} · ${formatDauer(s.dauerSek)}</small>
        <div>${s.fehler} Fehler bei ${s.anzahl} Wörtern${s.fast ? ` · ${s.fast}× fast richtig` : ''}</div>
      </li>`;
  }).join('');

  const problemRows = probleme.map((w) => `
    <li class="vocab">
      <div class="words">
        <div class="fremd">${esc(w.fremd)}</div>
        <div class="deutsch">${esc(w.deutsch)}</div>
        <small>${label(w.unitId)}</small>
      </div>
      <span class="badge">${w.fehlerGesamt}× falsch</span>
      <a class="icon-btn" href="#/ueben/${w.unitId}" title="Diese Lektion üben" aria-label="Diese Lektion üben">${icon('ueben')}</a>
    </li>`).join('');

  app.innerHTML = `
    <a class="back" href="#/start">${icon('zurueck')} Start</a>
    <h1>${icon('historie')} Historie</h1>

    <h2>${icon('ziel')} Problemwörter</h2>
    ${probleme.length
      ? `<ul class="list">${problemRows}</ul>`
      : '<p class="empty">Keine Problemwörter – super!</p>'}

    <h2>Alle Übungen (${liste.length})</h2>
    ${liste.length
      ? `<ul class="list">${sessionRows}</ul>`
      : '<p class="empty">Noch keine Übungen gemacht.</p>'}

    <div class="form">
      <h2>${icon('speichern')} Sicherung</h2>
      <p>Speichere alle Bücher, Vokabeln und Übungen als Datei – z. B. für ein neues Gerät.</p>
      <div class="row">
        <button class="btn" id="export">${icon('export')} Exportieren</button>
        <label class="btn btn-secondary file-btn">${icon('import')} Importieren
          <input type="file" id="import" accept=".json,application/json" hidden>
        </label>
      </div>
      <p class="notice" id="msg" hidden></p>
    </div>
  `;

  const msg = app.querySelector('#msg');
  const show = (text) => { msg.textContent = text; msg.hidden = false; };

  app.querySelector('#export').addEventListener('click', async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vokiko-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    show(`Gespeichert: ${data.books.length} Bücher, ${data.vocab.length} Vokabeln, ${data.sessions.length} Übungen.`);
  });

  app.querySelector('#import').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    event.target.value = ''; // dieselbe Datei kann später nochmal gewählt werden
    if (!file) return;

    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      show('Diese Datei kann ich nicht lesen. Ist es eine Vokiko-Sicherung (.json)?');
      return;
    }
    const fehler = checkImport(data);
    if (fehler) { show(fehler); return; }

    const ok = await confirmDialog({
      title: 'Sicherung importieren?',
      text: `${data.books.length} Bücher, ${data.vocab.length} Vokabeln und ${(data.sessions || []).length} Übungen. `
        + 'Einträge, die es schon gibt, werden mit dem Stand aus der Datei überschrieben.',
      okLabel: 'Importieren',
      icon: 'import',
    });
    if (!ok) return;
    await importAll(data);
    await renderHistory(app);
    app.querySelector('#msg').textContent = 'Import fertig!';
    app.querySelector('#msg').hidden = false;
  });
}
