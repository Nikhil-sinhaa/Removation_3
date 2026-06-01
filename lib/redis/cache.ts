import { getRedisClient } from './client';

const DEFAULT_TTL = 300; // 5 minutes

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient();
      const data = await client.get(`cache:${key}`);
      return data ? (JSON.parse(data) as T) : null;
    } catch (err) {
      console.error('[Cache] get error:', err);
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = DEFAULT_TTL): Promise<void> {
    try {
      const client = getRedisClient();
      await client.setex(`cache:${key}`, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.error('[Cache] set error:', err);
    }
  },

  async del(key: string): Promise<void> {
    try {
      const client = getRedisClient();
      await client.del(`cache:${key}`);
    } catch (err) {
      console.error('[Cache] del error:', err);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const client = getRedisClient();
      const keys = await client.keys(`cache:${pattern}*`);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (err) {
      console.error('[Cache] invalidatePattern error:', err);
    }
  },

  // ---- Typed helpers for high-traffic paths ----

  async getAdminConfig<T>(key: string): Promise<T | null> {
    return this.get<T>(`adminconfig:${key}`);
  },

  async setAdminConfig(key: string, value: unknown): Promise<void> {
    // Match the existing 60s in-memory TTL so behaviour is identical
    return this.set(`adminconfig:${key}`, value, 60);
  },

  async delAdminConfig(key: string): Promise<void> {
    return this.del(`adminconfig:${key}`);
  },

  async getPublicStats<T>(): Promise<T | null> {
    return this.get<T>('stats:public');
  },

  async setPublicStats(data: unknown): Promise<void> {
    return this.set('stats:public', data, 3600); // 1 hour
  },

  async getUserSession<T>(userId: string): Promise<T | null> {
    return this.get<T>(`session:${userId}`);
  },

  async setUserSession(userId: string, data: unknown): Promise<void> {
    return this.set(`session:${userId}`, data, 900); // 15 min
  },

  async invalidateUserSession(userId: string): Promise<void> {
    return this.del(`session:${userId}`);
  },
};
