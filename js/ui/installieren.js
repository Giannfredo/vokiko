// installieren.js – Hinweis „Vokiko als App installieren“ auf der Startseite
//
// - Chrome/Edge/Android: Der Browser meldet mit „beforeinstallprompt“, dass er installieren kann.
//   Wir heben das Ereignis auf und zeigen einen eigenen Knopf.
// - iPhone/iPad: Safari hat keinen solchen Knopf → kurze Anleitung „Teilen → Zum Home-Bildschirm“.
// - Läuft Vokiko schon als installierte App, wird nichts angezeigt.

import { icon } from './icons.js';

let installAnfrage = null; // aufgehobenes beforeinstallprompt-Ereignis

export function istInstalliert() {
  return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

function istIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad meldet sich als Mac
}

// Einmal beim App-Start aufrufen (das Ereignis kann früh kommen, noch bevor die Startseite steht)
export function initInstallieren() {
  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // nicht die Browser-Leiste zeigen, wir haben einen eigenen Knopf
    installAnfrage = event;
    zeichnen();
  });
  addEventListener('appinstalled', () => { installAnfrage = null; zeichnen(); });
}

// Platzhalter für die Startseite; zeichnen() füllt ihn
export function installHinweis() {
  return istInstalliert() ? '' : '<div id="install-hinweis"></div>';
}

const DATEN_TIPP = `<p><small>Tipp: Die App hat ihren eigenen Speicher. Bücher, die du schon im Browser angelegt
  hast, nimmst du über Historie → Exportieren und in der App → Importieren mit.</small></p>`;

export function zeichnen() {
  const ziel = document.getElementById('install-hinweis');
  if (!ziel) return;
  if (istInstalliert()) { ziel.innerHTML = ''; return; }

  if (installAnfrage) {
    ziel.innerHTML = `
      <div class="install">
        <button class="btn" type="button" id="install-btn">${icon('handy')} Vokiko als App installieren</button>
        ${DATEN_TIPP}
      </div>`;
    ziel.querySelector('#install-btn').addEventListener('click', async () => {
      installAnfrage.prompt();
      await installAnfrage.userChoice; // Ja oder Nein – das Ereignis ist danach verbraucht
      installAnfrage = null;
      zeichnen();
    });
  } else if (istIOS()) {
    ziel.innerHTML = `
      <details class="install">
        <summary>${icon('handy')} Vokiko als App auf den Home-Bildschirm</summary>
        <ol>
          <li>Diese Seite in <strong>Safari</strong> öffnen.</li>
          <li>Unten auf <strong>Teilen</strong> tippen (Quadrat mit Pfeil nach oben).</li>
          <li><strong>„Zum Home-Bildschirm“</strong> wählen und auf <strong>Hinzufügen</strong> tippen.</li>
        </ol>
        ${DATEN_TIPP}
      </details>`;
  } else {
    ziel.innerHTML = `
      <details class="install">
        <summary>${icon('handy')} Vokiko als App installieren</summary>
        <p>Im Menü deines Browsers <strong>„App installieren“</strong> oder
           <strong>„Zum Startbildschirm hinzufügen“</strong> wählen.</p>
        ${DATEN_TIPP}
      </details>`;
  }
}
