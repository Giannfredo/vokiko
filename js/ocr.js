// ocr.js – Foto vorbereiten und Texterkennung mit Tesseract.js (wird erst bei Bedarf geladen)

const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const TESS_SPRACHEN = { en: 'eng', fr: 'fra' };
const MAX_BREITE = 2000;   // größere Fotos werden verkleinert – schneller, kaum schlechter
const MIN_SICHERHEIT = 40; // unsichere „Wörter“ (meist aus Bildern) werden ignoriert

let ladePromise = null;

// Lädt das Tesseract-Skript einmalig (danach steht window.Tesseract bereit)
function loadTesseract() {
  if (!ladePromise) {
    ladePromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TESSERACT_URL;
      script.onload = () => resolve(window.Tesseract);
      script.onerror = () => { ladePromise = null; reject(new Error('Tesseract konnte nicht geladen werden')); };
      document.head.append(script);
    });
  }
  return ladePromise;
}

// Liest die Bilddatei. Wirft einen Fehler mit code 'BILDFORMAT', wenn der Browser das Format
// nicht kann (z. B. HEIC vom iPhone in Chrome).
export async function loadImage(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const fehler = new Error('Bildformat wird nicht unterstützt');
    fehler.code = 'BILDFORMAT';
    throw fehler;
  }
}

/**
 * Bereitet das Foto für die Erkennung vor und gibt ein Canvas zurück:
 * - drehung: 0, 90, 180 oder 270 Grad (im Uhrzeigersinn)
 * - bereich: markierter Ausschnitt { x, y, w, h } als Anteile 0–1 des gedrehten Bilds,
 *            null = ganzes Bild
 * - kleine Ausschnitte werden bis zu 2× vergrößert (Tesseract liest größere Schrift besser)
 * - Graubild aus dem Grün-Kanal: rote Schrift auf gelbem Grund (z. B. rote Artikel)
 *   wird so dunkel auf hell und damit besser lesbar.
 */
export function prepareImage(bild, { drehung = 0, bereich = null, maxBreite = MAX_BREITE } = {}) {
  const quer = drehung % 180 !== 0;
  const breite = quer ? bild.height : bild.width;  // Maße nach dem Drehen
  const hoehe = quer ? bild.width : bild.height;
  const b = bereich || { x: 0, y: 0, w: 1, h: 1 };
  const ausschnittB = b.w * breite;
  const ausschnittH = b.h * hoehe;
  const faktor = Math.min(bereich ? 2 : 1, maxBreite / ausschnittB);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(ausschnittB * faktor);
  canvas.height = Math.round(ausschnittH * faktor);
  const ctx = canvas.getContext('2d');
  ctx.scale(faktor, faktor);
  ctx.translate(-b.x * breite, -b.y * hoehe);
  // Drehen um die Bildmitte
  ctx.translate(breite / 2, hoehe / 2);
  ctx.rotate((drehung * Math.PI) / 180);
  ctx.drawImage(bild, -bild.width / 2, -bild.height / 2);

  // Grün-Kanal als Graubild
  const daten = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const p = daten.data;
  for (let i = 0; i < p.length; i += 4) { p[i] = p[i + 1]; p[i + 2] = p[i + 1]; }
  ctx.putImageData(daten, 0, 0);
  return canvas;
}

/**
 * Liest den Text aus einem oder mehreren vorbereiteten Bildern (z. B. markierten Bereichen).
 * Tesseract wird dafür nur einmal gestartet.
 * sprache:    'en' | 'fr' (Sprache des Buchs, Deutsch kommt immer dazu)
 * onProgress: (anteil 0–1 über alle Bilder, text) => void
 * Ergebnis:   [{ text, words: [{ text, x0, x1, y0, y1 }] }] – eins pro Bild
 */
export async function recognizeAll(canvases, sprache, onProgress = () => {}) {
  onProgress(0, 'Texterkennung wird geladen …');
  const Tesseract = await loadTesseract();
  let nr = 0; // welches Bild gerade gelesen wird
  const worker = await Tesseract.createWorker(`${TESS_SPRACHEN[sprache]}+deu`, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const teil = canvases.length > 1 ? ` (Bereich ${nr + 1} von ${canvases.length})` : '';
        onProgress((nr + m.progress) / canvases.length, `Kiko liest${teil} …`);
      } else if (m.status.includes('loading')) {
        onProgress(0, 'Sprachdaten werden geladen …');
      }
    },
  });
  try {
    const ergebnisse = [];
    for (nr = 0; nr < canvases.length; nr++) {
      const { data } = await worker.recognize(canvases[nr]);
      const words = (data.words || [])
        .filter((w) => w.confidence >= MIN_SICHERHEIT && w.text.trim())
        .map((w) => ({ text: w.text.trim(), ...w.bbox }));
      ergebnisse.push({ text: data.text, words });
    }
    return ergebnisse;
  } finally {
    await worker.terminate();
  }
}
