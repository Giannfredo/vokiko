// kiko.js – Kiko, der Rote Panda, als SVG-Grafik im Manga-Stil (keine Bilddatei nötig)
//
// stimmung: 'normal' | 'freude' | 'denkt' | 'troestet'
// outfit:   null | 'schal' (Englisch, Union-Jack-Schal) | 'muetze' (Französisch, Baskenmütze)
// Die Farben kommen aus CSS-Klassen (k-fell, k-tusche, …), die auf Variablen in :root zeigen.
// Manga-Merkmale: dicke Tusche-Konturen, große Augen mit zwei Glanzpunkten, Rouge-Striche.

// Zwei große Glanzaugen. Mit dx/dy schaut Kiko woandershin (die Iris wandert), glanz = Größe der Lichtpunkte.
function augen({ dx = 0, dy = 0, glanz = 6.5, extra = '' } = {}) {
  const auge = (x) => `
    <ellipse class="k-tusche" cx="${x}" cy="106" rx="16" ry="20"/>
    <ellipse class="k-iris" cx="${x + dx}" cy="${114 + dy}" rx="11" ry="10"/>
    <circle class="k-glanz" cx="${x - 6 + dx / 2}" cy="${97 + dy / 2}" r="${glanz}"/>
    <circle class="k-glanz" cx="${x + 6}" cy="116" r="${glanz / 2.2}"/>`;
  return `<g class="augen">${auge(68)}${auge(132)}${extra}</g>`;
}

// Kleiner 4-zackiger Funkel-Stern (Manga-Glitzer) an Position x/y
const funkel = (x, y, s = 1, klasse = 'k-funkel') =>
  `<path class="${klasse}" transform="translate(${x} ${y}) scale(${s})" d="M0 -10 Q2 -2 10 0 Q2 2 0 10 Q-2 2 -10 0 Q-2 -2 0 -10 Z"/>`;

// Augen, Mund und Extras je Stimmung. Augen mit class="augen" blinzeln (siehe style.css).
const GESICHTER = {
  normal: `
    ${augen()}
    <path class="k-strich" d="M52 98 Q48 93 45 91 M148 98 Q152 93 155 91"/>
    <path class="k-strich" d="M88 137 Q94 143 100 137 Q106 143 112 137"/>`,
  freude: `
    <path class="k-strich dick" d="M52 112 Q68 88 84 112 M116 112 Q132 88 148 112"/>
    <path class="k-tusche k-umriss" d="M86 134 Q100 162 114 134 Z"/>
    <path class="k-zunge" d="M92 146 Q100 141 108 146 Q100 156 92 146 Z"/>
    ${funkel(18, 44, 1)}${funkel(10, 98, 0.6)}${funkel(190, 150, 0.9, 'k-funkel blau')}`,
  denkt: `
    ${augen({ dx: 5, dy: -15, glanz: 5.5 })}
    <path class="k-strich" d="M54 82 Q66 78 80 82 M120 80 Q134 74 146 78"/>
    <path class="k-strich" d="M92 139 Q100 135 109 139"/>
    <path class="k-tropfen" d="M28 62 Q20 76 28 82 Q36 76 28 62 Z"/>
    <circle class="k-blase" cx="186" cy="152" r="4"/><circle class="k-blase" cx="195" cy="138" r="6"/>`,
  troestet: `
    ${augen({ glanz: 8, extra: '<circle class="k-glanz" cx="58" cy="112" r="2"/><circle class="k-glanz" cx="122" cy="112" r="2"/>' })}
    <path class="k-traenen-linie" d="M52 124 Q68 131 84 124 M116 124 Q132 131 148 124"/>
    <path class="k-strich" d="M52 84 Q64 80 78 76 M122 76 Q136 80 148 84"/>
    <path class="k-strich" d="M91 142 Q100 136 109 142"/>
    <path class="k-herz" d="M186 146 C178 138 168 148 186 160 C204 148 194 138 186 146 Z"/>`,
};

