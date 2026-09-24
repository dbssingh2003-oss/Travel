import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const realRedis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  lazyConnect: true,
  enableOfflineQueue: false,
});

let isConnected = false;
const inMemoryStore = new Map<string, { val: string; expiresAt?: number }>();

realRedis.on("connect", () => {
  isConnected = true;
  console.log("[Redis] Connected successfully");
});

realRedis.on("error", (err) => {
  isConnected = false;
  // Non-fatal warning in development
});

// Proxy interface to handle in-memory fallback transparently
export const redis = {
  async connect() {
    try {
      await realRedis.connect();
    } catch (err: any) {
      isConnected = false;
      console.warn(`[Redis] Server not reachable at ${REDIS_URL}. Using in-memory fallback.`);
    }
  },

  async quit() {
    if (isConnected) {
      await realRedis.quit();
    }
  },

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string> {
    if (isConnected) {
      return realRedis.set(key, value as any, mode as any, duration as any) as any;
    }
    const expiresAt = mode === "EX" && duration ? Date.now() + duration * 1000 : undefined;
    inMemoryStore.set(key, { val: value, expiresAt });
    return "OK";
  },

  async setex(key: string, seconds: number, value: string): Promise<string> {
    if (isConnected) {
      return realRedis.setex(key, seconds, value);
    }
    inMemoryStore.set(key, { val: value, expiresAt: Date.now() + seconds * 1000 });
    return "OK";
  },

  async get(key: string): Promise<string | null> {
    if (isConnected) {
      return realRedis.get(key);
    }
    const entry = inMemoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      inMemoryStore.delete(key);
      return null;
    }
    return entry.val;
  },

  async del(...keys: string[]): Promise<number> {
    if (isConnected) {
      return realRedis.del(...keys);
    }
    let count = 0;
    for (const key of keys) {
      if (inMemoryStore.delete(key)) count++;
    }
    return count;
  },

  on(event: string, listener: (...args: any[]) => void) {
    realRedis.on(event as any, listener);
    return this;
  },
};

export default redis;
