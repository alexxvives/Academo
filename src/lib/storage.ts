import { promises as fs } from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import { getCloudflareContext, R2Bucket } from './cloudflare';

export interface StorageAdapter {
  upload(file: File, folder: string): Promise<string>;
  getUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
  getStream(key: string): Promise<ReadableStream | null>;
}

class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
  }

  async upload(file: File, folder: string): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${randomBytes(16).toString('hex')}-${file.name}`;
    const folderPath = path.join(this.uploadDir, folder);
    const filePath = path.join(folderPath, filename);

    // Ensure directory exists
    await fs.mkdir(folderPath, { recursive: true });

    // Write file
    await fs.writeFile(filePath, buffer);

    // Return relative path
    return path.join(folder, filename).replace(/\\/g, '/');
  }

  async getUrl(key: string): Promise<string> {
    // For local storage, we'll serve via API route
    return `/api/storage/serve/${encodeURIComponent(key)}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    await fs.unlink(filePath);
  }

  async getStream(key: string): Promise<ReadableStream | null> {
    // Local storage doesn't use streams in the same way
    return null;
  }
}

class R2StorageAdapter implements StorageAdapter {
  private bucket: R2Bucket | null = null;

  private getBucket(): R2Bucket {
    if (!this.bucket) {
      const ctx = getCloudflareContext();
      if (!ctx?.STORAGE) {
        throw new Error('R2 storage not available - are you running on Cloudflare?');
      }
      this.bucket = ctx.STORAGE;
    }
    return this.bucket;
  }

  async upload(file: File, folder: string): Promise<string> {
    const bucket = this.getBucket();
    const filename = `${randomBytes(16).toString('hex')}-${file.name}`;
    const key = `${folder}/${filename}`;

    const arrayBuffer = await file.arrayBuffer();
    
    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    return key;
  }

  async getUrl(key: string): Promise<string> {
    // For private content, we serve through our API
    return `/api/storage/serve/${encodeURIComponent(key)}`;
  }

  async delete(key: string): Promise<void> {
    const bucket = this.getBucket();
    await bucket.delete(key);
  }

  async getStream(key: string): Promise<ReadableStream | null> {
    const bucket = this.getBucket();
    const object = await bucket.get(key);
    return object?.body || null;
  }
}

// Singleton instances
let localAdapter: LocalStorageAdapter | null = null;
let r2Adapter: R2StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  const storageType = process.env.STORAGE_TYPE || 'local';

  switch (storageType) {
    case 'r2':
      if (!r2Adapter) r2Adapter = new R2StorageAdapter();
      return r2Adapter;
    case 'local':
    default:
      if (!localAdapter) localAdapter = new LocalStorageAdapter();
      return localAdapter;
  }
}

// Helper to check if running on Cloudflare
export function isCloudflare(): boolean {
  return getCloudflareContext() !== null;
}
