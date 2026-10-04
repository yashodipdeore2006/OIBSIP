import Ingredient from "../models/Ingredient.js";

export const createIngredient = async (req, res, next) => {
  try {
    const {
      name,
      category,
      price,
      stock,
      lowStockThreshold = 10,
    } = req.body;

    const ingredient = await Ingredient.create({
      name: name.trim(),
      category,
      price,
      stock,
      lowStockThreshold,
      lowStockAlertSent: stock <= lowStockThreshold ? false : false,
    });

    res.status(201).json({
      success: true,
      message: "Ingredient created successfully",
      ingredient,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventory = async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find()
      .sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      ingredients,
    });
  } catch (error) {
    next(error);
  }
};

export const updateIngredient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ingredient = await Ingredient.findById(id);

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: "Ingredient not found",
      });
    }

    const {
      name,
      category,
      price,
      stock,
      lowStockThreshold,
    } = req.body;

    const previousStock = ingredient.stock;
    const previousThreshold = ingredient.lowStockThreshold;

    if (name !== undefined) ingredient.name = name.trim();
    if (category !== undefined) ingredient.category = category;
    if (price !== undefined) ingredient.price = price;
    if (stock !== undefined) ingredient.stock = stock;
    if (lowStockThreshold !== undefined) {
      ingredient.lowStockThreshold = lowStockThreshold;
    }

    const stockMovedAboveThreshold =
      ingredient.stock > ingredient.lowStockThreshold &&
      (previousStock <= previousThreshold || previousStock <= ingredient.lowStockThreshold);

    if (stockMovedAboveThreshold) {
      ingredient.lowStockAlertSent = false;
    }

    await ingredient.save();

    res.status(200).json({
      success: true,
      message: "Ingredient updated successfully",
      ingredient,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteIngredient = async (req, res, next) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: "Ingredient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ingredient deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
