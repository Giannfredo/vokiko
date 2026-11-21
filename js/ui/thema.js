// thema.js – Design-Thema „bunt“ (hell) oder „dunkel“ umschalten
//
// Das Thema steht als data-theme="dunkel" am <html>-Element; style.css tauscht dann die Farb-Variablen.
// Gespeichert wird es in localStorage (nicht IndexedDB), weil das kleine Skript in index.html es
// schon VOR dem ersten Zeichnen lesen muss – sonst blitzt beim Laden kurz das helle Thema auf.
// Es ist nur eine Anzeige-Einstellung, keine Lerndaten.

import { icon } from './icons.js';

export const THEMA_KEY = 'vokiko-thema';

export function aktuellesThema() {
  return document.documentElement.dataset.theme === 'dunkel' ? 'dunkel' : 'bunt';
}

function setzeThema(thema) {
  if (thema === 'dunkel') document.documentElement.dataset.theme = 'dunkel';
  else delete document.documentElement.dataset.theme;
  try { localStorage.setItem(THEMA_KEY, thema); } catch { /* privates Fenster o. Ä.: dann eben nur bis zum Neuladen */ }
}

// Verbindet den Knopf in der Kopfleiste: zeigt das Thema, zu dem man wechseln würde
export function initThemaKnopf(knopf) {
  function anzeigen() {
    const dunkel = aktuellesThema() === 'dunkel';
    knopf.innerHTML = icon(dunkel ? 'sonne' : 'mond');
    knopf.title = dunkel ? 'Helles Design' : 'Dunkles Design';
    knopf.setAttribute('aria-label', knopf.title);
  }
  knopf.addEventListener('click', () => {
    setzeThema(aktuellesThema() === 'dunkel' ? 'bunt' : 'dunkel');
    anzeigen();
  });
  anzeigen();
}
