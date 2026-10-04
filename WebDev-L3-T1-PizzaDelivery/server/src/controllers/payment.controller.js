import crypto from "crypto";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import Ingredient from "../models/Ingredient.js";
import razorpay from "../config/razorpay.js";

export const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    // 1. Validate order ID

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // 2. Find order

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 3. Make sure order belongs to logged-in user

    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You cannot pay for this order",
      });
    }

    // 4. Prevent duplicate payment

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    }

    // 5. Razorpay amount is in paise

    const amountInPaise = Math.round(
      order.totalAmount * 100
    );

    // 6. Create Razorpay order

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${order._id}`,
    });

    // 7. Save Razorpay order ID

    order.razorpayOrderId = razorpayOrder.id;

    await order.save();

    // 8. Return payment information

    return res.status(200).json({
      success: true,
      message: "Payment order created successfully",

      payment: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error(
      "Create payment order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // 1. Validate payment data

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification data is incomplete",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // 2. Find order

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 3. Verify ownership

    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You cannot verify this order",
      });
    }

    // 4. Verify Razorpay order ID

    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order does not match",
      });
    }

    // 5. If already paid, return existing order

    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment was already verified",
        order,
      });
    }

    // 6. Generate expected Razorpay signature

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    // 7. Compare signatures

    if (
      generatedSignature !== razorpay_signature
    ) {
      order.paymentStatus = "failed";

      await order.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // 8. Start MongoDB transaction

    session.startTransaction();

    // 9. Build list of required ingredients

    const requiredIngredients = [
      order.pizza.base.ingredientId,
      order.pizza.sauce.ingredientId,
      order.pizza.cheese.ingredientId,
      ...order.pizza.vegetables.map(
        (vegetable) => vegetable.ingredientId
      ),
    ];

    // Remove duplicate IDs

    const uniqueIngredientIds = [
      ...new Set(
        requiredIngredients.map((id) =>
          id.toString()
        )
      ),
    ];

    // 10. Atomically decrease stock

    for (const ingredientId of uniqueIngredientIds) {
      const updatedIngredient =
        await Ingredient.findOneAndUpdate(
          {
            _id: ingredientId,
            stock: { $gte: 1 },
          },
          {
            $inc: {
              stock: -1,
            },
          },
          {
            new: true,
            session,
          }
        );

      if (!updatedIngredient) {
        throw new Error(
          `Insufficient stock for ingredient ${ingredientId}`
        );
      }
    }

    // 11. Mark payment as paid

    order.paymentStatus = "paid";

    order.razorpayPaymentId =
      razorpay_payment_id;

    order.razorpaySignature =
      razorpay_signature;

    await order.save({ session });

    // 12. Commit everything

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message:
        "Payment verified and order confirmed successfully",
      order,
    });
  } catch (error) {
    // Rollback stock + payment changes

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Payment verification error:",
      error
    );

    if (
      error.message?.startsWith(
        "Insufficient stock"
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Payment was received, but required stock is no longer available. Manual refund handling is required.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  } finally {
    await session.endSession();
  }
};