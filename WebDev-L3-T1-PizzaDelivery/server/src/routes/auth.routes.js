import express from "express";

import {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

import {
  authenticateUser,
} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/me", authenticateUser, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

router.get("/verify-email", verifyEmail);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

//====================================
export default router;