import { io } from "../server.js";

export const emitOrderStatusUpdate = (
  userId,
  order
) => {
  io.to(`user:${userId}`).emit(
    "order-status-updated",
    {
      order,
    }
  );
};