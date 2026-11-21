// icons.js – eigene Icons im Sticker-Stil (statt Emojis, die je nach Gerät anders aussehen)
//
// Jedes Icon ist ein kleines SVG (24×24) aus zwei Sorten Teilen:
// - class="f <farbe>": gefüllte Fläche in Knallfarbe mit Kontur in Schriftfarbe (currentColor)
// - class="s": nur Linie in Schriftfarbe (Pfeile, Striche); "s dick" = kräftiger
// Farben: gelb, mint, pink, blau, lila, weiss, voll (= Schriftfarbe). Siehe .ic in style.css.
//
// Benutzung:  `${icon('ueben')} Üben`   – das Icon ist rein dekorativ (aria-hidden).
// Bei Knöpfen NUR mit Icon immer aria-label setzen!

const kreis = (farbe, r = 9.5) => `<circle class="f ${farbe}" cx="12" cy="12" r="${r}"/>`;

const ICONS = {
  // Navigation und Aktionen
  zurueck: '<path class="s dick" d="M19 12H5M11 6l-6 6 6 6"/>',
  weiter: '<path class="s dick" d="M5 12h14M13 6l6 6-6 6"/>',
  x: '<path class="s dick" d="M6 6l12 12M18 6L6 18"/>',
  plus: `${kreis('gelb')}<path class="s dick" d="M12 7.5v9M7.5 12h9"/>`,
  ueben: `${kreis('mint')}<path class="f voll" d="M10 8.2v7.6l6-3.8z"/>`,
  nochmal: '<path class="s dick" d="M20 11a8 8 0 0 0-14.5-4.5M4 3.5V8h4.5M4 13a8 8 0 0 0 14.5 4.5M20 20.5V16h-4.5"/>',
  drehen: '<path class="s dick" d="M20 12a8 8 0 1 1-2.4-5.7M20 3.5V8h-4.5"/>',
  tauschen: '<path class="s dick" d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"/>',
  muell: '<path class="f pink" d="M6 7h12l-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"/><path class="s" d="M4 7h16M9 7V4h6v3M10 11v6M14 11v6"/>',
  stift: '<path class="f gelb" d="M15.5 4.5l4 4L9 19l-5 1 1-5z"/><path class="f pink" d="M15.5 4.5l1.3-1.3a1.4 1.4 0 0 1 2 0l2 2a1.4 1.4 0 0 1 0 2L19.5 8.5z"/>',
  speichern: '<path class="f blau" d="M4 5a1 1 0 0 1 1-1h12l3 3v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><rect class="f weiss" x="7" y="13" width="10" height="7"/><rect class="f lila" x="8" y="4" width="7" height="5"/>',
  export: '<path class="f mint" d="M3 14h5l1.5 2.5h5L16 14h5v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path class="s dick" d="M12 3v9.5M8 7l4-4 4 4"/>',
  import: '<path class="f gelb" d="M3 14h5l1.5 2.5h5L16 14h5v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path class="s dick" d="M12 3v9.5M8 9l4 4 4-4"/>',
  stumm: '<path class="f gelb" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="s dick" d="M16 9.5l5 5M21 9.5l-5 5"/>',
  lupe: '<circle class="f blau" cx="10.5" cy="10.5" r="6.5"/><path class="s dick" d="M15.5 15.5L21 21"/>',
  laut: '<path class="f gelb" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path class="s" d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',

  // Bereiche
  buch: '<path class="f mint" d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path class="s" d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3M9 7.5h6"/>',
  'buch-offen': '<path class="f weiss" d="M3 5.5c3-1.3 6-1 9 1 3-2 6-2.3 9-1V19c-3-1.3-6-1-9 1-3-2-6-2.3-9-1z"/><path class="s" d="M12 6.5V20"/>',
  historie: '<rect class="f pink" x="3.5" y="12" width="4.5" height="8" rx="1"/><rect class="f gelb" x="9.75" y="5" width="4.5" height="15" rx="1"/><rect class="f mint" x="16" y="9" width="4.5" height="11" rx="1"/><path class="s" d="M2 21.5h20"/>',
  kamera: '<path class="f blau" d="M3 8.5a2 2 0 0 1 2-2h2.5L9 4.5h6l1.5 2H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle class="f weiss" cx="12" cy="13" r="3.8"/>',
  galerie: '<rect class="f blau" x="3" y="4" width="18" height="16" rx="2"/><circle class="f gelb" cx="8.5" cy="9.5" r="2"/><path class="f mint" d="M3.5 18l5.5-5.5 4 4 2.5-2.5 5 5V19a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1z"/>',
  ziel: `${kreis('pink')}${kreis('weiss', 6)}${kreis('pink', 2.6)}`,
  auswahl: '<rect class="f weiss" x="3" y="2.5" width="18" height="5.5" rx="2"/><rect class="f mint" x="3" y="9.25" width="18" height="5.5" rx="2"/><rect class="f weiss" x="3" y="16" width="18" height="5.5" rx="2"/>',
  handy: '<rect class="f lila" x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path class="s" d="M10.5 18.5h3"/>',

  // Ergebnisse und Hinweise
  richtig: `${kreis('mint')}<path class="s dick" d="M7.5 12.5l3 3 6-6.5"/>`,
  fast: `${kreis('gelb')}<path class="s dick" d="M7 13c1.7-2.2 3.3-2.2 5 0s3.3 2.2 5 0"/>`,
  falsch: `${kreis('pink')}<path class="s dick" d="M9 9l6 6M15 9l-6 6"/>`,
  warnung: '<path class="f gelb" d="M12 3.5l9.5 16.5h-19z"/><path class="s dick" d="M12 10v4M12 17.3v.1"/>',
  blitz: '<path class="f pink" d="M13.5 2L4 14h7l-1.5 8L19 10h-7z"/>',
  funkel: '<path class="f gelb" d="M12 2Q13.5 10.5 22 12Q13.5 13.5 12 22Q10.5 13.5 2 12Q10.5 10.5 12 2z"/>',
  pfote: '<ellipse class="f pink" cx="12" cy="16" rx="4.8" ry="4"/><circle class="f pink" cx="5.5" cy="10.5" r="2.1"/><circle class="f pink" cx="9.5" cy="6.2" r="2.1"/><circle class="f pink" cx="14.5" cy="6.2" r="2.1"/><circle class="f pink" cx="18.5" cy="10.5" r="2.1"/>',

  // Design-Thema
  mond: '<path class="f gelb" d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/>',
  sonne: '<circle class="f gelb" cx="12" cy="12" r="4.5"/><path class="s" d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
};

export function icon(name) {
  const inhalt = ICONS[name] || ICONS.funkel;
  return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inhalt}</svg>`;
}
