import { prisma } from "../../../lib/prisma";
import { emitTripEvent } from "../../../ws/gateway";
import { logger } from "../../../lib/logger";

export type SagaStepStatus = "STARTED" | "SUCCEEDED" | "FAILED" | "COMPENSATED" | "SKIPPED";

export async function recordSagaEvent(
  tripId: string,
  step: string,
  status: SagaStepStatus,
  detail?: Record<string, any>
) {
  try {
    // 1. Persist to SagaEvent table
    const event = await prisma.sagaEvent.create({
      data: {
        tripId,
        step,
        status,
        detail: detail || {},
      },
    });

    // 2. Also log to AuditLog for compliance
    await prisma.auditLog.create({
      data: {
        tripId,
        actorId: "system:saga",
        action: `SAGA_${step}_${status}`,
        detail: detail || {},
      },
    });

    // 3. Emit real-time WebSocket event for Observability Panel
    emitTripEvent(tripId, {
      type: `trip:${tripId}:saga:step`,
      tripId,
      step,
      status,
      detail,
      createdAt: event.createdAt.toISOString(),
    });

    logger.info({ tripId, step, status }, `[SagaObservability] ${step} -> ${status}`);
    return event;
  } catch (err: any) {
    logger.error({ err: err.message, tripId, step }, "[SagaLog] Failed to record saga event");
  }
}

export async function getTripSagaTimeline(tripId: string) {
  return prisma.sagaEvent.findMany({
    where: { tripId },
    orderBy: { createdAt: "asc" },
  });
}
