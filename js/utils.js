// utils.js – kleine Helfer, die überall gebraucht werden

// Macht Text "ungefährlich" für HTML, damit z. B. "<b>" als Text erscheint.
export function esc(text = '') {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

// chip: kleines Sprach-Schild (statt Flaggen-Emoji, das unter Windows nur als Buchstaben erscheint)
export const DEUTSCH_CHIP = '<span class="sprach-chip de">DE</span>';

export const SPRACHEN = {
  en: { name: 'Englisch', chip: '<span class="sprach-chip en">EN</span>', stimme: 'en-GB', outfit: 'schal', akzente: [] },
  fr: { name: 'Französisch', chip: '<span class="sprach-chip fr">FR</span>', stimme: 'fr-FR', outfit: 'muetze',
        akzente: ['é', 'è', 'ê', 'à', 'â', 'ç', 'î', 'ï', 'ô', 'û', 'ù', 'ë', 'œ'] },
};