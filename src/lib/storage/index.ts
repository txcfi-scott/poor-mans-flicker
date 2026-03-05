import type { StorageProvider } from './types';

let _provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (_provider) return _provider;

  if (process.env.STORAGE_PROVIDER === 'local' || process.env.NODE_ENV === 'development') {
    const { LocalStorageProvider } = require('./local');
    _provider = new LocalStorageProvider();
  } else {
    const { R2StorageProvider } = require('./r2');
    _provider = new R2StorageProvider();
  }

  return _provider!;
}

export type { StorageProvider } from './types';
