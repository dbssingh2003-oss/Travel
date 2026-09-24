/**
 * Socket.io WebSocket Gateway
 *
 * Provides real-time updates for trips, bookings, and notifications.
 * Includes native JWT authentication on connection handshake.
 */
import { Server as SocketServer, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { createHmac } from "crypto";
import { config } from "../lib/config";
import { logger } from "../lib/logger";

let io: SocketServer | null = null;

interface AuthenticatedSocket extends Socket {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
}

/**
 * Verify JWT token using Node native crypto HMAC SHA256
 */
function verifyJwtToken(token: string, secret: string): { sub: string; email: string; role: string } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const [headerB64, payloadB64, signatureB64] = parts;
  const expectedSig = createHmac("sha256", secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");

  if (expectedSig !== signatureB64) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    throw new Error("Token expired");
  }

  return payload;
}

export function initSocketGateway(httpServer: HttpServer, allowedOrigins: string[]) {
  io = new SocketServer(httpServer, {
    path: "/ws",
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Authentication Middleware for WebSockets
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "") ||
      (socket.handshake.query?.token as string);

    if (!token) {
      // Allow unauthenticated connection for guest viewers
      return next();
    }

    try {
      const decoded = verifyJwtToken(token, config.jwt.accessSecret);
      socket.user = decoded;
      return next();
    } catch (err: any) {
      logger.warn({ socketId: socket.id, err: err.message }, "WebSocket auth token verification failed");
      return next(new Error("Authentication failed: invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userLabel = socket.user ? `user:${socket.user.sub} (${socket.user.email})` : "guest";
    logger.info({ socketId: socket.id, user: userLabel }, "[WS] Client connected");

    // Allow user to join personal notification room if authenticated
    if (socket.user?.sub) {
      socket.join(`user:${socket.user.sub}`);
    }

    // Subscribe to a specific trip room
    socket.on("subscribe", (tripId: string) => {
      if (typeof tripId === "string" && tripId.trim()) {
        const room = `trip:${tripId.trim()}`;
        socket.join(room);
        logger.debug({ socketId: socket.id, room }, "[WS] Subscribed");
      }
    });

    // Unsubscribe from a trip room
    socket.on("unsubscribe", (tripId: string) => {
      if (typeof tripId === "string" && tripId.trim()) {
        const room = `trip:${tripId.trim()}`;
        socket.leave(room);
        logger.debug({ socketId: socket.id, room }, "[WS] Unsubscribed");
      }
    });

    socket.on("disconnect", (reason) => {
      logger.info({ socketId: socket.id, reason }, "[WS] Client disconnected");
    });
  });

  return io;
}

export function emitTripEvent(tripId: string, event: Record<string, unknown>) {
  if (!io) {
    logger.warn({ event }, "[WS] Socket.io not initialized — event dropped");
    return;
  }
  io.to(`trip:${tripId}`).emit(event.type as string, event);
}

export function emitUserEvent(userId: string, event: Record<string, unknown>) {
  if (!io) {
    logger.warn({ event, userId }, "[WS] Socket.io not initialized — user event dropped");
    return;
  }
  io.to(`user:${userId}`).emit(event.type as string, event);
}

export function getIo(): SocketServer | null {
  return io;
}
