"use client";

import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
    : "http://localhost:5000");

export function getSocket(token?: string): Socket {
  if (!socketInstance || !socketInstance.connected) {
    const opts: any = {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    };

    if (token) {
      opts.auth = { token };
    }

    socketInstance = io(SOCKET_URL, opts);

    socketInstance.on("connect", () => {
      console.log(`[Socket.IO Client] Connected to ${SOCKET_URL} (ID: ${socketInstance?.id})`);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("[Socket.IO Client] Connection error:", err.message);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[Socket.IO Client] Disconnected:", reason);
    });
  }

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

