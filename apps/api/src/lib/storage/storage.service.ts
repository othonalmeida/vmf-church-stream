export interface StorageService {
  /** Uploads a single local (scratch) file to relativePath and returns its public URL. */
  putFile(relativePath: string, localFilePath: string, contentType?: string): Promise<string>;
  /** Recursively uploads every file under localDirPath, mirrored under relativePrefix. */
  putDirectory(relativePrefix: string, localDirPath: string): Promise<void>;
  /** Public URL for a relative path that has already been published. */
  getPublicUrl(relativePath: string): string;
  /** Deletes every object stored under the given relative prefix. */
  deletePrefix(relativePrefix: string): Promise<void>;
}
