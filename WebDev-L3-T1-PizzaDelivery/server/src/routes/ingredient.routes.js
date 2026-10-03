import express from "express";

import {
  createIngredient,
  getInventory,
  updateIngredient,
  deleteIngredient,
} from "../controllers/inventory.controller.js";

const router = express.Router();

router.get("/", getInventory);

router.post("/", createIngredient);

router.patch("/:id", updateIngredient);

router.delete("/:id", deleteIngredient);

export default router;