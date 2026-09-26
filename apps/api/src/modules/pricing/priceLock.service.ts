import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";
import { emitTripEvent } from "../../ws/gateway";
import { logger } from "../../lib/logger";

const DEFAULT_LOCK_DURATION_SECONDS = 15 * 60; // 15 minutes quote hold

export interface PriceLockResult {
  id: string;
  tripId: string;
  tripPlanId: string;
  lockedCost: number;
  expiresAt: Date;
  secondsRemaining: number;
}

export async function createPriceLock(
  tripId: string,
  tripPlanId: string,
  durationSeconds: number = DEFAULT_LOCK_DURATION_SECONDS
): Promise<PriceLockResult> {
  const plan = await prisma.tripPlan.findUnique({
    where: { id: tripPlanId },
  });

  if (!plan || plan.tripId !== tripId) {
    throw new Error("Trip plan not found or does not belong to this trip");
  }

  const expiresAt = new Date(Date.now() + durationSeconds * 1000);

  // Store in Database
  const lock = await prisma.priceLock.create({
    data: {
      tripId,
      tripPlanId,
      lockedCost: plan.estimatedCost,
      expiresAt,
    },
  });

  // Store in Redis with TTL for high performance lookups
  const redisKey = `price-lock:trip:${tripId}`;
  await redis.setex(
    redisKey,
    durationSeconds,
    JSON.stringify({
      id: lock.id,
      tripPlanId,
      lockedCost: plan.estimatedCost,
      expiresAt: expiresAt.toISOString(),
    })
  );

  logger.info(
    { tripId, tripPlanId, lockedCost: plan.estimatedCost, durationSeconds },
    "[PriceLock] Locked price quote"
  );

  return {
    id: lock.id,
    tripId,
    tripPlanId,
    lockedCost: plan.estimatedCost,
    expiresAt,
    secondsRemaining: durationSeconds,
  };
}

export async function getActivePriceLock(tripId: string): Promise<PriceLockResult | null> {
  const redisKey = `price-lock:trip:${tripId}`;
  const cached = await redis.get(redisKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const expiresAt = new Date(parsed.expiresAt);
      const secondsRemaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      if (secondsRemaining > 0) {
        return {
          id: parsed.id,
          tripId,
          tripPlanId: parsed.tripPlanId,
          lockedCost: parsed.lockedCost,
          expiresAt,
          secondsRemaining,
        };
      }
    } catch (err) {
      logger.warn({ err }, "[PriceLock] Failed to parse cached price lock");
    }
  }

  // Fallback to database
  const lock = await prisma.priceLock.findFirst({
    where: {
      tripId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!lock) return null;

  const secondsRemaining = Math.max(0, Math.floor((lock.expiresAt.getTime() - Date.now()) / 1000));

  return {
    id: lock.id,
    tripId: lock.tripId,
    tripPlanId: lock.tripPlanId,
    lockedCost: lock.lockedCost,
    expiresAt: lock.expiresAt,
    secondsRemaining,
  };
}

export async function releasePriceLock(tripId: string): Promise<void> {
  await redis.del(`price-lock:trip:${tripId}`);
  await prisma.priceLock.deleteMany({
    where: { tripId },
  });
}

export function notifyPriceLockExpiring(tripId: string, secondsRemaining: number) {
  emitTripEvent(tripId, {
    type: `trip:${tripId}:price-lock:expiring`,
    tripId,
    secondsRemaining,
    timestamp: new Date().toISOString(),
  });
}
