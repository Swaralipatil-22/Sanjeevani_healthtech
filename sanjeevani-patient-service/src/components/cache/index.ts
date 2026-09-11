interface CacheEntry<T> {
  value: T;
  expires_at: number;
}

/**
 * Small in-process TTL cache. Permission lookups run on every authenticated
 * request, so they are cached rather than re-queried per call. A multi-replica
 * deployment would move this to Redis; the interface stays the same.
 */
class LocalCacheManager {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  public get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expires_at < Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlInSeconds = 300): void {
    this.store.set(key, {
      value,
      expires_at: Date.now() + ttlInSeconds * 1000,
    });
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public flush(): void {
    this.store.clear();
  }
}

export const localCacheManager = new LocalCacheManager();
