import { renderStart } from './screens/start.js';
import { renderShelf } from './screens/shelf.js';
import { renderBook } from './screens/book.js';
import { renderUnit } from './screens/unit.js';
import { renderPractice } from './screens/practice.js';
import { renderHistory } from './screens/history.js';

const app = document.getElementById('app');

// Welche Adresse zeigt welchen Bildschirm?
const routes = [
  { pattern: /^#\/start$/,           render: renderStart },
  { pattern: /^#\/regal$/,           render: renderShelf },
  { pattern: /^#\/buch\/(\w+)$/,     render: renderBook },
  { pattern: /^#\/lektion\/(\w+)$/,  render: renderUnit },
  { pattern: /^#\/ueben\/(\w+)$/,    render: renderPractice },
  { pattern: /^#\/historie$/,        render: renderHistory },
];

async function router() {
  const hash = location.hash || '#/start';
  for (const route of routes) {
    const match = hash.match(route.pattern);
    if (match) {
      await route.render(app, ...match.slice(1));
      window.scrollTo(0, 0);
      return;
    }
  }
  app.innerHTML = `<h1>Hoppla!</h1><p>Diese Seite gibt es nicht.</p>
                   <a class="btn" href="#/start">Zum Start</a>`;
}

window.addEventListener('hashchange', router); // reagiert auf Klicks und den Zurück-Knopf
router();                                       // zeigt beim Laden die erste Seite