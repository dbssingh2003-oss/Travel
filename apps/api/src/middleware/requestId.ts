import { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "crypto";

declare module "fastify" {
  interface FastifyRequest {
    id: string;
  }
}

/**
 * Attaches a unique request ID to each incoming request (or reuses x-request-id if supplied).
 * Sets the `X-Request-Id` response header for traceability.
 */
export async function requestIdMiddleware(
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const reqId = (req.headers["x-request-id"] as string) || randomUUID();
  req.id = reqId;
  reply.header("X-Request-Id", reqId);
}
