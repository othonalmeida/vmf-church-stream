import { env } from "../../env.js";
import { localDiskStorage } from "./local-disk.storage.js";
import { s3Storage } from "./s3.storage.js";
import type { StorageService } from "./storage.service.js";

export const storage: StorageService = env.STORAGE_DRIVER === "s3" ? s3Storage : localDiskStorage;

export const isS3Storage = env.STORAGE_DRIVER === "s3";

export type { StorageService } from "./storage.service.js";
export { resolveScratchPath, ensureScratchDir, removeScratchPath } from "./scratch.js";
