import Ingredient from "../models/Ingredient.js";

export const decreaseIngredientStock = async (
  ingredientId,
  quantity = 1,
  session
) => {
  const ingredient = await Ingredient.findOneAndUpdate(
    {
      _id: ingredientId,
      stock: { $gte: quantity },
    },
    {
      $inc: {
        stock: -quantity,
      },
    },
    {
      new: true,
      session,
    }
  );

  return ingredient;
};