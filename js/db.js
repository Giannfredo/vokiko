// db.js – Speichern und Laden mit IndexedDB (der Datenbank im Browser)

const DB_NAME = 'vokiko';
const DB_VERSION = 2; // 1 = Bücher/Lektionen/Vokabeln, 2 = + Übungen und Antworten
const STORES = ['books', 'units', 'vocab', 'sessions', 'answers'];
let dbPromise = null;

// Öffnet die Datenbank. Bei einer neuen Version werden nur die fehlenden "Tabellen" angelegt,
// bestehende Daten bleiben erhalten.
function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (event.oldVersion < 1) {
          db.createObjectStore('books', { keyPath: 'id' });
          db.createObjectStore('units', { keyPath: 'id' }).createIndex('bookId', 'bookId');
          db.createObjectStore('vocab', { keyPath: 'id' }).createIndex('unitId', 'unitId');
        }
        if (event.oldVersion < 2) {
          db.createObjectStore('sessions', { keyPath: 'id' }).createIndex('unitId', 'unitId');
          db.createObjectStore('answers', { keyPath: 'id' }).createIndex('sessionId', 'sessionId');
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        // Wenn ein anderer Tab eine neuere Version öffnen will: Platz machen.
        db.onversionchange = () => { db.close(); location.reload(); };
        resolve(db);
      };
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

// Führt eine Aktion auf einer Tabelle aus und wartet, bis sie fertig ist.
async function run(storeName, mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = action(tx.objectStore(storeName));
    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onerror = () => reject(tx.error);
  });
}

const getAll = (store) => run(store, 'readonly', (s) => s.getAll());
const getOne = (store, id) => run(store, 'readonly', (s) => s.get(id));
const getBy = (store, index, value) => run(store, 'readonly', (s) => s.index(index).getAll(value));
const save = (store, obj) => run(store, 'readwrite', (s) => s.put(obj)).then(() => obj);
const removeOne = (store, id) => run(store, 'readwrite', (s) => s.delete(id));
// Viele Einträge in einem Rutsch speichern
const saveMany = (store, list) => run(store, 'readwrite', (s) => { list.forEach((o) => s.put(o)); });

// Eindeutige Kennung, z. B. "lq3k9x2ab7"
export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- Bücher ----------
export const books = {
  all: () => getAll('books'),
  get: (id) => getOne('books', id),
  save: (book) => save('books', book),
  async remove(id) {
    for (const unit of await units.ofBook(id)) await units.remove(unit.id);
    await removeOne('books', id);
  },
};

// ---------- Lektionen ----------
export const units = {
  all: () => getAll('units'),
  get: (id) => getOne('units', id),
  async ofBook(bookId) {
    const list = await getBy('units', 'bookId', bookId);
    return list.sort((a, b) => a.reihenfolge - b.reihenfolge);
  },
  save: (unit) => save('units', unit),
  async remove(id) {
    for (const v of await vocab.ofUnit(id)) await removeOne('vocab', v.id);
    for (const s of await sessions.ofUnit(id)) await sessions.remove(s.id);
    await removeOne('units', id);
  },
};

// ---------- Vokabeln ----------
export const vocab = {
  all: () => getAll('vocab'),
  get: (id) => getOne('vocab', id),
  async ofUnit(unitId) {
    const list = await getBy('vocab', 'unitId', unitId);
    return list.sort((a, b) => a.erstelltAm - b.erstelltAm);
  },
  save: (v) => save('vocab', v),
  remove: (id) => removeOne('vocab', id),
};

// ---------- Übungen (Historie) ----------
// { id, unitId, unitIds, modus, gestartetAm, dauerSek, anzahl, fehler, fast }
export const sessions = {
  async all() {
    return (await getAll('sessions')).sort((a, b) => b.gestartetAm - a.gestartetAm); // neueste zuerst
  },
  async ofUnit(unitId) {
    return (await getBy('sessions', 'unitId', unitId)).sort((a, b) => b.gestartetAm - a.gestartetAm);
  },
  save: (s) => save('sessions', s),
  async remove(id) {
    for (const a of await answers.ofSession(id)) await removeOne('answers', a.id);
    await removeOne('sessions', id);
  },
};

// ---------- Antworten einer Übung ----------
// { id, sessionId, vocabId, gezeigt, eingegeben, ergebnis: 'richtig'|'fast'|'falsch' }
export const answers = {
  ofSession: (sessionId) => getBy('answers', 'sessionId', sessionId),
  save: (a) => save('answers', a),
  saveMany: (list) => saveMany('answers', list),
};

// ---------- Sicherung: Export und Import ----------

// Alle Daten als ein Objekt (wird als .json-Datei gespeichert)
export async function exportAll() {
  const data = { app: 'vokiko', version: DB_VERSION, exportiertAm: Date.now() };
  for (const store of STORES) data[store] = await getAll(store);
  return data;
}

// Prüft eine eingelesene Datei. Gibt eine Fehlermeldung zurück oder null, wenn alles passt.
export function checkImport(data) {
  if (!data || data.app !== 'vokiko') return 'Das ist keine Vokiko-Sicherung.';
  if (!Array.isArray(data.books) || !Array.isArray(data.vocab)) return 'Die Datei ist unvollständig.';
  return null;
}

// Übernimmt die Daten. Einträge mit gleicher id werden überschrieben, alles andere bleibt.
export async function importAll(data) {
  for (const store of STORES) {
    if (Array.isArray(data[store]) && data[store].length) await saveMany(store, data[store]);
  }
}
