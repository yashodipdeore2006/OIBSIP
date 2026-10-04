import express from "express";

import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rateLimit.middleware.js";
import { validateBody, validators } from "../middleware/validate.middleware.js";

const router = express.Router();

router.post(
  "/register",
  authRateLimiter,
  validateBody(validators.register),
  registerUser
);

router.post(
  "/login",
  authRateLimiter,
  validateBody(validators.login),
  loginUser
);

router.get("/me", authenticateUser, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

router.get("/verify-email", verifyEmail);

router.post(
  "/forgot-password",
  authRateLimiter,
  validateBody(validators.forgotPassword),
  forgotPassword
);

router.post(
  "/reset-password",
  authRateLimiter,
  validateBody(validators.resetPassword),
  resetPassword
);

export default router;
