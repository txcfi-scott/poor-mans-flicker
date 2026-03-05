export interface StorageProvider {
  upload(key: string, data: Buffer, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  getUrl(key: string): string;
  list(prefix: string): Promise<string[]>;
}
