// Nur für Schritt 1 – ab Schritt 2 kommen die Daten aus der Datenbank.
export const books = [
  {
    id: 'b1', titel: 'Englisch-Buch 1', sprache: 'en', cover: '🇬🇧',
    units: [
      { id: 'u1', name: 'Unit 1: Hello!', fortschritt: 80 },
      { id: 'u2', name: 'Unit 2: My family', fortschritt: 30 },
    ],
  },
  {
    id: 'b2', titel: 'Französisch-Buch 1', sprache: 'fr', cover: '🇫🇷',
    units: [
      { id: 'u3', name: 'Unité 1: Salut !', fortschritt: 0 },
    ],
  },
];