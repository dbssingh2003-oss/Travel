import { io } from "socket.io-client";

// Determine if a dedicated WebSocket server is configured
const rawWsUrl = import.meta.env.VITE_WS_URL?.trim();
const isProd = import.meta.env.PROD;

// In production, avoid connecting to localhost:4000 or polling on Vercel serverless (which triggers 405)
const hasExplicitWsUrl = Boolean(rawWsUrl && rawWsUrl !== "" && !rawWsUrl.includes("localhost"));
const WS_URL = hasExplicitWsUrl ? rawWsUrl! : (isProd ? "" : "http://localhost:4000");

export const isWsEnabled = Boolean(!isProd || hasExplicitWsUrl);

export const socket = io(WS_URL || "http://localhost:4000", {
  path: "/ws",
  autoConnect: false,
  // Enforce pure WebSocket transport to prevent HTTP polling POST /ws/?... 405 errors on serverless
  transports: ["websocket"],
  reconnectionAttempts: isWsEnabled ? 3 : 0,
  reconnectionDelay: 2000,
});

if (isWsEnabled) {
  socket.on("connect", () => {
    console.log("[WS] Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[WS] Disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.warn("[WS] Real-time connection unavailable, falling back to REST:", err.message);
  });
}

export function subscribeTripUpdates(tripId: string) {
  if (isWsEnabled && !socket.connected) {
    try {
      socket.connect();
    } catch {
      // safe fallback
    }
  }
  if (socket.connected) {
    socket.emit("subscribe", tripId);
  }
}

export function unsubscribeTripUpdates(tripId: string) {
  if (socket.connected) {
    socket.emit("unsubscribe", tripId);
  }
}
