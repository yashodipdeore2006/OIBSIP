import mongoose from "mongoose";
import Ingredient from "../models/Ingredient.js";
import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
  try {
    const { baseId, sauceId, cheeseId, vegetableIds = [] } = req.body;

    // 1. Validate required ingredients
    if (!baseId || !sauceId || !cheeseId) {
      return res.status(400).json({
        success: false,
        message: "Base, sauce and cheese are required",
      });
    }

    // 2. Validate MongoDB IDs
    const ids = [baseId, sauceId, cheeseId, ...vegetableIds];

    const invalidId = ids.some(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidId) {
      return res.status(400).json({
        success: false,
        message: "Invalid ingredient ID",
      });
    }

    // 3. Fetch ingredients from database
    const ingredientIds = [...new Set(ids)];

    const ingredients = await Ingredient.find({
      _id: { $in: ingredientIds },
    });

    // 4. Make sure all ingredients exist
    if (ingredients.length !== ingredientIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more ingredients were not found",
      });
    }

    // 5. Find individual ingredients
    const base = ingredients.find(
      (item) => item._id.toString() === baseId
    );

    const sauce = ingredients.find(
      (item) => item._id.toString() === sauceId
    );

    const cheese = ingredients.find(
      (item) => item._id.toString() === cheeseId
    );

    const vegetables = ingredients.filter((item) =>
      vegetableIds.includes(item._id.toString())
    );

    // 6. Validate ingredient categories
    if (base.category !== "base") {
      return res.status(400).json({
        success: false,
        message: "Selected base is invalid",
      });
    }

    if (sauce.category !== "sauce") {
      return res.status(400).json({
        success: false,
        message: "Selected sauce is invalid",
      });
    }

    if (cheese.category !== "cheese") {
      return res.status(400).json({
        success: false,
        message: "Selected cheese is invalid",
      });
    }

    const invalidVegetable = vegetables.some(
      (vegetable) => vegetable.category !== "vegetable"
    );

    if (invalidVegetable) {
      return res.status(400).json({
        success: false,
        message: "One or more vegetables are invalid",
      });
    }

    // 7. Check stock
    const selectedIngredients = [
      base,
      sauce,
      cheese,
      ...vegetables,
    ];

    const outOfStock = selectedIngredients.find(
      (ingredient) => ingredient.stock <= 0
    );

    if (outOfStock) {
      return res.status(400).json({
        success: false,
        message: `${outOfStock.name} is out of stock`,
      });
    }

    // 8. Calculate price on server
    const totalAmount =
      base.price +
      sauce.price +
      cheese.price +
      vegetables.reduce(
        (total, vegetable) => total + vegetable.price,
        0
      );

    // 9. Create order snapshot
    const order = await Order.create({
      user: req.user.userId,

      pizza: {
        base: {
          ingredientId: base._id,
          name: base.name,
          price: base.price,
        },

        sauce: {
          ingredientId: sauce._id,
          name: sauce.name,
          price: sauce.price,
        },

        cheese: {
          ingredientId: cheese._id,
          name: cheese.name,
          price: cheese.price,
        },

        vegetables: vegetables.map((vegetable) => ({
          ingredientId: vegetable._id,
          name: vegetable.name,
          price: vegetable.price,
        })),
      },

      totalAmount,

      paymentStatus: "pending",

      orderStatus: "received",
    });

    // 10. Send response
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating order",
    });
  }
};