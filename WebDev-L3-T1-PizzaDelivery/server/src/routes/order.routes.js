import express from "express";

import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";

import {
  authenticateUser,
} from "../middleware/auth.middleware.js";

import {
  authorizeAdmin,
} from "../middleware/admin.middleware.js";

const router = express.Router();

/*
  USER ROUTES
*/

// Create order
router.post(
  "/",
  authenticateUser,
  createOrder
);

// Get logged-in user's orders
router.get(
  "/my-orders",
  authenticateUser,
  getMyOrders
);


/*
  ADMIN ROUTES
*/

// Get all orders
router.get(
  "/admin",
  authenticateUser,
  authorizeAdmin,
  getAllOrders
);

// Update order status
router.patch(
  "/admin/:id/status",
  authenticateUser,
  authorizeAdmin,
  updateOrderStatus
);

export default router;