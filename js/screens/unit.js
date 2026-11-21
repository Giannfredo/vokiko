import { books, units, vocab, newId } from '../db.js';
import { esc, SPRACHEN, DEUTSCH_CHIP } from '../utils.js';
import { confirmDialog } from '../ui/dialog.js';
import { canSpeak, speak } from '../speech.js';
import { icon } from '../ui/icons.js';

export async function renderUnit(app, unitId) {
  const unit = await units.get(unitId);
  if (!unit) {
    app.innerHTML = `<a class="back" href="#/regal">${icon('zurueck')} Regal</a><h1>Lektion nicht gefunden</h1>`;
    return;
  }
  const book = await books.get(unit.bookId);
  const sprache = SPRACHEN[book.sprache];
  const words = await vocab.ofUnit(unitId);

  const rows = words.map((w) => `
    <li class="vocab">
      <div class="words">
        <div class="fremd">${esc(w.fremd)}</div>
        <div class="deutsch">${esc(w.deutsch)}</div>
      </div>
      ${canSpeak() ? `<button class="icon-btn" data-speak="${w.id}" title="Anhören" aria-label="Anhören">${icon('laut')}</button>` : ''}
      <button class="icon-btn" data-edit="${w.id}" title="Bearbeiten" aria-label="Bearbeiten">${icon('stift')}</button>
      <button class="icon-btn" data-delete="${w.id}" title="Löschen" aria-label="Löschen">${icon('muell')}</button>
    </li>`).join('');

  app.innerHTML = `
    <a class="back" href="#/buch/${book.id}">${icon('zurueck')} ${esc(book.titel)}</a>
    <h1>${esc(unit.name)}</h1>
    <p>${words.length} Vokabeln</p>
    <div class="row">
      ${words.length ? `<a class="btn" href="#/ueben/${unitId}">${icon('ueben')} Üben</a>` : ''}
      <a class="btn btn-secondary" href="#/foto/${unitId}">${icon('kamera')} Foto einlesen</a>
    </div>
    ${words.length ? `<ul class="list">${rows}</ul>` : '<p class="empty">Noch keine Vokabeln. Leg unten die erste an!</p>'}

    <form class="form" id="vocab-form">
      <h2 id="form-title">Neue Vokabel</h2>
      <label>${sprache.chip} ${sprache.name}
        <input name="fremd" required autocomplete="off" autocapitalize="off" spellcheck="false">
      </label>
      <label>${DEUTSCH_CHIP} Deutsch
        <input name="deutsch" required autocomplete="off" placeholder="mehrere Bedeutungen mit ; trennen">
      </label>
      <label>Beispielsatz (optional) <input name="beispiel" autocomplete="off"></label>
      <div class="row">
        <button class="btn" type="submit" id="save-btn">${icon('plus')} Hinzufügen</button>
        <button class="btn btn-secondary" type="button" id="cancel-btn" hidden>Abbrechen</button>
      </div>
    </form>

    <button class="btn btn-danger" id="delete-unit">${icon('muell')} Lektion löschen</button>
  `;

  const form = app.querySelector('#vocab-form');
  let editingId = null; // null = neue Vokabel, sonst die id der Vokabel, die bearbeitet wird

  function startEdit(w) {
    editingId = w.id;
    form.fremd.value = w.fremd;
    form.deutsch.value = w.deutsch;
    form.beispiel.value = w.beispiel || '';
    app.querySelector('#form-title').textContent = 'Vokabel bearbeiten';
    app.querySelector('#save-btn').innerHTML = `${icon('speichern')} Speichern`;
    app.querySelector('#cancel-btn').hidden = false;
    form.scrollIntoView({ behavior: 'smooth' });
    form.fremd.focus();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fields = {
      fremd: form.fremd.value.trim(),
      deutsch: form.deutsch.value.trim(),
      beispiel: form.beispiel.value.trim(),
    };
    if (editingId) {
      const old = await vocab.get(editingId);
      await vocab.save({ ...old, ...fields });
    } else {
      await vocab.save({
        id: newId(),
        unitId,
        ...fields,
        status: 'neu',
        richtigInFolge: 0,
        fehlerGesamt: 0,
        erstelltAm: Date.now(),
      });
    }
    await renderUnit(app, unitId);
    app.querySelector('#vocab-form').fremd.focus(); // gleich die nächste Vokabel tippen
  });

  app.querySelector('#cancel-btn').addEventListener('click', () => renderUnit(app, unitId));

  // Ein Klick-Empfänger für alle Bearbeiten- und Löschen-Knöpfe der Liste
  app.querySelector('.list')?.addEventListener('click', async (event) => {
    const editId = event.target.dataset.edit;
    const deleteId = event.target.dataset.delete;
    const speakId = event.target.dataset.speak;
    if (speakId) speak(words.find((w) => w.id === speakId).fremd, sprache.stimme);
    if (editId) startEdit(words.find((w) => w.id === editId));
    if (deleteId) {
      const w = words.find((x) => x.id === deleteId);
      const ok = await confirmDialog({
        title: 'Vokabel löschen?',
        text: `"${w.fremd}" – ${w.deutsch}`,
        icon: 'muell',
      });
      if (!ok) return;
      await vocab.remove(deleteId);
      renderUnit(app, unitId);
    }
  });

  app.querySelector('#delete-unit').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'Lektion löschen?',
      text: `"${unit.name}" wird mit allen ${words.length} Vokabeln gelöscht.`,
      icon: 'buch-offen',
    });
    if (ok) {
      await units.remove(unitId);
      location.hash = `#/buch/${book.id}`;
    }
  });
}