// Weiße „Augenbrauen“-Flecken: beim Nachdenken eine hochgezogen, beim Trösten schräg (mitfühlend)
function brauen(stimmung) {
  if (stimmung === 'denkt') {
    return `<ellipse class="k-hell" cx="66" cy="72" rx="10" ry="6"/>
            <ellipse class="k-hell" cx="134" cy="68" rx="10" ry="6" transform="rotate(-12 134 68)"/>`;
  }
  if (stimmung === 'troestet') {
    return `<ellipse class="k-hell" cx="66" cy="72" rx="10" ry="6" transform="rotate(-18 66 72)"/>
            <ellipse class="k-hell" cx="134" cy="72" rx="10" ry="6" transform="rotate(18 134 72)"/>`;
  }
  return `<ellipse class="k-hell" cx="66" cy="74" rx="10" ry="6"/>
          <ellipse class="k-hell" cx="134" cy="74" rx="10" ry="6"/>`;
}

// Outfits sind für einen kleineren Kopf gezeichnet (Mitte 60/64) und werden auf den
// neuen Kopf (Mitte 100/102) vergrößert.
const OUTFIT_PASSEND = 'translate(100 102) scale(1.8) translate(-60 -64)';
const SCHAL_PASSEND = 'translate(100 90) scale(1.75) translate(-60 -64)'; // etwas höher, sonst hängt er unter dem Kinn

// Schal mit Union-Jack-Zipfel (Englisch)
const SCHAL = `
  <g transform="${SCHAL_PASSEND}">
    <path class="k-uk-blau k-umriss-duenn" d="M24 92 Q60 110 96 92 L98 103 Q60 122 22 103 Z"/>
    <path class="k-weiss-linie" d="M23 97.5 Q60 116 97 97.5"/>
    <path class="k-uk-rot-linie" d="M23 97.5 Q60 116 97 97.5"/>
    <g transform="translate(70 102) rotate(8)">
      <rect class="k-uk-blau" width="20" height="24" rx="2"/>
      <path class="k-uk-weiss" d="M0 0 L20 24 M20 0 L0 24" stroke-width="4"/>
      <path class="k-uk-rot" d="M0 0 L20 24 M20 0 L0 24" stroke-width="1.5"/>
      <path class="k-uk-weiss" d="M10 0 V24 M0 12 H20" stroke-width="6"/>
      <path class="k-uk-rot" d="M10 0 V24 M0 12 H20" stroke-width="3.5"/>
      <rect class="k-umriss-duenn" width="20" height="24" rx="2" fill="none"/>
    </g>
  </g>`;

// Baskenmütze (Französisch), leicht schief auf dem Kopf
const MUETZE = `
  <g transform="${OUTFIT_PASSEND}">
    <g transform="rotate(-10 62 30)">
      <path class="k-muetze k-umriss-duenn" d="M30 34 Q34 14 62 13 Q92 14 96 32 Q62 42 30 34 Z"/>
      <path class="k-muetze-stiel" d="M62 13 L64 6"/>
    </g>
  </g>`;

// Sternchen-Haarspange am linken Ohr (fällt unter der Mütze weg)
const SPANGE = `<path class="k-funkel" transform="translate(58 44) rotate(-15)"
  d="M0 -11 L3.2 -4 L10.5 -3.4 L5 1.6 L6.5 9 L0 5 L-6.5 9 L-5 1.6 L-10.5 -3.4 L-3.2 -4 Z"/>`;

// Geringelter Schwanz hinter dem Kopf, rechts (wird zuerst gezeichnet = liegt hinten).
// Dreimal dieselbe Linie: breit in Tusche (= Kontur), etwas schmaler in Fell, darüber gestrichelt die Ringe.
// Bei Freude wedelt er (CSS-Animation um den Ansatzpunkt 148/118, siehe style.css).
const SCHWANZ_LINIE = 'M148 118 C174 122 184 104 182 82 C180 68 174 58 166 52';
const SCHWANZ = `
  <g class="k-schwanz">
    <path class="k-schwanz-rand" d="${SCHWANZ_LINIE}"/>
    <path class="k-schwanz-fell" d="${SCHWANZ_LINIE}"/>
    <path class="k-schwanz-ringe" d="${SCHWANZ_LINIE}"/>
    <circle class="k-hell k-umriss" cx="166" cy="51" r="11"/>
  </g>`;

