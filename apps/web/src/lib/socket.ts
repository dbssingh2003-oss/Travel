import { io } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:4000";

export const socket = io(WS_URL, {
  path: "/ws",
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on("connect", () => {
  console.log("[WS] Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("[WS] Disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("[WS] Connection error:", err.message);
});

export function subscribeTripUpdates(tripId: string) {
  if (!socket.connected) socket.connect();
  socket.emit("subscribe", tripId);
}

export function unsubscribeTripUpdates(tripId: string) {
  socket.emit("unsubscribe", tripId);
}
