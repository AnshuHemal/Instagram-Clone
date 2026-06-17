import { Image } from 'expo-image';

export const preloadImages = async (urls: string[]) => {
  await Image.prefetch(urls);
};

export const clearImageCache = async () => {
  await Image.clearDiskCache();
  await Image.clearMemoryCache();
};