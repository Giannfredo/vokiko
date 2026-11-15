import { books } from '../db.js';
import { kikoSays } from '../ui/kiko.js';

export async function renderStart(app) {
  const anzahl = (await books.all()).length;
  const text = anzahl === 0
    ? 'Dein Regal ist noch leer. Leg dein erstes Buch an!'
    : 'Schön, dass du da bist! Wollen wir ein paar Vokabeln üben?';

  app.innerHTML = `
    <h1>Hallo! 👋</h1>
    ${kikoSays(text, { stimmung: anzahl === 0 ? 'normal' : 'freude' })}
    <div class="row">
      <a class="btn" href="#/regal">📚 Zum Bücherregal</a>
      <a class="btn btn-secondary" href="#/historie">📊 Historie</a>
    </div>
  `;
}