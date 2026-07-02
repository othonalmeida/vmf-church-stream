import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveScratchPath, ensureScratchDir, removeScratchPath } from "./scratch.js";
import type { StorageService } from "./storage.service.js";

/**
 * Local disk driver: the scratch directory (apps/api/uploads/) *is* the final
 * public storage, served by the @fastify/static plugin under /media. Publishing
 * a file that's already in the scratch dir at the right relative path is a no-op.
 */
export const localDiskStorage: StorageService = {
  async putFile(relativePath, localFilePath) {
    const destPath = resolveScratchPath(relativePath);
    if (path.resolve(localFilePath) !== path.resolve(destPath)) {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(localFilePath, destPath);
    }
    return this.getPublicUrl(relativePath);
  },

  async putDirectory(relativePrefix, localDirPath) {
    const destDir = resolveScratchPath(relativePrefix);
    if (path.resolve(localDirPath) !== path.resolve(destDir)) {
      await ensureScratchDir(relativePrefix);
      const entries = await fs.readdir(localDirPath);
      await Promise.all(
        entries.map((entry) => fs.copyFile(path.join(localDirPath, entry), path.join(destDir, entry)))
      );
    }
  },

  getPublicUrl(relativePath) {
    return `/media/${relativePath.split(path.sep).join("/")}`;
  },

  async deletePrefix(relativePrefix) {
    await removeScratchPath(relativePrefix);
  },
};
