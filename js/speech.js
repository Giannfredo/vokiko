// speech.js – Wörter vorlesen mit der Web Speech API des Browsers

export function canSpeak() {
  return 'speechSynthesis' in window;
}

/**
 * Liest einen Text vor.
 * lang: Sprachcode wie 'en-GB' oder 'fr-FR' (siehe SPRACHEN in utils.js)
 */
export function speak(text, lang) {
  if (!canSpeak()) return;
  speechSynthesis.cancel(); // falls noch etwas vorgelesen wird
  const u = new SpeechSynthesisUtterance(String(text).replaceAll(';', ','));
  u.lang = lang;
  u.rate = 0.9; // etwas langsamer, damit man gut zuhören kann
  const stimme = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-') === lang)
    || speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)));
  if (stimme) u.voice = stimme;
  speechSynthesis.speak(u);
}

// Lädt die Stimmenliste schon vorab (manche Browser liefern sie erst verzögert).
if (canSpeak()) speechSynthesis.getVoices();
