import { books, units, vocab, newId } from '../db.js';
import { esc, SPRACHEN, DEUTSCH_CHIP } from '../utils.js';
import { kikoSays } from '../ui/kiko.js';
import { confirmDialog } from '../ui/dialog.js';
import { loadImage, prepareImage, recognizeAll } from '../ocr.js';
import { parseWords } from '../parser.js';
import { normalize } from '../quiz.js';
import { icon } from '../ui/icons.js';

export async function renderImport(app, unitId) {
  const unit = await units.get(unitId);
  if (!unit) {
    app.innerHTML = `<a class="back" href="#/regal">${icon('zurueck')} Regal</a><h1>Lektion nicht gefunden</h1>`;
    return;
  }
  const book = await books.get(unit.bookId);
  const sprache = SPRACHEN[book.sprache];
  const back = `<a class="back" href="#/lektion/${unitId}">${icon('zurueck')} ${esc(unit.name)}</a>`;

  // ---------- Phase 1: Foto wählen ----------
  app.innerHTML = `${back}
    <h1>${icon('kamera')} Foto einlesen</h1>
    ${kikoSays('Fotografiere die Vokabelliste möglichst gerade, hell und scharf. Am besten nur eine Seite pro Foto.',
      { outfit: sprache.outfit })}
    <div class="row">
      <label class="btn file-btn">${icon('kamera')} Foto aufnehmen
        <input type="file" accept="image/*" capture="environment" hidden data-photo>
      </label>
      <label class="btn btn-secondary file-btn">${icon('galerie')} Aus der Galerie
        <input type="file" accept="image/*" hidden data-photo>
      </label>
    </div>
    <p class="notice" id="msg" hidden></p>`;

  app.querySelectorAll('[data-photo]').forEach((input) =>
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        prepare(await loadImage(file));
      } catch {
        const msg = app.querySelector('#msg');
        msg.textContent = 'Dieses Bildformat kann der Browser nicht öffnen (z. B. HEIC vom iPhone in Chrome). '
          + 'Probier es in Safari oder speichere das Foto als JPEG.';
        msg.hidden = false;
      }
    }));

  // ---------- Phase 2: Foto vorbereiten (drehen, Bereiche markieren) ----------
  function prepare(bild) {
    let drehung = 0;
    let bereiche = []; // [{ x, y, w, h }] als Anteile 0–1 des gedrehten Bilds

    app.innerHTML = `${back}
      <h1>${icon('kamera')} Foto vorbereiten</h1>
      <p>Zieh mit Finger oder Maus einen Rahmen um die Vokabeln – gern auch mehrere.
         Ohne Rahmen liest Kiko die ganze Seite. Die Schrift soll waagrecht stehen.</p>
      <div class="preview-box">
        <div class="crop-area" id="crop">
          <div class="crop-layer" id="layer"></div>
        </div>
      </div>
      <div class="row">
        <button class="btn btn-secondary" id="rotate">${icon('drehen')} Drehen</button>
        <button class="btn btn-secondary" id="clear" hidden>${icon('muell')} Rahmen löschen</button>
      </div>
      <button class="btn btn-start" id="start"></button>`;

    const crop = app.querySelector('#crop');
    const layer = app.querySelector('#layer');

    function drawPreview() {
      crop.querySelector('canvas')?.remove();
      crop.prepend(prepareImage(bild, { drehung, maxBreite: 800 }));
      drawBoxes();
    }

    // Rahmen als Kästchen über dem Bild (Position in %, damit es bei jeder Größe passt)
    function drawBoxes(entwurf = null) {
      const liste = entwurf ? [...bereiche, entwurf] : bereiche;
      layer.innerHTML = liste.map((b, i) => `
        <div class="crop-box ${b === entwurf ? 'draft' : ''}"
             style="left:${b.x * 100}%;top:${b.y * 100}%;width:${b.w * 100}%;height:${b.h * 100}%">
          ${b === entwurf ? '' : `<span class="crop-nr">${i + 1}</span>
            <button class="crop-remove" data-remove="${i}" aria-label="Rahmen ${i + 1} entfernen">${icon('x')}</button>`}
        </div>`).join('');
      app.querySelector('#clear').hidden = bereiche.length === 0;
      app.querySelector('#start').innerHTML = bereiche.length
        ? `${icon('lupe')} ${bereiche.length} ${bereiche.length === 1 ? 'Bereich' : 'Bereiche'} erkennen`
        : `${icon('lupe')} Ganze Seite erkennen`;
    }
    drawPreview();

    // Rahmen ziehen – Pointer-Events funktionieren mit Maus, Finger und Stift
    let start = null;
    const punkt = (event) => {
      const r = layer.getBoundingClientRect();
      return {
        x: Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)),
        y: Math.min(1, Math.max(0, (event.clientY - r.top) / r.height)),
      };
    };
    const rechteck = (a, b) => ({
      x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y),
    });
    layer.addEventListener('pointerdown', (event) => {
      if (event.target.closest('[data-remove]')) return;
      start = punkt(event);
      layer.setPointerCapture(event.pointerId);
    });
    layer.addEventListener('pointermove', (event) => {
      if (start) drawBoxes(rechteck(start, punkt(event)));
    });
    layer.addEventListener('pointerup', (event) => {
      if (!start) return;
      const r = rechteck(start, punkt(event));
      start = null;
      if (r.w > 0.03 && r.h > 0.02) bereiche.push(r); // versehentliches Tippen ignorieren
      drawBoxes();
    });
    layer.addEventListener('pointercancel', () => { start = null; drawBoxes(); });
    layer.addEventListener('click', (event) => {
      const i = event.target.dataset.remove;
      if (i !== undefined) { bereiche.splice(i, 1); drawBoxes(); }
    });

    app.querySelector('#rotate').addEventListener('click', () => {
      drehung = (drehung + 90) % 360;
      bereiche = []; // Rahmen passen nach dem Drehen nicht mehr
      drawPreview();
    });
    app.querySelector('#clear').addEventListener('click', () => { bereiche = []; drawBoxes(); });
    app.querySelector('#start').addEventListener('click', () => {
      const canvases = (bereiche.length ? bereiche : [null])
        .map((bereich) => prepareImage(bild, { drehung, bereich }));
      bild.close();
      runOcr(canvases);
    });
  }

  // ---------- Phase 3: Texterkennung ----------
  async function runOcr(canvases) {
    app.innerHTML = `${back}
      <h1>${icon('kamera')} Foto einlesen</h1>
      ${kikoSays('Hmm, mal sehen … Ich lese die Wörter. Das dauert einen Moment.', { stimmung: 'denkt', outfit: sprache.outfit })}
      <div class="preview-box preview-strip" id="preview"></div>
      <p id="ocr-status">Einen Moment …</p>
      <div class="progress"><div id="ocr-bar" style="width:0%"></div></div>`;
    app.querySelector('#preview').append(...canvases);

    try {
      const ergebnisse = await recognizeAll(canvases, book.sprache, (anteil, status) => {
        app.querySelector('#ocr-status').textContent = `${status} ${anteil ? Math.round(anteil * 100) + ' %' : ''}`;
        app.querySelector('#ocr-bar').style.width = `${anteil * 100}%`;
      });
      // Jeder Bereich wird für sich zerlegt – jeder hat seine eigenen Spalten
      const paare = [];
      let ausgelassen = 0;
      for (const { words } of ergebnisse) {
        const r = parseWords(words);
        paare.push(...r.paare);
        ausgelassen += r.ausgelassen;
      }
      const rohtext = ergebnisse.length === 1 ? ergebnisse[0].text
        : ergebnisse.map((e, i) => `––– Bereich ${i + 1} –––\n${e.text}`).join('\n');
      showReview(paare, ausgelassen, rohtext);
    } catch (error) {
      console.error(error);
      app.querySelector('#ocr-status').textContent =
        'Das hat leider nicht geklappt. Bist du mit dem Internet verbunden? (Beim ersten Mal werden Sprachdaten geladen.)';
      app.querySelector('#ocr-status').insertAdjacentHTML('afterend',
        `<button class="btn" id="retry">${icon('nochmal')} Nochmal versuchen</button>`);
      app.querySelector('#retry').addEventListener('click', () => renderImport(app, unitId));
    }
  }

  // ---------- Phase 4: Prüfansicht ----------
  async function showReview(paare, ausgelassen, rohtext) {
    const vorhanden = new Set((await vocab.ofUnit(unitId)).map((w) => normalize(w.fremd)));
    const rows = paare.map((p) => ({ ...p })); // Arbeitskopie, wird beim Tippen aktualisiert

    app.innerHTML = `${back}
      <h1>Prüfen und speichern</h1>
      <p>Kiko hat <strong>${paare.length}</strong> Vokabeln gefunden${ausgelassen
        ? ` und ${ausgelassen} Zeilen ohne Vokabel ausgelassen (Überschriften, Erklärtexte)` : ''}.
         Texterkennung macht Fehler – schau jede Zeile kurz an. Mehrere Bedeutungen mit <code>;</code> trennen.</p>
      <div class="row">
        <button class="btn btn-secondary" id="swap">${icon('tauschen')} Spalten tauschen</button>
        <button class="btn btn-secondary" id="add">${icon('plus')} Zeile</button>
      </div>
      <div class="review-head"><span>${sprache.chip} ${sprache.name}</span><span>${DEUTSCH_CHIP} Deutsch</span></div>
      <ul class="list" id="review"></ul>
      <details class="raw">
        <summary>Erkannten Text anzeigen</summary>
        <pre>${esc(rohtext)}</pre>
      </details>
      <div class="row">
        <button class="btn" id="save">${icon('speichern')} Speichern</button>
        <a class="btn btn-secondary" href="#/lektion/${unitId}">Abbrechen</a>
      </div>`;

    const list = app.querySelector('#review');
    const vollstaendig = (r) => r.fremd.trim() && r.deutsch.trim();

    function hintFor(r) {
      if (vorhanden.has(normalize(r.fremd))) return 'schon in der Lektion – wird übersprungen';
      if (!vollstaendig(r)) return 'unvollständig';
      return r.pruefen ? 'bitte prüfen' : '';
    }

    function updateCount() {
      const anzahl = rows.filter((r) => vollstaendig(r) && !vorhanden.has(normalize(r.fremd))).length;
      app.querySelector('#save').innerHTML = `${icon('speichern')} ${anzahl} Vokabeln speichern`;
      app.querySelector('#save').disabled = anzahl === 0;
    }

    // Nur den Hinweis einer Zeile auffrischen (ohne die ganze Liste neu zu zeichnen)
    function updateRow(li) {
      const hinweis = hintFor(rows[li.dataset.i]);
      li.classList.toggle('flag', Boolean(hinweis));
      li.querySelector('.flag-text').innerHTML = hinweis ? `${icon('warnung')} ${esc(hinweis)}` : '';
    }

    function draw() {
      list.innerHTML = rows.map((r, i) => {
        const hinweis = hintFor(r);
        return `
          <li class="review-row ${hinweis ? 'flag' : ''}" data-i="${i}">
            <input data-field="fremd" value="${esc(r.fremd)}" aria-label="${sprache.name}"
                   autocomplete="off" autocapitalize="off" spellcheck="false">
            <input data-field="deutsch" value="${esc(r.deutsch)}" aria-label="Deutsch" autocomplete="off">
            <button class="icon-btn" data-remove="${i}" title="Zeile löschen" aria-label="Zeile löschen">${icon('muell')}</button>
            <input class="beispiel" data-field="beispiel" value="${esc(r.beispiel || '')}"
                   placeholder="Beispielsatz (optional)" aria-label="Beispielsatz" autocomplete="off">
            <small class="flag-text">${hinweis ? `${icon('warnung')} ${esc(hinweis)}` : ''}</small>
          </li>`;
      }).join('') || '<p class="empty">Keine Zeilen. Füge mit „Zeile“ welche hinzu.</p>';
      updateCount();
    }
    draw();

    // Tippen ändert die Daten und den Zähler; die Zeile selbst bleibt stehen, damit der Cursor nicht springt.
    list.addEventListener('input', (event) => {
      const li = event.target.closest('[data-i]');
      if (!li) return;
      rows[li.dataset.i][event.target.dataset.field] = event.target.value;
      updateCount();
    });
    list.addEventListener('change', (event) => {
      const li = event.target.closest('[data-i]');
      if (!li) return;
      rows[li.dataset.i].pruefen = false; // angesehen und bearbeitet
      updateRow(li);
    });
    list.addEventListener('click', (event) => {
      const i = event.target.dataset.remove;
      if (i !== undefined) { rows.splice(i, 1); draw(); }
    });

    app.querySelector('#swap').addEventListener('click', () => {
      rows.forEach((r) => { [r.fremd, r.deutsch] = [r.deutsch, r.fremd]; });
      draw();
    });
    app.querySelector('#add').addEventListener('click', () => {
      rows.push({ fremd: '', deutsch: '', beispiel: '', pruefen: false });
      draw();
      list.lastElementChild?.querySelector('input')?.focus();
    });

    app.querySelector('#save').addEventListener('click', async () => {
      const neu = [];
      const gesehen = new Set(vorhanden);
      for (const r of rows) {
        const key = normalize(r.fremd);
        if (!vollstaendig(r) || gesehen.has(key)) continue;
        gesehen.add(key); // auch Doppelte innerhalb des Fotos nur einmal
        neu.push(r);
      }
      const uebrig = rows.length - neu.length;
      if (uebrig > 0) {
        const ok = await confirmDialog({
          title: `${neu.length} Vokabeln speichern?`,
          text: `${uebrig} Zeilen sind unvollständig oder schon vorhanden und werden nicht gespeichert.`,
          okLabel: 'Speichern',
          cancelLabel: 'Zurück',
          icon: 'speichern',
        });
        if (!ok) return;
      }
      const jetzt = Date.now();
      for (const [k, r] of neu.entries()) {
        await vocab.save({
          id: newId(),
          unitId,
          fremd: r.fremd.trim(),
          deutsch: r.deutsch.trim(),
          beispiel: (r.beispiel || '').trim(),
          status: 'neu',
          richtigInFolge: 0,
          fehlerGesamt: 0,
          erstelltAm: jetzt + k, // Reihenfolge wie auf dem Foto
        });
      }
      location.hash = `#/lektion/${unitId}`;
    });
  }
}
