import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface DownloadRecord {
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
    key: string;
    value: DownloadRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<VmfOfflineDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<VmfOfflineDB>("vmf-offline", 1, {
      upgrade(db) {
        db.createObjectStore("downloads", { keyPath: "videoId" });
      },
    });
  }
  return dbPromise;
}

export async function putDownloadRecord(record: DownloadRecord) {
  const db = await getDb();
  await db.put("downloads", record);
}

export async function getDownloadRecord(videoId: string) {
  const db = await getDb();
  return db.get("downloads", videoId);
}

export async function listDownloadRecords() {
  const db = await getDb();
  return db.getAll("downloads");
}

export async function deleteDownloadRecord(videoId: string) {
  const db = await getDb();
  await db.delete("downloads", videoId);
}

export type { DownloadRecord };
