import express from "express";
import { getAdminDashboardStats } from "../controllers/admin.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { authorizeAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

router.use(authenticateUser, authorizeAdmin);
router.get("/dashboard", getAdminDashboardStats);

export default router;
