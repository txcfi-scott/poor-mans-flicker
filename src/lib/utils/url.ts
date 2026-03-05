import { getStorageProvider } from '@/lib/storage';

export type ImageVariant = 'thumb' | 'display' | 'full';

export function getPhotoUrl(storageKey: string, variant: ImageVariant): string {
  const provider = getStorageProvider();
  return provider.getUrl(`${storageKey}/${variant}.webp`);
}

export function getPhotoUrls(storageKey: string) {
  return {
    thumb: getPhotoUrl(storageKey, 'thumb'),
    display: getPhotoUrl(storageKey, 'display'),
    full: getPhotoUrl(storageKey, 'full'),
  };
}
