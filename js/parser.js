// parser.js – erkannten Text in Wortpaare zerlegen (ohne HTML, ohne Tesseract)
//
// Hauptweg: parseWords(words) mit Wortpositionen aus der Texterkennung
//   words: [{ text, x0, x1, y0, y1 }]  (Pixel, Ursprung oben links)
//   1. Nahe Wörter zu Abschnitten verketten (z. B. „les chats [leʃa] m. pl.“)
//   2. Spaltenanfänge auf der Seite finden (Fremdwort | Deutsch | Beispiel)
//   3. Jede Spalte von oben nach unten sortieren und die Spalten miteinander abgleichen.
//      Die Reihenfolge der Zeilen ist in jeder Spalte gleich – auch wenn das Foto schräg
//      oder perspektivisch verzerrt ist. Darum braucht es keine Schräglage.
//   4. Übrige deutsche Zeilen als Fortsetzung anhängen, dann säubern
// Notweg: parseText(text) für einfache Listen mit Trennzeichen („big - groß“)
//
// Ergebnis: { paare: [{ fremd, deutsch, beispiel, pruefen }], ausgelassen: Zahl }

// ---------- Säubern ----------

// Grammatik-Abkürzungen aus dem Wörterverzeichnis (fam., m. pl., adj., …)
const ABKUERZUNGEN = /(^|\s)(fam|inv|adj|adv|m|f|pl|sg|qc|qn|ugs|Adj|Adv|Pl|Sg)\.(\/\s?(m|f|adj|adv)\.?)?(?=\s|$|,)/g;

function basicClean(text = '') {
  return text
    .replace(/\[[^\]]*(\]|$)/g, ' ')                // Lautschrift [ˈbɪɡ], auch wenn „]“ fehlt
    .replace(/\S*\]/g, ' ')                         // falsch gelesener Anfang: „(se]“, „Lzasui]“
    .replace(/(^|\s)[()[\]|•·*#%](?=\s|$)/g, ' ')   // einzelne Klammern, Striche, Punkte
    .replace(/\s*[▶►>]\s*\S.*$/, '')                // Verweise „▶ Verbes, p. 160“
    .replace(/(^|\s)\/[^/\s][^/]*\/(?=\s|$)/g, ' ') // Lautschrift /bɪɡ/ (nicht „he/she/it“)
    .replace(/^\s*(\d{1,3}[.)]|[•·▪◦*–-])\s+/, '')   // Aufzählung „1.“ „•“ „–“
    .replace(/\s+/g, ' ')
    .trim();
}

// Mehrere Bedeutungen einheitlich mit „; “ trennen und Ränder glätten
function joinMeanings(text) {
  return text
    .split(';')
    .map((t) => t.trim().replace(/^[,;/]+|[,;/]+$/g, '').trim())
    .filter(Boolean)
    .join('; ');
}

export function cleanFremd(text = '') {
  let t = basicClean(text);
  for (let i = 0; i < 2; i++) t = t.replace(ABKUERZUNGEN, ' '); // „m. pl.“ = zwei Abkürzungen
  t = t.replace(/\s+\/\s*|\s*\/\s+/g, '; ');          // „sympa / sympathique“
  return joinMeanings(t.replace(/\s+/g, ' '));
}

export function cleanDeutsch(text = '') {
  let t = basicClean(text);
  t = t.replace(/\s*wörtlich:.*$/i, '');              // Erklärung „wörtlich: …“ weg
  t = t.replace(/(^|\s)hier:\s*/gi, ' ');             // „hier: Und dir?“ → „Und dir?“
  t = t.replace(/\s*\bauch:\s*/gi, '; ');             // „Hallo! auch: Tschüss!“ → zwei Bedeutungen
  t = t.replace(/\s+\/\s*|\s*\/\s+/g, '; ');          // „Wie geht's? / Geht's gut?“
  t = t.replace(/,\s+/g, '; ');                       // „super, toll“
  return joinMeanings(t.replace(/\s+/g, ' '));
}

export const cleanPart = basicClean;

// Mindestens zwei Buchstaben, sonst keine Vokabel (Seitenzahl, Rest von Lautschrift …)
function hasWord(text = '') {
  return (text.match(/\p{L}/gu) || []).length >= 2;
}

// Zeilen einer Zelle zusammenfügen; Worttrennung „Personal-“ + „pronomens“ → „Personalpronomens“
function appendText(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (/\p{L}-$/u.test(a) && /^\p{Ll}/u.test(b)) return a.slice(0, -1) + b;
  if (/\/$/.test(a)) return a + b;
  return `${a} ${b}`;
}
const endetOffen = (t) => /[-/,]$/.test(t.trim()); // Zelle geht in der nächsten Zeile weiter

// ---------- 1. Abschnitte ----------

