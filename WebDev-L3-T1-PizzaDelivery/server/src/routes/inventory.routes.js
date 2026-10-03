import express from "express";

import {
  createIngredient,
  getInventory,
  updateIngredient,
  deleteIngredient,
} from "../controllers/inventory.controller.js";

import {
  authenticateUser,
} from "../middleware/auth.middleware.js";

import {
  authorizeAdmin,
} from "../middleware/admin.middleware.js";

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeAdmin);

router.get("/", getInventory);

router.post("/", createIngredient);

router.patch("/:id", updateIngredient);

router.delete("/:id", deleteIngredient);

export default router;