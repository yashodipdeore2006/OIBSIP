import jwt from "jsonwebtoken";
import { Server } from "socket.io";

let ioInstance = null;

export const attachSocketServer = (httpServer) => {
  const clientUrl = (
    process.env.CLIENT_URL || "http://localhost:5173"
  ).replace(/\/$/, "");

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

    console.log(
      `Socket connected: ${socket.id} (user ${userId})`
    );

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id} (${reason})`
      );
    });
  });

  ioInstance = io;

  return io;
};

export const emitOrderStatusUpdate = (userId, order) => {
  if (!ioInstance) {
    console.warn(
      "Socket server is not attached; order status event was skipped."
    );
    return;
  }

  ioInstance.to(`user:${userId}`).emit(
    "order-status-updated",
    { order }
  );
};
