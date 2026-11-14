import { books } from '../demo-data.js';

export function renderBook(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) {
    return `<a class="back" href="#/regal">← Regal</a><h1>Buch nicht gefunden</h1>`;
  }

  const items = book.units.map(unit => `
    <li class="card">
      <h3>${unit.name}</h3>
      <div class="progress"><div style="width:${unit.fortschritt}%"></div></div>
      <small>${unit.fortschritt} % sicher</small>
    </li>`).join('');

  return `
    <a class="back" href="#/regal">← Regal</a>
    <h1>${book.cover} ${book.titel}</h1>
    <ul class="list">${items}</ul>
  `;
}