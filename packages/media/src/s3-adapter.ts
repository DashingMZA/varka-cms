/**
 * S3 / R2 compatible adapter.
 * Uses fetch + AWS SigV4-style is NOT implemented here as a toy —
 * production installs should use @aws-sdk/client-s3.
 *
 * This module exposes a factory that requires an injected `client`
 * so the monorepo does not hard-depend on AWS SDK until media phase install.
 */
import type { PutObjectInput, PutObjectResult, StorageAdapter, StorageDriverName } from './types';

export type S3LikeClient = {
  putObject(args: {
    Bucket: string;
    Key: string;
    Body: Buffer | Uint8Array;
    ContentType: string;
  }): Promise<void>;
  deleteObject(args: { Bucket: string; Key: string }): Promise<void>;
};

export type S3AdapterOptions = {
  name: Extract<StorageDriverName, 's3' | 'r2'>;
  bucket: string;
  publicBaseUrl: string;
  client: S3LikeClient;
};

export function createS3Adapter(opts: S3AdapterOptions): StorageAdapter {
  const base = opts.publicBaseUrl.replace(/\/$/, '');
  return {
    name: opts.name,
    async put(input: PutObjectInput): Promise<PutObjectResult> {
      const key = input.key.replace(/^\/+/, '');
      const buf = Buffer.isBuffer(input.body) ? input.body : Buffer.from(input.body);
      await opts.client.putObject({
        Bucket: opts.bucket,
        Key: key,
        Body: buf,
        ContentType: input.contentType,
      });
      return { key, sizeBytes: buf.length };
    },
    async delete(key: string): Promise<void> {
      await opts.client.deleteObject({
        Bucket: opts.bucket,
        Key: key.replace(/^\/+/, ''),
      });
    },
    getUrl(key: string): string {
      return `${base}/${key.replace(/^\/+/, '')}`;
    },
  };
}
