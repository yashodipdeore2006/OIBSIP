import mongoose from "mongoose";

import Ingredient from "../models/Ingredient.js";
import Order from "../models/Order.js";
import {
  emitOrderStatusUpdate,
} from "../sockets/index.js";



export const createOrder = async (req, res) => {
  try {
    const {
      baseId,
      sauceId,
      cheeseId,
      vegetableIds = [],
    } = req.body;

    // 1. Validate required ingredients

    if (!baseId || !sauceId || !cheeseId) {
      return res.status(400).json({
        success: false,
        message: "Base, sauce and cheese are required",
      });
    }

    // 2. Validate vegetableIds

    if (!Array.isArray(vegetableIds)) {
      return res.status(400).json({
        success: false,
        message: "vegetableIds must be an array",
      });
    }

    // 3. Validate MongoDB IDs

    const ids = [
      baseId,
      sauceId,
      cheeseId,
      ...vegetableIds,
    ];

    const invalidId = ids.some(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidId) {
      return res.status(400).json({
        success: false,
        message: "Invalid ingredient ID",
      });
    }

    // 4. Remove duplicate IDs

    const ingredientIds = [...new Set(ids)];

    // 5. Fetch ingredients from database

    const ingredients = await Ingredient.find({
      _id: { $in: ingredientIds },
    });

    // 6. Check that all ingredients exist

    if (ingredients.length !== ingredientIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more ingredients were not found",
      });
    }

    // 7. Find selected ingredients

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

    // 8. Validate categories

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
      (vegetable) =>
        vegetable.category !== "vegetable"
    );

    if (invalidVegetable) {
      return res.status(400).json({
        success: false,
        message: "One or more vegetables are invalid",
      });
    }

    // 9. Check current stock
    // Stock is NOT decreased here.
    // It will be decreased only after successful payment.

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

    // 10. Calculate price using database prices

    const totalAmount =
      base.price +
      sauce.price +
      cheese.price +
      vegetables.reduce(
        (total, vegetable) =>
          total + vegetable.price,
        0
      );

    // 11. Create order

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

        vegetables: vegetables.map(
          (vegetable) => ({
            ingredientId: vegetable._id,
            name: vegetable.name,
            price: vegetable.price,
          })
        ),
      },

      totalAmount,

      paymentStatus: "pending",

      orderStatus: "received",
    });

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

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.userId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(
      "Get all orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};


export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const allowedStatuses = [
      "received",
      "in_kitchen",
      "sent_to_delivery",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const statusOrder = {
      received: 0,
      in_kitchen: 1,
      sent_to_delivery: 2,
    };

    const currentIndex = statusOrder[order.orderStatus];
    const requestedIndex = statusOrder[orderStatus];

    // No change needed
    if (currentIndex === requestedIndex) {
      return res.status(200).json({
        success: true,
        message: "Order status is already set to this value.",
        order,
      });
    }

    // Prevent moving an order backward
    if (requestedIndex < currentIndex) {
      return res.status(400).json({
        success: false,
        message: "Order status cannot move backward.",
      });
    }

    // Only paid orders can move beyond "received"
    if (
      requestedIndex > 0 &&
      order.paymentStatus !== "paid"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only paid orders can be moved to the kitchen or delivery.",
      });
    }

    // Allow only one status transition at a time
    if (requestedIndex !== currentIndex + 1) {
      return res.status(400).json({
        success: false,
        message:
          "Order status must move to the next step only.",
      });
    }

    order.orderStatus = orderStatus;

    await order.save();

    // Real-time update to the customer
    emitOrderStatusUpdate(order.user.toString(), order);

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  }
};