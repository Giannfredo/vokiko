import { books, newId } from '../db.js';
import { esc, SPRACHEN } from '../utils.js';

export async function renderShelf(app) {
  const list = (await books.all()).sort((a, b) => a.erstelltAm - b.erstelltAm);

  const cards = list.map((book) => `
    <a class="card" href="#/buch/${book.id}">
      <div class="cover">${SPRACHEN[book.sprache].flagge}</div>
      <h3>${esc(book.titel)}</h3>
      <small>${SPRACHEN[book.sprache].name}${book.schulstufe ? ' · ' + esc(book.schulstufe) + '. Klasse' : ''}</small>
    </a>`).join('');

  app.innerHTML = `
    <a class="back" href="#/start">← Start</a>
    <h1>Mein Bücherregal</h1>
    ${list.length ? `<div class="grid">${cards}</div>` : '<p class="empty">Noch keine Bücher im Regal.</p>'}

    <form class="form" id="book-form">
      <h2>Neues Buch</h2>
      <label>Titel <input name="titel" required placeholder="z. B. More! 2"></label>
      <div class="row">
        <label>Sprache
          <select name="sprache">
            <option value="en">Englisch</option>
            <option value="fr">Französisch</option>
          </select>
        </label>
        <label>Klasse <input name="schulstufe" type="number" min="1" max="13" placeholder="z. B. 5"></label>
      </div>
      <button class="btn" type="submit">➕ Buch anlegen</button>
    </form>
  `;

  app.querySelector('#book-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // verhindert, dass die Seite neu lädt
    const data = new FormData(event.target);
    await books.save({
      id: newId(),
      titel: data.get('titel').trim(),
      sprache: data.get('sprache'),
      schulstufe: data.get('schulstufe'),
      erstelltAm: Date.now(),
    });
    renderShelf(app); // Bildschirm neu zeichnen
  });
}