// Verkettet Wörter, die direkt nebeneinander auf gleicher Höhe stehen.
// Große Lücken (Spaltengrenzen) trennen Abschnitte.
export function buildSegments(words) {
  const sorted = words
    .filter((w) => w.text && w.text.trim())
    .map((w) => ({ ...w, text: w.text.trim(), y: (w.y0 + w.y1) / 2, h: w.y1 - w.y0 }))
    .sort((a, b) => a.x0 - b.x0);
  const segs = [];
  for (const w of sorted) {
    let best = null;
    let bestDy = Infinity;
    for (const s of segs) {
      const last = s.words[s.words.length - 1];
      const luecke = w.x0 - last.x1;
      const dy = Math.abs(last.y - w.y);
      if (luecke > -0.5 * w.h && luecke < 1.5 * Math.max(w.h, last.h) && dy < 0.4 * Math.max(w.h, last.h) && dy < bestDy) {
        best = s;
        bestDy = dy;
      }
    }
    if (best) {
      best.words.push(w);
      best.x1 = w.x1;
    } else {
      segs.push({ words: [w], x0: w.x0, x1: w.x1 });
    }
  }
  for (const s of segs) {
    s.y = median(s.words.map((w) => w.y));
    s.h = median(s.words.map((w) => w.h));
    s.text = s.words.map((w) => w.text).join(' ');
  }
  return segs;
}

// ---------- 2. Spalten ----------

// Spaltenanfänge: x-Positionen, an denen viele Abschnitte beginnen. Jede Spalte bekommt eine
// Gerade x = a + b·y, weil schräge Fotos die Spalten kippen.
// Es zählen die (höchstens 3) häufigsten – so stören kleine Kästen mit eigenen Spalten nicht.
export function findColumns(segs, seitenBreite) {
  const starts = segs.map((s) => ({ x: s.x0, y: s.y })).sort((a, b) => a.x - b.x);
  const clusters = [];
  for (const s of starts) {
    const c = clusters[clusters.length - 1];
    if (c && s.x - c[c.length - 1].x < 0.035 * seitenBreite) c.push(s); else clusters.push([s]);
  }
  return clusters
    .filter((c) => c.length >= 3)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3)
    .map(fitLine)
    .sort((a, b) => a.at(0) - b.at(0));
}

function fitLine(points) {
  const n = points.length;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  let sxy = 0;
  let syy = 0;
  for (const p of points) { sxy += (p.y - my) * (p.x - mx); syy += (p.y - my) ** 2; }
  const b = syy > 0 ? Math.max(-0.15, Math.min(0.15, sxy / syy)) : 0;
  return { at: (y) => mx + b * (y - my), anzahl: n };
}

// Teilt Abschnitte auf die Spalten auf. Ein Abschnitt, der über eine Spaltengrenze reicht,
// wird an den Wörtern dort zerschnitten.
function splitIntoColumns(segs, columns) {
  const cols = columns.map(() => []);
  for (const s of segs) {
    const teile = new Map();
    for (const w of s.words) {
      let k = 0;
      for (let i = 0; i < columns.length; i++) if (w.x0 >= columns[i].at(w.y) - 1.5 * s.h) k = i;
      if (!teile.has(k)) teile.set(k, []);
      teile.get(k).push(w);
    }
    for (const [k, ws] of teile) {
      cols[k].push({ text: ws.map((w) => w.text).join(' '), y: median(ws.map((w) => w.y)), h: s.h });
    }
  }
  return cols.map((c) => c.sort((a, b) => a.y - b.y));
}

// ---------- 3. Abgleichen ----------

// Gleicht zwei Spalten ab (beide von oben nach unten sortiert). Gesucht ist die Kette von Paaren,
// bei der sich der Höhenversatz von Paar zu Paar möglichst wenig ändert – so folgt der Abgleich
// einer schrägen oder verzerrten Seite. Jedes Paar bringt einen Punkt, Versatz-Sprünge kosten.
export function align(A, B, h) {
  const cand = [];
  A.forEach((a, i) => B.forEach((b, j) => {
    const off = b.y - a.y;
    if (Math.abs(off) < 2.5 * h) cand.push({ i, j, off });
  }));
  cand.sort((p, q) => p.i - q.i || p.j - q.j);
  const best = cand.map((c) => 1 - (0.5 * Math.abs(c.off)) / h);
  const prev = cand.map(() => -1);
  for (let k = 0; k < cand.length; k++) {
    for (let l = 0; l < k; l++) {
      if (cand[l].i >= cand[k].i || cand[l].j >= cand[k].j) continue;
      // Kleine Schwankungen (bis 0,3 Zeilenhöhen) sind normal, große Sprünge kosten viel
      const sprung = Math.max(0, Math.abs(cand[k].off - cand[l].off) - 0.3 * h);
      const v = best[l] + 1 - (2 * sprung) / h;
      if (v > best[k]) { best[k] = v; prev[k] = l; }
    }
  }
  let k = best.indexOf(Math.max(...best));
  const paare = [];
  while (k >= 0) { paare.unshift([cand[k].i, cand[k].j]); k = prev[k]; }
  return paare;
}

// ---------- Zusammensetzen ----------

