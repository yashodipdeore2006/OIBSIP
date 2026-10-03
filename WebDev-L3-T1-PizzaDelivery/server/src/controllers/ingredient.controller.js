import Ingredient from "../models/Ingredient.js";

export const getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find()
      .sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      ingredients,
    });
  } catch (error) {
    console.error("Get ingredients error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



export const getIngredientsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const ingredients = await Ingredient.find({
      category,
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      category,
      ingredients,
    });
  } catch (error) {
    console.error(
      "Get ingredients by category error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};