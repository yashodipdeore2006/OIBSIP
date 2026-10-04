import mongoose from "mongoose";

const ingredientSnapshotSchema = new mongoose.Schema(
  {
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ingredient",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    pizza: {
      base: { type: ingredientSnapshotSchema, required: true },
      sauce: { type: ingredientSnapshotSchema, required: true },
      cheese: { type: ingredientSnapshotSchema, required: true },
      vegetables: { type: [ingredientSnapshotSchema], default: [] },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refund_required"],
      default: "pending",
      index: true,
    },

    paymentFailureReason: {
      type: String,
      default: null,
      maxlength: 500,
    },

    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },

    paymentReconciledAt: {
      type: Date,
      default: null,
    },

    paymentWebhookEventId: {
      type: String,
      default: null,
    },

    orderStatus: {
      type: String,
      enum: ["received", "in_kitchen", "sent_to_delivery"],
      default: "received",
      index: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
