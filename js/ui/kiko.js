// kiko.js – Kiko, der Rote Panda, als SVG-Grafik (keine Bilddatei nötig)
//
// stimmung: 'normal' | 'freude' | 'denkt' | 'troestet'
// outfit:   null | 'schal' (Englisch, Union-Jack-Schal) | 'muetze' (Französisch, Baskenmütze)
// Die Farben kommen aus CSS-Klassen (k-fell, k-weiss, …), die auf Variablen in :root zeigen.

// Augen und Mund je Stimmung. Augen mit class="augen" blinzeln (siehe style.css).
const GESICHTER = {
  normal: `
    <g class="augen">
      <circle class="k-dunkel" cx="44" cy="66" r="5.5"/><circle class="k-weiss" cx="46" cy="64" r="1.8"/>
      <circle class="k-dunkel" cx="76" cy="66" r="5.5"/><circle class="k-weiss" cx="78" cy="64" r="1.8"/>
    </g>
    <path class="k-linie" d="M54 84 Q60 89 66 84"/>`,
  freude: `
    <path class="k-linie dick" d="M38 68 Q44 60 50 68"/>
    <path class="k-linie dick" d="M70 68 Q76 60 82 68"/>
    <ellipse class="k-backe" cx="31" cy="79" rx="6" ry="3.5"/>
    <ellipse class="k-backe" cx="89" cy="79" rx="6" ry="3.5"/>
    <path class="k-dunkel" d="M52 83 Q60 96 68 83 Z"/>
    <path class="k-zunge" d="M56 88 Q60 94 64 88 Z"/>`,
  denkt: `
    <g class="augen">
      <circle class="k-dunkel" cx="46" cy="63" r="5.5"/><circle class="k-weiss" cx="48" cy="61" r="1.8"/>
      <circle class="k-dunkel" cx="78" cy="63" r="5.5"/><circle class="k-weiss" cx="80" cy="61" r="1.8"/>
    </g>
    <path class="k-linie" d="M55 86 Q61 83 66 86"/>`,
  troestet: `
    <g class="augen">
      <circle class="k-dunkel" cx="44" cy="67" r="5"/><circle class="k-weiss" cx="46" cy="65" r="1.6"/>
      <circle class="k-dunkel" cx="76" cy="67" r="5"/><circle class="k-weiss" cx="78" cy="65" r="1.6"/>
    </g>
    <path class="k-linie" d="M55 85 Q60 88 65 85"/>`,
};

// Weiße „Augenbrauen“-Flecken: beim Nachdenken eine hochgezogen, beim Trösten schräg (mitfühlend)
function brauen(stimmung) {
  if (stimmung === 'denkt') {
    return `<ellipse class="k-weiss" cx="44" cy="53" rx="7" ry="4.5"/>
            <ellipse class="k-weiss" cx="76" cy="49" rx="7" ry="4.5" transform="rotate(-12 76 49)"/>`;
  }
  if (stimmung === 'troestet') {
    return `<ellipse class="k-weiss" cx="44" cy="54" rx="7" ry="4.5" transform="rotate(-18 44 54)"/>
            <ellipse class="k-weiss" cx="76" cy="54" rx="7" ry="4.5" transform="rotate(18 76 54)"/>`;
  }
  return `<ellipse class="k-weiss" cx="44" cy="53" rx="7" ry="4.5"/>
          <ellipse class="k-weiss" cx="76" cy="53" rx="7" ry="4.5"/>`;
}

// Schal mit Union-Jack-Zipfel (Englisch)
const SCHAL = `
  <path class="k-uk-blau" d="M24 92 Q60 110 96 92 L98 103 Q60 122 22 103 Z"/>
  <path class="k-weiss-linie" d="M23 97.5 Q60 116 97 97.5"/>
  <path class="k-uk-rot-linie" d="M23 97.5 Q60 116 97 97.5"/>
  <g transform="translate(70 102) rotate(8)">
    <rect class="k-uk-blau" width="20" height="24" rx="2"/>
    <path class="k-uk-weiss" d="M0 0 L20 24 M20 0 L0 24" stroke-width="4"/>
    <path class="k-uk-rot" d="M0 0 L20 24 M20 0 L0 24" stroke-width="1.5"/>
    <path class="k-uk-weiss" d="M10 0 V24 M0 12 H20" stroke-width="6"/>
    <path class="k-uk-rot" d="M10 0 V24 M0 12 H20" stroke-width="3.5"/>
  </g>`;

// Baskenmütze (Französisch), leicht schief auf dem Kopf
const MUETZE = `
  <g transform="rotate(-10 62 30)">
    <path class="k-muetze" d="M30 34 Q34 14 62 13 Q92 14 96 32 Q62 42 30 34 Z"/>
    <path class="k-muetze-stiel" d="M62 13 L64 6"/>
  </g>`;

// Ein Ohr (das rechte entsteht durch Spiegeln)
const OHR = `
  <path class="k-fell k-ohr-rand" d="M20 52 C10 30 20 12 46 28 Z"/>
  <path class="k-ohr-innen" d="M24 45 C19 31 25 22 39 30 Z"/>`;

export function kikoSvg({ stimmung = 'normal', outfit = null } = {}) {
  const gesicht = GESICHTER[stimmung] || GESICHTER.normal;
  return `
    <svg class="kiko-svg" viewBox="0 0 120 128" role="img" aria-label="Kiko, der Rote Panda">
      <g>${OHR}</g>
      <g transform="translate(120 0) scale(-1 1)">${OHR}</g>
      <ellipse class="k-fell" cx="60" cy="64" rx="42" ry="36"/>
      ${brauen(stimmung)}
      <ellipse class="k-weiss" cx="27" cy="77" rx="10" ry="9"/>
      <ellipse class="k-weiss" cx="93" cy="77" rx="10" ry="9"/>
      <ellipse class="k-weiss" cx="60" cy="84" rx="22" ry="14"/>
      <path class="k-traene" d="M41 72 Q38 80 35 87 M79 72 Q82 80 85 87"/>
      ${gesicht}
      <ellipse class="k-dunkel" cx="60" cy="78" rx="5" ry="3.5"/>
      ${outfit === 'schal' ? SCHAL : ''}
      ${outfit === 'muetze' ? MUETZE : ''}
    </svg>`;
}

/**
 * Kiko mit Sprechblase daneben.
 * text ist HTML – Texte, die Nutzer eingegeben haben, vorher mit esc() schützen!
 */
export function kikoSays(text, { stimmung = 'normal', outfit = null } = {}) {
  return `
    <div class="kiko-says kiko-${stimmung}">
      <div class="kiko">${kikoSvg({ stimmung, outfit })}</div>
      <div class="kiko-bubble"><span class="visually-hidden">Kiko sagt:</span> ${text}</div>
    </div>`;
}
