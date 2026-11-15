import { books, units, vocab, sessions, answers as answerDb, newId } from '../db.js';
import { esc, SPRACHEN } from '../utils.js';
import { buildQuestions, evaluate, countErrors, stars, updateStatus } from '../quiz.js';
import { previousSession, compareText, problemWords } from '../history.js';
import { canSpeak, speak } from '../speech.js';
import { kikoSays } from '../ui/kiko.js';

export async function renderPractice(app, unitId) {
  const unit = await units.get(unitId);
  if (!unit) {
    app.innerHTML = `<a class="back" href="#/regal">← Regal</a><h1>Lektion nicht gefunden</h1>`;
    return;
  }
  const book = await books.get(unit.bookId);
  const sprache = SPRACHEN[book.sprache];
  const words = await vocab.ofUnit(unitId); // Stand VOR der Runde
  const back = `<a class="back" href="#/lektion/${unitId}">← ${esc(unit.name)}</a>`;

  // 🔊-Knopf: Text steht im data-Attribut, der Klick liest ihn vor
  const speakBtn = (text) => canSpeak()
    ? `<button class="icon-btn speak-btn" type="button" data-speak="${esc(text)}" title="Anhören">🔊</button>`
    : '';
  function wireSpeak() {
    app.querySelectorAll('[data-speak]').forEach((btn) =>
      btn.addEventListener('click', () => speak(btn.dataset.speak, sprache.stimme)));
  }

  if (words.length === 0) {
    app.innerHTML = `${back}
      <h1>Noch keine Wörter</h1>
      ${kikoSays('Leg zuerst ein paar Vokabeln an, dann üben wir!', { outfit: sprache.outfit })}
      <a class="btn" href="#/lektion/${unitId}">➕ Vokabeln anlegen</a>`;
    return;
  }

  // ---------- Phase 1: Einstellen ----------
  const auswahlMoeglich = words.length >= 3;
  let modus = auswahlMoeglich ? 'auswahl' : 'fremd-de';
  const probleme = problemWords(words);
  let nurProbleme = false;
  let gestartetAm = 0;

  app.innerHTML = `${back}
    <h1>Üben: ${esc(unit.name)}</h1>
    <h2>Wie willst du üben?</h2>
    <div class="choice-list" id="modus">
      <button class="btn btn-choice" data-modus="auswahl" ${auswahlMoeglich ? '' : 'disabled'}>
        👆 Auswählen – 1 aus 3${auswahlMoeglich ? '' : '<small>ab 3 Vokabeln</small>'}
      </button>
      <button class="btn btn-choice" data-modus="fremd-de">✍️ Schreiben: ${sprache.flagge} → 🇩🇪</button>
      <button class="btn btn-choice" data-modus="de-fremd">✍️ Schreiben: 🇩🇪 → ${sprache.flagge}</button>
    </div>
    ${probleme.length ? `
      <label class="toggle">
        <input type="checkbox" id="nur-probleme">
        🎯 Nur meine Problemwörter (${probleme.length})
      </label>` : ''}
    <h2>Wie viele Wörter?</h2>
    <div class="row" id="anzahl"></div>`;

  // Die Anzahl-Knöpfe hängen davon ab, ob nur Problemwörter geübt werden
  function drawAnzahl() {
    const pool = nurProbleme ? probleme : words;
    const anzahlen = [10, 20].filter((n) => n < pool.length);
    app.querySelector('#anzahl').innerHTML = `
      ${anzahlen.map((n) => `<button class="btn" data-n="${n}">${n} Wörter</button>`).join('')}
      <button class="btn" data-n="alle">Alle (${pool.length})</button>`;
  }
  drawAnzahl();

  app.querySelector('#nur-probleme')?.addEventListener('change', (event) => {
    nurProbleme = event.target.checked;
    drawAnzahl();
  });

  function markModus() {
    app.querySelectorAll('[data-modus]').forEach((b) => {
      b.classList.toggle('selected', b.dataset.modus === modus);
      b.setAttribute('aria-pressed', b.dataset.modus === modus);
    });
  }
  markModus();

  app.querySelector('#modus').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-modus]');
    if (!btn || btn.disabled) return;
    modus = btn.dataset.modus;
    markModus();
  });

  app.querySelector('#anzahl').addEventListener('click', (event) => {
    const n = event.target.dataset.n;
    if (!n) return;
    const pool = nurProbleme ? probleme : words;
    gestartetAm = Date.now();
    askQuestion(buildQuestions(words, n === 'alle' ? 'alle' : Number(n), modus, pool), []);
  });

  // ---------- Phase 2: Abfrage (ein Wort pro Bildschirm, ohne Richtig/Falsch) ----------
  function askQuestion(questions, answers) {
    const i = answers.length;
    if (i === questions.length) return showResults(questions, answers);
    const q = questions[i];
    const next = (antwort) => askQuestion(questions, [...answers, antwort]);

    const zeigtFremd = q.modus !== 'de-fremd'; // bei DE → Fremd kein 🔊, sonst wäre die Lösung verraten
    const hinweis = q.modus === 'de-fremd' ? `Wie heißt das auf ${sprache.name}?` : 'Was heißt das auf Deutsch?';

    const antwortTeil = q.modus === 'auswahl'
      ? `<div class="choice-list" id="optionen">
          ${q.optionen.map((o, k) => `<button class="btn btn-choice" data-k="${k}">${esc(o)}</button>`).join('')}
        </div>`
      : `<form class="write-form" id="write-form">
          <input name="antwort" aria-label="Deine Antwort" autocomplete="off" autocapitalize="off"
                 autocorrect="off" spellcheck="false" lang="${q.modus === 'de-fremd' ? book.sprache : 'de'}">
          ${q.modus === 'de-fremd' && sprache.akzente.length ? `
            <div class="accent-bar">
              ${sprache.akzente.map((c) => `<button type="button" class="accent-btn" data-char="${c}">${c}</button>`).join('')}
            </div>` : ''}
          <button class="btn" type="submit">Weiter ➜</button>
        </form>`;

    app.innerHTML = `
      <div class="quiz-top">
        <span>Wort ${i + 1} von ${questions.length}</span>
        <a class="back" href="#/lektion/${unitId}">✕ Abbrechen</a>
      </div>
      <div class="progress"><div style="width:${(i / questions.length) * 100}%"></div></div>
      <div class="quiz-word">${esc(q.frage)} ${zeigtFremd ? speakBtn(q.fremd) : ''}</div>
      <p class="quiz-hint">${hinweis}</p>
      ${antwortTeil}`;
    wireSpeak();

    if (q.modus === 'auswahl') {
      app.querySelector('#optionen').addEventListener('click', (event) => {
        const k = event.target.closest('[data-k]')?.dataset.k;
        if (k !== undefined) next(q.optionen[k]);
      });
      return;
    }

    const form = app.querySelector('#write-form');
    const input = form.antwort;
    input.focus();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      next(input.value);
    });
    // Akzent-Knopf: Zeichen an der Cursor-Position einfügen
    form.querySelector('.accent-bar')?.addEventListener('click', (event) => {
      const ch = event.target.dataset.char;
      if (!ch) return;
      input.setRangeText(ch, input.selectionStart, input.selectionEnd, 'end');
      input.focus();
    });
  }

  // ---------- Phase 3: Korrekturseite ----------
  async function saveStatus(e) {
    const word = words.find((w) => w.id === e.vocabId);
    await vocab.save(updateStatus(word, e.korrekt)); // immer vom Stand VOR der Runde aus
  }

  async function showResults(questions, answers) {
    const ergebnisse = evaluate(questions, answers);
    for (const e of ergebnisse) await saveStatus(e);

    // Übung und Antworten für die Historie speichern
    const session = {
      id: newId(),
      unitId,
      unitIds: [unitId],
      modus,
      nurProbleme,
      gestartetAm,
      dauerSek: Math.round((Date.now() - gestartetAm) / 1000),
      anzahl: ergebnisse.length,
      fehler: countErrors(ergebnisse),
      fast: ergebnisse.filter((e) => e.ergebnis === 'fast').length,
    };
    await sessions.save(session);
    ergebnisse.forEach((e) => { e.answerId = newId(); });
    await answerDb.saveMany(ergebnisse.map((e) => ({
      id: e.answerId,
      sessionId: session.id,
      vocabId: e.vocabId,
      gezeigt: e.frage,
      eingegeben: e.antwort,
      ergebnis: e.ergebnis,
    })));

    const vorher = previousSession(await sessions.ofUnit(unitId), session);
    drawResults(ergebnisse, session, vorher);
  }

  function drawResults(ergebnisse, session, vorher) {
    const fehler = countErrors(ergebnisse);
    const fast = ergebnisse.filter((e) => e.ergebnis === 'fast').length;
    const vergleich = compareText(vorher, { fehler });
    const s = stars(fehler, ergebnisse.length);
    const lob = fehler === 0 && fast === 0 ? 'Wow, alles richtig! 🎉'
      : fehler === 0 ? 'Super! Achte nur noch auf die Akzente.'
      : s >= 2 ? 'Super gemacht! Nur ein paar kleine Fehler.'
      : s === 1 ? 'Gut dabei! Schau dir die Fehler unten nochmal an.'
      : 'Nochmal probieren? Mit jeder Runde wird es leichter.';
    const stimmung = s === 3 ? 'freude' : s === 2 ? 'normal' : 'troestet';

    const rows = ergebnisse.map((e, i) => {
      const deine = e.antwort.trim() ? esc(e.antwort) : '<em>keine Antwort</em>';
      let inhalt;
      if (e.ergebnis === 'richtig') {
        inhalt = `<div>${esc(e.richtig)}</div>${e.manuell ? '<small>von dir als richtig gewertet</small>' : ''}`;
      } else if (e.ergebnis === 'fast') {
        inhalt = `<div>Deine Antwort: ${deine}</div>
                  <div>Fast! So schreibt man es: <strong>${esc(e.richtig)}</strong></div>`;
      } else {
        inhalt = `<div>Deine Antwort: <s>${deine}</s></div>
                  <div>Richtig: <strong>${esc(e.richtig)}</strong></div>
                  ${e.modus !== 'auswahl' && e.antwort.trim()
                    ? `<button class="fix-btn" data-fix="${i}">Doch richtig 👍</button>` : ''}`;
      }
      const icon = { richtig: '✅', fast: '🟡', falsch: '❌' }[e.ergebnis];
      return `
        <li class="result ${e.ergebnis}">
          <span class="result-icon">${icon}</span>
          <div class="result-body"><div class="fremd">${esc(e.frage)}</div>${inhalt}</div>
          ${speakBtn(e.fremd)}
        </li>`;
    }).join('');

    app.innerHTML = `${back}
      <h1>Geschafft!</h1>
      <div class="stars" aria-label="${s} von 3 Sternen">${'★'.repeat(s)}<span class="off">${'★'.repeat(3 - s)}</span></div>
      <p class="score">${fehler} Fehler bei ${ergebnisse.length} Wörtern${fast ? ` · ${fast}× fast richtig` : ''}</p>
      <p class="compare">${vergleich}</p>
      ${kikoSays(lob, { stimmung, outfit: sprache.outfit })}
      <ul class="list" id="results">${rows}</ul>
      <div class="row">
        <button class="btn" id="again">🔁 Nochmal üben</button>
        <a class="btn btn-secondary" href="#/lektion/${unitId}">Zur Lektion</a>
      </div>`;
    wireSpeak();

    // „Doch richtig“: z. B. ein Synonym, das nicht in der Liste steht
    app.querySelector('#results').addEventListener('click', async (event) => {
      const i = event.target.dataset.fix;
      if (i === undefined) return;
      const e = ergebnisse[i];
      Object.assign(e, { ergebnis: 'richtig', korrekt: true, manuell: true });
      await saveStatus(e);
      // Auch in der Historie nachtragen
      await answerDb.save({
        id: e.answerId, sessionId: session.id, vocabId: e.vocabId,
        gezeigt: e.frage, eingegeben: e.antwort, ergebnis: 'richtig', manuell: true,
      });
      session.fehler = countErrors(ergebnisse);
      await sessions.save(session);
      drawResults(ergebnisse, session, vorher);
    });

    app.querySelector('#again').addEventListener('click', () => renderPractice(app, unitId));
  }
}
