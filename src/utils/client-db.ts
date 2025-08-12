/**
 * Minimal IndexedDB helper for storing a single session record.
 * No external dependencies to keep the bundle small.
 */

export type StoredSession = {
  id: string;
  createdAt: string; // ISO string
  lastVerifiedAt: string; // ISO string

  githubUsername: string | null;
  githubAccessToken: string | null;

  notionUsername: string | null;
  notionAccessToken: string | null;

  googleDriveUsername: string | null;
  googleDriveAccessToken: string | null;
  googleDriveAccessTokenExpiresAt: string | null; // ISO string or null
  googleDriveRefreshToken: string | null;
  googleDriveRefreshTokenExpiresAt: string | null; // ISO string or null

  gmailUsername: string | null;
  gmailAccessToken: string | null;
  gmailAccessTokenExpiresAt: string | null; // ISO string or null
  gmailRefreshToken: string | null;
  gmailRefreshTokenExpiresAt: string | null; // ISO string or null
};

const DB_NAME = "anysearch";
const DB_VERSION = 1;
const STORE = "session";
const KEY = "current";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readStoredSession(): Promise<StoredSession | null> {
  try {
    const db = await openDb();
    return await new Promise<StoredSession | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const req = store.get(KEY);
      req.onsuccess = () =>
        resolve((req.result as StoredSession | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function writeStoredSession(
  session: StoredSession,
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put(session, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearStoredSession(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
