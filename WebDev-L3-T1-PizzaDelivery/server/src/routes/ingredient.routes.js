import express from "express";
import {
  getIngredients,
  getIngredientsByCategory,
} from "../controllers/ingredient.controller.js";

const router = express.Router();

router.get("/", getIngredients);
router.get("/:category", getIngredientsByCategory);

export default router;
