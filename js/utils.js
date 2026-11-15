// utils.js – kleine Helfer, die überall gebraucht werden

// Macht Text "ungefährlich" für HTML, damit z. B. "<b>" als Text erscheint.
export function esc(text = '') {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

export const SPRACHEN = {
  en: { name: 'Englisch', flagge: '🇬🇧', stimme: 'en-GB', outfit: 'schal', akzente: [] },
  fr: { name: 'Französisch', flagge: '🇫🇷', stimme: 'fr-FR', outfit: 'muetze',
        akzente: ['é', 'è', 'ê', 'à', 'â', 'ç', 'î', 'ï', 'ô', 'û', 'ù', 'ë', 'œ'] },
};