import "dotenv/config";

import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import app from "./app.js";
import connectDB from "./config/database.js";
import { startLowStockJob } from "./jobs/lowStock.job.js";
import { startPaymentReconciliationJob } from "./jobs/paymentReconciliation.job.js";

const PORT = Number(process.env.PORT || 5000);
const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST", "PATCH"],
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Invalid or expired authentication token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user.userId;
  socket.join(`user:${userId}`);
  console.log(`Socket connected: ${socket.id} (user ${userId})`);

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

const startServer = async () => {
  await connectDB();
  startLowStockJob();
  startPaymentReconciliationJob();

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
};

const shutdown = (signal) => {
  console.log(`${signal} received. Closing HTTP server...`);
  httpServer.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

export { io };
