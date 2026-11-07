import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { Server as SocketIOServer } from "socket.io";
import { ENV } from "./config/environment";
import { errorHandler } from "./middleware/errorHandler";
import healthRoutes from "./routes/health.routes";
import categoriesRoutes from "./routes/categories.routes";
import { setupChatSocket } from "./sockets/chatSocket";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: [ENV.FRONTEND_URL, "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

setupChatSocket(io);

// Security & utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: [ENV.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (ENV.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// API Routes
app.use("/api", healthRoutes);
app.use("/api", categoriesRoutes);

// Root greeting & developer credit
app.get("/", (req, res) => {
  res.json({
    name: "MajDur API Server",
    tagline: "Find Work. Hire Workers. Build Your Future.",
    developer: "Harsh Singh",
    version: "1.0.0",
    healthCheck: "/api/health",
    categories: "/api/categories",
  });
});

// Centralized error handling
app.use(errorHandler);

// Start server
const PORT = ENV.PORT;
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 MajDur Backend Server Running`);
  console.log(`⚡ Port: ${PORT}`);
  console.log(`⚡ Environment: ${ENV.NODE_ENV}`);
  console.log(`⚡ Developer: ${ENV.DEVELOPER}`);
  console.log(`⚡ Health: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});

export { app, server, io };

