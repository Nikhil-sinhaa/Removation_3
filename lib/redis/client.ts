import Redis, { RedisOptions } from 'ioredis';

function buildRedisOptions(): RedisOptions {
  const base: RedisOptions = {
    connectTimeout: 10000,
    commandTimeout: 5000,
    keepAlive: 30000,
    disconnectTimeout: 2000,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,

    retryStrategy(times: number) {
      if (times > 10) {
        console.error('[Redis] Max reconnection attempts reached. Giving up.');
        return null;
      }
      const delay = Math.min(times * 100, 3000);
      console.warn(`[Redis] Reconnecting... attempt ${times}, delay ${delay}ms`);
      return delay;
    },

    reconnectOnError(err: Error) {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some(e => err.message.includes(e));
    },
  };

  // REDIS_URL takes priority (Upstash / Vercel). Individual vars are for local dev.
  if (process.env.REDIS_URL) {
    return { ...base, lazyConnect: true };
  }

  return {
    ...base,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  };
}

const redisOptions = buildRedisOptions();

declare global {
  var _redisClient: Redis | undefined;
  var _redisSubscriber: Redis | undefined;
}

function createRedisClient(): Redis {
  const client = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, redisOptions)
    : new Redis(redisOptions);

  client.on('connect', () => {
    console.log('[Redis] ✅ Connected');
  });

  client.on('error', (err: Error) => {
    console.error('[Redis] ❌ Error:', err.message);
  });

  client.on('close', () => {
    console.warn('[Redis] Connection closed');
  });

  client.on('reconnecting', () => {
    console.warn('[Redis] Reconnecting...');
  });

  return client;
}

export function getRedisClient(): Redis {
  if (!global._redisClient) {
    global._redisClient = createRedisClient();
  }
  return global._redisClient;
}

// Separate subscriber client — pub/sub requires a dedicated connection
export function getRedisSubscriber(): Redis {
  if (!global._redisSubscriber) {
    global._redisSubscriber = createRedisClient();
  }
  return global._redisSubscriber;
}

export async function closeRedisConnections(): Promise<void> {
  if (global._redisClient) {
    await global._redisClient.quit();
    global._redisClient = undefined;
  }
  if (global._redisSubscriber) {
    await global._redisSubscriber.quit();
    global._redisSubscriber = undefined;
  }
}

export default getRedisClient;
