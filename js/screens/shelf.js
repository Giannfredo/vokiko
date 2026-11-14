import { books } from '../demo-data.js';

export function renderShelf() {
  const cards = books.map(book => `
    <a class="card" href="#/buch/${book.id}">
      <div class="cover">${book.cover}</div>
      <h3>${book.titel}</h3>
      <small>${book.units.length} Lektionen</small>
    </a>`).join('');

  return `
    <a class="back" href="#/start">← Start</a>
    <h1>Mein Bücherregal</h1>
    <div class="grid">${cards}</div>
  `;
}