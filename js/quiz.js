// quiz.js – Abfrage-Logik ohne HTML (Fragen bauen, auswerten, Sterne, Wort-Status)

// Die drei Abfragemodi
// auswahl = 1 aus 3 Fremd → Deutsch, auswahl-de = 1 aus 3 Deutsch → Fremd
export const MODI = ['auswahl', 'auswahl-de', 'fremd-de', 'de-fremd'];

// Beide „1 aus 3“-Modi (antippen statt schreiben)
export const istAuswahl = (modus) => modus === 'auswahl' || modus === 'auswahl-de';

// Mischt eine Liste (Fisher-Yates) und gibt eine neue Liste zurück.
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Toleranzregeln ----------

// Groß/Klein egal, Leerzeichen am Rand egal, doppelte Leerzeichen zählen als eins.
export function normalize(text = '') {
  return String(text).trim().toLowerCase().replace(/\s+/g, ' ');
}

// Entfernt Akzente: "café" → "cafe". NFD zerlegt "é" in "e" + Akzentzeichen,
// danach werden alle Akzentzeichen (Unicode-Bereich U+0300–U+036F) gelöscht.
export function stripAccents(text = '') {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// "die Bibliothek; die Bücherei" → ["die Bibliothek", "die Bücherei"]
export function meanings(text = '') {
  return String(text).split(';').map((m) => m.trim()).filter(Boolean);
}

/**
 * Prüft eine getippte Antwort gegen die Lösung.
 * Ergebnis: 'richtig' | 'fast' (nur Akzente falsch/fehlend) | 'falsch'
 */
export function checkTyped(eingabe, loesung) {
  const e = normalize(eingabe);
  if (!e) return 'falsch';
  const optionen = meanings(loesung).map(normalize);
  if (optionen.includes(e)) return 'richtig';
  if (optionen.map(stripAccents).includes(stripAccents(e))) return 'fast';
  return 'falsch';
}

// ---------- Fragen bauen ----------

/**
 * words:  alle Vokabeln der Lektion (daraus kommen die falschen Antworten bei „1 aus 3“)
 * anzahl: wie viele Fragen (Zahl oder 'alle')
 * modus:  'auswahl' | 'auswahl-de' | 'fremd-de' | 'de-fremd'
 * pool:   aus welchen Wörtern gefragt wird (z. B. nur Problemwörter), Standard: alle
 * Ergebnis: [{ vocabId, modus, fremd, frage, richtig, optionen? }]
 */
export function buildQuestions(words, anzahl = 'alle', modus = 'auswahl', pool = words) {
  const n = anzahl === 'alle' ? pool.length : Math.min(anzahl, pool.length);
  return shuffle(pool).slice(0, n).map((word) => {
    const basis = { vocabId: word.id, modus, fremd: word.fremd };
    if (modus === 'de-fremd') return { ...basis, frage: word.deutsch, richtig: word.fremd };
    if (modus === 'fremd-de') return { ...basis, frage: word.fremd, richtig: word.deutsch };

    // Auswahl „1 aus 3“: falsche Antworten aus derselben Lektion, mit anderer Bedeutung.
    // auswahl: Fremdwort fragen, deutsche Antworten; auswahl-de: andersherum.
    const feld = modus === 'auswahl-de' ? 'fremd' : 'deutsch';
    const falsche = [...new Set(
      words.filter((w) => w.id !== word.id).map((w) => w[feld])
    )].filter((d) => d !== word[feld]);
    return {
      ...basis,
      frage: modus === 'auswahl-de' ? word.deutsch : word.fremd,
      richtig: word[feld],
      optionen: shuffle([word[feld], ...shuffle(falsche).slice(0, 2)]),
    };
  });
}

// ---------- Auswerten ----------

// answers[i] ist die Antwort (angetippt oder getippt) zu questions[i].
export function evaluate(questions, answers) {
  return questions.map((q, i) => {
    const antwort = answers[i] ?? '';
    const ergebnis = istAuswahl(q.modus)
      ? (antwort === q.richtig ? 'richtig' : 'falsch')
      : checkTyped(antwort, q.richtig);
    return { ...q, antwort, ergebnis, korrekt: ergebnis !== 'falsch' };
  });
}

// Combo = wie viele Antworten zuletzt hintereinander richtig waren (für den „3er-Combo!“-Sticker).
// 'fast' unterbricht die Serie nicht, zählt aber auch nicht mit; 'falsch' beendet sie.
export function combo(questions, answers) {
  let serie = 0;
  for (const e of evaluate(questions.slice(0, answers.length), answers)) {
    if (e.ergebnis === 'richtig') serie += 1;
    else if (e.ergebnis === 'falsch') serie = 0;
  }
  return serie;
}

// Nur 'falsch' ist ein Fehler, 'fast' nicht.
export function countErrors(ergebnisse) {
  return ergebnisse.filter((e) => e.ergebnis === 'falsch').length;
}

// 0 Fehler = 3 Sterne, bis 20 % = 2, bis 50 % = 1, sonst 0.
export function stars(fehler, anzahl) {
  if (anzahl === 0) return 0;
  if (fehler === 0) return 3;
  const quote = fehler / anzahl;
  if (quote <= 0.2) return 2;
  if (quote <= 0.5) return 1;
  return 0;
}

// Neuer Stand einer Vokabel nach einer Antwort. 3× hintereinander richtig = 'sicher'.
export function updateStatus(word, korrekt) {
  const richtigInFolge = korrekt ? (word.richtigInFolge || 0) + 1 : 0;
  return {
    ...word,
    richtigInFolge,
    fehlerGesamt: (word.fehlerGesamt || 0) + (korrekt ? 0 : 1),
    status: richtigInFolge >= 3 ? 'sicher' : 'in Arbeit',
  };
}
