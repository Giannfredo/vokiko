// konfetti.js – kurzer Konfetti-Regen über der Seite (ohne Bibliothek)
//
// Legt für ein paar Sekunden ein durchsichtiges <canvas> über alles, wirft bunte Schnipsel
// aus `ursprung` (einem Element, z. B. den Sternen) nach oben und lässt sie herunterflattern.
// Klicks gehen durch (pointer-events: none). Wer am Gerät „Bewegung reduzieren“ eingestellt
// hat, bekommt kein Konfetti.

const FARBEN = ['--orange', '--rost', '--gruen', '--gelb', '--uk-blau'];

export function konfetti({ ursprung = null, anzahl = 150, dauer = 3500, verzoegerung = 0 } = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setTimeout(() => regnen(ursprung, anzahl, dauer), verzoegerung);
}

function regnen(ursprung, anzahl, dauer) {
  const w = innerWidth;
  const h = innerHeight;
  const dpr = devicePixelRatio || 1; // scharf auf Retina-Displays
  const canvas = document.createElement('canvas');
  canvas.className = 'konfetti';
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Farben aus den CSS-Variablen holen
  const stil = getComputedStyle(document.documentElement);
  const farben = FARBEN.map((v) => stil.getPropertyValue(v).trim()).filter(Boolean);

  // Startpunkt: Mitte des Ursprung-Elements (falls sichtbar), sonst oben in der Mitte
  const r = ursprung?.getBoundingClientRect();
  const sx = r && r.bottom > 0 && r.top < h ? r.left + r.width / 2 : w / 2;
  const sy = r && r.bottom > 0 && r.top < h ? r.top + r.height / 2 : h * 0.3;

  const teile = Array.from({ length: anzahl }, () => {
    const winkel = -Math.PI / 2 + (Math.random() - 0.5) * 2.2; // grob nach oben, breit gestreut
    const tempo = 6 + Math.random() * 10;
    return {
      x: sx, y: sy,
      vx: Math.cos(winkel) * tempo,
      vy: Math.sin(winkel) * tempo,
      breite: 6 + Math.random() * 6,
      hoehe: 4 + Math.random() * 4,
      dreh: Math.random() * Math.PI,
      vdreh: (Math.random() - 0.5) * 0.3,
      farbe: farben[Math.floor(Math.random() * farben.length)],
    };
  });

  const start = performance.now();
  let letzt = start;
  function bild(jetzt) {
    const t = jetzt - start;
    const k = Math.min(3, (jetzt - letzt) / 16.7); // gleich schnell bei 60 und 120 Hz
    letzt = jetzt;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = Math.max(0, Math.min(1, (dauer - t) / 600)); // am Ende ausblenden
    for (const p of teile) {
      p.vx *= 0.97 ** k;                     // Luftwiderstand
      p.vy = p.vy * 0.97 ** k + 0.25 * k;    // … und Schwerkraft
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.dreh += p.vdreh * k;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.dreh);
      ctx.scale(1, Math.cos(p.dreh * 3)); // Flattern: Schnipsel dreht sich um sich selbst
      ctx.fillStyle = p.farbe;
      ctx.fillRect(-p.breite / 2, -p.hoehe / 2, p.breite, p.hoehe);
      ctx.restore();
    }
    if (t < dauer) requestAnimationFrame(bild);
    else canvas.remove();
  }
  requestAnimationFrame(bild);
}
