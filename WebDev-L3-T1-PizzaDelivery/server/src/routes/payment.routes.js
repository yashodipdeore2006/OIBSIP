import express from "express";

import {
  createPaymentOrder,
  handleRazorpayWebhook,
  verifyPayment,
} from "../controllers/payment.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { validateBody, validators } from "../middleware/validate.middleware.js";

const router = express.Router();

router.post(
  "/create-order",
  authenticateUser,
  validateBody(validators.paymentOrder),
  createPaymentOrder
);

router.post(
  "/verify",
  authenticateUser,
  validateBody(validators.paymentVerify),
  verifyPayment
);

export { handleRazorpayWebhook };
export default router;
