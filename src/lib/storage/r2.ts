import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import type { StorageProvider } from './types';

export class R2StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY!,
        secretAccessKey: process.env.R2_SECRET_KEY!,
      },
    });
    this.bucket = process.env.R2_BUCKET!;
    this.publicUrl = process.env.R2_PUBLIC_URL!;
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      await this.client.send(new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: { Objects: batch.map(Key => ({ Key })) },
      }));
    }
  }

  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  async list(prefix: string): Promise<string[]> {
    const keys: string[] = [];
    let continuationToken: string | undefined;
    do {
      const response = await this.client.send(new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }));
      keys.push(...(response.Contents?.map(obj => obj.Key!).filter(Boolean) ?? []));
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    return keys;
  }
}
