import type { FastifyRequest, FastifyReply } from "fastify";
import type { Role } from "../types/models";

export function requireAuth(roles?: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    if (roles && roles.length > 0) {
      const user = request.user as { role: Role };
      if (!roles.includes(user.role)) {
        return reply.status(403).send({ error: "Forbidden" });
      }
    }
  };
}
