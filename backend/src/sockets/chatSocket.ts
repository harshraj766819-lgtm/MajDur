import { Server as SocketIOServer, Socket } from "socket.io";

export function setupChatSocket(io: SocketIOServer) {
  io.on("connection", (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join conversation room
    socket.on("join_conversation", (conversationId: string) => {
      socket.join(conversationId);
      console.log(`[Socket.IO] ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave conversation room
    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(conversationId);
      console.log(`[Socket.IO] ${socket.id} left conversation ${conversationId}`);
    });

    // Send message event
    socket.on("send_message", (data: { conversationId: string; senderId: string; content: string }) => {
      io.to(data.conversationId).emit("new_message", {
        ...data,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
}

