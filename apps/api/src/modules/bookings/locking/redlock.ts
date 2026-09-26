import { redis } from "../../../lib/redis";
import { logger } from "../../../lib/logger";

export interface LockHandle {
  key: string;
  token: string;
  released: boolean;
  release: () => Promise<boolean>;
}

const DEFAULT_LOCK_TTL_MS = 30000; // 30 seconds

/**
 * Acquire distributed lock on trip to prevent duplicate concurrent saga executions
 */
export async function acquireTripLock(
  tripId: string,
  ttlMs: number = DEFAULT_LOCK_TTL_MS
): Promise<LockHandle | null> {
  const lockKey = `lock:trip:${tripId}`;
  const lockToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

  try {
    // Attempt to set key only if not exists
    const existing = await redis.get(lockKey);
    if (existing) {
      logger.warn({ tripId }, "[Redlock] Trip lock already held by another process");
      return null;
    }

    await redis.set(lockKey, lockToken, "EX", Math.ceil(ttlMs / 1000));

    const handle: LockHandle = {
      key: lockKey,
      token: lockToken,
      released: false,
      release: async () => {
        if (handle.released) return true;
        try {
          const current = await redis.get(lockKey);
          if (current === lockToken) {
            await redis.del(lockKey);
          }
          handle.released = true;
          return true;
        } catch (err) {
          logger.error({ err, tripId }, "[Redlock] Error releasing lock");
          return false;
        }
      },
    };

    return handle;
  } catch (err) {
    logger.error({ err, tripId }, "[Redlock] Exception during acquireTripLock");
    return null;
  }
}
