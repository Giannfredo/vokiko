import { books } from '../db.js';
import { kikoSays } from '../ui/kiko.js';
import { installHinweis, zeichnen as zeichneInstallHinweis } from '../ui/installieren.js';
import { icon } from '../ui/icons.js';

export async function renderStart(app) {
  const anzahl = (await books.all()).length;
  const text = anzahl === 0
    ? 'Dein Regal ist noch leer. Leg dein erstes Buch an!'
    : 'Schön, dass du da bist! Wollen wir ein paar Vokabeln üben?';

  app.innerHTML = `
    <h1>Hallo! ${icon('funkel')}</h1>
    ${kikoSays(text, { stimmung: anzahl === 0 ? 'normal' : 'freude' })}
    <div class="row">
      <a class="btn" href="#/regal">${icon('buch')} Zum Bücherregal</a>
      <a class="btn btn-secondary" href="#/historie">${icon('historie')} Historie</a>
    </div>
    ${installHinweis()}
  `;
  zeichneInstallHinweis();
}