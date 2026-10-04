import Ingredient from "../models/Ingredient.js";

const allowedCategories = [
  "base",
  "sauce",
  "cheese",
  "vegetable",
];

export const getIngredients = async (req, res, next) => {
  try {
    const ingredients = await Ingredient.find()
      .select("name category price stock")
      .sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      ingredients,
    });
  } catch (error) {
    next(error);
  }
};

export const getIngredientsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ingredient category.",
      });
    }

    const ingredients = await Ingredient.find({ category })
      .select("name category price stock")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      category,
      ingredients,
    });
  } catch (error) {
    next(error);
  }
};
