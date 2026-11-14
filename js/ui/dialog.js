// dialog.js – eigenes, freundliches Bestätigungs-Popup statt confirm()
import { esc } from '../utils.js';

/**
 * Zeigt ein Popup und wartet auf die Antwort.
 * Gibt true zurück, wenn bestätigt wurde, sonst false.
 *
 * Beispiel:
 *   if (await confirmDialog({ title: 'Löschen?', text: '…' })) { … }
 */
export function confirmDialog({
  title = 'Bist du sicher?',
  text = '',
  okLabel = 'Ja, löschen',
  cancelLabel = 'Abbrechen',
  icon = '🐾',
} = {}) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'popup';
    dialog.innerHTML = `
      <div class="popup-icon">${icon}</div>
      <h2>${esc(title)}</h2>
      ${text ? `<p>${esc(text)}</p>` : ''}
      <div class="popup-buttons">
        <button class="btn btn-secondary" value="cancel">${esc(cancelLabel)}</button>
        <button class="btn btn-danger-strong" value="ok">${esc(okLabel)}</button>
      </div>
    `;
    document.body.append(dialog);

    function close(result) {
      dialog.close();
      dialog.remove();
      resolve(result);
    }

    dialog.querySelector('[value=ok]').addEventListener('click', () => close(true));
    dialog.querySelector('[value=cancel]').addEventListener('click', () => close(false));
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(false); }); // Esc-Taste
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(false); }); // Klick daneben

    dialog.showModal();
    dialog.querySelector('[value=cancel]').focus(); // sicherer: Abbrechen ist vorausgewählt
  });
}