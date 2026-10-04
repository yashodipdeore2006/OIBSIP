import crypto from "crypto";
import mongoose from "mongoose";

import Ingredient from "../models/Ingredient.js";
import Order from "../models/Order.js";
import razorpay from "../config/razorpay.js";

const safeCompare = (a, b) => {
  const first = Buffer.from(String(a || ""), "utf8");
  const second = Buffer.from(String(b || ""), "utf8");
  return first.length === second.length && crypto.timingSafeEqual(first, second);
};

const getRequiredIngredientIds = (order) => [
  order.pizza.base.ingredientId.toString(),
  order.pizza.sauce.ingredientId.toString(),
  order.pizza.cheese.ingredientId.toString(),
  ...order.pizza.vegetables.map((item) => item.ingredientId.toString()),
];

export const settlePaidOrder = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature = null,
  webhookEventId = null,
  reconciled = false,
}) => {
  const session = await mongoose.startSession();
  let refundRequiredReason = null;

  try {
    session.startTransaction();

    const order = await Order.findOne({ razorpayOrderId }).session(session);

    if (!order) {
      await session.abortTransaction();
      return { found: false, paid: false };
    }

    if (order.paymentStatus === "paid") {
      await session.commitTransaction();
      return { found: true, paid: true, alreadyPaid: true, order };
    }

    for (const ingredientId of [...new Set(getRequiredIngredientIds(order))]) {
      const updated = await Ingredient.findOneAndUpdate(
        { _id: ingredientId, stock: { $gte: 1 } },
        { $inc: { stock: -1 } },
        { new: true, session }
      );

      if (!updated) {
        refundRequiredReason =
          "Payment was captured, but required inventory was unavailable. A refund is required.";
        throw new Error("INSUFFICIENT_STOCK_AFTER_CAPTURE");
      }
    }

    order.paymentStatus = "paid";
    order.paymentFailureReason = null;
    order.razorpayPaymentId = razorpayPaymentId || order.razorpayPaymentId;
    order.razorpaySignature = razorpaySignature || order.razorpaySignature;
    order.paymentReconciledAt = reconciled || webhookEventId ? new Date() : order.paymentReconciledAt;
    order.paymentWebhookEventId = webhookEventId || order.paymentWebhookEventId;

    await order.save({ session });
    await session.commitTransaction();

    return { found: true, paid: true, order };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (error.message === "INSUFFICIENT_STOCK_AFTER_CAPTURE" && refundRequiredReason) {
      await Order.updateOne(
        { razorpayOrderId },
        {
          $set: {
            paymentStatus: "refund_required",
            paymentFailureReason: refundRequiredReason,
            razorpayPaymentId: razorpayPaymentId || null,
            paymentReconciledAt: new Date(),
            paymentWebhookEventId: webhookEventId || null,
          },
        }
      );

      return {
        found: true,
        paid: false,
        refundRequired: true,
        reason: refundRequiredReason,
      };
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

export const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "You cannot pay for this order." });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Order is already paid." });
    }

    let razorpayOrder = null;

    if (order.razorpayOrderId) {
      try {
        razorpayOrder = await razorpay.orders.fetch(order.razorpayOrderId);
      } catch {
        razorpayOrder = null;
      }

      if (razorpayOrder?.status === "paid") {
        const paymentsResponse = await razorpay.orders.fetchPayments(order.razorpayOrderId);
        const capturedPayment = paymentsResponse.items?.find(
          (payment) => payment.status === "captured"
        );

        if (capturedPayment) {
          const settled = await settlePaidOrder({
            razorpayOrderId: order.razorpayOrderId,
            razorpayPaymentId: capturedPayment.id,
            reconciled: true,
          });

          if (settled.refundRequired) {
            return res.status(409).json({
              success: false,
              message: settled.reason,
              refundRequired: true,
            });
          }

          return res.status(409).json({
            success: false,
            message: "Payment was already captured. Please refresh your orders.",
          });
        }
      }
    }

    if (!razorpayOrder) {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(order.totalAmount * 100),
        currency: "INR",
        receipt: `order_${order._id}`,
      });

      order.razorpayOrderId = razorpayOrder.id;
    }

    order.paymentStatus = "pending";
    order.paymentFailureReason = null;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment order ready.",
      payment: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
    orderId,
  } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    if (order.user.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "You cannot verify this order." });
    }

    if (order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ success: false, message: "Razorpay order does not match." });
    }

    if (order.paymentStatus === "paid") {
      return res.status(200).json({ success: true, message: "Payment was already verified.", order });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!safeCompare(expectedSignature, razorpaySignature)) {
      await Order.updateOne(
        { _id: orderId, paymentStatus: { $ne: "paid" } },
        {
          $set: {
            paymentStatus: "failed",
            paymentFailureReason: "Payment signature verification failed.",
          },
        }
      );

      return res.status(400).json({
        success: false,
        message: "Payment verification failed.",
      });
    }

    const settled = await settlePaidOrder({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (settled.refundRequired) {
      return res.status(409).json({
        success: false,
        message: settled.reason,
        refundRequired: true,
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and order confirmed successfully.",
      order: settled.order,
    });
  } catch (error) {
    next(error);
  }
};

export const handleRazorpayWebhook = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return res.status(503).json({ success: false, message: "Webhook secret is not configured." });
    }

    const signature = req.headers["x-razorpay-signature"];
    const eventId = req.headers["x-razorpay-event-id"] || null;
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (!safeCompare(expected, signature)) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature." });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    const paymentEntity = event.payload?.payment?.entity;

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId && razorpayPaymentId) {
        await settlePaidOrder({
          razorpayOrderId,
          razorpayPaymentId,
          webhookEventId: eventId,
        });
      }
    }

    if (event.event === "payment.failed") {
      const razorpayOrderId = paymentEntity?.order_id;
      const reason = paymentEntity?.error_description || "Payment failed at Razorpay.";

      if (razorpayOrderId) {
        await Order.updateOne(
          { razorpayOrderId, paymentStatus: { $ne: "paid" } },
          {
            $set: {
              paymentStatus: "failed",
              paymentFailureReason: String(reason).slice(0, 500),
              paymentWebhookEventId: eventId,
              paymentReconciledAt: new Date(),
            },
          }
        );
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return res.status(500).json({ success: false, message: "Webhook processing failed." });
  }
};
