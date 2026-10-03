import Ingredient from "../models/Ingredient.js";

export const createIngredient = async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      stock,
      lowStockThreshold,
    } = req.body;

    if (
      !name ||
      !category ||
      price === undefined ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const ingredient = await Ingredient.create({
      name,
      category,
      price,
      stock,
      lowStockThreshold,
    });

    res.status(201).json({
      success: true,
      message: "Ingredient created successfully",
      ingredient,
    });
  } catch (error) {
    console.error("Create ingredient error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getInventory = async (req, res) => {
  try {
    const ingredients = await Ingredient.find()
      .sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      ingredients,
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;

    const ingredient =
      await Ingredient.findById(id);

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

    if (name !== undefined) {
      ingredient.name = name;
    }

    if (category !== undefined) {
      ingredient.category = category;
    }

    if (price !== undefined) {
      ingredient.price = price;
    }

    if (stock !== undefined) {
      ingredient.stock = stock;
    }

    if (lowStockThreshold !== undefined) {
      ingredient.lowStockThreshold =
        lowStockThreshold;
    }

    await ingredient.save();

    res.status(200).json({
      success: true,
      message: "Ingredient updated successfully",
      ingredient,
    });
  } catch (error) {
    console.error(
      "Update ingredient error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;

    const ingredient =
      await Ingredient.findByIdAndDelete(id);

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
    console.error("Delete ingredient error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
