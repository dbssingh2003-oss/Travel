import type { FastifyRequest, FastifyReply } from "fastify";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      (request as any).validated = schema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({
          error: "Validation failed",
          details: err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      return reply.status(400).send({ error: "Bad request" });
    }
  };
}
