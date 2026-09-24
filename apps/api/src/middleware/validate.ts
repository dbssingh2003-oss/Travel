import type { FastifyRequest, FastifyReply } from "fastify";
import { ZodSchema, ZodError } from "zod";
import { sendError } from "../lib/apiResponse";

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Zod validation middleware for Fastify.
 * Accepts either:
 * - A single ZodSchema (validates `request.body`)
 * - An object containing `{ body?, query?, params? }` schemas
 */
export function validate(schema: ZodSchema | ValidationSchemas) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if ("safeParse" in schema) {
        // Single schema => body validation
        (request as any).validated = schema.parse(request.body);
      } else {
        // Multi-target schema
        if (schema.body && request.body !== undefined) {
          (request as any).validatedBody = schema.body.parse(request.body);
          (request as any).validated = (request as any).validatedBody;
        }
        if (schema.query && request.query !== undefined) {
          (request as any).validatedQuery = schema.query.parse(request.query);
        }
        if (schema.params && request.params !== undefined) {
          (request as any).validatedParams = schema.params.parse(request.params);
        }
      }
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return sendError(
          reply,
          400,
          "Validation failed. Please verify your input.",
          "VALIDATION_ERROR",
          details
        );
      }
      return sendError(reply, 400, "Invalid request format.", "BAD_REQUEST");
    }
  };
}