// Ein Ohr (das rechte entsteht durch Spiegeln)
const OHR = `
  <path class="k-fell k-umriss" d="M30 70 Q22 24 40 14 Q58 14 86 40 Z"/>
  <path class="k-hell" d="M40 56 Q36 30 44 25 Q56 27 72 40 Z"/>`;

export function kikoSvg({ stimmung = 'normal', outfit = null } = {}) {
  const gesicht = GESICHTER[stimmung] || GESICHTER.normal;
  return `
    <svg class="kiko-svg" viewBox="0 0 200 180" role="img" aria-label="Kiko, der Rote Panda">
      ${SCHWANZ}
      <g>${OHR}</g>
      <g transform="translate(200 0) scale(-1 1)">${OHR}</g>
      <ellipse class="k-fell k-umriss" cx="100" cy="102" rx="80" ry="64"/>
      <ellipse class="k-hell" cx="44" cy="130" rx="16" ry="13"/>
      <ellipse class="k-hell" cx="156" cy="130" rx="16" ry="13"/>
      <ellipse class="k-hell" cx="100" cy="134" rx="38" ry="26"/>
      ${brauen(stimmung)}
      <path class="k-rouge" d="M36 128 l6 -8 M44 130 l6 -8 M52 132 l6 -8 M142 132 l6 -8 M150 130 l6 -8 M158 128 l6 -8"/>
      ${gesicht}
      <path class="k-tusche k-umriss" d="M93 124 Q100 120 107 124 Q104 131 100 132 Q96 131 93 124 Z"/>
      <circle class="k-glanz" cx="97" cy="124" r="1.6"/>
      ${outfit === 'muetze' ? MUETZE : SPANGE}
      ${outfit === 'schal' ? SCHAL : ''}
    </svg>`;
}

/**
 * Kiko mit Sprechblase daneben.
 * text ist HTML – Texte, die Nutzer eingegeben haben, vorher mit esc() schützen!
 */
export function kikoSays(text, { stimmung = 'normal', outfit = null } = {}) {
  return `
    <div class="kiko-says kiko-${stimmung}" data-stimmung="${stimmung}" data-outfit="${outfit || ''}">
      <button type="button" class="kiko" aria-label="Kiko streicheln">${kikoSvg({ stimmung, outfit })}</button>
      <div class="kiko-bubble"><span class="visually-hidden">Kiko sagt:</span> ${text}</div>
    </div>`;
}

const FREUDE_DAUER = 2600; // ms – passt zum Wedeln in style.css (8 × 0,3 s)

/**
 * Kiko streicheln: Ein Klick auf Kiko zeigt kurz das Freude-Gesicht und lässt ihn wedeln,
 * danach kommt die vorherige Stimmung zurück. Einmal beim App-Start aufrufen – ein einziger
 * Lauscher am Dokument reicht für alle Kikos, auch auf später gezeichneten Bildschirmen.
 */
export function initKikoStreicheln() {
  const timer = new WeakMap(); // je Kiko der laufende „zurück zur alten Stimmung“-Timer
  document.addEventListener('click', (event) => {
    const knopf = event.target.closest('.kiko-says .kiko');
    if (!knopf) return;
    const box = knopf.closest('.kiko-says');
    const outfit = box.dataset.outfit || null;
    clearTimeout(timer.get(box));
    box.classList.add('gestreichelt');
    knopf.innerHTML = kikoSvg({ stimmung: 'freude', outfit }); // neues SVG = Wedeln startet neu
    timer.set(box, setTimeout(() => {
      box.classList.remove('gestreichelt');
      knopf.innerHTML = kikoSvg({ stimmung: box.dataset.stimmung, outfit });
    }, FREUDE_DAUER));
  });
}
