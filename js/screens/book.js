import { books, units, vocab, newId } from '../db.js';
import { esc, SPRACHEN } from '../utils.js';

export async function renderBook(app, bookId) {
  const book = await books.get(bookId);
  if (!book) {
    app.innerHTML = `<a class="back" href="#/regal">← Regal</a><h1>Buch nicht gefunden</h1>`;
    return;
  }

  const list = await units.ofBook(bookId);
  const items = [];
  for (const unit of list) {
    const words = await vocab.ofUnit(unit.id);
    const sicher = words.filter((w) => w.status === 'sicher').length;
    const prozent = words.length ? Math.round((sicher / words.length) * 100) : 0;
    items.push(`
      <li><a class="card" href="#/lektion/${unit.id}">
        <h3>${esc(unit.name)}</h3>
        <div class="progress"><div style="width:${prozent}%"></div></div>
        <small>${words.length} Vokabeln · ${prozent} % sicher</small>
      </a></li>`);
  }

  app.innerHTML = `
    <a class="back" href="#/regal">← Regal</a>
    <h1>${SPRACHEN[book.sprache].flagge} ${esc(book.titel)}</h1>
    ${list.length ? `<ul class="list">${items.join('')}</ul>` : '<p class="empty">Noch keine Lektionen.</p>'}

    <form class="form" id="unit-form">
      <h2>Neue Lektion</h2>
      <label>Name <input name="name" required placeholder="z. B. Unit 3: At school"></label>
      <button class="btn" type="submit">➕ Lektion anlegen</button>
    </form>

    <button class="btn btn-danger" id="delete-book">🗑 Buch löschen</button>
  `;

  app.querySelector('#unit-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    await units.save({
      id: newId(),
      bookId,
      name: data.get('name').trim(),
      reihenfolge: list.length + 1,
    });
    renderBook(app, bookId);
  });

  app.querySelector('#delete-book').addEventListener('click', async () => {
    if (confirm(`"${book.titel}" mit allen Lektionen und Vokabeln löschen?`)) {
      await books.remove(bookId);
      location.hash = '#/regal';
    }
  });
}