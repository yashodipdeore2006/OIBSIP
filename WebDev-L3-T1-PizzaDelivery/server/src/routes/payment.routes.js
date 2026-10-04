import express from "express";

import {
  createPaymentOrder,
  verifyPayment
} from "../controllers/payment.controller.js";

import {
  authenticateUser,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/create-order",
  authenticateUser,
  createPaymentOrder
);

router.post(
  "/verify",
  authenticateUser,
  verifyPayment
);

//============================
export default router;