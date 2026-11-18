import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";
import { ENV } from "./config/environment";
import { errorHandler } from "./middleware/errorHandler";
import healthRoutes from "./routes/health.routes";
import categoriesRoutes from "./routes/categories.routes";
import workersRoutes from "./routes/workers.routes";
import statsRoutes from "./routes/stats.routes";
import authRoutes from "./routes/auth.routes";
import customerRoutes from "./routes/customer.routes";
import bookingsRoutes from "./routes/bookings.routes";
import reviewsRoutes from "./routes/reviews.routes";
import invoicesRoutes from "./routes/invoices.routes";
import notificationsRoutes from "./routes/notifications.routes";
import workerRoutes from "./routes/worker.routes";
import contractorRoutes from "./routes/contractor.routes";
import conversationsRoutes from "./routes/conversations.routes";
import paymentsRoutes from "./routes/payments.routes";
import { setupChatSocket } from "./sockets/chatSocket";
import { setNotificationSocketIO } from "./services/notification.service";
import { setPaymentSocketIO } from "./services/payment.service";

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
setNotificationSocketIO(io);
setPaymentSocketIO(io);

// Security & utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: [ENV.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "10mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser(ENV.COOKIE_SECRET));

if (ENV.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// API Routes
app.use("/api", healthRoutes);
app.use("/api", categoriesRoutes);
app.use("/api", workersRoutes);
app.use("/api", statsRoutes);
app.use("/api", authRoutes);
app.use("/api", paymentsRoutes);
app.use("/api", customerRoutes);
app.use("/api", bookingsRoutes);
app.use("/api", reviewsRoutes);
app.use("/api", invoicesRoutes);
app.use("/api", notificationsRoutes);
app.use("/api", workerRoutes);
app.use("/api", contractorRoutes);
app.use("/api", conversationsRoutes);

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
if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 MajDur Backend Server Running`);
    console.log(`⚡ Port: ${PORT}`);
    console.log(`⚡ Environment: ${ENV.NODE_ENV}`);
    console.log(`⚡ Developer: ${ENV.DEVELOPER}`);
    console.log(`⚡ Health: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });
}

export { app, server, io };

