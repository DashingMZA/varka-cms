export type StorageDriverName = 'local' | 's3' | 'r2' | 'github';

export type PutObjectInput = {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
};

export type PutObjectResult = {
  key: string;
  sizeBytes: number;
};

export type StorageAdapter = {
  name: StorageDriverName;
  put(input: PutObjectInput): Promise<PutObjectResult>;
  delete(key: string): Promise<void>;
  /** Public or signed URL for serving */
  getUrl(key: string): string;
};
