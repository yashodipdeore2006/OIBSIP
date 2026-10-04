import express from "express";

import {
  createIngredient,
  deleteIngredient,
  getInventory,
  updateIngredient,
} from "../controllers/inventory.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { authorizeAdmin } from "../middleware/admin.middleware.js";
import {
  validateBody,
  validateObjectIdParam,
} from "../middleware/validate.middleware.js";

const categories = ["base", "sauce", "cheese", "vegetable"];

const validateIngredient = (body, { partial = false } = {}) => {
  if (!partial && (typeof body.name !== "string" || !body.name.trim())) {
    return "Name is required.";
  }

  if (!partial && !categories.includes(body.category)) {
    return "A valid ingredient category is required.";
  }

  if (partial && body.name !== undefined && (typeof body.name !== "string" || !body.name.trim())) {
    return "Name must be a non-empty string.";
  }

  if (body.category !== undefined && !categories.includes(body.category)) {
    return "Invalid ingredient category.";
  }

  if (body.price !== undefined && (typeof body.price !== "number" || !Number.isFinite(body.price) || body.price < 0)) {
    return "Price must be a non-negative number.";
  }

  if (body.stock !== undefined && (!Number.isInteger(body.stock) || body.stock < 0)) {
    return "Stock must be a non-negative integer.";
  }

  if (
    body.lowStockThreshold !== undefined &&
    (!Number.isInteger(body.lowStockThreshold) || body.lowStockThreshold < 0)
  ) {
    return "lowStockThreshold must be a non-negative integer.";
  }

  if (!partial && typeof body.price !== "number") return "Price is required.";
  if (!partial && !Number.isInteger(body.stock)) return "Stock is required.";

  return true;
};

const router = express.Router();

router.use(authenticateUser, authorizeAdmin);

router.get("/", getInventory);

router.post(
  "/",
  validateBody((body) => validateIngredient(body)),
  createIngredient
);

router.patch(
  "/:id",
  validateObjectIdParam("id"),
  validateBody((body) => {
    const allowed = ["name", "category", "price", "stock", "lowStockThreshold"];
    if (Object.keys(body).some((key) => !allowed.includes(key))) {
      return "Unsupported inventory field.";
    }
    if (Object.keys(body).length === 0) {
      return "At least one field is required.";
    }
    return validateIngredient(body, { partial: true });
  }),
  updateIngredient
);

router.delete(
  "/:id",
  validateObjectIdParam("id"),
  deleteIngredient
);

export default router;
