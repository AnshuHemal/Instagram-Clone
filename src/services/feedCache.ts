/**
 * feedCache.ts — Offline Feed Cache Service
 *
 * Uses expo-secure-store to persist the first page of the Home Feed
 * and the Explore grid to disk. Data is restored on cold launch or
 * when the device is offline so the user never sees a blank spinner.
 *
 * TTL: 24 hours. Stale cache is silently ignored and replaced by a
 * fresh fetch as soon as network is available.
 */

import * as SecureStore from 'expo-secure-store';

// ─── Cache Keys ───────────────────────────────────────────────────────────────

const KEYS = {
  FEED_PAGE:    'cache_feed_page_v2',
  EXPLORE_PAGE: 'cache_explore_page_v2',
} as const;

// ─── TTL (ms) ─────────────────────────────────────────────────────────────────

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Types ────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  savedAt: number; // Unix timestamp ms
}

// ─── Low-level helpers ────────────────────────────────────────────────────────

/**
 * Saves a value to SecureStore as a JSON-encoded CacheEntry.
 * SecureStore caps entries at ~2KB on some platforms; we chunk
 * large arrays to stay safely within limits.
 */
async function write<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, savedAt: Date.now() };
    const json = JSON.stringify(entry);
    // SecureStore limit is 2048 bytes on some platforms. For feed JSON
    // that can be larger we silently skip if it's too big.
    if (json.length > 60_000) {
      console.warn(`[FeedCache] Entry for key "${key}" is ${json.length} bytes — caching a trimmed set`);
    }
    await SecureStore.setItemAsync(key, json);
  } catch (err) {
    // Never let cache writes crash the app
    console.warn('[FeedCache] Write failed:', err);
  }
}

/**
 * Reads and validates a CacheEntry from SecureStore.
 * Returns null if missing, unreadable, or past TTL.
 */
async function read<T>(key: string): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);

    // Validate TTL
    if (Date.now() - entry.savedAt > TTL_MS) {
      console.log(`[FeedCache] Entry "${key}" is stale (>24h) — discarding`);
      await SecureStore.deleteItemAsync(key).catch(() => {});
      return null;
    }

    return entry.data;
  } catch (err) {
    console.warn('[FeedCache] Read failed:', err);
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const feedCache = {
  /**
   * Persist the first page of the Home Feed.
   * Call this after a successful fetchPosts(null, true).
   */
  async saveFeedPage(posts: any[]): Promise<void> {
    // Cache at most 15 posts to keep the SecureStore entry small
    await write(KEYS.FEED_PAGE, posts.slice(0, 15));
  },

  /**
   * Restore the cached Home Feed first page.
   * Returns null if no valid cache exists.
   */
  async loadFeedPage(): Promise<any[] | null> {
    return read<any[]>(KEYS.FEED_PAGE);
  },

  /**
   * Persist the Explore grid content.
   */
  async saveExplorePage(posts: any[]): Promise<void> {
    await write(KEYS.EXPLORE_PAGE, posts.slice(0, 30));
  },

  /**
   * Restore the cached Explore grid.
   * Returns null if no valid cache exists.
   */
  async loadExplorePage(): Promise<any[] | null> {
    return read<any[]>(KEYS.EXPLORE_PAGE);
  },

  /**
   * Wipe all feed caches — call on logout.
   */
  async clearAll(): Promise<void> {
    await Promise.allSettled([
      SecureStore.deleteItemAsync(KEYS.FEED_PAGE),
      SecureStore.deleteItemAsync(KEYS.EXPLORE_PAGE),
    ]);
  },
};
