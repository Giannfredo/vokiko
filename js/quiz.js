// quiz.js – Abfrage-Logik ohne HTML (Fragen bauen, auswerten, Sterne, Wort-Status)

// Mischt eine Liste (Fisher-Yates) und gibt eine neue Liste zurück.
export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Baut Fragen für den Auswahl-Modus „1 aus 3“.
 * words:  alle Vokabeln der Lektion (für die falschen Antworten)
 * anzahl: wie viele Fragen (Zahl oder 'alle')
 * Ergebnis: [{ vocabId, frage, richtig, optionen: [3 Texte] }]
 */
export function buildChoiceQuestions(words, anzahl = 'alle') {
  const n = anzahl === 'alle' ? words.length : Math.min(anzahl, words.length);
  return shuffle(words).slice(0, n).map((word) => {
    // Falsche Antworten: andere Wörter derselben Lektion mit anderer Bedeutung
    const falsche = [...new Set(
      words.filter((w) => w.id !== word.id).map((w) => w.deutsch)
    )].filter((d) => d !== word.deutsch);
    return {
      vocabId: word.id,
      frage: word.fremd,
      richtig: word.deutsch,
      optionen: shuffle([word.deutsch, ...shuffle(falsche).slice(0, 2)]),
    };
  });
}

// Wertet die Runde aus. answers[i] ist der angetippte Text zu questions[i].
export function evaluate(questions, answers) {
  const ergebnisse = questions.map((q, i) => ({
    ...q,
    antwort: answers[i],
    korrekt: answers[i] === q.richtig,
  }));
  return { ergebnisse, fehler: ergebnisse.filter((e) => !e.korrekt).length };
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
