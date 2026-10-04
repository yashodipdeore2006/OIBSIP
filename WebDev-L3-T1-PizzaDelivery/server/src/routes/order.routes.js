import express from "express";

import {
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { authorizeAdmin } from "../middleware/admin.middleware.js";
import {
  validateBody,
  validateObjectIdParam,
  validators,
} from "../middleware/validate.middleware.js";

const router = express.Router();

router.post(
  "/",
  authenticateUser,
  validateBody(validators.createOrder),
  createOrder
);

router.get("/my-orders", authenticateUser, getMyOrders);

router.get(
  "/admin",
  authenticateUser,
  authorizeAdmin,
  getAllOrders
);

router.patch(
  "/admin/:id/status",
  authenticateUser,
  authorizeAdmin,
  validateObjectIdParam("id"),
  validateBody(validators.orderStatus),
  updateOrderStatus
);

export default router;