export function parseWords(words) {
  if (!words || !words.length) return { paare: [], ausgelassen: 0 };
  const segs = buildSegments(words);
  const seitenBreite = Math.max(...words.map((w) => w.x1)) - Math.min(...words.map((w) => w.x0));
  const columns = findColumns(segs, seitenBreite);

  // Keine Spalten gefunden → wie einfacher Text mit Trennzeichen behandeln
  if (columns.length < 2) {
    const zeilen = [...segs].sort((a, b) => a.y - b.y).map((s) => s.text);
    return parseText(zeilen.join('\n'));
  }

  const h = median(segs.map((s) => s.h)) || 1;
  const [col0, col1, col2 = []] = splitIntoColumns(segs, columns)
    // Reste ohne Wort (z. B. eine zweite Zeile, die nur Lautschrift ist) fallen weg
    .map((c, k) => c.filter((s) => hasWord(k === 0 ? cleanFremd(s.text) : s.text)));

  // Fremdwort ↔ Deutsch
  const rows = [];
  const deutschVergeben = new Set();
  const fremdVergeben = new Set();
  for (const [i, j] of align(col0, col1, h)) {
    rows.push({ y: col0[i].y, fremd: col0[i].text, deutsch: col1[j].text, dTop: col1[j].y, dBottom: col1[j].y, beispiel: '' });
    fremdVergeben.add(i);
    deutschVergeben.add(j);
  }
  let ausgelassen = col0.length - fremdVergeben.size; // Überschriften, Erklärtexte …

  // Übrige deutsche Zeilen: Fortsetzung einer Zelle oder Zeile ohne erkanntes Fremdwort
  col1.forEach((s, j) => {
    if (deutschVergeben.has(j)) return;
    const darueber = rows.filter((r) => r.dBottom < s.y && s.y - r.dBottom < 1.6 * h).sort((a, b) => b.dBottom - a.dBottom)[0];
    const darunter = rows.filter((r) => r.dTop > s.y && r.dTop - s.y < 1.6 * h).sort((a, b) => a.dTop - b.dTop)[0];
    let ziel = null;
    if (darunter && endetOffen(s.text)) ziel = darunter;
    else if (darueber && endetOffen(darueber.deutsch)) ziel = darueber;
    else {
      ziel = [darueber, darunter].filter((r) => r && Math.abs(r.y - s.y) < 1.0 * h)
        .sort((a, b) => Math.abs(a.y - s.y) - Math.abs(b.y - s.y))[0];
    }
    if (!ziel) {
      // Eigene Zeile ohne erkanntes Fremdwort – nur bei echtem Text (nicht „DO“, „VE“ …)
      if ((s.text.match(/\p{L}/gu) || []).length >= 3) {
        rows.push({ y: s.y, fremd: '', deutsch: s.text, dTop: s.y, dBottom: s.y, beispiel: '' });
      } else {
        ausgelassen++;
      }
    } else if (ziel === darunter && s.y < ziel.dTop) {
      ziel.deutsch = appendText(s.text, ziel.deutsch);
      ziel.dTop = s.y;
    } else {
      ziel.deutsch = appendText(ziel.deutsch, s.text);
      ziel.dBottom = s.y;
    }
  });
  rows.sort((a, b) => a.y - b.y);

  // Beispielsätze (3. Spalte) zuordnen; übrige an die Zeile direkt darüber hängen
  if (col2.length) {
    const vergeben = new Set();
    for (const [i, j] of align(rows, col2, h)) { rows[i].beispiel = col2[j].text; vergeben.add(j); }
    col2.forEach((s, j) => {
      if (vergeben.has(j)) return;
      const r = rows.filter((x) => x.y <= s.y && s.y - x.y < 1.6 * h).pop();
      if (r) r.beispiel = appendText(r.beispiel, s.text);
    });
  }

  const paare = rows.map((r) => {
    const fremd = cleanFremd(r.fremd);
    const deutsch = cleanDeutsch(r.deutsch);
    return {
      fremd,
      deutsch,
      beispiel: basicClean(r.beispiel),
      pruefen: !hasWord(fremd) || !hasWord(deutsch) || fremd.length > 40 || deutsch.length > 60
        || /\d/.test(fremd), // Ziffern: meist Seitenzahl oder Zahlenkasten
    };
  });
  return { paare, ausgelassen };
}

// ---------- Notweg: einfache Textlisten mit Trennzeichen ----------

const TRENNER = [/\t+/, /\s+=\s+/, /\s*\|\s*/, /\s+[–—]\s+/, /\s+-\s+/, /\s{3,}/];

export function splitBySeparator(text) {
  for (const t of TRENNER) {
    const teile = text.split(t).map((p) => p.trim()).filter(Boolean);
    if (teile.length >= 2) return teile;
  }
  return null;
}

export function parseText(text = '') {
  const paare = [];
  let ausgelassen = 0;
  for (const line of text.split('\n')) {
    if (!hasWord(line)) continue;
    const teile = splitBySeparator(line.trim());
    if (!teile) { ausgelassen++; continue; }
    const [f, d, b = ''] = teile;
    paare.push({ fremd: cleanFremd(f), deutsch: cleanDeutsch(d), beispiel: basicClean(b), pruefen: teile.length > 3 });
  }
  return { paare, ausgelassen };
}

function median(zahlen) {
  if (!zahlen.length) return 0;
  const s = [...zahlen].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
