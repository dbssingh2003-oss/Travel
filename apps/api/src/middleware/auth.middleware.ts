import type { FastifyRequest, FastifyReply } from "fastify";
import type { Role } from "../types/models";
import { sendError } from "../lib/apiResponse";

export function requireAuth(roles?: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err: any) {
      if (err.name === "TokenExpiredError" || err.message?.includes("expired")) {
        return sendError(
          reply,
          401,
          "Your session has expired. Please log in again.",
          "TOKEN_EXPIRED"
        );
      }
      return sendError(
        reply,
        401,
        "Authentication required. Please provide a valid Bearer token.",
        "UNAUTHORIZED"
      );
    }

    if (roles && roles.length > 0) {
      const user = request.user as { role: Role };
      if (!roles.includes(user.role)) {
        return sendError(
          reply,
          403,
          "You do not have permission to perform this action.",
          "FORBIDDEN"
        );
      }
    }
  };
}
