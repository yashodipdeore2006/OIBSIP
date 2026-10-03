import express from "express";

import { createOrder } from "../controllers/order.controller.js";

import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new pizza order
router.post("/", authenticateUser, createOrder);

export default router;