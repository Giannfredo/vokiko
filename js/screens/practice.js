import { books, units, vocab } from '../db.js';
import { esc } from '../utils.js';
import { buildChoiceQuestions, evaluate, stars, updateStatus } from '../quiz.js';

export async function renderPractice(app, unitId) {
  const unit = await units.get(unitId);
  if (!unit) {
    app.innerHTML = `<a class="back" href="#/regal">← Regal</a><h1>Lektion nicht gefunden</h1>`;
    return;
  }
  const book = await books.get(unit.bookId);
  const words = await vocab.ofUnit(unitId);
  const back = `<a class="back" href="#/lektion/${unitId}">← ${esc(unit.name)}</a>`;

  if (words.length < 3) {
    app.innerHTML = `${back}
      <h1>Noch zu wenige Wörter</h1>
      <div class="kiko-bubble"><strong>Kiko sagt:</strong> Für „1 aus 3“ brauche ich mindestens 3 Vokabeln.</div>
      <a class="btn" href="#/lektion/${unitId}">➕ Vokabeln anlegen</a>`;
    return;
  }

  // ---------- Phase 1: Einstellen ----------
  const anzahlen = [10, 20].filter((n) => n < words.length);
  app.innerHTML = `${back}
    <h1>Üben: ${esc(unit.name)}</h1>
    <p>${esc(book.titel)} · Modus „1 aus 3“</p>
    <h2>Wie viele Wörter?</h2>
    <div class="choice-list" id="anzahl">
      ${anzahlen.map((n) => `<button class="btn" data-n="${n}">${n} Wörter</button>`).join('')}
      <button class="btn" data-n="alle">Alle (${words.length})</button>
    </div>`;

  app.querySelector('#anzahl').addEventListener('click', (event) => {
    const n = event.target.dataset.n;
    if (!n) return;
    const questions = buildChoiceQuestions(words, n === 'alle' ? 'alle' : Number(n));
    askQuestion(questions, []);
  });

  // ---------- Phase 2: Abfrage (ein Wort pro Bildschirm, ohne Richtig/Falsch) ----------
  function askQuestion(questions, answers) {
    const i = answers.length;
    if (i === questions.length) return showResults(questions, answers);
    const q = questions[i];

    app.innerHTML = `
      <div class="quiz-top">
        <span>Wort ${i + 1} von ${questions.length}</span>
        <a class="back" href="#/lektion/${unitId}">✕ Abbrechen</a>
      </div>
      <div class="progress"><div style="width:${(i / questions.length) * 100}%"></div></div>
      <div class="quiz-word">${esc(q.frage)}</div>
      <p class="quiz-hint">Was heißt das auf Deutsch?</p>
      <div class="choice-list" id="optionen">
        ${q.optionen.map((o, k) => `<button class="btn btn-choice" data-k="${k}">${esc(o)}</button>`).join('')}
      </div>`;

    app.querySelector('#optionen').addEventListener('click', (event) => {
      const k = event.target.closest('[data-k]')?.dataset.k;
      if (k === undefined) return;
      askQuestion(questions, [...answers, q.optionen[k]]);
    });
  }

  // ---------- Phase 3: Korrekturseite ----------
  async function showResults(questions, answers) {
    const { ergebnisse, fehler } = evaluate(questions, answers);

    // Wort-Status speichern (neu → in Arbeit → sicher)
    for (const e of ergebnisse) {
      const word = words.find((w) => w.id === e.vocabId);
      await vocab.save(updateStatus(word, e.korrekt));
    }

    const s = stars(fehler, questions.length);
    const lob = fehler === 0 ? 'Wow, alles richtig! 🎉'
      : s >= 2 ? 'Super gemacht! Nur ein paar kleine Fehler.'
      : s === 1 ? 'Gut dabei! Schau dir die Fehler unten nochmal an.'
      : 'Nochmal probieren? Mit jeder Runde wird es leichter.';

    const rows = ergebnisse.map((e) => `
      <li class="result ${e.korrekt ? 'ok' : 'wrong'}">
        <span class="result-icon">${e.korrekt ? '✅' : '❌'}</span>
        <div>
          <div class="fremd">${esc(e.frage)}</div>
          ${e.korrekt
            ? `<div>${esc(e.richtig)}</div>`
            : `<div>Deine Antwort: <s>${esc(e.antwort)}</s></div>
               <div>Richtig: <strong>${esc(e.richtig)}</strong></div>`}
        </div>
      </li>`).join('');

    app.innerHTML = `${back}
      <h1>Geschafft!</h1>
      <div class="stars" aria-label="${s} von 3 Sternen">${'★'.repeat(s)}<span class="off">${'★'.repeat(3 - s)}</span></div>
      <p class="score">${fehler} Fehler bei ${questions.length} Wörtern</p>
      <div class="kiko-bubble"><strong>Kiko sagt:</strong> ${lob}</div>
      <ul class="list">${rows}</ul>
      <div class="row">
        <button class="btn" id="again">🔁 Nochmal üben</button>
        <a class="btn btn-secondary" href="#/lektion/${unitId}">Zur Lektion</a>
      </div>`;

    app.querySelector('#again').addEventListener('click', () => renderPractice(app, unitId));
  }
}
