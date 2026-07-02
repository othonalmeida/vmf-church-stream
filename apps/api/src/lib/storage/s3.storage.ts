import { promises as fs } from "node:fs";
import path from "node:path";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { env } from "../../env.js";
import { guessContentType } from "./content-type.js";
import type { StorageService } from "./storage.service.js";

const client = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials:
    env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
      ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
      : undefined,
});

function toKey(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}

export const s3Storage: StorageService = {
  async putFile(relativePath, localFilePath) {
    const body = await fs.readFile(localFilePath);
    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: toKey(relativePath),
        Body: body,
        ContentType: guessContentType(relativePath),
      })
    );
    return this.getPublicUrl(relativePath);
  },

  async putDirectory(relativePrefix, localDirPath) {
    // O pipeline de transcodificacao so gera diretorios planos (sem subpastas),
    // entao aqui listamos apenas arquivos de primeiro nivel.
    const entries = await fs.readdir(localDirPath, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile());
    await Promise.all(
      files.map((entry) => this.putFile(path.join(relativePrefix, entry.name), path.join(localDirPath, entry.name)))
    );
  },

  getPublicUrl(relativePath) {
    return `${env.S3_PUBLIC_URL_BASE}/${toKey(relativePath)}`;
  },

  async deletePrefix(relativePrefix) {
    const prefix = toKey(relativePrefix).replace(/\/?$/, "/");
    let continuationToken: string | undefined;

    do {
      const listed = await client.send(
        new ListObjectsV2Command({ Bucket: env.S3_BUCKET, Prefix: prefix, ContinuationToken: continuationToken })
      );
      const keys = (listed.Contents ?? []).map((obj) => obj.Key).filter((key): key is string => !!key);
      if (keys.length > 0) {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: env.S3_BUCKET,
            Delete: { Objects: keys.map((Key) => ({ Key })) },
          })
        );
      }
      continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
    } while (continuationToken);
  },
};
