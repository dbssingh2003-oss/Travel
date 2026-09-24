import type { FastifyError, FastifyRequest, FastifyReply } from "fastify";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.statusCode || 500;
  console.error(`[Error] ${request.method} ${request.url}:`, error.message);
  reply.status(statusCode).send({
    error: statusCode >= 500 ? "Internal server error" : error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
}
