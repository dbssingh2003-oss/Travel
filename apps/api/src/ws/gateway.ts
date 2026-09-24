/**
 * Socket.io WebSocket Gateway
 *
 * Rooms are keyed by tripId. The frontend subscribes on "subscribe" event.
 * The saga and ops service emit events via emitTripEvent().
 */
import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";

let io: SocketServer | null = null;

export function initSocketGateway(httpServer: HttpServer, allowedOrigins: string[]) {
  io = new SocketServer(httpServer, {
    path: "/ws",
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    socket.on("subscribe", (tripId: string) => {
      socket.join(`trip:${tripId}`);
      console.log(`[WS] ${socket.id} subscribed to trip:${tripId}`);
    });

    socket.on("unsubscribe", (tripId: string) => {
      socket.leave(`trip:${tripId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function emitTripEvent(tripId: string, event: Record<string, unknown>) {
  if (!io) {
    console.warn("[WS] Socket.io not initialized — event dropped:", event);
    return;
  }
  io.to(`trip:${tripId}`).emit(event.type as string, event);
}

export function getIo(): SocketServer | null {
  return io;
}
