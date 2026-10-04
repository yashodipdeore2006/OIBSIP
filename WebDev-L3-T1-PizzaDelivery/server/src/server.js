import "dotenv/config";

import http from "http";
import jwt from "jsonwebtoken";

import app from "./app.js";
import connectDB from "./config/database.js";

import { Server } from "socket.io";
import {
  startLowStockJob,
} from "./jobs/lowStock.job.js";


const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"],
  },
});

// Socket authentication
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error("Authentication required")
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.user = decoded;

    next();
  } catch (error) {
    next(
      new Error(
        "Invalid or expired authentication token"
      )
    );
  }
});

io.on("connection", (socket) => {
  console.log(
    `Socket connected: ${socket.id}`
  );

  const userId = socket.user.userId;

  socket.join(`user:${userId}`);

  console.log(
    `User ${userId} joined room`
  );

  socket.on("disconnect", () => {
    console.log(
      `Socket disconnected: ${socket.id}`
    );
  });
});

const startServer = async () => {
  await connectDB();

  startLowStockJob();

  httpServer.listen(PORT, () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  });
};

startServer();

export { io };