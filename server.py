# server.py – lokaler Entwicklungs-Server für Vokiko
# Wie `python3 -m http.server 8000`, aber der Browser speichert nichts zwischen.
# So sieht man nach jeder Änderung sofort den neuen Stand (sonst mischt der Browser
# alte und neue JavaScript-Module und die App bleibt leer).
#
# Starten:  python3 server.py   →  http://localhost:8000

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class OhneCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    print('Vokiko läuft auf http://localhost:8000  (Beenden mit Ctrl+C)')
    ThreadingHTTPServer(('', 8000), OhneCache).serve_forever()
