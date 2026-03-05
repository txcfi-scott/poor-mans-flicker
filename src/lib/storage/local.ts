import fs from 'fs/promises';
import path from 'path';
import type { StorageProvider } from './types';

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private publicPrefix: string;

  constructor() {
    this.basePath = path.join(process.cwd(), 'public', 'uploads');
    this.publicPrefix = '/uploads';
  }

  async upload(key: string, data: Buffer, _contentType: string): Promise<string> {
    const filePath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
    return this.getUrl(key);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    await fs.unlink(filePath).catch(() => {});
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.allSettled(keys.map(key => this.delete(key)));
  }

  getUrl(key: string): string {
    return `${this.publicPrefix}/${key}`;
  }

  async list(prefix: string): Promise<string[]> {
    const dirPath = path.join(this.basePath, prefix);
    try {
      const entries = await fs.readdir(dirPath, { recursive: true });
      return entries
        .filter(entry => typeof entry === 'string')
        .map(entry => `${prefix}${entry}`);
    } catch {
      return [];
    }
  }
}
