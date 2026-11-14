// db.js – Speichern und Laden mit IndexedDB (der Datenbank im Browser)

const DB_NAME = 'vokiko';
const DB_VERSION = 1;
let dbPromise = null;

// Öffnet die Datenbank. Beim allerersten Mal werden die "Tabellen" angelegt.
function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore('books', { keyPath: 'id' });
        db.createObjectStore('units', { keyPath: 'id' }).createIndex('bookId', 'bookId');
        db.createObjectStore('vocab', { keyPath: 'id' }).createIndex('unitId', 'unitId');
      };
      request.onsuccess = () => resolve(request.result);
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
  get: (id) => getOne('units', id),
  async ofBook(bookId) {
    const list = await getBy('units', 'bookId', bookId);
    return list.sort((a, b) => a.reihenfolge - b.reihenfolge);
  },
  save: (unit) => save('units', unit),
  async remove(id) {
    for (const v of await vocab.ofUnit(id)) await removeOne('vocab', v.id);
    await removeOne('units', id);
  },
};

// ---------- Vokabeln ----------
export const vocab = {
  get: (id) => getOne('vocab', id),
  async ofUnit(unitId) {
    const list = await getBy('vocab', 'unitId', unitId);
    return list.sort((a, b) => a.erstelltAm - b.erstelltAm);
  },
  save: (v) => save('vocab', v),
  remove: (id) => removeOne('vocab', id),
};