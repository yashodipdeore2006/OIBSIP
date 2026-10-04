import mongoose from "mongoose";

import Ingredient from "../models/Ingredient.js";
import Order from "../models/Order.js";
import { emitOrderStatusUpdate } from "../sockets/index.js";

export const createOrder = async (req, res, next) => {
  try {
    const {
      baseId,
      sauceId,
      cheeseId,
      vegetableIds = [],
    } = req.body;

    const ids = [baseId, sauceId, cheeseId, ...vegetableIds];
    const uniqueIds = [...new Set(ids)];

    const ingredients = await Ingredient.find({
      _id: { $in: uniqueIds },
    });

    if (ingredients.length !== uniqueIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more ingredients were not found.",
      });
    }

    const findIngredient = (id) =>
      ingredients.find((item) => item._id.toString() === id);

    const base = findIngredient(baseId);
    const sauce = findIngredient(sauceId);
    const cheese = findIngredient(cheeseId);
    const vegetables = vegetableIds.map(findIngredient);

    if (base.category !== "base") {
      return res.status(400).json({ success: false, message: "Selected base is invalid." });
    }

    if (sauce.category !== "sauce") {
      return res.status(400).json({ success: false, message: "Selected sauce is invalid." });
    }

    if (cheese.category !== "cheese") {
      return res.status(400).json({ success: false, message: "Selected cheese is invalid." });
    }

    if (vegetables.some((item) => item.category !== "vegetable")) {
      return res.status(400).json({
        success: false,
        message: "One or more vegetables are invalid.",
      });
    }

    const selectedIngredients = [base, sauce, cheese, ...vegetables];
    const outOfStock = selectedIngredients.find((item) => item.stock <= 0);

    if (outOfStock) {
      return res.status(400).json({
        success: false,
        message: `${outOfStock.name} is out of stock.`,
      });
    }

    const totalAmount = selectedIngredients.reduce(
      (total, ingredient) => total + ingredient.price,
      0
    );

    const toSnapshot = (ingredient) => ({
      ingredientId: ingredient._id,
      name: ingredient.name,
      price: ingredient.price,
    });

    const order = await Order.create({
      user: req.user.userId,
      pizza: {
        base: toSnapshot(base),
        sauce: toSnapshot(sauce),
        cheese: toSnapshot(cheese),
        vegetables: vegetables.map(toSnapshot),
      },
      totalAmount,
      paymentStatus: "pending",
      orderStatus: "received",
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.userId })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const statusOrder = {
      received: 0,
      in_kitchen: 1,
      sent_to_delivery: 2,
    };

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const currentIndex = statusOrder[order.orderStatus];
    const requestedIndex = statusOrder[orderStatus];

    if (currentIndex === requestedIndex) {
      return res.status(200).json({
        success: true,
        message: "Order status is already set to this value.",
        order,
      });
    }

    if (requestedIndex < currentIndex) {
      return res.status(400).json({
        success: false,
        message: "Order status cannot move backward.",
      });
    }

    if (requestedIndex > 0 && order.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Only paid orders can move to the kitchen or delivery.",
      });
    }

    if (requestedIndex !== currentIndex + 1) {
      return res.status(400).json({
        success: false,
        message: "Order status must move one step at a time.",
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    emitOrderStatusUpdate(order.user.toString(), order);

    res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      order,
    });
  } catch (error) {
    next(error);
  }
};
