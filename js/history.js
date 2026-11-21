// history.js – Statistik ohne HTML: Vergleich mit dem letzten Mal, Problemwörter, Anzeige-Helfer

export const MODUS_NAMEN = {
  'auswahl': '1 aus 3 → Deutsch',
  'auswahl-de': '1 aus 3 → Fremdsprache',
  'fremd-de': 'Schreiben → Deutsch',
  'de-fremd': 'Schreiben → Fremdsprache',
};

// Die letzte Übung derselben Lektion im selben Modus vor der aktuellen.
// list: Übungen der Lektion, aktuell: die gerade gespeicherte Übung
export function previousSession(list, aktuell) {
  return list
    .filter((s) => s.id !== aktuell.id && s.modus === aktuell.modus && s.gestartetAm < aktuell.gestartetAm)
    .sort((a, b) => b.gestartetAm - a.gestartetAm)[0] || null;
}

// „Letztes Mal 5 Fehler, heute 2“
export function compareText(vorher, heute) {
  if (!vorher) return 'Das war deine erste Runde in diesem Modus.';
  const v = vorher.fehler;
  const h = heute.fehler;
  if (v === 0 && h === 0) return 'Letztes Mal 0 Fehler, heute wieder 0. Stark!';
  if (h < v) return `Letztes Mal ${v} Fehler, heute ${h}. Du wirst besser!`;
  if (h === v) return `Letztes Mal ${v} Fehler, heute auch ${h}.`;
  return `Letztes Mal ${v} Fehler, heute ${h}. Beim nächsten Mal klappt's wieder besser!`;
}

// Bestleistung (dann gibt es Konfetti): alles richtig (3 Sterne)
// oder weniger Fehler als beim letzten Mal in derselben Lektion und demselben Modus.
export function isBestleistung(vorher, fehler, sterne) {
  return sterne === 3 || (vorher !== null && fehler < vorher.fehler);
}

// Problemwörter: schon mal falsch und noch nicht sicher – die mit den meisten Fehlern zuerst.
export function isProblem(word) {
  return (word.fehlerGesamt || 0) > 0 && word.status !== 'sicher';
}
export function problemWords(words, limit = Infinity) {
  return words
    .filter(isProblem)
    .sort((a, b) => b.fehlerGesamt - a.fehlerGesamt)
    .slice(0, limit);
}

// 75 → "1:15 min", 40 → "40 s"
export function formatDauer(sek = 0) {
  if (sek < 60) return `${sek} s`;
  return `${Math.floor(sek / 60)}:${String(sek % 60).padStart(2, '0')} min`;
}

// 14.11.2026, 18:05
export function formatDatum(ms) {
  return new Date(ms).toLocaleString('de', { dateStyle: 'medium', timeStyle: 'short' });
}
