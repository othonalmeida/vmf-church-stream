import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface DownloadRecord {
  userId: string;
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  deviceId: string;
  playlistUrl: string;
  cachedUrls: string[];
  totalBytes: number;
  downloadedAt: string;
}

interface VmfOfflineDB extends DBSchema {
  downloads: {
    key: [string, string];
    value: DownloadRecord;
    indexes: { byUser: string };
  };
}

let dbPromise: Promise<IDBPDatabase<VmfOfflineDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<VmfOfflineDB>("vmf-offline", 2, {
      upgrade(db) {
        // A v1 guardava os registros so por videoId, sem vinculo a usuario -
        // num aparelho compartilhado por mais de uma conta, isso vazava a
        // biblioteca de downloads de um usuario para o outro. Reconstroi do
        // zero na v2 com chave composta [userId, videoId]; e so cache local
        // (os arquivos ja baixados continuam no Cache Storage e podem ser
        // re-catalogados baixando de novo, sem perda de dados no servidor).
        if (db.objectStoreNames.contains("downloads")) {
          db.deleteObjectStore("downloads");
        }
        const store = db.createObjectStore("downloads", { keyPath: ["userId", "videoId"] });
        store.createIndex("byUser", "userId");
      },
    });
  }
  return dbPromise;
}

export async function putDownloadRecord(record: DownloadRecord) {
  const db = await getDb();
  await db.put("downloads", record);
}

export async function getDownloadRecord(userId: string, videoId: string) {
  const db = await getDb();
  return db.get("downloads", [userId, videoId]);
}

export async function listDownloadRecords(userId: string) {
  const db = await getDb();
  return db.getAllFromIndex("downloads", "byUser", userId);
}

/** Todos os registros no aparelho, de qualquer usuario - usado so para decidir se um segmento em cache ainda e' referenciado por outra conta antes de apaga-lo. */
export async function listAllDownloadRecords() {
  const db = await getDb();
  return db.getAll("downloads");
}

export async function deleteDownloadRecord(userId: string, videoId: string) {
  const db = await getDb();
  await db.delete("downloads", [userId, videoId]);
}

export type { DownloadRecord };
