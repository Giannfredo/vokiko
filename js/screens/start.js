import { books } from '../db.js';

export async function renderStart(app) {
  const anzahl = (await books.all()).length;
  const text = anzahl === 0
    ? 'Dein Regal ist noch leer. Leg dein erstes Buch an!'
    : 'Schön, dass du da bist! Wollen wir ein paar Vokabeln üben?';

  app.innerHTML = `
    <h1>Hallo! 👋</h1>
    <div class="kiko-bubble"><strong>Kiko sagt:</strong> ${text}</div>
    <a class="btn" href="#/regal">📚 Zum Bücherregal</a>
  `;
}