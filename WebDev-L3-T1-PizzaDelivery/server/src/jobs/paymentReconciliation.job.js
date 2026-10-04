import cron from "node-cron";

import Order from "../models/Order.js";
import razorpay from "../config/razorpay.js";
import { settlePaidOrder } from "../controllers/payment.controller.js";

export const startPaymentReconciliationJob = () => {
  cron.schedule("*/15 * * * *", async () => {
    try {
      const orders = await Order.find({
        paymentStatus: { $in: ["pending", "failed"] },
        razorpayOrderId: { $ne: null },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }).limit(100);

      for (const order of orders) {
        try {
          const response = await razorpay.orders.fetchPayments(order.razorpayOrderId);
          const captured = response.items?.find((payment) => payment.status === "captured");

          if (!captured) continue;

          await settlePaidOrder({
            razorpayOrderId: order.razorpayOrderId,
            razorpayPaymentId: captured.id,
            reconciled: true,
          });
        } catch (error) {
          console.error(
            `Payment reconciliation failed for order ${order._id}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error("Payment reconciliation job error:", error);
    }
  });

  console.log("Payment reconciliation job started.");
};
