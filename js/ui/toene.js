// toene.js – kurze Retro-Töne für die Rückmeldung beim Üben (ohne Sound-Dateien)
//
// Die Töne entstehen mit der Web Audio API: ein Oszillator (Rechteck-/Dreieckwelle wie bei alten
// Spielkonsolen) und eine Lautstärke-Hülle, damit nichts knackt. Funktioniert auch offline.
// Ein-/Aus-Schalter in der Kopfleiste; die Einstellung liegt in localStorage (wie das Design-Thema),
// weil sie nur eine kleine Anzeige-Einstellung ist, keine Lerndaten.
// Hinweis: Auf dem iPhone sind Web-Töne stumm, wenn der Lautlos-Schalter aktiv ist.

import { icon } from './icons.js';

const TON_KEY = 'vokiko-ton';
let kontext = null; // AudioContext – erst beim ersten Ton anlegen (Browser erlauben Ton erst nach einem Tippen)

export function tonAn() {
  try { return localStorage.getItem(TON_KEY) !== 'aus'; } catch { return true; }
}

function setzeTon(an) {
  try { localStorage.setItem(TON_KEY, an ? 'an' : 'aus'); } catch { /* privates Fenster: gilt bis zum Neuladen nicht */ }
}

function audio() {
  if (!kontext) kontext = new (window.AudioContext || window.webkitAudioContext)();
  if (kontext.state === 'suspended') kontext.resume();
  return kontext;
}

// Eine Note: Frequenz in Hz, Start/Dauer in Sekunden, optional Gleiten zu einer zweiten Frequenz
function note(c, { freq, start, dauer, typ = 'square', laut = 0.05, bis = null }) {
  const osc = c.createOscillator();
  const huelle = c.createGain();
  osc.type = typ;
  osc.frequency.setValueAtTime(freq, start);
  if (bis) osc.frequency.exponentialRampToValueAtTime(bis, start + dauer);
  huelle.gain.setValueAtTime(0.0001, start);
  huelle.gain.exponentialRampToValueAtTime(laut, start + 0.01);   // schnell einblenden …
  huelle.gain.exponentialRampToValueAtTime(0.0001, start + dauer); // … und ausklingen
  osc.connect(huelle).connect(c.destination);
  osc.start(start);
  osc.stop(start + dauer + 0.02);
}

/** Spielt den Ton zu einem Ergebnis: 'richtig' | 'fast' | 'falsch' */
export function spieleTon(ergebnis) {
  if (!tonAn()) return;
  try {
    const c = audio();
    const t = c.currentTime;
    if (ergebnis === 'richtig') {          // „Pling-pling“ aufwärts (H5 → E6)
      note(c, { freq: 988, start: t, dauer: 0.08 });
      note(c, { freq: 1319, start: t + 0.08, dauer: 0.16 });
    } else if (ergebnis === 'fast') {      // neutraler Doppel-Piep
      note(c, { freq: 784, start: t, dauer: 0.09, typ: 'triangle', laut: 0.08 });
      note(c, { freq: 784, start: t + 0.12, dauer: 0.09, typ: 'triangle', laut: 0.08 });
    } else {                               // tiefes, abfallendes „Bwomp“
      note(c, { freq: 196, start: t, dauer: 0.28, laut: 0.04, bis: 110 });
    }
  } catch { /* kein Ton möglich (altes Gerät) – egal, die Farbe zeigt es ja auch */ }
}

// Verbindet den Knopf in der Kopfleiste: zeigt, ob der Ton an ist; Klick schaltet um
export function initTonKnopf(knopf) {
  function anzeigen() {
    const an = tonAn();
    knopf.innerHTML = icon(an ? 'laut' : 'stumm');
    knopf.title = an ? 'Töne ausschalten' : 'Töne einschalten';
    knopf.setAttribute('aria-label', knopf.title);
    knopf.setAttribute('aria-pressed', String(an));
  }
  knopf.addEventListener('click', () => {
    setzeTon(!tonAn());
    anzeigen();
    spieleTon('richtig'); // kleine Hörprobe beim Einschalten (beim Ausschalten bleibt es still)
  });
  anzeigen();
}
