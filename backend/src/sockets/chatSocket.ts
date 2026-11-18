import { Server as SocketIOServer, Socket } from "socket.io";
import { prisma } from "../config/prisma";
import { verifyAccessToken } from "../utils/token";
import { ChatService } from "../services/chat.service";

// Active user connection tracking: Map<userId, Set<socketId>>
const userSocketsMap = new Map<string, Set<string>>();

// Track active conversation rooms a socket has joined: Map<socketId, Set<conversationId>>
const socketJoinedRooms = new Map<string, Set<string>>();

/**
 * Check if a user is currently connected to Socket.IO
 */
export function isUserOnline(userId: string): boolean {
  const sockets = userSocketsMap.get(userId);
  return sockets !== undefined && sockets.size > 0;
}

/**
 * Helper to parse cookies from handshake headers
 */
function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      cookies[name] = decodeURIComponent(val);
    }
  });

  return cookies;
}

export function setupChatSocket(io: SocketIOServer) {
  // ========================================================
  // 1. JWT Authentication Handshake Middleware
  // ========================================================
  io.use(async (socket: Socket, next) => {
    try {
      let token: string | undefined;

      // Check auth payload from client handshake
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      // Check Authorization header
      if (!token && socket.handshake.headers.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.split(" ")[1];
        }
      }

      // Check cookies
      if (!token && socket.handshake.headers.cookie) {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        token = cookies["majdur_access_token"];
      }

      if (!token) {
        return next(new Error("Authentication token required for Socket.IO connection"));
      }

      let payload;
      try {
        payload = verifyAccessToken(token);
      } catch (err: any) {
        return next(new Error(`Invalid or expired token: ${err.message || "Unauthorized"}`));
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          role: true,
          phone: true,
          avatar: true,
          isActive: true,
        },
      });

      if (!user) {
        return next(new Error("User account not found"));
      }

      if (!user.isActive) {
        return next(new Error("Account deactivated"));
      }

      // Store authenticated user in socket session
      socket.data.user = user;
      next();
    } catch (error: any) {
      return next(new Error(`Authentication failed: ${error.message || "Unknown error"}`));
    }
  });

  // ========================================================
  // 2. Connection & Event Handlers
  // ========================================================
  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;
    const userId = user.id;

    // Track active connection
    if (!userSocketsMap.has(userId)) {
      userSocketsMap.set(userId, new Set());
    }
    const userSockets = userSocketsMap.get(userId)!;
    const isFirstConnection = userSockets.size === 0;
    userSockets.add(socket.id);
    socketJoinedRooms.set(socket.id, new Set());

    // Join user's private notification room
    socket.join(`user:${userId}`);

    // Broadcast online presence if this is the user's first active tab
    if (isFirstConnection) {
      io.emit("presence:update", {
        userId,
        status: "online",
        timestamp: new Date().toISOString(),
      });
    }

    // ========================================================
    // Event: conversation:join - Join a verified conversation room
    // ========================================================
    socket.on("conversation:join", async (data: { conversationId: string }, callback?: (res: any) => void) => {
      try {
        const { conversationId } = data || {};
        if (!conversationId) {
          socket.emit("error", { message: "conversationId is required" });
          if (callback) callback({ success: false, message: "conversationId is required" });
          return;
        }

        // Verify user is an authorized member
        const membership = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: { conversationId, userId },
          },
        });

        if (!membership && user.role !== "ADMIN") {
          socket.emit("error", {
            code: "UNAUTHORIZED_ROOM",
            message: "You are not an authorized participant of this conversation",
            conversationId,
          });
          if (callback) callback({ success: false, message: "Unauthorized room access" });
          return;
        }

        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);
        socketJoinedRooms.get(socket.id)?.add(conversationId);

        if (callback) {
          callback({ success: true, conversationId });
        }
      } catch (err: any) {
        console.error("[Socket.IO] conversation:join error:", err);
        socket.emit("error", { message: err.message || "Failed to join conversation room" });
      }
    });

    // ========================================================
    // Event: conversation:leave - Leave a conversation room
    // ========================================================
    socket.on("conversation:leave", (data: { conversationId: string }) => {
      if (data?.conversationId) {
        socket.leave(`conversation:${data.conversationId}`);
        socketJoinedRooms.get(socket.id)?.delete(data.conversationId);
      }
    });

    // ========================================================
    // Event: message:send - Send, persist, and broadcast message
    // ========================================================
    socket.on(
      "message:send",
      async (
        data: {
          conversationId: string;
          content: string;
          clientMessageId?: string;
          messageType?: string;
        },
        ackCallback?: (res: any) => void
      ) => {
        try {
          const { conversationId, content, clientMessageId, messageType = "TEXT" } = data || {};

          if (!conversationId || !content || !content.trim()) {
            const errPayload = { success: false, message: "conversationId and non-empty content are required" };
            socket.emit("error", errPayload);
            if (ackCallback) ackCallback(errPayload);
            return;
          }

          // Persist message to database via ChatService
          const result = await ChatService.sendMessage({
            conversationId,
            senderId: userId,
            content,
            clientMessageId,
            messageType,
          });

          if (result.status >= 400) {
            const errPayload = { success: false, message: result.message || "Failed to send message" };
            socket.emit("error", errPayload);
            if (ackCallback) ackCallback(errPayload);
            return;
          }

          const messageRecord = result.messageRecord;
          if (!messageRecord) return;
          const roomName = `conversation:${conversationId}`;

          // Broadcast to other participants in the room
          socket.to(roomName).emit("message:new", {
            message: messageRecord,
            conversationId,
          });

          // Check if recipient is connected in the room to trigger delivery receipt
          const roomClients = io.sockets.adapter.rooms.get(roomName);
          const hasOtherClients = roomClients && roomClients.size > 1;

          if (hasOtherClients) {
            socket.emit("message:delivered", {
              messageId: messageRecord.id,
              conversationId,
              deliveredAt: new Date().toISOString(),
            });
          }

          // Acknowledge back to sender with persisted record
          if (ackCallback) {
            ackCallback({
              success: true,
              message: messageRecord,
              isDuplicate: result.isDuplicate,
            });
          }
        } catch (err: any) {
          console.error("[Socket.IO] message:send error:", err);
          const errPayload = { success: false, message: err.message || "Internal server error" };
          socket.emit("error", errPayload);
          if (ackCallback) ackCallback(errPayload);
        }
      }
    );

    // ========================================================
    // Event: message:read - Read receipt & status update
    // ========================================================
    socket.on("message:read", async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data || {};
        if (!conversationId) return;

        await ChatService.markMessagesAsRead(conversationId, userId);

        const roomName = `conversation:${conversationId}`;
        socket.to(roomName).emit("message:read", {
          conversationId,
          readerId: userId,
          readAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[Socket.IO] message:read error:", err);
      }
    });

    // ========================================================
    // Event: typing:start & typing:stop
    // ========================================================
    socket.on("typing:start", (data: { conversationId: string }) => {
      if (data?.conversationId) {
        const roomName = `conversation:${data.conversationId}`;
        socket.to(roomName).emit("typing:start", {
          conversationId: data.conversationId,
          userId,
          userName: user.name,
        });
      }
    });

    socket.on("typing:stop", (data: { conversationId: string }) => {
      if (data?.conversationId) {
        const roomName = `conversation:${data.conversationId}`;
        socket.to(roomName).emit("typing:stop", {
          conversationId: data.conversationId,
          userId,
        });
      }
    });

    // ========================================================
    // Backward-compatible legacy event aliases
    // ========================================================
    socket.on("join_conversation", (convoId: string) => {
      socket.emit("conversation:join", { conversationId: convoId });
    });

    socket.on("leave_conversation", (convoId: string) => {
      socket.emit("conversation:leave", { conversationId: convoId });
    });

    // ========================================================
    // Disconnect cleanup
    // ========================================================
    socket.on("disconnect", () => {
      // Clear typing indicator from joined rooms
      const joinedRooms = socketJoinedRooms.get(socket.id);
      if (joinedRooms) {
        joinedRooms.forEach((convoId) => {
          socket.to(`conversation:${convoId}`).emit("typing:stop", {
            conversationId: convoId,
            userId,
          });
        });
      }
      socketJoinedRooms.delete(socket.id);

      // Remove socket from user tracking
      const userSockets = userSocketsMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        // If no more active sockets for this user -> emit offline presence
        if (userSockets.size === 0) {
          userSocketsMap.delete(userId);
          io.emit("presence:update", {
            userId,
            status: "offline",
            lastSeenAt: new Date().toISOString(),
          });
        }
      }
    });
  });
}
